// extratos_user.js — Apenas leitura do próprio extrato
async function carregarExtrato(usuarioId) {
  const { data, error } = await supabase
    .from('extratos')
    .select('data_compra, produtos(nome), quantidade, valor_unitario')
    .eq('usuarios_id', usuarioId)
    .order('data_compra', { ascending: false });

  if (error) {
    console.error('Erro ao carregar extrato:', error);
    return;
  }

  const listaContainer = document.getElementById('extrato-lista');
  const totalSpan = document.getElementById('total');
  listaContainer.innerHTML = '';

  let total = 0;

  // Cabeçalho da tabela
  let html = `
    <table class="tabela-extratos">
      <thead>
        <tr>
          <th>Data</th>
          <th>Produto</th>
          <th>Qtd</th>
          <th>Unitário</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Linhas da tabela
  data.forEach(item => {
    const subtotal = item.quantidade * item.valor_unitario;
    total += subtotal;

    html += `
      <tr>
        <td>${item.data_compra}</td>
        <td>${item.produtos.nome}</td>
        <td>${item.quantidade}</td>
        <td>${item.valor_unitario.toFixed(2)}</td>
        <td>${subtotal.toFixed(2)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  listaContainer.innerHTML = html;
  totalSpan.textContent = total.toFixed(2);
}
