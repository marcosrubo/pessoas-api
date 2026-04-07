const API_URL =
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:3000/pessoas'
    : 'https://pessoas-api.onrender.com/pessoas';

let pessoas = [];
let idSelecionado = null;
let campoOrdenacao = null;
let direcaoOrdenacao = 'asc';

let paginaAtual = 1;
let itensPorPagina = 10;
let listaAtualFiltrada = [];

let toastTimeout = null;

/* =========================
   ELEMENTOS
========================= */
function el(id) {
  return document.getElementById(id);
}

/* =========================
   STATUS / MODO
========================= */
function setStatus(mensagem) {
  el('status').textContent = mensagem;
}

function atualizarModoInterface() {
  const modo = el('modo');
  const btnCadastrar = el('btnCadastrar');
  const btnSalvar = el('btnSalvar');
  const btnExcluir = el('btnExcluir');
  const btnCancelar = el('btnCancelar');

  if (idSelecionado) {
    modo.className = 'modo modo-edicao';
    modo.textContent = '🟡 Modo Edição';
    btnCadastrar.disabled = true;
    btnSalvar.disabled = false;
    btnExcluir.disabled = false;
    btnCancelar.disabled = false;
  } else {
    modo.className = 'modo modo-cadastro';
    modo.textContent = '🟢 Modo Cadastro';
    btnCadastrar.disabled = false;
    btnSalvar.disabled = true;
    btnExcluir.disabled = true;
    btnCancelar.disabled = true;
  }
}

/* =========================
   TOAST
========================= */
function mostrarToast(mensagem, tipo = 'info') {
  const toast = el('toast');

  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensagem;

  requestAnimationFrame(() => {
    toast.classList.add('ativo');
  });

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('ativo');
  }, 2500);
}

/* =========================
   MODAL
========================= */
function abrirModal({ titulo, mensagem, tipo = 'info', botoes = [] }) {
  const overlay = el('modalOverlay');
  const topo = el('modalTopo');
  const texto = el('modalMensagem');
  const acoes = el('modalAcoes');

  topo.className = `modal-topo ${tipo}`;
  topo.textContent = titulo;
  texto.textContent = mensagem;
  acoes.innerHTML = '';

  botoes.forEach((botao) => {
    const btn = document.createElement('button');
    btn.className = `btn-modal ${botao.classe}`;
    btn.textContent = botao.texto;
    btn.addEventListener('click', () => {
      fecharModal();
      if (typeof botao.acao === 'function') {
        botao.acao();
      }
    });
    acoes.appendChild(btn);
  });

  overlay.classList.add('ativo');
}

function fecharModal() {
  el('modalOverlay').classList.remove('ativo');
}

function mostrarMensagem(titulo, mensagem, tipo = 'info') {
  abrirModal({
    titulo,
    mensagem,
    tipo,
    botoes: [
      {
        texto: 'OK',
        classe: 'btn-modal-principal'
      }
    ]
  });
}

function pedirConfirmacao(titulo, mensagem) {
  return new Promise((resolve) => {
    abrirModal({
      titulo,
      mensagem,
      tipo: 'confirmacao',
      botoes: [
        {
          texto: 'Cancelar',
          classe: 'btn-modal-secundario',
          acao: () => resolve(false)
        },
        {
          texto: 'Confirmar',
          classe: 'btn-modal-perigo',
          acao: () => resolve(true)
        }
      ]
    });
  });
}

/* =========================
   VALIDAÇÃO
========================= */
function limparErros() {
  el('erroNome').textContent = '';
  el('erroIdade').textContent = '';

  el('nome').classList.remove('erro-campo');
  el('idade').classList.remove('erro-campo');
}

function mostrarErroCampo(campoId, erroId, mensagem) {
  el(erroId).textContent = mensagem;
  el(campoId).classList.add('erro-campo');
}

function validarFormulario() {
  limparErros();

  const nome = el('nome').value.trim();
  const idadeTexto = el('idade').value.trim();

  let valido = true;
  let primeiroCampoComErro = null;

  if (!nome) {
    mostrarErroCampo('nome', 'erroNome', 'Informe o nome.');
    valido = false;
    primeiroCampoComErro = primeiroCampoComErro || el('nome');
  } else if (nome.length < 2) {
    mostrarErroCampo('nome', 'erroNome', 'O nome deve ter pelo menos 2 letras.');
    valido = false;
    primeiroCampoComErro = primeiroCampoComErro || el('nome');
  }

  if (!idadeTexto) {
    mostrarErroCampo('idade', 'erroIdade', 'Informe a idade.');
    valido = false;
    primeiroCampoComErro = primeiroCampoComErro || el('idade');
  } else {
    const idade = Number(idadeTexto);

    if (!Number.isInteger(idade) || idade < 0 || idade > 130) {
      mostrarErroCampo('idade', 'erroIdade', 'Informe uma idade válida entre 0 e 130.');
      valido = false;
      primeiroCampoComErro = primeiroCampoComErro || el('idade');
    }
  }

  if (!valido && primeiroCampoComErro) {
    primeiroCampoComErro.focus();
  }

  return valido;
}

/* =========================
   FORMATAÇÃO
========================= */
function formatarValor(valor) {
  return valor ?? '';
}

function formatarData(data) {
  if (!data) return '';

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return String(data);
  }

  return d.toLocaleString('pt-BR');
}

/* =========================
   CONTADOR / ORDENAÇÃO
========================= */
function atualizarContador(quantidade) {
  el('contadorRegistros').textContent = `${quantidade} registro(s) encontrado(s)`;
}

function obterTextoBusca() {
  return el('buscaNome').value.trim().toLowerCase();
}

function atualizarIconesOrdenacao() {
  el('icone-nome').textContent = '';
  el('icone-idade').textContent = '';

  if (!campoOrdenacao) return;

  const icone = direcaoOrdenacao === 'asc' ? '↑' : '↓';

  if (campoOrdenacao === 'nome') {
    el('icone-nome').textContent = icone;
  }

  if (campoOrdenacao === 'idade') {
    el('icone-idade').textContent = icone;
  }
}

function ordenarPor(campo) {
  if (campoOrdenacao === campo) {
    direcaoOrdenacao = direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
  } else {
    campoOrdenacao = campo;
    direcaoOrdenacao = 'asc';
  }

  paginaAtual = 1;
  filtrarTabela();
}

function obterListaFiltradaOrdenada() {
  const textoBusca = obterTextoBusca();

  let lista = pessoas.filter((pessoa) => {
    const nome = String(pessoa.nome ?? '').toLowerCase();
    return nome.includes(textoBusca);
  });

  if (campoOrdenacao) {
    lista.sort((a, b) => {
      let valorA = a[campoOrdenacao];
      let valorB = b[campoOrdenacao];

      if (campoOrdenacao === 'nome') {
        valorA = String(valorA ?? '').toLowerCase();
        valorB = String(valorB ?? '').toLowerCase();
      } else if (campoOrdenacao === 'idade') {
        valorA = Number(valorA ?? 0);
        valorB = Number(valorB ?? 0);
      }

      if (valorA < valorB) return direcaoOrdenacao === 'asc' ? -1 : 1;
      if (valorA > valorB) return direcaoOrdenacao === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return lista;
}

/* =========================
   TABELA / PAGINAÇÃO
========================= */
function renderizarTabela(listaPaginada) {
  const tbody = el('tabela');
  tbody.innerHTML = '';

  if (listaPaginada.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="sem-registros">Nenhum registro encontrado.</td>
      </tr>
    `;
    atualizarIconesOrdenacao();
    return;
  }

  listaPaginada.forEach((pessoa) => {
    const linha = document.createElement('tr');

    if (String(pessoa.id) === String(idSelecionado)) {
      linha.classList.add('linha-selecionada');
    }

    linha.innerHTML = `
      <td>${formatarValor(pessoa.id)}</td>
      <td>${formatarValor(pessoa.nome)}</td>
      <td>${formatarValor(pessoa.idade)}</td>
      <td>${formatarData(pessoa.updated_at)}</td>
    `;

    linha.addEventListener('click', () => {
      selecionarPessoa(pessoa);
    });

    linha.addEventListener('dblclick', () => {
      selecionarPessoa(pessoa);
      el('nome').focus();
      el('nome').select();
    });

    tbody.appendChild(linha);
  });

  atualizarIconesOrdenacao();
}

function atualizarPaginacao() {
  const totalItens = listaAtualFiltrada.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));

  if (paginaAtual > totalPaginas) {
    paginaAtual = totalPaginas;
  }

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const listaPaginada = listaAtualFiltrada.slice(inicio, fim);

  renderizarTabela(listaPaginada);

  el('infoPaginacao').textContent = `Página ${paginaAtual} de ${totalPaginas}`;
}

function filtrarTabela() {
  listaAtualFiltrada = obterListaFiltradaOrdenada();
  atualizarContador(listaAtualFiltrada.length);

  const totalPaginas = Math.max(1, Math.ceil(listaAtualFiltrada.length / itensPorPagina));
  if (paginaAtual > totalPaginas) {
    paginaAtual = totalPaginas;
  }

  atualizarPaginacao();

  const textoBuscaOriginal = el('buscaNome').value.trim();

  if (textoBuscaOriginal) {
    setStatus(`Filtro aplicado para: "${textoBuscaOriginal}"`);
  } else if (!idSelecionado) {
    setStatus('Lista exibida completa.');
  }
}

function alterarItensPorPagina() {
  itensPorPagina = Number(el('itensPorPagina').value);
  paginaAtual = 1;
  filtrarTabela();
}

function irParaPrimeiraPagina() {
  paginaAtual = 1;
  atualizarPaginacao();
}

function irParaPaginaAnterior() {
  if (paginaAtual > 1) {
    paginaAtual--;
    atualizarPaginacao();
  }
}

function irParaProximaPagina() {
  const totalPaginas = Math.max(1, Math.ceil(listaAtualFiltrada.length / itensPorPagina));
  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    atualizarPaginacao();
  }
}

function irParaUltimaPagina() {
  paginaAtual = Math.max(1, Math.ceil(listaAtualFiltrada.length / itensPorPagina));
  atualizarPaginacao();
}

/* =========================
   API
========================= */
async function carregarPessoas() {
  try {
    setStatus('Carregando lista...');
    const resposta = await fetch(API_URL);

    if (!resposta.ok) {
      throw new Error('Erro ao carregar a lista');
    }

    pessoas = await resposta.json();
    filtrarTabela();

    if (!idSelecionado) {
      setStatus('Lista carregada com sucesso.');
    }
  } catch (erro) {
    console.error('Erro ao carregar pessoas:', erro);
    mostrarMensagem('Erro', 'Erro ao carregar dados.', 'erro');
    setStatus('Erro ao carregar a lista.');
  }
}

async function incluir() {
  try {
    if (!validarFormulario()) {
      setStatus('Corrija os campos destacados.');
      return;
    }

    const nome = el('nome').value.trim();
    const idade = Number(el('idade').value);

    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, idade })
    });

    if (!resposta.ok) {
      throw new Error('Erro ao cadastrar');
    }

    limpar(false);
    await carregarPessoas();

    mostrarToast('Pessoa cadastrada com sucesso!', 'sucesso');
    setStatus('Pessoa cadastrada com sucesso.');
  } catch (erro) {
    console.error('Erro ao cadastrar:', erro);
    mostrarMensagem('Erro', 'Erro ao cadastrar.', 'erro');
    setStatus('Erro ao cadastrar pessoa.');
  }
}

async function salvar() {
  try {
    const id = el('id').value;

    if (!id) {
      mostrarMensagem('Atenção', 'Selecione um registro para editar.', 'info');
      return;
    }

    if (!validarFormulario()) {
      setStatus('Corrija os campos destacados.');
      return;
    }

    const nome = el('nome').value.trim();
    const idade = Number(el('idade').value);

    const resposta = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, idade })
    });

    if (!resposta.ok) {
      throw new Error('Erro ao salvar');
    }

    limpar(false);
    await carregarPessoas();

    mostrarToast('Registro atualizado com sucesso!', 'sucesso');
    setStatus('Registro atualizado com sucesso.');
  } catch (erro) {
    console.error('Erro ao salvar:', erro);
    mostrarMensagem('Erro', 'Erro ao salvar.', 'erro');
    setStatus('Erro ao salvar registro.');
  }
}

async function excluir() {
  try {
    const id = el('id').value;

    if (!id) {
      mostrarMensagem('Atenção', 'Selecione um registro para excluir.', 'info');
      return;
    }

    const confirmado = await pedirConfirmacao(
      'Confirmar exclusão',
      'Deseja realmente excluir este registro?'
    );

    if (!confirmado) {
      setStatus('Exclusão cancelada.');
      return;
    }

    const resposta = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!resposta.ok) {
      throw new Error('Erro ao excluir');
    }

    limpar(false);
    await carregarPessoas();

    mostrarToast('Registro excluído com sucesso!', 'sucesso');
    setStatus('Registro excluído com sucesso.');
  } catch (erro) {
    console.error('Erro ao excluir:', erro);
    mostrarMensagem('Erro', 'Erro ao excluir.', 'erro');
    setStatus('Erro ao excluir registro.');
  }
}

/* =========================
   SELEÇÃO / LIMPEZA
========================= */
function selecionarPessoa(pessoa) {
  idSelecionado = pessoa.id ?? null;

  el('id').value = pessoa.id ?? '';
  el('nome').value = pessoa.nome ?? '';
  el('idade').value = pessoa.idade ?? '';
  el('atualizacao').value = formatarData(pessoa.updated_at);

  limparErros();
  atualizarModoInterface();
  filtrarTabela();
  setStatus(`Registro ID ${pessoa.id} selecionado para edição.`);
}

function limpar(mensagem = true) {
  idSelecionado = null;

  el('id').value = '';
  el('nome').value = '';
  el('idade').value = '';
  el('atualizacao').value = '';

  limparErros();
  atualizarModoInterface();
  filtrarTabela();

  if (mensagem) {
    setStatus('Campos limpos. Nenhum registro selecionado.');
  }
}

function cancelarEdicao() {
  limpar(false);
  setStatus('Edição cancelada.');
  mostrarToast('Edição cancelada.', 'info');
  el('nome').focus();
}

/* =========================
   CSV
========================= */
function exportarCSV() {
  if (!listaAtualFiltrada.length) {
    mostrarMensagem('Atenção', 'Não há registros para exportar.', 'info');
    return;
  }

  const linhas = [
    ['ID', 'Nome', 'Idade', 'Atualização']
  ];

  listaAtualFiltrada.forEach((pessoa) => {
    linhas.push([
      pessoa.id ?? '',
      `"${String(pessoa.nome ?? '').replace(/"/g, '""')}"`,
      pessoa.idade ?? '',
      `"${formatarData(pessoa.updated_at).replace(/"/g, '""')}"`
    ]);
  });

  const conteudo = '\uFEFF' + linhas.map((linha) => linha.join(';')).join('\n');
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'pessoas.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  mostrarToast('CSV exportado com sucesso!', 'sucesso');
  setStatus('Arquivo CSV gerado com sucesso.');
}

/* =========================
   EVENTOS
========================= */
el('modalOverlay').addEventListener('click', (event) => {
  if (event.target.id === 'modalOverlay') {
    fecharModal();
  }
});

document.addEventListener('keydown', (event) => {
  const modalAberto = el('modalOverlay').classList.contains('ativo');

  if (event.key === 'Escape') {
    if (modalAberto) {
      fecharModal();
      return;
    }

    if (idSelecionado) {
      cancelarEdicao();
    }
  }

  if (event.key === 'Enter') {
    const elementoAtivo = document.activeElement;
    const tag = elementoAtivo ? elementoAtivo.tagName.toLowerCase() : '';

    if (modalAberto) return;

    if (tag === 'button') return;

    event.preventDefault();

    if (idSelecionado) {
      salvar();
    } else {
      incluir();
    }
  }
});

el('nome').addEventListener('input', () => {
  if (el('erroNome').textContent) {
    validarFormulario();
  }
});

el('idade').addEventListener('input', () => {
  if (el('erroIdade').textContent) {
    validarFormulario();
  }
});

/* =========================
   INICIALIZAÇÃO
========================= */
function inicializar() {
  atualizarModoInterface();
  carregarPessoas();
}

inicializar();