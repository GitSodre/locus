/*********************************
 * DASHBOARD.JS – FINAL E ESTÁVEL
 * + COPIAR + SHOW/HIDE
 * + PAINEL ADMIN (editar convênio)
 * + CHAMADOS (solicitar / gerenciar troca de senha)
 *********************************/

// logout global
window.logout = async function () {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
};

let conveniosCache = [];
let isAdmin = false;
let currentUserEmail = "";
let currentUserName = "";
let convenioAtual = null; // objeto do convênio selecionado no momento

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  limparDados();            // estado inicial
  prepararBotoesDeCopia();  // listeners de copiar (uma única vez)
  prepararPainelAdmin();    // listener do botão "Salvar alterações"
  prepararModalChamado();   // listeners do modal de solicitação

  await verificarPapel();   // define isAdmin e ajusta a tela

  const { data, error } = await supabaseClient
    .from("convenios")
    .select("*");

  if (error) {
    console.error("Erro ao carregar convênios:", error);
    alert("Não foi possível carregar os convênios.");
    await window.logout();
    return;
  }

  conveniosCache = data || [];
  carregarEmpresas();
});

/* =====================================================
   PAPEL DO USUÁRIO (ADMIN x FUNCIONÁRIO)
   Consulta a tabela "usuarios" pelo e-mail autenticado.
===================================================== */
async function verificarPapel() {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData?.user;

  currentUserEmail = user?.email || "";
  currentUserName = user?.user_metadata?.full_name || currentUserEmail;

  const { data: userRow, error } = await supabaseClient
    .from("usuarios")
    .select("tipo")
    .eq("email", currentUserEmail)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar papel do usuário:", error);
  }

  isAdmin = (userRow?.tipo || "").toString().toLowerCase() === "admin";
  aplicarVisibilidadeAdmin();
}

function aplicarVisibilidadeAdmin() {
  const btnPainelAdmin = document.getElementById("btnPainelAdmin");
  const painelEdicao = document.getElementById("painelEdicao");
  const painelChamados = document.getElementById("painelChamados");

  if (btnPainelAdmin) btnPainelAdmin.hidden = !isAdmin;
  if (painelEdicao) painelEdicao.hidden = !isAdmin;
  if (painelChamados) painelChamados.hidden = !isAdmin;

  if (isAdmin) carregarChamados();
}

// Rola a tela até o painel de edição (o botão "Painel Admin" só aparece para admins)
window.toggleAdminPanels = function () {
  const painelEdicao = document.getElementById("painelEdicao");
  if (painelEdicao && !painelEdicao.hidden) {
    painelEdicao.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

/* ================= EMPRESAS ================= */
function carregarEmpresas() {
  const selectEmpresa = document.getElementById("selectEmpresa");
  selectEmpresa.length = 1;

  const empresas = [...new Set(conveniosCache.map(c => c.empresa))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  empresas.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp;
    opt.textContent = emp;
    selectEmpresa.appendChild(opt);
  });

  selectEmpresa.onchange = () => {
    limparDados();
    const empresa = selectEmpresa.value;
    document.getElementById("outEmpresa").textContent = empresa || "—";
    carregarConvenios(empresa);
  };
}

/* ================= CONVÊNIOS ================= */
function carregarConvenios(empresa) {
  const selectConvenio = document.getElementById("selectConvenio");
  selectConvenio.innerHTML = '<option value="">Selecione o convênio</option>';
  selectConvenio.disabled = !empresa;

  if (!empresa) {
    setCopyState(); // garante botões ocultos
    return;
  }

  const convenios = conveniosCache
    .filter(c => c.empresa === empresa)
    .map(c => c.convenio)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  convenios.forEach(conv => {
    const opt = document.createElement("option");
    opt.value = conv;
    opt.textContent = conv;
    selectConvenio.appendChild(opt);
  });

  selectConvenio.onchange = () => {
    const selecionado = selectConvenio.value;
    const c = conveniosCache.find(
      x => x.empresa === empresa && x.convenio === selecionado
    );

    if (!c) {
      limparDados();
      return;
    }

    convenioAtual = c;

    document.getElementById("outConvenio").textContent = c.convenio;
    atualizarExibicaoConvenio(c);

    // Habilita ação de solicitar troca de senha
    document.getElementById("btnChamado").disabled = false;

    // Se for admin, popula o formulário de edição
    if (isAdmin) preencherFormularioEdicao(c);

    // Atualiza visibilidade dos botões de copiar
    setCopyState();
  };
}

/* Atualiza os campos Link / Login / Senha / Observação exibidos na tela */
function atualizarExibicaoConvenio(c) {
  const linkEl = document.getElementById("outLink");

  if (c.link && c.link.trim() !== "") {
    const url = c.link.startsWith("http") ? c.link : "https://" + c.link;
    linkEl.href = url;
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";
    linkEl.textContent = url;
    linkEl.removeAttribute("aria-disabled");
    linkEl.classList.remove("link-desabilitado");
  } else {
    linkEl.textContent = "—";
    linkEl.removeAttribute("href");
    linkEl.removeAttribute("target");
    linkEl.setAttribute("aria-disabled", "true");
    linkEl.classList.add("link-desabilitado");
  }

  document.getElementById("outLogin").textContent = safeText(c.login);
  document.getElementById("outSenha").textContent = safeText(c.senha);
  document.getElementById("outObservacao").textContent = safeText(c.observacao);
}

/* ================= COPIAR ================= */
function prepararBotoesDeCopia() {
  const btnCopyLink  = document.getElementById("copyLink");
  const btnCopyLogin = document.getElementById("copyLogin");
  const btnCopySenha = document.getElementById("copySenha");

  if (btnCopyLink)  btnCopyLink.addEventListener("click", async () => { await copyToClipboard(getValueForCopyLink()); });
  if (btnCopyLogin) btnCopyLogin.addEventListener("click", async () => { await copyToClipboard(getTextFrom("outLogin")); });
  if (btnCopySenha) btnCopySenha.addEventListener("click", async () => { await copyToClipboard(getTextFrom("outSenha")); });
}

function setCopyState() {
  toggleCopyVisibility("copyLink",  !!getValueForCopyLink());
  toggleCopyVisibility("copyLogin", !!getTextFrom("outLogin"));
  toggleCopyVisibility("copySenha", !!getTextFrom("outSenha"));
}

function toggleCopyVisibility(btnId, show) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  if (show) {
    btn.disabled = false;
    btn.removeAttribute("hidden");
    btn.style.display = "inline-block";
  } else {
    btn.disabled = true;
    btn.setAttribute("hidden", "");
    btn.style.display = "none";
  }
}

function getValueForCopyLink() {
  const a = document.getElementById("outLink");
  const href = a.getAttribute("href");
  const disabled = a.getAttribute("aria-disabled") === "true";
  return (!disabled && href) ? href : "";
}

function getTextFrom(id) {
  const el = document.getElementById(id);
  const t = (el?.textContent || "").trim();
  return (t && t !== "—") ? t : "";
}

function safeText(v) {
  const t = (v ?? "").toString().trim();
  return t ? t : "—";
}

async function copyToClipboard(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  }
}

/* =====================================================
   PAINEL ADMIN — EDIÇÃO DO CONVÊNIO SELECIONADO
===================================================== */
function prepararPainelAdmin() {
  const btnSalvar = document.getElementById("btnSalvarConvenio");
  if (!btnSalvar) return;
  btnSalvar.addEventListener("click", salvarConvenio);
}

function preencherFormularioEdicao(c) {
  const editLink = document.getElementById("editLink");
  if (!editLink) return; // painel não existe nesta página

  editLink.value = c.link || "";
  document.getElementById("editLogin").value = c.login || "";
  document.getElementById("editSenha").value = c.senha || "";
  document.getElementById("editObservacao").value = c.observacao || "";
  document.getElementById("btnSalvarConvenio").disabled = false;

  const msg = document.getElementById("msgSalvarConvenio");
  if (msg) { msg.textContent = ""; msg.classList.remove("erro"); }
}

function limparFormularioEdicao() {
  const editLink = document.getElementById("editLink");
  if (!editLink) return;

  editLink.value = "";
  document.getElementById("editLogin").value = "";
  document.getElementById("editSenha").value = "";
  document.getElementById("editObservacao").value = "";
  document.getElementById("btnSalvarConvenio").disabled = true;

  const msg = document.getElementById("msgSalvarConvenio");
  if (msg) { msg.textContent = ""; msg.classList.remove("erro"); }
}

async function salvarConvenio() {
  if (!isAdmin || !convenioAtual) return;

  const msg = document.getElementById("msgSalvarConvenio");
  const novoLink  = document.getElementById("editLink").value.trim();
  const novoLogin = document.getElementById("editLogin").value.trim();
  const novaSenha = document.getElementById("editSenha").value.trim();
  const novaObs   = document.getElementById("editObservacao").value.trim();

  const { error } = await supabaseClient
    .from("convenios")
    .update({ link: novoLink, login: novoLogin, senha: novaSenha, observacao: novaObs })
    .eq("id", convenioAtual.id);

  if (error) {
    console.error("Erro ao salvar convênio:", error);
    msg.textContent = "Erro ao salvar alterações.";
    msg.classList.add("erro");
    return;
  }

  // Atualiza objeto atual e cache local
  convenioAtual.link = novoLink;
  convenioAtual.login = novoLogin;
  convenioAtual.senha = novaSenha;
  convenioAtual.observacao = novaObs;

  const idx = conveniosCache.findIndex(x => x.id === convenioAtual.id);
  if (idx !== -1) conveniosCache[idx] = { ...conveniosCache[idx], ...convenioAtual };

  atualizarExibicaoConvenio(convenioAtual);
  setCopyState();

  msg.classList.remove("erro");
  msg.textContent = "Alterações salvas com sucesso.";
}

/* =====================================================
   MODAL — SOLICITAR ALTERAÇÃO DE SENHA (usuário normal)
===================================================== */
function prepararModalChamado() {
  const btnChamado = document.getElementById("btnChamado");
  const modal = document.getElementById("modalChamado");
  const btnCancelar = document.getElementById("btnCancelarChamado");
  const btnConfirmar = document.getElementById("btnConfirmarChamado");

  if (!btnChamado || !modal) return;

  btnChamado.addEventListener("click", () => {
    if (!convenioAtual) return;

    document.getElementById("modalEmpresa").textContent = convenioAtual.empresa;
    document.getElementById("modalConvenio").textContent = convenioAtual.convenio;
    document.getElementById("modalNovaSenha").value = "";

    const msg = document.getElementById("msgModalChamado");
    msg.textContent = "";
    msg.classList.remove("erro");

    modal.hidden = false;
  });

  btnCancelar?.addEventListener("click", () => { modal.hidden = true; });

  btnConfirmar?.addEventListener("click", async () => {
    if (!convenioAtual) return;

    const novaSenha = document.getElementById("modalNovaSenha").value.trim();
    const msg = document.getElementById("msgModalChamado");

    if (!novaSenha) {
      msg.textContent = "Digite a nova senha desejada.";
      msg.classList.add("erro");
      return;
    }

    const { error } = await supabaseClient.from("chamados").insert({
      usuario: currentUserEmail,
      usuario_nome: currentUserName,
      empresa: convenioAtual.empresa,
      convenio: convenioAtual.convenio,
      login: convenioAtual.login,
      nova_senha: novaSenha,
      status: "aberto",
      visualizado: false
    });

    if (error) {
      console.error("Erro ao enviar chamado:", error);
      msg.textContent = "Erro ao enviar solicitação.";
      msg.classList.add("erro");
      return;
    }

    msg.classList.remove("erro");
    msg.textContent = "Solicitação enviada com sucesso!";

    setTimeout(() => { modal.hidden = true; }, 1200);
  });
}

/* =====================================================
   PAINEL ADMIN — LISTA DE CHAMADOS
===================================================== */
async function carregarChamados() {
  const { data, error } = await supabaseClient
    .from("chamados")
    .select("*")
    .order("data_abertura", { ascending: false });

  if (error) {
    console.error("Erro ao carregar chamados:", error);
    return;
  }

  renderizarChamados(data || []);
}

function renderizarChamados(chamados) {
  const lista = document.getElementById("listaChamados");
  const badge = document.getElementById("badgeChamados");
  if (!lista) return;

  const abertos = chamados.filter(c => normalizarStatus(c.status) !== "concluido");

  if (badge) {
    if (abertos.length > 0) {
      badge.textContent = abertos.length;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  if (chamados.length === 0) {
    lista.innerHTML = '<p class="painel-aviso">Nenhum chamado no momento.</p>';
    return;
  }

  lista.innerHTML = "";

  chamados.forEach(c => {
    const status = normalizarStatus(c.status);

    const item = document.createElement("div");
    item.className = "chamado-item";

    const info = document.createElement("div");
    info.className = "chamado-info";
    info.innerHTML = `
      <p><strong>${escapeHtml(c.usuario_nome || c.usuario)}</strong> — ${escapeHtml(c.empresa)} / ${escapeHtml(c.convenio)}</p>
      <p>Login: ${escapeHtml(c.login || "—")} &nbsp;|&nbsp; Nova senha solicitada: ${escapeHtml(c.nova_senha || "—")}</p>
      <p class="chamado-data">Aberto em: ${formatarData(c.data_abertura)}</p>
    `;

    const acoes = document.createElement("div");
    acoes.className = "chamado-acoes";

    const statusSpan = document.createElement("span");
    statusSpan.className = `status-badge status-${status}`;
    statusSpan.textContent = rotuloStatus(status);
    acoes.appendChild(statusSpan);

    if (status === "aberto") {
      const btnIniciar = document.createElement("button");
      btnIniciar.className = "btn-verde btn-small";
      btnIniciar.textContent = "Iniciar";
      btnIniciar.onclick = () => atualizarStatusChamado(c.id, "em_andamento");
      acoes.appendChild(btnIniciar);
    }

    if (status === "em_andamento") {
      const btnConcluir = document.createElement("button");
      btnConcluir.className = "btn-verde btn-small";
      btnConcluir.textContent = "Concluir";
      btnConcluir.onclick = () => concluirChamado(c);
      acoes.appendChild(btnConcluir);
    }

    item.appendChild(info);
    item.appendChild(acoes);
    lista.appendChild(item);
  });
}

function normalizarStatus(status) {
  // remove aspas literais que possam ter vindo do valor DEFAULT antigo do banco
  const s = (status || "").toString().replace(/'/g, "").trim().toLowerCase();
  if (s.includes("andamento")) return "em_andamento";
  if (s.includes("conclu")) return "concluido";
  return "aberto";
}

function rotuloStatus(status) {
  return { aberto: "Aberto", em_andamento: "Em andamento", concluido: "Concluído" }[status] || status;
}

function formatarData(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

function escapeHtml(str) {
  return (str ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function atualizarStatusChamado(id, novoStatus) {
  const payload = { status: novoStatus };
  if (novoStatus === "em_andamento") payload.data_inicio = new Date().toISOString();

  const { error } = await supabaseClient.from("chamados").update(payload).eq("id", id);

  if (error) {
    console.error("Erro ao atualizar chamado:", error);
    alert("Não foi possível atualizar o chamado.");
    return;
  }

  carregarChamados();
}

async function concluirChamado(c) {
  // 1) marca o chamado como concluído
  const { error: errChamado } = await supabaseClient
    .from("chamados")
    .update({
      status: "concluido",
      data_conclusao: new Date().toISOString(),
      admin_concluiu_email: currentUserEmail,
      admin_concluiu_nome: currentUserName
    })
    .eq("id", c.id);

  if (errChamado) {
    console.error("Erro ao concluir chamado:", errChamado);
    alert("Não foi possível concluir o chamado.");
    return;
  }

  // 2) aplica a nova senha no convênio correspondente
  const { error: errConvenio } = await supabaseClient
    .from("convenios")
    .update({ senha: c.nova_senha })
    .eq("empresa", c.empresa)
    .eq("convenio", c.convenio);

  if (errConvenio) {
    console.error("Chamado concluído, mas falhou ao atualizar a senha do convênio:", errConvenio);
  } else {
    // atualiza cache e tela, caso o convênio concluído seja o que está selecionado
    const idx = conveniosCache.findIndex(x => x.empresa === c.empresa && x.convenio === c.convenio);
    if (idx !== -1) {
      conveniosCache[idx].senha = c.nova_senha;
      if (convenioAtual && convenioAtual.id === conveniosCache[idx].id) {
        convenioAtual.senha = c.nova_senha;
        atualizarExibicaoConvenio(convenioAtual);
        preencherFormularioEdicao(convenioAtual);
        setCopyState();
      }
    }
  }

  carregarChamados();
}

/* ================= LIMPEZA ================= */
function limparDados() {
  convenioAtual = null;

  document.getElementById("outEmpresa").textContent = "—";
  document.getElementById("outConvenio").textContent = "—";

  const linkEl = document.getElementById("outLink");
  linkEl.textContent = "—";
  linkEl.removeAttribute("href");
  linkEl.removeAttribute("target");
  linkEl.setAttribute("aria-disabled", "true");
  linkEl.classList.add("link-desabilitado");

  document.getElementById("outLogin").textContent = "—";
  document.getElementById("outSenha").textContent = "—";
  document.getElementById("outObservacao").textContent = "—";

  document.getElementById("btnChamado").disabled = true;
  document.getElementById("selectConvenio").disabled = true;

  limparFormularioEdicao(); // esconde/zera formulário de edição do admin
  setCopyState();           // esconde botões de copiar
}
