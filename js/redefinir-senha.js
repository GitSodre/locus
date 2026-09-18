let linkValido = false;

document.addEventListener("DOMContentLoaded", () => {
  const msg = document.getElementById("msg");

  // O cliente Supabase já lê o token da URL do link do email
  // (detectSessionInUrl: true, configurado em supabase.js) e dispara
  // o evento PASSWORD_RECOVERY quando o link ainda é válido.
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      linkValido = true;
    }
  });

  // Se depois de alguns segundos nenhum evento de recuperação chegou,
  // o link provavelmente é inválido ou já expirou.
  setTimeout(() => {
    if (!linkValido) {
      msg.classList.add("erro");
      msg.textContent = "Link inválido ou expirado. Solicite a recuperação novamente.";
      document.getElementById("btnRedefinir").disabled = true;
    }
  }, 3000);
});

function apenasNumeros(input) {
  input.value = input.value.replace(/\D/g, "").slice(0, 6);
}

document.getElementById("pin1").addEventListener("input", e => apenasNumeros(e.target));
document.getElementById("pin2").addEventListener("input", e => apenasNumeros(e.target));

document.getElementById("btnRedefinir").addEventListener("click", async () => {
  const pin1 = document.getElementById("pin1").value;
  const pin2 = document.getElementById("pin2").value;
  const msg = document.getElementById("msg");
  const btn = document.getElementById("btnRedefinir");

  msg.classList.remove("erro");
  msg.textContent = "";

  if (!linkValido) {
    msg.classList.add("erro");
    msg.textContent = "Link inválido ou expirado. Solicite a recuperação novamente.";
    return;
  }
  if (pin1.length !== 6 || pin2.length !== 6) {
    msg.classList.add("erro");
    msg.textContent = "A senha precisa ter exatamente 6 números.";
    return;
  }
  if (pin1 !== pin2) {
    msg.classList.add("erro");
    msg.textContent = "As senhas digitadas não coincidem.";
    return;
  }

  btn.disabled = true;

  const { error } = await supabaseClient.auth.updateUser({ password: pin1 });

  if (error) {
    btn.disabled = false;
    msg.classList.add("erro");
    msg.textContent = "Não foi possível redefinir a senha: " + error.message;
    return;
  }

  msg.textContent = "Senha redefinida com sucesso! Redirecionando para o login...";

  await supabaseClient.auth.signOut();
  setTimeout(() => { window.location.href = "index.html"; }, 1500);
});
