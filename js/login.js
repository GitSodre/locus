// Toggle mostrar/ocultar senha
document.getElementById("toggleSenha").addEventListener("click", () => {
  const senhaInput = document.getElementById("senha");
  senhaInput.type = senhaInput.type === "password" ? "text" : "password";
});

// Enter faz login
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("btnEntrar").click();
  }
});

document.getElementById("btnEntrar").addEventListener("click", async () => {
  const email = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    alert("Preencha email e senha");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    alert("Login inválido");
    return;
  }

  window.location.href = "dashboard.html";
});
