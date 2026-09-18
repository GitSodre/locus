// Só chega aqui quem acabou de logar com a senha temporária.
// Sem sessão válida, não há o que redefinir.
document.addEventListener("DOMContentLoaded", async () => {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data.session) {
    window.location.href = "index.html";
  }
});

function apenasNumeros(input) {
  input.value = input.value.replace(/\D/g, "").slice(0, 6);
}

document.getElementById("pin1").addEventListener("input", e => apenasNumeros(e.target));
document.getElementById("pin2").addEventListener("input", e => apenasNumeros(e.target));

document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    document.getElementById("btnDefinir").click();
  }
});

document.getElementById("btnDefinir").addEventListener("click", async () => {
  const pin1 = document.getElementById("pin1").value;
  const pin2 = document.getElementById("pin2").value;
  const msg = document.getElementById("msg");
  const btn = document.getElementById("btnDefinir");

  msg.classList.remove("erro");
  msg.textContent = "";

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

  const { error: errSenha } = await supabaseClient.auth.updateUser({ password: pin1 });

  if (errSenha) {
    btn.disabled = false;
    msg.classList.add("erro");
    msg.textContent = traduzirErroAuth(errSenha.message);
    return;
  }

  // Marca o primeiro acesso como concluído. Isso passa por uma função
  // no banco (RPC) porque o usuário comum não tem permissão para
  // alterar sua própria linha na tabela "usuarios" diretamente.
  const { error: errRpc } = await supabaseClient.rpc("finalizar_primeiro_acesso");
  if (errRpc) {
    console.error("Erro ao concluir primeiro acesso:", errRpc);
  }

  window.location.href = "dashboard.html";
});
