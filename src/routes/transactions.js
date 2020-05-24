const express = require('express');

const UndueResourceError = require('../errors/UndueResourceError');

module.exports = (app) => {

  const router = express.Router();

  // Funciona como um Middleware, sempre que for passado no endpoint o parametro (id) esta função é chamada
  router.param('id', async (req, res, next) => {
    try {
      const result = await app.services.transactions.find(req.user.id, { 'transactions.id': req.params.id });

      if (result.length > 0) next();
      else throw new UndueResourceError('Este recurso não pertence a esse usuário');
    } catch (err) {
      next(err);
    }
  });

  router.get('/', (req, res, next) => {
    app.services.transactions.find(req.user.id)
      .then((result) => res.status(200).json(result))
      .catch((err) => next(err));
  });

  router.post('/', (req, res, next) => {
    app.services.transactions.save(req.body)
      .then((result) => res.status(201).json(result[0]))
      .catch((err) => next(err));
  });

  router.get('/:id', (req, res, next) => {
    app.services.transactions.findOne({ id: req.params.id })
      .then((result) => res.status(200).json(result))
      .catch((err) => next(err));
  });

  router.put('/:id', (req, res, next) => {
    app.services.transactions.update(req.params.id, req.body)
      .then((result) => res.status(200).json(result[0]))
      .catch((err) => next(err));
  });

  router.delete('/:id', (req, res, next) => {
    app.services.transactions.remove(req.params.id)
      .then(() => res.status(204).send())
      .catch((err) => next(err));
  });

  return router;
};
