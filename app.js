const supabaseUrl = "https://tkqdqydcthdztitfzmrs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcWRxeWRjdGhkenRpdGZ6bXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTQxMjQsImV4cCI6MjA4OTg5MDEyNH0.ZWv6OvU3l-9qHHUu--9dyIaOxl672tm59u8I_qhLTzo";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Aguardar o DOM carregar completamente
document.addEventListener('DOMContentLoaded', function() {
  const btnEntrar = document.getElementById('btnEntrar');
  
  if (btnEntrar) {
    btnEntrar.addEventListener('click', logar);
  }
});

async function logar() {
  console.log("clicou");

  const login = document.getElementById("login").value;
  const senha = document.getElementById("senha").value;

  if (!login || !senha) {
    alert("Por favor, preencha usuário e senha!");
    return;
  }

  const email = login + "@sistema.com";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: senha
  });

  console.log(data, error);

  if (error) {
    alert("Erro no login: " + error.message);
  } else {
    alert("Login realizado!");
    window.location.href = "dashboard.html";
  }
}
