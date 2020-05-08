const express = require('express');
const jwt = require('jwt-simple');
const bcrypt = require('bcrypt-nodejs');
const ValidationError = require('../errors/ValidationError');

const secret = 'secret';

module.exports = (app) => {
  const router = express.Router();

  router.post('/signin', async (req, res, next) => {
    try {
      const user = await app.services.user.findOne({ mail: req.body.mail }, true);

      if (!user || !bcrypt.compareSync(req.body.password, user.password)) throw new ValidationError('Usuário ou senha inválido');

      const payload = {
        id: user.id,
        name: user.name,
        mail: user.mail,
      };

      const token = jwt.encode(payload, secret);

      res.status(200).json({ token });
    } catch (error) {
      next(error);
    }
  });

  router.post('/signup', async (req, res, next) => {
    try {
      const result = await app.services.user.save(req.body);

      return res.status(201).json(result[0]);
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
