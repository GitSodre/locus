/*********************************
 * DASHBOARD.JS – FINAL E ESTÁVEL + COPIAR + SHOW/HIDE
 *********************************/

// logout global
window.logout = async function () {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
};

let conveniosCache = [];

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  limparDados();            // estado inicial
  prepararBotoesDeCopia();  // listeners (uma única vez)

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

    // Preenche campos
    document.getElementById("outConvenio").textContent = c.convenio;

    // LINK
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

    // Ativa ação
    document.getElementById("btnChamado").disabled = false;

    // 🔁 Atualiza visibilidade dos botões de copiar
    setCopyState();
  };
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

// Mostra/oculta + habilita/desabilita de forma robusta
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
    btn.removeAttribute("hidden");        // remove atributo
    btn.style.display = "inline-block";   // garante exibição
  } else {
    btn.disabled = true;
    btn.setAttribute("hidden", "");       // atributo HTML hidden
    btn.style.display = "none";           // reforço
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
  // só considera válido se não for vazio e não for o marcador "—"
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
    // Fallback para ambientes sem permissão/HTTPS
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

  setCopyState(); // esconde botões de copiar
}
