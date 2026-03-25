// js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar = document.getElementById("btnEntrar");

  if (btnEntrar) {
    btnEntrar.addEventListener("click", logar);
  }
});

async function logar() {
  const login = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!login || !senha) {
    alert("Preencha usuário e senha");
    return;
  }

  const email = login + "@sistema.com";

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: senha
    });

  if (error) {
    alert("Erro no login: " + error.message);
    console.error(error);
    return;
  }

  // Buscar tipo do usuário
  const { data: usuario, error: erroUsuario } = await supabaseClient
    .from("usuarios")
    .select("tipo")
    .eq("email", email)
    .single();

  if (erroUsuario) {
    alert("Usuário não autorizado");
    await supabaseClient.auth.signOut();
    return;
  }

  localStorage.setItem("tipoUsuario", usuario.tipo);
  window.location.href = "dashboard.html";
}
