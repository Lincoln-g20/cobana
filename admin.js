// ---- extratos_admin.js ----

// 1) Abre a interface de busca por nome de usuário
function abrirGerenciarExtratos() {
  document.getElementById('painel-conteudo').innerHTML = `
    <h3>Gerenciar Extratos</h3>
    <label>Digite o nome do usuário:</label>
    <input type="text" id="input-nome-usuario" placeholder="Ex: João Silva" />
    <button id="btn-buscar-usuario" class="btn-salvar">Buscar</button>
    <div id="extratos-lista-container" style="margin-top:20px;"></div>
  `;

  document.getElementById('btn-buscar-usuario').addEventListener('click', async () => {
    const nomeBuscado = document.getElementById('input-nome-usuario').value.trim();
    if (!nomeBuscado) return alert('Digite o nome do usuário');

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nome')
      .ilike('nome', `%${nomeBuscado}%`)
      .order('nome');

    if (error || !usuarios || usuarios.length === 0) {
      console.error('Usuário não encontrado:', error);
      return alert('Usuário não encontrado');
    }

    if (usuarios.length > 1) {
      const nomes = usuarios.map(u => `• ${u.nome}`).join('\n');
      return alert(`Mais de um resultado encontrado:\n\n${nomes}`);
    }

    const usuarioId = usuarios[0].id;
    listarExtratosAdmin(usuarioId);
  });
}

// 2) Lista extratos de um usuário (modo padrão com tabela)
async function listarExtratosAdmin(usuarioId) {
  const { data, error } = await supabase
    .from('extratos')
    .select('id, data_compra, quantidade, valor_unitario, produtos(nome)')
    .eq('usuarios_id', usuarioId)
    .order('data_compra', { ascending: false });

  if (error) {
    console.error('Erro ao carregar extratos:', error);
    return alert('Erro ao carregar extratos');
  }

  let totalGeral = 0;

  let html = `
    <button onclick="abrirFormularioLancamento(${usuarioId})" class="btn-salvar">
      + Adicionar Lançamento
    </button>
    <button id="btn-excluir-lancamento" class="btn-salvar" style="background-color: red; color: white;">
      Excluir Lançamento
    </button>
    <div style="overflow-x: auto;" id="extratos-table-container">
      <table class="tabela-extratos">
        <thead>
          <tr>
            <th>Data</th><th>Produto</th><th>Qtd</th><th>Total</th>
          </tr>
        </thead>
        <tbody id="extratos-tbody"></tbody>
      </table>
    </div>
    <button onclick="confirmarPagamento(${usuarioId})" class="btn-excluir" style="margin-top:15px;">
      PAGAMENTO
    </button>
  `;

  document.getElementById('extratos-lista-container').innerHTML = html;

  // Botão para alternar para visualização de exclusão
  document.getElementById('btn-excluir-lancamento').addEventListener('click', () => {
    exibirFormularioExcluirLancamento(usuarioId, data); // Mostra a lista no lugar da tabela
  });

  // Preenche a tabela
  const tbody = document.getElementById('extratos-tbody');
  data.forEach(item => {
    const total = item.quantidade * item.valor_unitario;
    totalGeral += total;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.data_compra}</td>
      <td>${item.produtos.nome}</td>
      <td>${item.quantidade}</td>
      <td>R$ ${total.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Total geral
  const tfoot = document.createElement('tfoot');
  tfoot.innerHTML = `
    <tr>
      <td colspan="3" style="text-align:right;"><strong>Total Geral:</strong></td>
      <td><strong>R$ ${totalGeral.toFixed(2)}</strong></td>
    </tr>
  `;
  document.querySelector('.tabela-extratos').appendChild(tfoot);
}

// 3) Lista de lançamentos para exclusão (em formato de lista <ul>)
function exibirFormularioExcluirLancamento(usuarioId, extratos) {
  let htmlLista = `
    <h4>Excluir Lançamento</h4>
    <ul style="list-style:none; padding:0;">
  `;

  extratos.forEach(extrato => {
    htmlLista += `
      <li style="margin-bottom: 8px;">
        <button class="btn-excluir" onclick="confirmarExclusaoLancamento(${usuarioId}, ${extrato.id})">
          Excluir
        </button>
        <span style="margin-left: 10px;">${extrato.data_compra} - ${extrato.produtos.nome} (${extrato.quantidade})</span>
      </li>
    `;
  });

  htmlLista += `</ul>
    <button onclick="listarExtratosAdmin(${usuarioId})" class="btn-salvar">Voltar</button>
  `;

  document.getElementById('extratos-lista-container').innerHTML = htmlLista;
}

// 4) Confirma a exclusão de um único lançamento
async function confirmarExclusaoLancamento(usuarioId, lancamentoId) {
  const confirmar = confirm('Tem certeza que deseja excluir este lançamento?');
  if (!confirmar) return;

  const { error } = await supabase
    .from('extratos')
    .delete()
    .eq('id', lancamentoId);

  if (error) {
    console.error('Erro ao excluir lançamento:', error);
    return alert('Erro ao excluir lançamento');
  }

  alert('Lançamento excluído com sucesso');
  listarExtratosAdmin(usuarioId); // Recarrega lista
}

// 5) Confirmação de pagamento (remove todos os lançamentos do usuário)
async function confirmarPagamento(usuarioId) {
  const confirmar = confirm('Confirmar pagamento? Isso apagará todos os lançamentos.');
  if (!confirmar) return;

  const { error } = await supabase
    .from('extratos')
    .delete()
    .eq('usuarios_id', usuarioId);

  if (error) {
    console.error('Erro ao apagar lançamentos:', error);
    return alert('Erro ao apagar lançamentos');
  }

  alert('Pagamento registrado e lançamentos removidos.');
  listarExtratosAdmin(usuarioId);
}
