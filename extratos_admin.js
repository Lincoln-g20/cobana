function abrirFormularioLancamento(usuarioId) {
  // Verifique se o usuário é admin antes de permitir o lançamento
  supabase
    .from('usuarios')
    .select('tipo')
    .eq('id', usuarioId)
    .single()
    .then(({ data: usuario, error }) => {
      if (error || !usuario) {
        console.error('Erro ao carregar usuário:', error);
        return alert('Usuário não encontrado');
      }

      if (usuario.tipo === 'admin') {
        return alert('Não é possível adicionar lançamentos no admin');
      }

      // Interface do formulário com autocomplete
      document.getElementById('extratos-lista-container').innerHTML = `
        <h4>Adicionar Lançamento</h4>
        <form id="form-lancamento" style="display:flex; flex-direction: column; gap: 15px; max-width: 100%; padding: 20px;">
          <label for="data-compra">Data:</label>
          <input type="date" id="data-compra" required style="padding: 8px; font-size: 16px; border-radius: 4px; border: 1px solid #ccc;">
          
          <label for="produto-nome">Produto:</label>
          <input type="text" id="produto-nome" placeholder="Digite o nome do produto" autocomplete="off" required style="padding: 8px; font-size: 16px; border-radius: 4px; border: 1px solid #ccc;">
          <ul id="sugestoes-produtos" style="list-style:none;padding:0;margin:4px 0; max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px;"></ul>
          
          <label for="quantidade">Quantidade:</label>
          <input type="number" id="quantidade" min="1" required style="padding: 8px; font-size: 16px; border-radius: 4px; border: 1px solid #ccc;">
          
          <label for="valor-unitario">Valor Unitário:</label>
          <input type="number" id="valor-unitario" step="0.01" min="0" required disabled style="padding: 8px; font-size: 16px; border-radius: 4px; border: 1px solid #ccc;">
          
          <button type="submit" class="btn-salvar" style="background-color: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px;">Salvar</button>
        </form>
      `;

      let timeoutBusca;
      let produtoSelecionado = null;

      const inputProduto = document.getElementById('produto-nome');
      const listaSugestoes = document.getElementById('sugestoes-produtos');
      const inpPreco = document.getElementById('valor-unitario');

      inputProduto.addEventListener('input', () => {
        clearTimeout(timeoutBusca);
        listaSugestoes.innerHTML = '';
        produtoSelecionado = null;
        inpPreco.value = '';

        const termo = inputProduto.value.trim();
        if (termo.length < 2) return;

        timeoutBusca = setTimeout(async () => {
          const { data: produtos, error } = await supabase
            .from('produtos')
            .select('id, nome, preco')
            .ilike('nome', `%${termo}%`)
            .order('nome', { ascending: true });

          if (error) {
            console.error('Erro ao buscar produtos:', error);
            return;
          }

          listaSugestoes.innerHTML = produtos.map(p => `
            <li style="padding:6px; cursor:pointer; background:#eee; border:1px solid #ccc; margin-bottom:2px; border-radius:4px"
                data-id="${p.id}" data-nome="${p.nome}" data-preco="${p.preco}">
              ${p.nome} - R$ ${p.preco.toFixed(2)}
            </li>
          `).join('');

          listaSugestoes.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
              inputProduto.value = item.dataset.nome;
              inpPreco.value = item.dataset.preco;
              produtoSelecionado = {
                id: parseInt(item.dataset.id),
                preco: parseFloat(item.dataset.preco)
              };
              listaSugestoes.innerHTML = '';
            });
          });
        }, 1000); // delay de 1 segundo
      });

      document
        .getElementById('form-lancamento')
        .addEventListener('submit', async e => {
          e.preventDefault();

          const dataCompra = document.getElementById('data-compra').value;
          const quantidade = parseInt(document.getElementById('quantidade').value, 10);
          const valorUnitario = parseFloat(inpPreco.value);
          const produtoId = produtoSelecionado?.id;

          if (!dataCompra || !produtoId || isNaN(quantidade) || isNaN(valorUnitario)) {
            return alert('Preencha todos os campos corretamente e selecione um produto válido');
          }

          const { error } = await supabase
            .from('extratos')
            .insert([{
              usuarios_id: usuarioId,
              produto_id: produtoId,
              data_compra: dataCompra,
              quantidade,
              valor_unitario: valorUnitario
            }]);

          if (error) {
            console.error('Erro ao adicionar lançamento:', error);
            return alert('Erro ao adicionar lançamento');
          }

          alert('Lançamento adicionado com sucesso');
          listarExtratosAdmin(usuarioId);
        });
    });
}
