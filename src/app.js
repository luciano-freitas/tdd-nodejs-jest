const app = require('express')();
const consign = require('consign');
const knex = require('knex');
const knexfile = require('../knexfile');

// TODO criar chaveamento dinamico
app.db = knex(knexfile.test);

consign({ cwd: 'src', verbose: false })
  .include('./config/passport.js')
  .include('./config/middlewares.js')
  .then('./services')
  .then('./routes')
  .then('./config/router.js')
  .into(app);

app.get('/', (req, res) => res.status(200).send());

app.use((req, res) => res.status(404).json({ error: 'Página não encontrada' }));


// Tratamento de erros genérico
app.use((err, req, res, next) => {
  const { name, message, stack } = err;

  if (name === 'ValidationError') res.status(400).json({ error: message });
  if (name === 'UndueResourceError') res.status(403).json({ error: message });
  else res.status(500).json({ name, message, stack });

  next(err);
});

// app.db
//   .on('query', (query) => console.log('Sql gerado', { sql: query.sql, bindings: query.bindings || '' }))
//   .on('query-response', (response) => console.log('Resultado da query', response))
//   .on('error', (error) => console.log('Error ocorrido', error));

module.exports = app;
