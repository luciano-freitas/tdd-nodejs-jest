const express = require('express');

module.exports = (app) => {
  const router = express.Router();

  router.get('/', (req, res, next) => {
    app.services.transfers.find({ user_id: req.user.id })
      .then((result) => res.status(200).json(result))
      .catch((err) => next(err));
  });

  router.post('/', (req, res, next) => {
    const transfer = { ...req.body, user_id: req.user.id };

    app.services.transfers.save(transfer)
      .then((result) => res.status(201).json(result[0]))
      .catch((err) => next(err));
  });

  router.get('/:id', (req, res, next) => {
    app.services.transfers.findOne({ id: req.params.id })
      .then((result) => res.status(200).json(result))
      .catch((err) => next(err));
  });

  router.delete('/:id', (req, res, next) => {
    app.services.transfers.remove(req.params.id)
      .then(() => res.status(204).send())
      .catch((err) => next(err));
  });

  return router;
};
