// ---- Gerenciar Usuários ----
function abrirGerenciarUsuarios() {
  document.getElementById('btn-voltar').style.display = 'inline-block';
  listarUsuarios();
}
window.abrirGerenciarUsuarios = listarUsuarios;

async function listarUsuarios(filtro = '') {
  let query = supabase.from('usuarios').select('*').order('nome', { ascending: true });
  if (filtro.trim()) query = query.ilike('nome', `%${filtro.trim()}%`);

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao carregar usuários:', error);
    return;
  }

  renderizarUsuarios(data, filtro);
}

function renderizarUsuarios(data, filtro) {
  let html = `
    <h3>Gerenciar Usuários</h3>
    <h4>Adicionar Novo Usuário</h4>
    <input type="text" id="novo-nome" placeholder="Nome">
    <input type="password" id="nova-senha" placeholder="Senha">
    <button onclick="adicionarUsuario()">Adicionar</button>

    <h4>Buscar Usuário</h4>
    <div style="display: flex; gap: 8px; align-items: center;">
      <input type="text"
             id="filtro-nome"
             placeholder="Filtrar por nome"
             oninput="debounceFiltrarUsuarios()"
             value="${filtro}">
      <button id="btn-limpar-filtro" onclick="limparFiltro()" style="${filtro ? 'display:inline-block;' : 'display:none;'}">Limpar</button>
    </div>

    <h4>Lista de Usuários</h4>
    <table class="tabela-usuarios">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach(usuario => {
    if (usuario.tipo === 'admin') return; // Oculta usuários com tipo "admin"
    
    html += `
      <tr>
        <td>${usuario.nome}</td>
        <td>
          <button onclick="exibirCamposEdicao(${usuario.id})" class="btn-editar">Editar</button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  document.getElementById('painel-conteudo').innerHTML = html;
  atualizarBotaoLimpar(filtro);
}

function exibirCamposEdicao(id) {
  // Ocultar a lista e exibir os campos de edição do usuário selecionado
  const painelConteudo = document.getElementById('painel-conteudo');
  painelConteudo.innerHTML = `
    <h3>Editar Usuário</h3>
    <input type="text" id="nome-${id}" placeholder="Nome" disabled>
    <input type="password" id="senha-${id}" placeholder="Nova senha">
    <input type="password" id="confirmar-senha-${id}" placeholder="Confirmar nova senha">
    <button onclick="salvarAlteracoes(${id})">Salvar</button>
    <button onclick="deletarUsuario(${id})" class="btn-excluir">Excluir</button>
    <button onclick="listarUsuarios()">Voltar</button>
  `;
}

function atualizarBotaoLimpar(filtro) {
  const inputFiltro = document.getElementById('filtro-nome');
  const btnLimpar = document.getElementById('btn-limpar-filtro');
  if (inputFiltro && btnLimpar) {
      inputFiltro.addEventListener('input', () => {
          if (inputFiltro.value.trim()) {
              btnLimpar.style.display = 'inline-block';
          }
      });
  }
}

// ---- Debounce ----
let debounceTimeout;
function debounceFiltrarUsuarios() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
      const filtro = document.getElementById('filtro-nome').value.trim();
      listarUsuarios(filtro);
  }, 400);
}

function limparFiltro() {
  const campo = document.getElementById('filtro-nome');
  campo.value = '';
  listarUsuarios(); // Recarrega sem filtro
}

// ---- Adicionar Usuário ----
async function adicionarUsuario() {
  const nome = document.getElementById('novo-nome').value.trim();
  const senha = document.getElementById('nova-senha').value.trim();
  const tipo = 'usuario';

  if (!nome || !senha) {
      alert('Preencha todos os campos!');
      return;
  }

  const { data: existentes, error: err } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nome', nome);

  if (err) {
      console.error(err);
      alert('Erro ao verificar nome existente.');
      return;
  }
  if (existentes.length) {
      alert('Esse nome já está em uso!');
      return;
  }

  const { error } = await supabase
      .from('usuarios')
      .insert([{ nome, senha, tipo }]);

  if (error) {
      console.error('Erro ao adicionar usuário:', error);
      alert('Erro ao adicionar usuário!');
      return;
  }

  alert('Usuário adicionado com sucesso!');
  listarUsuarios();
}

// ---- Editar Usuário ----
async function salvarAlteracoes(id) {
  const novoNome = document.getElementById(`nome-${id}`).value.trim();
  const novaSenha = document.getElementById(`senha-${id}`).value.trim();
  const confirmarSenha = document.getElementById(`confirmar-senha-${id}`).value.trim();

  if (!novoNome) {
      alert('O nome não pode ficar vazio.');
      return;
  }

  if (novaSenha !== confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
  }

  const { data: exist, error: err } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nome', novoNome);

  if (err) {
      console.error(err);
      alert('Erro ao verificar nome existente.');
      return;
  }
  if (exist.some(u => u.id !== id)) {
      alert('Esse nome já está em uso!');
      return;
  }

  const atualizacao = { nome: novoNome };
  if (novaSenha && novaSenha !== '') {
      atualizacao.senha = novaSenha;
  }

  const { error } = await supabase
      .from('usuarios')
      .update(atualizacao)
      .eq('id', id);

  if (error) {
      console.error('Erro ao editar usuário:', error);
      alert('Erro ao editar usuário!');
      return;
  }

  alert('Usuário atualizado com sucesso!');
  listarUsuarios();
}

// ---- Deletar Usuário ----
async function deletarUsuario(id) {
  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

  // Impede a exclusão do admin
  const { data: usuario, error: err } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', id)
      .single();

  if (err || !usuario) {
      console.error('Erro ao buscar usuário:', err);
      alert('Erro ao verificar o usuário.');
      return;
  }

  if (usuario.tipo === 'admin') {
      alert('Não é permitido excluir o usuário admin!');
      return;
  }

  const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

  if (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário!');
      return;
  }

  alert('Usuário excluído com sucesso!');
  listarUsuarios();
}
