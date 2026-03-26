async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

async function carregarDashboard() {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  await carregarEmpresas();
}

async function carregarEmpresas() {
  const { data, error } = await supabaseClient
    .from("convenios")
    .select("empresa")
    .order("empresa");

  if (error) {
    console.error(error);
    return;
  }

  const empresasUnicas = [...new Set(data.map(item => item.empresa))];

  const selectEmpresa = document.getElementById("selectEmpresa");
  selectEmpresa.innerHTML = `<option value="">Selecione a empresa</option>`;

  empresasUnicas.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp;
    option.textContent = emp;
    selectEmpresa.appendChild(option);
  });

  selectEmpresa.addEventListener("change", carregarConvenios);
}

async function carregarConvenios() {
  const empresa = document.getElementById("selectEmpresa").value;
  const selectConvenio = document.getElementById("selectConvenio");
  const dadosDiv = document.getElementById("dadosConvenio");

  dadosDiv.innerHTML = "";
  selectConvenio.innerHTML = `<option value="">Selecione o convênio</option>`;
  selectConvenio.disabled = true;

  if (!empresa) return;

  const { data, error } = await supabaseClient
    .from("convenios")
    .select("id, convenio")
    .eq("empresa", empresa);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.convenio;
    selectConvenio.appendChild(option);
  });

  selectConvenio.disabled = false;
  selectConvenio.addEventListener("change", carregarDadosConvenio);
}

async function carregarDadosConvenio() {
  const id = document.getElementById("selectConvenio").value;
  const dadosDiv = document.getElementById("dadosConvenio");

  dadosDiv.innerHTML = "";

  if (!id) return;

  const { data, error } = await supabaseClient
    .from("convenios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  dadosDiv.innerHTML = `
    <h3>${data.convenio}</h3>
    <p><strong>Empresa:</strong> ${data.empresa}</p>
    <p><strong>Link:</strong> <a href="${data.link}" target="_blank">${data.link}</a></p>
    <p><strong>Login:</strong> ${data.login}</p>
    <p><strong>Senha:</strong> ${data.senha}</p>
    <p><strong>Observação:</strong> ${data.observacao ?? ""}</p>
  `;
}

carregarDashboard();
``
