const request = require('supertest');
const app = require('../../src/app');

test('Deve criar usuário via signup', async () => {
  const mail = `${Date.now()}@mail.com`;

  const result = await request(app)
    .post('/auth/signup')
    .send({
      name: 'Luciano',
      mail,
      password: '123456',
    });

  expect(result.status).toBe(201);
  expect(result.body.name).toBe('Luciano');
  expect(result.body).toHaveProperty('mail');
  expect(result.body).not.toHaveProperty('password');
});

test('Deve receber token ao logar', async () => {
  const mail = `${Date.now()}@mail.com`;

  await app.services.user.save({
    name: 'Luciano',
    mail,
    password: '123456',
  });

  const result = await request(app)
    .post('/auth/signin')
    .send({
      mail,
      password: '123456',
    });

  expect(result.status).toBe(200);
  expect(result.body).toHaveProperty('token');

});

test('Não deve autenticar usuário com senha errada', async () => {
  const mail = `${Date.now()}@mail.com`;

  await app.services.user.save({
    name: 'Luciano',
    mail,
    password: '123456',
  });

  const result = await request(app)
    .post('/auth/signin')
    .send({
      mail,
      password: '654321',
    });

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Usuário ou senha inválido');

});

test('Não deve autenticar usuário com usuário errado', async () => {
  const mail = `${Date.now()}@mail.com`;

  await app.services.user.save({
    name: 'Luciano',
    mail,
    password: '123456',
  });

  const result = await request(app)
    .post('/auth/signin')
    .send({
      mail: 'not_exist_user@mail.com',
      password: '654321',
    });

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Usuário ou senha inválido');

});

test('Não deve acessar uma rota protegida sem o token', async () => {
  const result = await request(app).post('/v1/users');

  expect(result.status).toBe(401);

});
