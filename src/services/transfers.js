module.exports = (app) => {
  const find = (filter = {}) => {
    return app.db('transfers')
      .where(filter)
      .select();
  };

  const findOne = (filter = {}) => {
    return app.db('transfers')
      .where(filter)
      .first();
  };

  const save = async (transfer) => {
    const result = await app.db('transfers').insert(transfer, '*');
    const transferId = result[0].id;

    const transactions = [
      {
        description: `Transfer to acc #${transfer.acc_dest_id}`,
        date: transfer.date,
        ammount: transfer.ammount * -1,
        type: 'O',
        acc_id: transfer.acc_ori_id,
        transfer_id: transferId,
      },
      {
        description: `Transfer from acc #${transfer.acc_ori_id}`,
        date: transfer.date,
        ammount: transfer.ammount,
        type: 'I',
        acc_id: transfer.acc_dest_id,
        transfer_id: transferId,
      },
    ];

    await app.db('transactions').insert(transactions);
    return result;
  };

  const remove = async (id) => {
    await app.db('transactions').where({ transfer_id: id }).del();
    return app.db('transfers').where({ id }).del();
  };

  return {
    find,
    findOne,
    save,
    remove,
  };
};
