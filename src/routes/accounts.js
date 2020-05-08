const express = require('express');

const UndueResourceError = require('../errors/UndueResourceError');

module.exports = (app) => {

  const router = express.Router();

  // Funciona como um Middleware, sempre que for passado no endpoint o parametro (id) esta função é chamada
  router.param('id', async (req, res, next) => {
    try {
      const result = await app.services.accounts.findOne({ id: req.params.id });

      if (result.user_id !== req.user.id) throw new UndueResourceError('Este recurso não pertence a esse usuário');
      else next();
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const result = await app.services.accounts.save({ ...req.body, user_id: req.user.id });

      return res.status(201).json(result[0]);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const result = await app.services.accounts.findAll({ user_id: req.user.id });

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const result = await app.services.accounts.findOne({ id: req.params.id });

      if (result.user_id !== req.user.id) return res.status(403).json({ error: 'Este recurso não pertence a esse usuário' });

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const result = await app.services.accounts.update(req.params.id, req.body);

      return res.status(200).json(result[0]);
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await app.services.accounts.remove(req.params.id);

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
