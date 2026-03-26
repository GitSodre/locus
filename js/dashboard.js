let conveniosCache = [];
let empresaIndex = -1;

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// Inicializa
document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return;
  }

  const res = await supabaseClient.from("convenios").select("*");
  conveniosCache = res.data || [];
});

/* ===== EMPRESA ===== */
const empresaInput = document.getElementById("empresaInput");
const empresaDropdown = document.getElementById("empresaDropdown");

empresaInput.addEventListener("focus", () => mostrarEmpresas(""));
empresaInput.addEventListener("input", e => {
  mostrarEmpresas(e.target.value);
  if (e.target.value === "") limparTudo();
});

empresaInput.addEventListener("keydown", e => navegar(e, empresaDropdown));

function mostrarEmpresas(filtro) {
  empresaDropdown.innerHTML = "";

  const vazio = document.createElement("div");
  vazio.textContent = "—";
  vazio.onclick = limparTudo;
  empresaDropdown.appendChild(vazio);

  const empresas = [...new Set(conveniosCache.map(c => c.empresa))]
    .filter(e => e.toLowerCase().includes(filtro.toLowerCase()));

  empresas.forEach(e => {
    const div = document.createElement("div");
    div.textContent = e;
    div.onclick = () => selecionarEmpresa(e);
    empresaDropdown.appendChild(div);
  });

  empresaDropdown.style.display = "block";
}

function selecionarEmpresa(empresa) {
  empresaInput.value = empresa;
  empresaDropdown.style.display = "none";
  document.getElementById("outEmpresa").textContent = empresa;
  prepararConvenios(empresa);
  limparConvenio();
}

/* ===== CONVÊNIO ===== */
const convenioInput = document.getElementById("convenioInput");
const convenioDropdown = document.getElementById("convenioDropdown");

function prepararConvenios(empresa) {
  convenioInput.disabled = false;
  convenioInput.value = "";

  convenioInput.addEventListener("focus", () => mostrarConvenios(empresa, ""));
  convenioInput.addEventListener("input", e => {
    mostrarConvenios(empresa, e.target.value);
    if (e.target.value === "") limparConvenio();
  });
}

function mostrarConvenios(empresa, filtro) {
  convenioDropdown.innerHTML = "";

  conveniosCache
    .filter(c => c.empresa === empresa &&
      c.convenio.toLowerCase().includes(filtro.toLowerCase()))
    .forEach(c => {
      const div = document.createElement("div");
      div.textContent = c.convenio;
      div.onclick = () => selecionarConvenio(c);
      convenioDropdown.appendChild(div);
    });

  convenioDropdown.style.display = "block";
}

function selecionarConvenio(c) {
  convenioInput.value = c.convenio;
  convenioDropdown.style.display = "none";
  document.getElementById("outConvenio").textContent = c.convenio;
  document.getElementById("outLink").textContent = c.link;
  document.getElementById("outLogin").textContent = c.login;
  document.getElementById("outSenha").textContent = c.senha;
  document.getElementById("btnChamado").disabled = false;
}

/* ===== TECLADO ===== */
function navegar(e, dropdown) {
  const items = dropdown.querySelectorAll("div");
  if (!items.length) return;

  if (e.key === "ArrowDown") empresaIndex = Math.min(empresaIndex + 1, items.length - 1);
  if (e.key === "ArrowUp") empresaIndex = Math.max(empresaIndex - 1, 0);

  items.forEach((el, i) =>
    el.style.background = i === empresaIndex ? "#e6f0ff" : ""
  );

  if (e.key === "Enter" && empresaIndex >= 0) {
    items[empresaIndex].click();
  }
}

/* ===== LIMPEZA ===== */
function limparTudo() {
  empresaInput.value = "";
  limparConvenio();
  document.getElementById("outEmpresa").textContent = "—";
}

function limparConvenio() {
  convenioInput.value = "";
  convenioInput.disabled = true;
  document.getElementById("outConvenio").textContent = "—";
  document.getElementById("outLink").textContent = "—";
  document.getElementById("outLogin").textContent = "—";
  document.getElementById("outSenha").textContent = "—";
  document.getElementById("btnChamado").disabled = true;
}

document.addEventListener("click", e => {
  if (!e.target.closest(".filtro")) {
    empresaDropdown.style.display = "none";
    convenioDropdown.style.display = "none";
  }
});
