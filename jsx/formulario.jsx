const cidDatabase = window.CID_DATABASE || [];
const colaboradoresDatabase = window.COLABORADORES_DATABASE || [];
const dataHoje = new Date().toISOString().slice(0, 10);

function criarFormularioInicial(tipo = "atestado") {
  return {
    tipo,
    nome: "",
    colaboradorBusca: "",
    colaboradorCodigo: "",
    funcao: "",
    obra: "",
    data: dataHoje,
    dataInicio: dataHoje,
    dataFim: dataHoje,
    horaInicio: "",
    horaFim: "",
    dias: tipo === "atestado" ? 1 : "",
    horasAfastamento: tipo === "atestado" ? 8 : "",
    valorHora: "",
    motivo: "",
    cidBusca: "",
    cidCodigo: "",
    cidAbreviacao: "",
    cidDescricao: "",
    cidCapitulo: "",
    cidGrupo: "",
    categoria: "",
    subcategoria: ""
  };
}

function FormularioDocumento() {
  const [form, setForm] = React.useState(criarFormularioInicial());
  const [mensagem, setMensagem] = React.useState("");

  const erros = validarFormulario(form);
  const formularioValido = erros.length === 0;

  function alterarTipo(tipo) {
    setMensagem("");
    setForm(criarFormularioInicial(tipo));
  }

  function alterarCampo(campo, valor) {
    setMensagem("");
    setForm((atual) => {
      const proximo = { ...atual, [campo]: valor };

      if (campo === "dataInicio" || campo === "dataFim") {
        const dias = calcularDiasAfastamento(
          campo === "dataInicio" ? valor : atual.dataInicio,
          campo === "dataFim" ? valor : atual.dataFim
        );
        proximo.dias = dias;
        proximo.horasAfastamento = dias ? dias * 8 : "";
      }

      if (campo === "horaInicio" || campo === "horaFim") {
        const inicio = campo === "horaInicio" ? valor : atual.horaInicio;
        const fim = campo === "horaFim" ? valor : atual.horaFim;
        if (atual.tipo === "declaracao") proximo.horasAfastamento = calcularHoras(inicio, fim);
      }

      return proximo;
    });
  }

  function alterarNome(valor) {
    setMensagem("");
    const encontrados = buscarColaborador(valor);
    const valorNormalizado = normalizar(valor);
    const exato = encontrados.find((item) => normalizar(item.nome) === valorNormalizado);
    const escolhido = exato || (encontrados.length === 1 && valor.trim().length >= 4 ? encontrados[0] : null);

    setForm({
      ...form,
      nome: valor,
      colaboradorBusca: valor,
      colaboradorCodigo: escolhido?.codigo || "",
      funcao: escolhido?.funcao || "",
      obra: escolhido?.obra || ""
    });
  }

  function selecionarColaborador(item) {
    setMensagem("");
    setForm({
      ...form,
      nome: item.nome,
      colaboradorBusca: item.nome,
      colaboradorCodigo: item.codigo,
      funcao: item.funcao || form.funcao,
      obra: item.obra || form.obra
    });
  }

  function selecionarCid(item) {
    setMensagem("");
    setForm({
      ...form,
      cidBusca: `${item.codigo} - ${item.abreviacao}`,
      cidCodigo: item.codigo,
      cidAbreviacao: item.abreviacao,
      cidDescricao: item.descricao,
      cidCapitulo: item.capitulo,
      cidGrupo: item.grupo,
      categoria: item.categoria,
      subcategoria: item.subcategoria
    });
  }

  function alterarBuscaCid(valor) {
    setMensagem("");
    setForm({
      ...form,
      cidBusca: valor,
      cidCodigo: "",
      cidAbreviacao: "",
      cidDescricao: "",
      cidCapitulo: "",
      cidGrupo: "",
      categoria: "",
      subcategoria: ""
    });
  }

  function limparCid() {
    alterarBuscaCid("");
  }

  function enviarFormulario(event) {
    event.preventDefault();
    const errosAtuais = validarFormulario(form);

    if (errosAtuais.length > 0) {
      setMensagem(errosAtuais[0]);
      return;
    }

    const registros = JSON.parse(localStorage.getItem("atestadosMedicos")) || [];
    const novoRegistro = {
      id: `${form.tipo === "atestado" ? "AT" : "DM"}-${Date.now()}`,
      ...form,
      horasAfastamento: Number(form.horasAfastamento || 0),
      dias: Number(form.dias || 0),
      valorHora: normalizarNumero(form.valorHora),
      periodo: montarPeriodo(form)
    };

    localStorage.setItem("atestadosMedicos", JSON.stringify([...registros, novoRegistro]));
    setMensagem("Documento enviado com sucesso.");
    setForm(criarFormularioInicial(form.tipo));
  }

  return (
    <form className="form-card" onSubmit={enviarFormulario} noValidate>
      <div className="toggle-group" aria-label="Tipo de documento">
        <button type="button" className={form.tipo === "atestado" ? "toggle active" : "toggle"} onClick={() => alterarTipo("atestado")}>
          Atestado
        </button>
        <button type="button" className={form.tipo === "declaracao" ? "toggle active" : "toggle"} onClick={() => alterarTipo("declaracao")}>
          Declaração médica
        </button>
      </div>

      <label>
        Nome
        <input value={form.nome} onChange={(event) => alterarNome(event.target.value)} type="text" placeholder="Nome completo do colaborador" required />
      </label>

      <ColaboradorAutocomplete busca={form.nome} colaboradorCodigo={form.colaboradorCodigo} selecionarColaborador={selecionarColaborador} />

      <div className="grid-two">
        <label>
          Função
          <input value={form.funcao} onChange={(event) => alterarCampo("funcao", event.target.value)} placeholder="Ex.: Pedreiro, Administrativo, Mestre de obras" required />
        </label>
        <label>
          Obra
          <input value={form.obra} onChange={(event) => alterarCampo("obra", event.target.value)} placeholder="Ex.: Blank Residence by JUST" required />
        </label>
      </div>

      {form.tipo === "atestado" ? (
        <CamposAtestado form={form} alterarCampo={alterarCampo} />
      ) : (
        <CamposDeclaracao form={form} alterarCampo={alterarCampo} />
      )}

      <label>
        Valor hora para custo (opcional)
        <input value={form.valorHora} onChange={(event) => alterarCampo("valorHora", event.target.value)} inputMode="decimal" placeholder="Ex.: 22,50. Se vazio, dashboard usa valor padrão." />
      </label>

      <CidAutocomplete form={form} obrigatorio={form.tipo === "atestado"} selecionarCid={selecionarCid} alterarBuscaCid={alterarBuscaCid} limparCid={limparCid} />

      <button className="submit-button" type="submit" disabled={!formularioValido}>
        Enviar formulário
      </button>

      {!formularioValido && <ValidationList erros={erros} />}
      {mensagem && <p className={formularioValido ? "message" : "error"}>{mensagem}</p>}
    </form>
  );
}

function CamposAtestado({ form, alterarCampo }) {
  return (
    <>
      <div className="grid-two">
        <label>
          Data inicial
          <input value={form.dataInicio} onChange={(event) => alterarCampo("dataInicio", event.target.value)} type="date" required />
        </label>
        <label>
          Data final
          <input value={form.dataFim} onChange={(event) => alterarCampo("dataFim", event.target.value)} type="date" required />
        </label>
      </div>

      <div className="grid-two">
        <label>
          Hora inicial (opcional)
          <input value={form.horaInicio} onChange={(event) => alterarCampo("horaInicio", event.target.value)} onInput={(event) => alterarCampo("horaInicio", event.target.value)} type="time" />
        </label>
        <label>
          Hora final (opcional)
          <input value={form.horaFim} onChange={(event) => alterarCampo("horaFim", event.target.value)} onInput={(event) => alterarCampo("horaFim", event.target.value)} type="time" />
        </label>
      </div>

      <div className="grid-two">
        <label>
          Dias de afastamento
          <input value={form.dias} type="number" min="1" max="180" readOnly required />
        </label>
        <label>
          Horas de afastamento
          <input value={formatarNumero(form.horasAfastamento)} readOnly />
        </label>
      </div>

      <label>
        Descrição/observação
        <textarea value={form.motivo} onChange={(event) => alterarCampo("motivo", event.target.value)} rows="4" placeholder="Ex.: afastamento por atestado médico" required />
      </label>
    </>
  );
}

function CamposDeclaracao({ form, alterarCampo }) {
  return (
    <>
      <label>
        Data da consulta/permanência
        <input value={form.data} onChange={(event) => alterarCampo("data", event.target.value)} type="date" required />
      </label>

      <div className="grid-two">
        <label>
          Hora inicial
          <input value={form.horaInicio} onChange={(event) => alterarCampo("horaInicio", event.target.value)} onInput={(event) => alterarCampo("horaInicio", event.target.value)} type="time" required />
        </label>
        <label>
          Hora final
          <input value={form.horaFim} onChange={(event) => alterarCampo("horaFim", event.target.value)} onInput={(event) => alterarCampo("horaFim", event.target.value)} type="time" required />
        </label>
      </div>

      <label>
        Tempo de afastamento
        <input value={form.horasAfastamento ? `${formatarNumero(form.horasAfastamento)} hora(s)` : ""} readOnly placeholder="Calculado pelas horas" required />
      </label>

      <label>
        Descrição/observação
        <textarea value={form.motivo} onChange={(event) => alterarCampo("motivo", event.target.value)} rows="4" placeholder="Ex.: consulta médica, exame ou permanência no atendimento" required />
      </label>
    </>
  );
}

function ValidationList({ erros }) {
  return (
    <div className="validation-list">
      <strong>Faltam dados para enviar:</strong>
      <ul>
        {erros.map((erro) => <li key={erro}>{erro}</li>)}
      </ul>
    </div>
  );
}

function ColaboradorAutocomplete({ busca, colaboradorCodigo, selecionarColaborador }) {
  const resultados = buscarColaborador(busca).slice(0, 6);
  if (colaboradorCodigo || !busca || busca.trim().length < 2 || resultados.length === 0) return null;

  return (
    <div className="cid-results">
      {resultados.map((item, index) => (
        <button type="button" key={`${item.codigo}-${item.nome}-${index}`} onClick={() => selecionarColaborador(item)}>
          <strong>{item.codigo || "-"}</strong>
          <span>{item.nome}</span>
          <small>{[item.funcao, item.obra, item.status].filter(Boolean).join(" | ") || "Sem função/obra disponível"}</small>
        </button>
      ))}
    </div>
  );
}

function CidAutocomplete({ form, obrigatorio, selecionarCid, alterarBuscaCid, limparCid }) {
  const [busca, setBusca] = React.useState(form.cidBusca);

  React.useEffect(() => {
    setBusca(form.cidBusca);
  }, [form.cidBusca]);

  const resultados = buscarCid(busca).slice(0, 6);

  function alterarBusca(valor) {
    setBusca(valor);
    if (!valor.trim()) {
      limparCid();
      return;
    }

    alterarBuscaCid(valor);
    const encontrados = buscarCid(valor);
    const valorNormalizado = normalizar(valor);
    const exato = encontrados.find((item) =>
      normalizar(item.codigo) === valorNormalizado ||
      normalizar(item.codigoCategoria) === valorNormalizado ||
      normalizar(item.abreviacao) === valorNormalizado ||
      normalizar(item.subcategoria) === valorNormalizado
    );

    if (exato) selecionarCid(exato);
    else if (encontrados.length === 1 && valor.trim().length >= 3) selecionarCid(encontrados[0]);
  }

  return (
    <section className="cid-box">
      <label>
        CID {obrigatorio ? "" : "(opcional)"}
        <input value={busca} onChange={(event) => alterarBusca(event.target.value)} type="text" placeholder="Busque por código, nome ou abreviação. Ex.: M54, dorsalgia, ansiedade" required={obrigatorio} />
      </label>

      {busca && resultados.length > 0 && (
        <div className="cid-results">
          {resultados.map((item) => (
            <button type="button" key={item.codigo} onClick={() => selecionarCid(item)}>
              <strong>{item.codigo}</strong>
              <span>{item.abreviacao}</span>
              <small>{item.descricao}</small>
            </button>
          ))}
        </div>
      )}

      <div className="grid-two">
        <label>Código<input value={form.cidCodigo} readOnly placeholder="Preenchido automaticamente" /></label>
        <label>Abreviação<input value={form.cidAbreviacao} readOnly placeholder="Preenchida automaticamente" /></label>
      </div>
      <label>Descrição<input value={form.cidDescricao} readOnly placeholder="Preenchida automaticamente" /></label>
      <div className="grid-two">
        <label>Capítulo<input value={form.cidCapitulo} readOnly placeholder="Preenchido automaticamente" /></label>
        <label>Grupo<input value={form.cidGrupo} readOnly placeholder="Preenchido automaticamente" /></label>
      </div>
      <div className="grid-two">
        <label>Categoria<input value={form.categoria} readOnly placeholder="Preenchida automaticamente" /></label>
        <label>Subcategoria<input value={form.subcategoria} readOnly placeholder="Preenchida automaticamente" /></label>
      </div>
    </section>
  );
}

function buscarColaborador(valor) {
  const termo = normalizar(valor);
  if (!termo) return [];

  return colaboradoresDatabase.filter((item) =>
    normalizar([item.nome, item.codigo, item.funcao, item.obra, item.status].join(" ")).includes(termo)
  );
}

function buscarCid(valor) {
  const termo = normalizar(valor);
  if (!termo) return [];

  return cidDatabase.filter((item) =>
    normalizar([item.codigo, item.codigoCategoria, item.abreviacao, item.descricao, item.capitulo, item.grupo, item.categoria, item.subcategoria].join(" ")).includes(termo)
  );
}

function calcularDiasAfastamento(dataInicio, dataFim) {
  if (!dataInicio || !dataFim || dataFim < dataInicio) return "";
  const inicio = new Date(`${dataInicio}T00:00:00`);
  const fim = new Date(`${dataFim}T00:00:00`);
  return Math.floor((fim - inicio) / 86400000) + 1;
}

function calcularHoras(horaInicio, horaFim) {
  if (!horaInicio || !horaFim || horaFim <= horaInicio) return "";
  const [hi, mi] = horaInicio.split(":").map(Number);
  const [hf, mf] = horaFim.split(":").map(Number);
  return ((hf * 60 + mf) - (hi * 60 + mi)) / 60;
}

function validarFormulario(form) {
  const erros = [];

  if (!form.nome.trim()) erros.push("Informe o nome do colaborador.");
  if (!form.funcao.trim()) erros.push("Informe a função.");
  if (!form.obra.trim()) erros.push("Informe a obra.");
  if (!form.motivo.trim()) erros.push("Informe a descrição/observação.");

  if (form.tipo === "atestado") {
    if (!form.dataInicio) erros.push("Informe a data inicial.");
    if (!form.dataFim) erros.push("Informe a data final.");
    if (form.dataInicio && form.dataFim && form.dataFim < form.dataInicio) erros.push("A data final precisa ser igual ou posterior à data inicial.");
    if (!Number(form.dias) || Number(form.dias) < 1) erros.push("Informe uma quantidade válida de dias de afastamento.");
    if (!form.cidCodigo || !form.categoria || !form.subcategoria) erros.push("Selecione um CID válido para o atestado.");
    if (form.horaInicio && !form.horaFim) erros.push("Informe a hora final ou deixe os dois horários em branco.");
    if (!form.horaInicio && form.horaFim) erros.push("Informe a hora inicial ou deixe os dois horários em branco.");
    if (form.horaInicio && form.horaFim && form.horaFim <= form.horaInicio) erros.push("A hora final precisa ser maior que a hora inicial.");
  }

  if (form.tipo === "declaracao") {
    if (!form.data) erros.push("Informe a data da consulta/permanência.");
    if (!form.horaInicio) erros.push("Informe a hora inicial.");
    if (!form.horaFim) erros.push("Informe a hora final.");
    if (form.horaInicio && form.horaFim && form.horaFim <= form.horaInicio) erros.push("A hora final precisa ser maior que a hora inicial.");
    if (!Number(form.horasAfastamento)) erros.push("Informe horários válidos para calcular o tempo de afastamento.");
  }

  return erros;
}

function montarPeriodo(form) {
  if (form.tipo === "atestado") {
    const partes = [`${formatarData(form.dataInicio)} a ${formatarData(form.dataFim)}`, `${form.dias} dia(s)`, `${formatarNumero(form.horasAfastamento)} hora(s)`];
    if (form.horaInicio && form.horaFim) partes.push(`${form.horaInicio} às ${form.horaFim}`);
    return partes.join(" | ");
  }

  return `${formatarData(form.data)} | ${form.horaInicio} às ${form.horaFim} | ${formatarNumero(form.horasAfastamento)} hora(s)`;
}

function formatarData(valor) {
  if (!valor) return "";
  return new Date(`${valor}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatarNumero(valor) {
  const numero = Number(valor || 0);
  return Number.isInteger(numero) ? String(numero) : numero.toFixed(2).replace(".", ",");
}

function normalizarNumero(valor) {
  if (valor === "" || valor === null || valor === undefined) return "";
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : "";
}

function normalizar(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

ReactDOM.createRoot(document.getElementById("formularioApp")).render(<FormularioDocumento />);
