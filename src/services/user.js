const bcrypt = require('bcrypt-nodejs');
const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const findAll = async (filter = {}) => {
    const result = await app.db('users').where(filter).select(['id', 'name', 'mail']);
    return result;
  };

  const findOne = async (filter = {}, returnPassword = false) => {
    const result = await app.db('users').where(filter).select('*').first();

    if (result && !returnPassword) delete result.password;

    return result;
  };

  const getPasswordHash = (password) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  };

  const save = async (user) => {
    if (!user.name) throw new ValidationError('Nome é um atributo obrigatório');
    if (!user.mail) throw new ValidationError('Email é um atributo obrigatório');
    if (!user.password) throw new ValidationError('Senha é um atributo obrigatório');

    const userDb = await findOne({ mail: user.mail });

    if (userDb) throw new ValidationError('Já existe um usuário com esse email');

    const newUser = { ...user };
    newUser.password = getPasswordHash(user.password);

    const result = await app.db('users').insert(newUser, ['id', 'name', 'mail']);
    return result;
  };

  return {
    findAll,
    save,
    findOne,
  };

};
