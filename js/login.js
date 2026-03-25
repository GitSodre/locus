document.getElementById("btnEntrar").addEventListener("click", async () => {
  const login = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!login || !senha) {
    alert("Preencha login e senha");
    return;
  }

  const email = login + "@sistema.com";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    alert("Login inválido");
    console.error(error);
    return;
  }

  // ✅ LOGIN ACABA AQUI
  window.location.href = "dashboard.html";
});
``
