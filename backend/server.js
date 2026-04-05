
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// libera acesso do front-end
app.use(cors());

// permite receber JSON no body
app.use(express.json());

// conexão com o Supabase
const supabase = createClient(
  'https://wwaohtcebmijxgugbihu.supabase.co',
  'sb_publishable_BU6qFD5MDhuUvybtf-ehkw_--JRKqTY'
);

// rota inicial
app.get('/', (req, res) => {
  res.send(`
    <h1>API RuboWeb 🚀</h1>
    <p>Sistema funcionando!</p>
    <p>Supabase conectado</p>
  `);
});

// listar pessoas
app.get('/pessoas', async (req, res) => {
  const { data, error } = await supabase
    .from('tbl_pessoas')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    return res.status(500).json({ erro: error.message });
  }

  res.json(data);
});

// cadastrar pessoa
app.post('/pessoas', async (req, res) => {
  const { nome, idade } = req.body;

  if (!nome || idade === undefined) {
    return res.status(400).json({
      erro: 'Nome e idade são obrigatórios'
    });
  }

  const { data, error } = await supabase
    .from('tbl_pessoas')
    .insert([{ nome, idade }])
    .select();

  if (error) {
    return res.status(500).json({ erro: error.message });
  }

  res.status(201).json({
    mensagem: 'Pessoa cadastrada com sucesso!',
    pessoa: data
  });
});

// porta local ou Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});