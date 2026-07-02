/*********************************
 * DASHBOARD.JS – com permissões admin/usuário
 *********************************/

window.logout = async function () {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
};

let conveniosCache = [];
let usuarioAtualEmail = null;
let isAdmin = false;
let convenioSelecionado = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  usuarioAtualEmail = sessionData.session.user.email;
  await checarPermissaoAdmin();

  limparDados();
  prepararBotoesDeCopia();
  prepararModalSolicitacao();
  prepararEdicaoAdmin();

  const { data, error } = await supabaseClient.from("convenios").select("*");

  if (error) {
    console.error("Erro ao carregar convênios:", error);
    alert("Não foi possível carregar os convênios.");
    await window.logout();
    return;
  }

  conveniosCache = data || [];
  carregarEmpresas();

  if (isAdmin) {
    document.getElementById("adminSection").hidden = false;
    carregarChamadosAbertos();
  }
});

/* ================= PERMISSÃO ================= */
async function checarPermissaoAdmin() {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("tipo")
    .eq("email", usuarioAtualEmail)
    .maybeSingle();

  if (error) {
    console.error("Erro ao checar permissão:", error);
    isAdmin = false;
    return;
  }
  isAdmin = data?.tipo === "admin";
}

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
    setCopyState();
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
    const c = conveniosCache.find(x => x.empresa === empresa && x.convenio === selecionado);

    if (!c) {
      convenioSelecionado = null;
      limparDados();
      return;
    }

    convenioSelecionado = c;
    preencherCampos(c);

    document.getElementById("btnChamado").disabled = false;
    const btnEditar = document.getElementById("btnEditarConvenio");
    if (btnEditar) btnEditar.disabled = false;

    setCopyState();
  };
}

function preencherCampos(c) {
  document.getElementById("outConvenio").textContent = c.convenio;

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

/* ================= COPIAR (igual ao original) ================= */
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

/* ================= MODAL: SOLICITAR ALTERAÇÃO (usuário comum) ================= */
function prepararModalSolicitacao() {
  const btnChamado = document.getElementById("btnChamado");
  const modal = document.getElementById("modalSolicitacao");
  const btnCancelar = document.getElementById("modalCancelar");
  const btnEnviar = document.getElementById("modalEnviar");

  btnChamado.addEventListener("click", () => {
    if (!convenioSelecionado) return;
    document.getElementById("modalLoginAtual").textContent = safeText(convenioSelecionado.login);
    document.getElementById("modalNovoLogin").value = "";
    document.getElementById("modalNovaSenha").value = "";
    modal.hidden = false;
  });

  btnCancelar.addEventListener("click", () => { modal.hidden = true; });

  btnEnviar.addEventListener("click", async () => {
    if (!convenioSelecionado) return;

    const novoLogin = document.getElementById("modalNovoLogin").value.trim();
    const novaSenha = document.getElementById("modalNovaSenha").value.trim();

    if (!novoLogin && !novaSenha) {
      alert("Preencha ao menos um dos campos (login ou senha).");
      return;
    }

    const { error } = await supabaseClient.from("chamados").insert({
      usuario: usuarioAtualEmail,
      usuario_nome: usuarioAtualEmail,
      empresa: convenioSelecionado.empresa,
      convenio: convenioSelecionado.convenio,
      login: novoLogin || null,
      nova_senha: novaSenha || null,
      status: "aberto"
    });

    if (error) {
      console.error("Erro ao abrir chamado:", error);
      alert("Não foi possível enviar a solicitação.");
      return;
    }

    alert("Solicitação enviada com sucesso!");
    modal.hidden = true;

    if (isAdmin) carregarChamadosAbertos();
  });
}

/* ================= EDIÇÃO (só admin) ================= */
function prepararEdicaoAdmin() {
  if (!isAdmin) return;

  const btnEditar = document.getElementById("btnEditarConvenio");
  const btnSalvar = document.getElementById("btnSalvarConvenio");
  const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

  btnEditar.addEventListener("click", () => {
    if (!convenioSelecionado) return;
    document.getElementById("editLink").value = convenioSelecionado.link || "";
    document.getElementById("editLogin").value = convenioSelecionado.login || "";
    document.getElementById("editSenha").value = convenioSelecionado.senha || "";
    document.getElementById("editObservacao").value = convenioSelecionado.observacao || "";
    ativarModoEdicao(true);
  });

  btnCancelarEdicao.addEventListener("click", () => {
    ativarModoEdicao(false);
  });

  btnSalvar.addEventListener("click", async () => {
    if (!convenioSelecionado) return;

    const atualizacao = {
      link: document.getElementById("editLink").value.trim(),
      login: document.getElementById("editLogin").value.trim(),
      senha: document.getElementById("editSenha").value.trim(),
      observacao: document.getElementById("editObservacao").value.trim()
    };

    const { error } = await supabaseClient
      .from("convenios")
      .update(atualizacao)
      .eq("id", convenioSelecionado.id);

    if (error) {
      console.error("Erro ao salvar convênio:", error);
      alert("Não foi possível salvar as alterações.");
      return;
    }

    Object.assign(convenioSelecionado, atualizacao);
    const idx = conveniosCache.findIndex(c => c.id === convenioSelecionado.id);
    if (idx >= 0) conveniosCache[idx] = convenioSelecionado;

    preencherCampos(convenioSelecionado);
    ativarModoEdicao(false);
    setCopyState();
    alert("Convênio atualizado com sucesso!");
  });
}

function ativarModoEdicao(ligado) {
  document.getElementById("visualizacaoConvenio").hidden = ligado;
  document.getElementById("edicaoConvenio").hidden = !ligado;
}

/* ================= CHAMADOS (só admin) ================= */
async function carregarChamadosAbertos() {
  const { data, error } = await supabaseClient
    .from("chamados")
    .select("*")
    .eq("status", "aberto")
    .order("data_abertura", { ascending: false });

  if (error) {
    console.error("Erro ao carregar chamados:", error);
    return;
  }
  renderizarChamados(data || []);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function renderizarChamados(chamados) {
  const container = document.getElementById("chamadosContainer");
  container.innerHTML = "";

  if (chamados.length === 0) {
    container.innerHTML = "<p>Nenhum chamado em aberto.</p>";
    return;
  }

  chamados.forEach(ch => {
    const item = document.createElement("div");
    item.className = "chamado-item";
    item.innerHTML = `
      <p><strong>Usuário:</strong> ${escapeHtml(ch.usuario_nome || ch.usuario)}</p>
      <p><strong>Empresa:</strong> ${escapeHtml(ch.empresa)} — <strong>Convênio:</strong> ${escapeHtml(ch.convenio)}</p>
      <p><strong>Novo login:</strong> ${escapeHtml(ch.login) || "—"}</p>
      <p><strong>Nova senha:</strong> ${escapeHtml(ch.nova_senha) || "—"}</p>
      <p><strong>Aberto em:</strong> ${new Date(ch.data_abertura).toLocaleString("pt-BR")}</p>
      <button class="btn-verde btn-dar-baixa" data-id="${ch.id}">Dar baixa</button>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll(".btn-dar-baixa").forEach(btn => {
    btn.addEventListener("click", async () => {
      await darBaixaChamado(btn.dataset.id);
    });
  });
}

async function darBaixaChamado(id) {
  const { error } = await supabaseClient
    .from("chamados")
    .update({
      status: "concluido",
      data_conclusao: new Date().toISOString(),
      admin_concluiu_email: usuarioAtualEmail
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao dar baixa:", error);
    alert("Não foi possível concluir o chamado.");
    return;
  }
  carregarChamadosAbertos();
}

/* ================= LIMPEZA ================= */
function limparDados() {
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

  const btnEditar = document.getElementById("btnEditarConvenio");
  if (btnEditar) btnEditar.disabled = true;
  ativarModoEdicaoSeguro(false);

  convenioSelecionado = null;
  setCopyState();
}

function ativarModoEdicaoSeguro(ligado) {
  const view = document.getElementById("visualizacaoConvenio");
  const edit = document.getElementById("edicaoConvenio");
  if (view) view.hidden = ligado;
  if (edit) edit.hidden = !ligado;
}
