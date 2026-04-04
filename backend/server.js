
// Dados do Supabase
// Organization: marcosrubo's Org
// Project name: marcosrubo's Project
// Database password: Senh@347asdfg
// Nome do banco: postgres
// Tabela: tbl_pessoas



const express = require('express');
const app = express();

// permite receber JSON no body
app.use(express.json());

// "banco" em memória (por enquanto)
let pessoas = [];

// rota inicial
app.get('/', (req, res) => {
  res.send('API RuboWeb funcionando 🚀');
});

// listar pessoas
app.get('/pessoas', (req, res) => {
  res.json(pessoas);
});

// cadastrar pessoa
app.post('/pessoas', (req, res) => {
  const { nome, idade } = req.body;

  // validação simples
  if (!nome || !idade) {
    return res.status(400).json({ erro: 'Nome e idade são obrigatórios' });
  }

  const novaPessoa = {
    id: pessoas.length + 1,
    nome,
    idade
  };

  pessoas.push(novaPessoa);

  res.status(201).json({
    mensagem: 'Pessoa cadastrada com sucesso!',
    pessoa: novaPessoa
  });
});

// porta dinâmica (obrigatório pro Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

