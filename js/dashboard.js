/*********************************
 * DASHBOARD.JS – FINAL E ESTÁVEL
 * + COPIAR + SHOW/HIDE
 * + PAINEL ADMIN (editar convênio + acessos adicionais)
 * + CHAMADOS (login / senha / link) com revisão facilitada
 *********************************/

const ICON_COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon-copy" aria-hidden="true"><path d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"/></svg>`;

// logout global
window.logout = async function () {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
};

let conveniosCache = [];
let isAdmin = false;
let currentUserEmail = "";
let currentUserName = "";
let convenioAtual = null;       // convênio selecionado nos filtros
let acessosExtraAtual = [];     // acessos adicionais do convênio selecionado
let chamadoEmRevisao = null;    // id do chamado sendo revisado no formulário do admin

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  limparDados();
  prepararBotoesDeCopia();
  prepararPainelAdmin();
  prepararModalChamado();

  await verificarPapel();

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

  if (error) console.error("Erro ao verificar papel do usuário:", error);

  isAdmin = (userRow?.tipo || "").toString().toLowerCase() === "admin";
  aplicarVisibilidadeAdmin();
}

function aplicarVisibilidadeAdmin() {
  const painelEdicao = document.getElementById("painelEdicao");
  const painelChamados = document.getElementById("painelChamados");

  if (painelEdicao) painelEdicao.hidden = !isAdmin;
  if (painelChamados) painelChamados.hidden = !isAdmin;

  if (isAdmin) carregarChamados();
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
    const c = conveniosCache.find(
      x => x.empresa === empresa && x.convenio === selecionado
    );

    if (!c) {
      limparDados();
      return;
    }

    cancelarRevisao();
    selecionarConvenio(c);
  };
}

async function selecionarConvenio(c) {
  convenioAtual = c;
  document.getElementById("outConvenio").textContent = c.convenio;
  atualizarExibicaoConvenio(c);
  document.getElementById("btnChamado").disabled = false;

  await carregarAcessosExtra(c.id);

  if (isAdmin) preencherFormularioEdicao(c);

  setCopyState();
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

/* =====================================================
   ACESSOS ADICIONAIS (convênios com mais de 1 link/login/senha)
===================================================== */
async function carregarAcessosExtra(convenioId) {
  const { data, error } = await supabaseClient
    .from("convenio_acessos")
    .select("*")
    .eq("convenio_id", convenioId)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao carregar acessos adicionais:", error);
    acessosExtraAtual = [];
  } else {
    acessosExtraAtual = (data || []).map(a => ({ ...a, _removido: false }));
  }

  renderizarOutrosAcessosView();
  if (isAdmin) renderizarAcessosExtraForm();
}

function renderizarOutrosAcessosView() {
  const container = document.getElementById("outrosAcessos");
  const lista = document.getElementById("listaOutrosAcessos");
  if (!container || !lista) return;

  const validos = acessosExtraAtual.filter(a => !a._removido && (a.link || a.login || a.senha));

  if (validos.length === 0) {
    container.hidden = true;
    lista.innerHTML = "";
    return;
  }

  container.hidden = false;
  lista.innerHTML = "";

  validos.forEach(a => {
    const card = document.createElement("div");
    card.className = "acesso-extra-card";

    const titulo = document.createElement("p");
    titulo.className = "acesso-extra-titulo";
    titulo.textContent = a.rotulo || "Acesso adicional";
    card.appendChild(titulo);

    if (a.link) card.appendChild(criarLinhaAcessoView("Link", a.link, true));
    if (a.login) card.appendChild(criarLinhaAcessoView("Login", a.login));
    if (a.senha) card.appendChild(criarLinhaAcessoView("Senha", a.senha));

    lista.appendChild(card);
  });
}

function criarLinhaAcessoView(rotulo, valor, ehLink) {
  const p = document.createElement("p");

  const strong = document.createElement("strong");
  strong.textContent = `${rotulo}: `;
  p.appendChild(strong);

  if (ehLink) {
    const url = valor.startsWith("http") ? valor : "https://" + valor;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = url;
    p.appendChild(a);
    p.appendChild(criarBotaoCopiar(url, "link"));
  } else {
    const span = document.createElement("span");
    span.textContent = valor;
    p.appendChild(span);
    p.appendChild(criarBotaoCopiar(valor, rotulo.toLowerCase()));
  }

  return p;
}

function criarBotaoCopiar(valor, label) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-copy";
  btn.title = `Copiar ${label}`;
  btn.setAttribute("aria-label", `Copiar ${label}`);
  btn.innerHTML = ICON_COPY_SVG;
  btn.addEventListener("click", () => copyToClipboard(valor));
  return btn;
}

/* Formulário de administração dos acessos adicionais */
function renderizarAcessosExtraForm() {
  const lista = document.getElementById("listaAcessosExtra");
  if (!lista) return;

  lista.innerHTML = "";

  acessosExtraAtual.forEach((a, idx) => {
    if (a._removido) return;

    const linha = document.createElement("div");
    linha.className = "acesso-extra-linha";
    linha.innerHTML = `
      <input type="text" class="ae-rotulo" placeholder="Rótulo (ex: Acesso financeiro)" value="${escapeAttr(a.rotulo || "")}">
      <input type="text" class="ae-link" placeholder="Link" value="${escapeAttr(a.link || "")}">
      <input type="text" class="ae-login" placeholder="Login" value="${escapeAttr(a.login || "")}">
      <input type="text" class="ae-senha" placeholder="Senha" value="${escapeAttr(a.senha || "")}">
    `;

    const btnRemover = document.createElement("button");
    btnRemover.type = "button";
    btnRemover.className = "btn-vermelho btn-small";
    btnRemover.textContent = "Remover";
    btnRemover.onclick = () => {
      if (a.id) {
        a._removido = true;
      } else {
        acessosExtraAtual.splice(idx, 1);
      }
      renderizarAcessosExtraForm();
    };
    linha.appendChild(btnRemover);

    linha.querySelector(".ae-rotulo").addEventListener("input", e => { a.rotulo = e.target.value; });
    linha.querySelector(".ae-link").addEventListener("input", e => { a.link = e.target.value; });
    linha.querySelector(".ae-login").addEventListener("input", e => { a.login = e.target.value; });
    linha.querySelector(".ae-senha").addEventListener("input", e => { a.senha = e.target.value; });

    lista.appendChild(linha);
  });
}

function escapeAttr(str) {
  return (str ?? "").toString().replaceAll('"', "&quot;");
}

async function salvarAcessosExtra(convenioId) {
  const paraExcluir = acessosExtraAtual.filter(a => a._removido && a.id);
  for (const a of paraExcluir) {
    await supabaseClient.from("convenio_acessos").delete().eq("id", a.id);
  }

  const paraAtualizar = acessosExtraAtual.filter(a => !a._removido && a.id);
  for (const a of paraAtualizar) {
    await supabaseClient.from("convenio_acessos")
      .update({ rotulo: a.rotulo || null, link: a.link || null, login: a.login || null, senha: a.senha || null })
      .eq("id", a.id);
  }

  const paraInserir = acessosExtraAtual
    .filter(a => !a._removido && !a.id && (a.rotulo || a.link || a.login || a.senha))
    .map((a, i) => ({
      convenio_id: convenioId,
      rotulo: a.rotulo || null,
      link: a.link || null,
      login: a.login || null,
      senha: a.senha || null,
      ordem: i
    }));

  if (paraInserir.length > 0) {
    await supabaseClient.from("convenio_acessos").insert(paraInserir);
  }

  await carregarAcessosExtra(convenioId);
}

/* ================= COPIAR (campos principais) ================= */
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
   PAINEL ADMIN — EDIÇÃO DO CONVÊNIO
===================================================== */
function prepararPainelAdmin() {
  document.getElementById("btnSalvarConvenio")?.addEventListener("click", salvarConvenio);
  document.getElementById("btnCancelarRevisao")?.addEventListener("click", cancelarRevisao);

  document.getElementById("btnAddAcesso")?.addEventListener("click", () => {
    acessosExtraAtual.push({ id: null, rotulo: "", link: "", login: "", senha: "", ordem: acessosExtraAtual.length, _removido: false });
    renderizarAcessosExtraForm();
  });
}

function preencherFormularioEdicao(c) {
  const editLink = document.getElementById("editLink");
  if (!editLink) return;

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

  const listaAcessos = document.getElementById("listaAcessosExtra");
  if (listaAcessos) listaAcessos.innerHTML = "";

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

  convenioAtual.link = novoLink;
  convenioAtual.login = novoLogin;
  convenioAtual.senha = novaSenha;
  convenioAtual.observacao = novaObs;

  const idx = conveniosCache.findIndex(x => x.id === convenioAtual.id);
  if (idx !== -1) conveniosCache[idx] = { ...conveniosCache[idx], ...convenioAtual };

  await salvarAcessosExtra(convenioAtual.id);

  atualizarExibicaoConvenio(convenioAtual);
  setCopyState();

  msg.classList.remove("erro");
  msg.textContent = "Alterações salvas com sucesso.";

  if (chamadoEmRevisao) {
    const idParaConcluir = chamadoEmRevisao;
    chamadoEmRevisao = null;

    const aviso = document.getElementById("avisoRevisao");
    if (aviso) aviso.hidden = true;

    await concluirChamadoPorId(idParaConcluir);
    msg.textContent = "Alterações salvas e chamado concluído.";
  }
}

/* =====================================================
   MODAL — SOLICITAR ALTERAÇÃO DE ACESSO (usuário normal)
===================================================== */
function prepararModalChamado() {
  const btnChamado = document.getElementById("btnChamado");
  const modal = document.getElementById("modalChamado");
  const btnCancelar = document.getElementById("btnCancelarChamado");
  const btnConfirmar = document.getElementById("btnConfirmarChamado");

  if (!btnChamado || !modal) return;

  ligarCheckboxCampo("chkAlterarLogin", "modalNovoLogin");
  ligarCheckboxCampo("chkAlterarSenha", "modalNovaSenha");
  ligarCheckboxCampo("chkAlterarLink",  "modalNovoLink");

  btnChamado.addEventListener("click", () => {
    if (!convenioAtual) return;

    document.getElementById("modalEmpresa").textContent = convenioAtual.empresa;
    document.getElementById("modalConvenio").textContent = convenioAtual.convenio;

    document.getElementById("modalLoginAtual").textContent = safeText(convenioAtual.login);
    document.getElementById("modalSenhaAtual").textContent = safeText(convenioAtual.senha);
    document.getElementById("modalLinkAtual").textContent = safeText(convenioAtual.link);

    ["chkAlterarLogin", "chkAlterarSenha", "chkAlterarLink"].forEach(id => {
      document.getElementById(id).checked = false;
    });
    ["modalNovoLogin", "modalNovaSenha", "modalNovoLink"].forEach(id => {
      const el = document.getElementById(id);
      el.value = "";
      el.disabled = true;
    });

    const msg = document.getElementById("msgModalChamado");
    msg.textContent = "";
    msg.classList.remove("erro");

    modal.hidden = false;
  });

  btnCancelar?.addEventListener("click", () => { modal.hidden = true; });

  btnConfirmar?.addEventListener("click", async () => {
    if (!convenioAtual) return;

    const alterarLogin = document.getElementById("chkAlterarLogin").checked;
    const alterarSenha = document.getElementById("chkAlterarSenha").checked;
    const alterarLink  = document.getElementById("chkAlterarLink").checked;

    const novoLogin = document.getElementById("modalNovoLogin").value.trim();
    const novaSenha = document.getElementById("modalNovaSenha").value.trim();
    const novoLink  = document.getElementById("modalNovoLink").value.trim();

    const msg = document.getElementById("msgModalChamado");

    if (!alterarLogin && !alterarSenha && !alterarLink) {
      msg.textContent = "Marque ao menos um campo para alterar.";
      msg.classList.add("erro");
      return;
    }
    if ((alterarLogin && !novoLogin) || (alterarSenha && !novaSenha) || (alterarLink && !novoLink)) {
      msg.textContent = "Preencha o novo valor dos campos marcados.";
      msg.classList.add("erro");
      return;
    }

    const { error } = await supabaseClient.from("chamados").insert({
      usuario: currentUserEmail,
      usuario_nome: currentUserName,
      empresa: convenioAtual.empresa,
      convenio: convenioAtual.convenio,
      convenio_id: convenioAtual.id,
      login: convenioAtual.login,
      novo_login: alterarLogin ? novoLogin : null,
      nova_senha: alterarSenha ? novaSenha : null,
      novo_link: alterarLink ? novoLink : null,
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

function ligarCheckboxCampo(checkboxId, inputId) {
  const chk = document.getElementById(checkboxId);
  const input = document.getElementById(inputId);
  if (!chk || !input) return;

  chk.addEventListener("change", () => {
    input.disabled = !chk.checked;
    if (!chk.checked) input.value = "";
    else input.focus();
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
    if (abertos.length > 0) { badge.textContent = abertos.length; badge.hidden = false; }
    else badge.hidden = true;
  }

  if (chamados.length === 0) {
    lista.innerHTML = '<p class="painel-aviso">Nenhum chamado no momento.</p>';
    return;
  }

  lista.innerHTML = "";

  chamados.forEach(c => {
    const status = normalizarStatus(c.status);
    const convenioRef = conveniosCache.find(x => c.convenio_id && x.id === c.convenio_id)
      || conveniosCache.find(x => x.empresa === c.empresa && x.convenio === c.convenio);

    const item = document.createElement("div");
    item.className = "chamado-item";

    const info = document.createElement("div");
    info.className = "chamado-info";

    const diff = montarDiffChamado(c, convenioRef);

    info.innerHTML = `
      <p><strong>${escapeHtml(c.usuario_nome || c.usuario)}</strong> — ${escapeHtml(c.empresa)} / ${escapeHtml(c.convenio)}</p>
      <p class="chamado-diff">${diff || "Nenhuma alteração especificada."}</p>
      <p class="chamado-data">Aberto em: ${formatarData(c.data_abertura)}</p>
    `;

    const acoes = document.createElement("div");
    acoes.className = "chamado-acoes";

    const statusSpan = document.createElement("span");
    statusSpan.className = `status-badge status-${status}`;
    statusSpan.textContent = rotuloStatus(status);
    acoes.appendChild(statusSpan);

    if (status !== "concluido") {
      const btnRevisar = document.createElement("button");
      btnRevisar.className = "btn-verde btn-small";
      btnRevisar.textContent = "Revisar no formulário";
      btnRevisar.onclick = () => revisarChamado(c);
      acoes.appendChild(btnRevisar);

      const btnConcluir = document.createElement("button");
      btnConcluir.className = "btn-verde btn-small";
      btnConcluir.textContent = "Concluir direto";
      btnConcluir.onclick = () => concluirChamado(c);
      acoes.appendChild(btnConcluir);
    }

    item.appendChild(info);
    item.appendChild(acoes);
    lista.appendChild(item);
  });
}

function montarDiffChamado(c, convenioRef) {
  const linhas = [];
  if (c.novo_login) linhas.push(`Login: ${escapeHtml(convenioRef?.login || "—")} → <strong>${escapeHtml(c.novo_login)}</strong>`);
  if (c.nova_senha) linhas.push(`Senha: ${escapeHtml(convenioRef?.senha || "—")} → <strong>${escapeHtml(c.nova_senha)}</strong>`);
  if (c.novo_link)  linhas.push(`Link: ${escapeHtml(convenioRef?.link || "—")} → <strong>${escapeHtml(c.novo_link)}</strong>`);
  return linhas.join("<br>");
}

function normalizarStatus(status) {
  const s = (status || "").toString().replace(/'/g, "").trim().toLowerCase();
  if (s.includes("conclu")) return "concluido";
  return "aberto";
}

function rotuloStatus(status) {
  return status === "concluido" ? "Concluído" : "Aberto";
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

/* Revisar no formulário: seleciona o convênio e pré-preenche com o que foi pedido */
function revisarChamado(c) {
  const convenio = conveniosCache.find(x => c.convenio_id && x.id === c.convenio_id)
    || conveniosCache.find(x => x.empresa === c.empresa && x.convenio === c.convenio);

  if (!convenio) {
    alert("Não foi possível localizar o convênio deste chamado.");
    return;
  }

  const selectEmpresa = document.getElementById("selectEmpresa");
  const selectConvenio = document.getElementById("selectConvenio");

  selectEmpresa.value = convenio.empresa;
  carregarConvenios(convenio.empresa);
  selectConvenio.value = convenio.convenio;

  selecionarConvenio(convenio).then(() => {
    if (c.novo_login) document.getElementById("editLogin").value = c.novo_login;
    if (c.nova_senha) document.getElementById("editSenha").value = c.nova_senha;
    if (c.novo_link)  document.getElementById("editLink").value = c.novo_link;

    chamadoEmRevisao = c.id;
    mostrarAvisoRevisao(c);

    document.getElementById("painelEdicao").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function mostrarAvisoRevisao(c) {
  const aviso = document.getElementById("avisoRevisao");
  if (!aviso) return;
  document.getElementById("avisoRevisaoNome").textContent = c.usuario_nome || c.usuario;
  aviso.hidden = false;
}

function cancelarRevisao() {
  chamadoEmRevisao = null;
  const aviso = document.getElementById("avisoRevisao");
  if (aviso) aviso.hidden = true;
  if (convenioAtual && isAdmin) preencherFormularioEdicao(convenioAtual);
}

/* Concluir direto: aplica as alterações sem passar pelo formulário */
async function concluirChamado(c) {
  const payload = {};
  if (c.novo_login) payload.login = c.novo_login;
  if (c.nova_senha) payload.senha = c.nova_senha;
  if (c.novo_link)  payload.link = c.novo_link.startsWith("http") ? c.novo_link : "https://" + c.novo_link;

  if (Object.keys(payload).length > 0) {
    let query = supabaseClient.from("convenios").update(payload);
    query = c.convenio_id ? query.eq("id", c.convenio_id) : query.eq("empresa", c.empresa).eq("convenio", c.convenio);
    const { error: errConvenio } = await query;

    if (errConvenio) {
      console.error("Erro ao aplicar alterações no convênio:", errConvenio);
      alert("Não foi possível aplicar as alterações no convênio.");
      return;
    }

    const idx = conveniosCache.findIndex(x => (c.convenio_id && x.id === c.convenio_id) || (x.empresa === c.empresa && x.convenio === c.convenio));
    if (idx !== -1) {
      Object.assign(conveniosCache[idx], payload);
      if (convenioAtual && convenioAtual.id === conveniosCache[idx].id) {
        Object.assign(convenioAtual, payload);
        atualizarExibicaoConvenio(convenioAtual);
        if (isAdmin) preencherFormularioEdicao(convenioAtual);
        setCopyState();
      }
    }
  }

  await concluirChamadoPorId(c.id);
}

async function concluirChamadoPorId(id) {
  const { error } = await supabaseClient
    .from("chamados")
    .update({
      status: "concluido",
      data_conclusao: new Date().toISOString(),
      admin_concluiu_email: currentUserEmail,
      admin_concluiu_nome: currentUserName
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao concluir chamado:", error);
    alert("Não foi possível concluir o chamado.");
    return;
  }

  carregarChamados();
}

/* ================= LIMPEZA ================= */
function limparDados() {
  convenioAtual = null;
  acessosExtraAtual = [];

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

  const outros = document.getElementById("outrosAcessos");
  if (outros) outros.hidden = true;

  limparFormularioEdicao();
  cancelarRevisao();
  setCopyState();
}
