const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/users';
const mail = `${Date.now()}@mail.com`;
let user;

beforeAll(async () => {

  const result = await app.services.user.save({
    name: 'User account',
    mail: `${Date.now()}@mail.com`,
    password: '123456',
  });

  user = { ...result[0] };
  user.token = jwt.encode(user, 'secret');
});

test('Deve listar todos os usuários', async () => {
  const result = await request(app)
    .get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`);

  expect(result.status).toBe(200);
  expect(result.body.length).toBeGreaterThan(0);
});

test('Deve inserir o usuário com sucesso', async () => {
  const result = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      name: 'Walter Mitty',
      mail,
      password: '123456',
    });

  expect(result.status).toBe(201);
  expect(result.body.name).toBe('Walter Mitty');
  expect(result.body).not.toHaveProperty('password');
});

test('Deve armazenar senha criptografada', async () => {
  const result = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      name: 'Test password encrypted',
      mail: `${Date.now()}@mail.com`,
      password: '123456',
    });

  expect(result.status).toBe(201);
  expect(result.body.name).toBe('Test password encrypted');

  const { id } = result.body;
  const userDb = await app.services.user.findOne({ id }, true);

  expect(userDb.password).not.toBeUndefined();
  expect(userDb.password).not.toBe('123456');
});

test('Não deve inserir um usuário sem nome', async () => {
  const result = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      mail: 'teste@mail.com',
      password: '123456',
    });

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Nome é um atributo obrigatório');
});

test('Não deve inserir um uruário sem email', async () => {
  const result = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      name: 'Walter Mitty',
      password: '123456',
    });

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Email é um atributo obrigatório');
});

test('Não deve inserir um uruário sem senha', async () => {
  const result = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      name: 'Walter Mitty',
      mail: 'teste2@mail.com',
    });

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Senha é um atributo obrigatório');
});

test('Não deve permitir inserir um email duplicado', async () => {
  const result = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      name: 'Walter Mitty',
      mail,
      password: '123456',
    });

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Já existe um usuário com esse email');
});
