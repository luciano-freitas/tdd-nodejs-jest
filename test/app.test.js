const supertest = require('supertest');

const app = require('../src/app');

const request = supertest(app);

test('Deve responder na raiz', async () => {

  const result = await request.get('/')
    .then((res) => {
      expect(res.status).toBe(200);
    });

  return result;
});
