// ---- Gerenciar Produtos ----
function abrirGerenciarProdutos() {
    document.getElementById('btn-voltar').style.display = 'inline-block';
    document.getElementById('painel-conteudo').innerHTML = `
      <h3>Gerenciar Produtos</h3>
      <p>Funcionalidade em desenvolvimento...</p>
    `;
  }
  window.abrirGerenciarProdutos = listarProdutos;
  
  async function listarProdutos(filtro = '') {
    let query = supabase.from('produtos').select('*').order('nome', { ascending: true });
    if (filtro.trim()) query = query.ilike('nome', `%${filtro.trim()}%`);
  
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao carregar produtos:', error);
      return;
    }
  
    let html = `
      <h3>Gerenciar Produtos</h3>
      <h4>Adicionar Novo Produto</h4>
      <input type="text" id="novo-produto-nome" placeholder="Nome do Produto">
      <input type="number" id="novo-produto-preco" placeholder="Preço (R$)" step="0.01" min="0">
      <button onclick="adicionarProduto()">Adicionar</button>
  
      <h4>Buscar Produto</h4>
      <input type="text"
             id="filtro-produto"
             placeholder="Filtrar por nome"
             oninput="listarProdutos(this.value)">
      
      <h4>Lista de Produtos</h4>
      <table class="tabela-produtos">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Preço (R$)</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
    `;
  
    data.forEach(produto => {
      html += `
        <tr>
          <td>
            <input type="text"
                   value="${produto.nome}"
                   id="produto-nome-${produto.id}"
                   class="input-tabela">
          </td>
          <td>
            <input type="number"
                   value="${produto.preco.toFixed(2)}"
                   id="produto-preco-${produto.id}"
                   class="input-tabela"
                   step="0.01"
                   min="0">
          </td>
          <td>
            <button onclick="editarProduto(${produto.id})" class="btn-salvar">Salvar</button>
            <button onclick="deletarProduto(${produto.id})" class="btn-excluir">Excluir</button>
          </td>
        </tr>
      `;
    });
  
    html += `</tbody></table>`;
  
    document.getElementById('painel-conteudo').innerHTML = html;
  }
  
  async function adicionarProduto() {
    const nome = document.getElementById('novo-produto-nome').value.trim();
    const preco = parseFloat(document.getElementById('novo-produto-preco').value.trim());
  
    if (!nome || isNaN(preco)) {
      alert('Preencha todos os campos corretamente!');
      return;
    }
  
    const { error } = await supabase
      .from('produtos')
      .insert([{ nome, preco }]);
  
    if (error) {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao adicionar produto!');
      return;
    }
  
    alert('Produto adicionado com sucesso!');
    listarProdutos();
  }
  
  async function editarProduto(id) {
    const nome = document.getElementById(`produto-nome-${id}`).value.trim();
    const preco = parseFloat(document.getElementById(`produto-preco-${id}`).value.trim());
  
    if (!nome || isNaN(preco)) {
      alert('Preencha todos os campos corretamente!');
      return;
    }
  
    const { error } = await supabase
      .from('produtos')
      .update({ nome, preco })
      .eq('id', id);
  
    if (error) {
      console.error('Erro ao editar produto:', error);
      alert('Erro ao editar produto!');
      return;
    }
  
    alert('Produto atualizado com sucesso!');
    listarProdutos();
  }
  
  async function deletarProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
  
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao deletar produto!');
      return;
    }
  
    
    alert('Produto excluído com sucesso!');
    listarProdutos();
  }
  