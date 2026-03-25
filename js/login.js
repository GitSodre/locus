document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar = document.getElementById("btnEntrar");

  btnEntrar.addEventListener("click", async () => {
    const email = document.getElementById("login").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      alert("Preencha email e senha");
      return;
    }

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password: senha
      });

    if (error) {
      alert("Login inválido");
      console.error(error);
      return;
    }

    window.location.href = "dashboard.html";
  });
});
