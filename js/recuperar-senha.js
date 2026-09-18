document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    document.getElementById("btnEnviar").click();
  }
});

document.getElementById("btnEnviar").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const msg = document.getElementById("msg");
  const btn = document.getElementById("btnEnviar");

  msg.classList.remove("erro");

  if (!email) {
    msg.classList.add("erro");
    msg.textContent = "Informe seu email.";
    return;
  }

  btn.disabled = true;

  // redirectTo precisa estar na lista de "Redirect URLs" do projeto no
  // Supabase (Authentication > URL Configuration), senão o link do
  // email não funciona.
  await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/redefinir-senha.html"
  });

  btn.disabled = false;

  // Mensagem igual em qualquer caso — evita revelar quais emails
  // estão ou não cadastrados no sistema.
  msg.textContent = "Se este email estiver cadastrado, você receberá um link para redefinir sua senha.";
});
