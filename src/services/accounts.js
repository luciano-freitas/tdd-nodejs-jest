const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {

  const findOne = async (filter = {}) => {
    const result = await app.db('accounts').where(filter).select().first();
    return result;
  };

  const save = async (account) => {
    if (!account.name) throw new ValidationError('Nome é um atributo obrigatório');

    const accDb = await findOne({ name: account.name, user_id: account.user_id });

    if (accDb) throw new ValidationError('Já existe uma conta com esse nome');

    return app.db('accounts').insert(account, '*');
  };

  const findAll = async (filter = {}) => {
    const result = await app.db('accounts').where(filter).select();
    return result;
  };

  const update = async (id, account) => {
    const result = await app.db('accounts').where({ id }).update(account, '*');
    return result;
  };

  const remove = async (id) => {
    const transaction = await app.services.transactions.findOne({ acc_id: id });

    if (transaction) throw new ValidationError('Essa conta possui transações associadas');

    await app.db('accounts').where({ id }).del();
  };

  return {
    save,
    findAll,
    findOne,
    update,
    remove,
  };

};
