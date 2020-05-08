const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/accounts';
let user;
let user2;

beforeAll(async () => {

  const result = await app.services.user.save({
    name: 'User account',
    mail: `${Date.now()}@mail.com`,
    password: '123456',
  });

  user = { ...result[0] };
  user.token = jwt.encode(user, 'secret');

  const result2 = await app.services.user.save({
    name: 'User account #2',
    mail: `${Date.now()}@mail.com`,
    password: '123456',
  });

  user2 = { ...result2[0] };
});

test('Deve listar apenas as contas do usuário', async () => {

  await app.db('accounts').insert([
    { name: 'Acc user #1', user_id: user.id },
    { name: 'Acc user #2', user_id: user2.id },
  ]);

  const result = await request(app)
    .get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`);

  expect(result.status).toBe(200);
  expect(result.body.length).toBe(1);
  expect(result.body[0].name).toBe('Acc user #1');

});

test('Deve inserir uma conta com sucesso', () => {

  return request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      name: 'Acc #1',
    })
    .then((result) => {
      expect(result.status).toBe(201);
      expect(result.body.name).toBe('Acc #1');
    });

});

test('Não deve inserir uma conta sem nome', () => {
  return request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({})
    .then((result) => {
      expect(result.status).toBe(400);
      expect(result.body.error).toBe('Nome é um atributo obrigatório');
    });
});

test('Não deve inserir uma conta de nome duplicado, para o mesmo usuário', async () => {
  await app.db('accounts').insert({ name: 'Acc duplicated', user_id: user.id });

  const result = await request(app)
    .post(MAIN_ROUTE)
    .set('Authorization', `bearer ${user.token}`)
    .send({ name: 'Acc duplicated' });

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Já existe uma conta com esse nome');

});

test('Não deve retornar uma conta de outro usuário', async () => {
  const acc = await app.db('accounts').insert({ name: 'Acc user #2', user_id: user2.id }, ['id']);

  const result = await request(app)
    .get(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('Authorization', `bearer ${user.token}`);

  expect(result.status).toBe(403);
  expect(result.body.error).toBe('Este recurso não pertence a esse usuário');

});

test('Não deve alterar a conta de outro usuário', async () => {
  const acc = await app.db('accounts').insert({ name: 'Acc user #2', user_id: user2.id }, ['id']);

  const result = await request(app)
    .put(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('Authorization', `bearer ${user.token}`)
    .send({ name: 'Acc not updated' });

  expect(result.status).toBe(403);
  expect(result.body.error).toBe('Este recurso não pertence a esse usuário');

});

test('Não deve remover a conta de outro usuário', async () => {
  const acc = await app.db('accounts').insert({ name: 'Acc user #2', user_id: user2.id }, ['id']);

  const result = await request(app)
    .delete(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('Authorization', `bearer ${user.token}`);

  expect(result.status).toBe(403);
  expect(result.body.error).toBe('Este recurso não pertence a esse usuário');

});

test('Deve retornar uma contar por Id', async () => {

  const account = [{
    name: 'Acc retorne ID',
    user_id: user.id,
  }];

  const resultAccountCreated = await app.db('accounts').insert(account, ['id']);

  const result = await request(app)
    .get(`${MAIN_ROUTE}/${resultAccountCreated[0].id}`)
    .set('authorization', `bearer ${user.token}`);

  expect(result.status).toBe(200);
  expect(result.body.name).toBe('Acc retorne ID');
  expect(result.body.user_id).toBe(user.id);
});

test('Deve alterar uma conta', async () => {

  const account = [{
    name: 'Acc to update',
    user_id: user.id,
  }];

  const resultAccountCreated = await app.db('accounts').insert(account, ['id']);

  const result = await request(app)
    .put(`${MAIN_ROUTE}/${resultAccountCreated[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Acc updated' });

  expect(result.status).toBe(200);
  expect(result.body.id).toBe(resultAccountCreated[0].id);
  expect(result.body.name).toBe('Acc updated');
});

test('Deve remover uma conta', async () => {

  const account = [{
    name: 'Acc remove',
    user_id: user.id,
  }];

  const resultAccountCreated = await app.db('accounts').insert(account, ['id']);

  const result = await request(app)
    .delete(`${MAIN_ROUTE}/${resultAccountCreated[0].id}`)
    .set('authorization', `bearer ${user.token}`);

  expect(result.status).toBe(204);

  // Verifica se realmente deletou do banco de dados
  const verifyAccountsNotExist = await app.db('accounts').where({ id: resultAccountCreated[0].id }).select('*').first();

  expect(verifyAccountsNotExist).toBeUndefined();
});
