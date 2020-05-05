const supertest = require('supertest');

const app = require('../src/app');

const request = supertest(app);

test('Deve responder na raiz', () => {

  return request.get('/')
    .then((res) => {
      expect(res.status).toBe(200);
    });

});
