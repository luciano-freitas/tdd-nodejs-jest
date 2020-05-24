const request = require('supertest');
const Promise = require('bluebird');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transactions';

let user;
let user2;

let accUser;
let accUser2;

const truncate = (tables) => {
  return Promise.each(tables, (table) => {
    app.db.raw(`truncate table ${table} cascade`);
  });
};

beforeAll(async () => {
  const tablesTruncate = [
    'transactions',
    'transfers',
    'accounts',
    'users',
  ];

  truncate(tablesTruncate);

  const users = await app.db('users').insert([
    { name: 'User #1', mail: 'user@mail.com', password: '$2a$10$LbxjUWdvqjuYL/L/R7GWY.HJ4ioz2B5Ktr6tRX3GaRVrhKm84Ji26' },
    { name: 'User #2', mail: 'user2@mail.com', password: '$2a$10$LbxjUWdvqjuYL/L/R7GWY.HJ4ioz2B5Ktr6tRX3GaRVrhKm84Ji26' },
  ], '*');

  [user, user2] = users;

  delete user.password;
  user.token = jwt.encode(user, 'secret');

  const accs = await app.db('accounts').insert([
    { name: 'Acc #1', user_id: user.id },
    { name: 'Acc #2', user_id: user2.id },
  ], '*');

  [accUser, accUser2] = accs;
});

test('Deve listar apenas as transações do usuário', () => {
  return app.db('transactions').insert([{
    description: 'T1',
    date: new Date(),
    ammount: 100,
    type: 'I',
    acc_id: accUser.id,
  },
  {
    description: 'T2',
    date: new Date(),
    ammount: 300,
    type: 'O',
    acc_id: accUser2.id,
  },
  ]).then(() => request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('T1');
    }));

});

test('Deve inserir uma transação com sucesso', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
      expect(res.body.ammount).toBe('100.00');
    });
});

test('Transações de entradas devem ser positivas', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T',
      date: new Date(),
      ammount: -100,
      type: 'I',
      acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
      expect(res.body.ammount).toBe('100.00');
    });
});

test('Transações de saídas devem ser negativas', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T',
      date: new Date(),
      ammount: 100,
      type: 'O',
      acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
      expect(res.body.ammount).toBe('-100.00');
    });
});

describe('Ao tentar inserir uma transação inválida', () => {

  let validTransaction;
  beforeAll(() => {
    validTransaction = {
      description: 'New T',
      date: new Date(),
      ammount: 100,
      type: 'I',
      acc_id: accUser.id,
    };
  });

  const testTemplate = (newData, errorMessage) => {
    return request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${user.token}`)
      .send({ ...validTransaction, ...newData })
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(errorMessage);
      });
  };

  test('Não deve inserir uma transação sem descrição', () => testTemplate({ description: null }, 'Descrição é um atributo obrigatório'));
  test('Não deve inserir uma transação sem valor', () => testTemplate({ ammount: null }, 'Valor é um atributo obrigatório'));
  test('Não deve inserir uma transação sem data', () => testTemplate({ date: null }, 'Data é um atributo obrigatório'));
  test('Não deve inserir uma transação sem conta', () => testTemplate({ acc_id: null }, 'Conta é um atributo obrigatório'));
  test('Não deve inserir uma transação sem tipo', () => testTemplate({ type: null }, 'Tipo é um atributo obrigatório'));
  test('Não deve inserir uma transação sem tipo inválido', () => testTemplate({ type: 'A' }, 'Tipo inválido'));
});

test('Deve retornar uma transação por ID', () => {
  return app.db('transactions').insert({
    description: 'T ID',
    date: new Date(),
    ammount: 100,
    type: 'I',
    acc_id: accUser.id,
  }, '*').then((trans) => request(app).get(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(trans[0].id);
      expect(res.body.description).toBe('T ID');
    }));
});

test('Deve alterar uma transação por ID', () => {
  return app.db('transactions').insert({
    description: 'to update',
    date: new Date(),
    ammount: 100,
    type: 'I',
    acc_id: accUser.id,
  }, '*').then((trans) => request(app).put(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'Updated' })
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(trans[0].id);
      expect(res.body.description).toBe('Updated');
    }));
});

test('Deve remover uma transação por ID', () => {
  return app.db('transactions').insert({
    description: 'to delete',
    date: new Date(),
    ammount: 100,
    type: 'I',
    acc_id: accUser.id,
  }, '*').then((trans) => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(204);
    }));
});

test('Não deve remover uma transação por outro usuário', () => {
  return app.db('transactions').insert({
    description: 'to delete',
    date: new Date(),
    ammount: 100,
    type: 'I',
    acc_id: accUser2.id,
  }, '*').then((trans) => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence a esse usuário');
    }));
});

test('Não deve remover conta com transação', () => {
  return app.db('transactions').insert({
    description: 'to delete',
    date: new Date(),
    ammount: 100,
    type: 'I',
    acc_id: accUser.id,
  }, '*').then(() => request(app).delete(`/v1/accounts/${accUser.id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Essa conta possui transações associadas');
    }));
});
