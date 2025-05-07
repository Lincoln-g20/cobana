// 1) Inicializa o cliente Supabase
const SUPABASE_URL = 'https://qrqnvtoexhfmhrmqwrzu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycW52dG9leGhmbWhybXF3cnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDAwODAsImV4cCI6MjA2MTE3NjA4MH0.CGp5pLM4EigrJZcJxPHJPZY7Xz4Mn3kJFYm02ntIhJU';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- Autenticação ----
async function login() {
  const nome = document.getElementById('nome').value;
  const senha = document.getElementById('senha').value;
  const erro = document.getElementById('erro');

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('nome', nome)
    .eq('senha', senha)
    .single();

  if (error || !data) {
    erro.textContent = 'Usuário ou senha incorretos.';
    return;
  }
  erro.textContent = '';

  // Exibe o container apropriado
  if (data.tipo === 'admin') {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-container').style.display = 'block';
    document.getElementById('painel-conteudo').innerHTML = '<p>Escolha uma opção no painel acima.</p>';
    document.getElementById('btn-voltar').style.display = 'none';
  } else {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('usuario-container').style.display = 'block';
    document.getElementById('cliente-nome').textContent = data.nome;
    carregarExtrato(data.id);
  }
}

// ---- Logout ----
function logout() {
  if (!confirm('Tem certeza que deseja fazer logout?')) return;
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('admin-container').style.display = 'none';
  document.getElementById('usuario-container').style.display = 'none';
  document.getElementById('nome').value = '';
  document.getElementById('senha').value = '';
  document.getElementById('erro').textContent = '';
}
