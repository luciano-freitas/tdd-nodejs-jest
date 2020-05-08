module.exports = function UndueResourceError(message = 'Este recurso não pertence a esse usuário') {
  this.name = 'UndueResourceError';
  this.message = message;
};
