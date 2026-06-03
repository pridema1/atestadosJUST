const DASHBOARD_PASSWORD = window.DASHBOARD_PASSWORD || "ALTERE_ANTES_DE_USAR";
const STORAGE_KEY = "atestadosMedicos";
const CONFIG_KEY = "absenteismoConfig";

function getRegistros() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function salvarRegistros(registros) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

function getConfig() {
  return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {
    jornadaDia: 8,
    diasUteisMes: 22,
    valorHoraPadrao: 22
  };
}

function DashboardAtestados() {
  const [autenticado, setAutenticado] = React.useState(sessionStorage.getItem("dashboardAutenticado") === "true");
  const [registros, setRegistros] = React.useState(getRegistros());
  const [editando, setEditando] = React.useState(null);
  const [filtros, setFiltros] = React.useState({ busca: "", nome: "", obra: "", funcao: "", cid: "", dataInicio: "", dataFim: "" });
  const [config, setConfig] = React.useState(getConfig());

  React.useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  if (!autenticado) return <LoginGate onEntrar={() => setAutenticado(true)} />;

  const filtrados = aplicarFiltros(registros, filtros);
  const metricas = calcularMetricas(filtrados, config);
  const opcoes = montarOpcoes(registros);

  function excluirRegistro(id) {
    const confirmar = window.confirm("Deseja excluir este formulário?");
    if (!confirmar) return;
    const atualizados = registros.filter((item) => item.id !== id);
    setRegistros(atualizados);
    salvarRegistros(atualizados);
  }

  function salvarEdicao(event) {
    event.preventDefault();
    const atualizado = {
      ...editando,
      dias: Number(editando.dias || 0),
      horasAfastamento: Number(editando.horasAfastamento || calcularHorasRegistro(editando)),
      valorHora: normalizarNumero(editando.valorHora),
      periodo: montarPeriodo(editando)
    };
    const atualizados = registros.map((item) => item.id === atualizado.id ? atualizado : item);
    setRegistros(atualizados);
    salvarRegistros(atualizados);
    setEditando(null);
  }

  function exportarCsv() {
    const cabecalho = [
      "ID", "Tipo", "Nome", "Função", "Obra", "Data inicial", "Data final", "Período",
      "Horas ausentes", "Dias", "Valor hora", "Custo absenteísmo", "CID Código",
      "CID Abreviação", "CID Descrição", "CID Capítulo", "CID Grupo", "CID Categoria",
      "CID Subcategoria", "Descrição/Observação"
    ];
    const linhas = filtrados.map((item) => {
      const horas = calcularHorasRegistro(item);
      const valorHora = Number(item.valorHora || config.valorHoraPadrao || 0);
      return [
        item.id,
        item.tipo === "declaracao" ? "Declaração médica" : "Atestado",
        item.nome,
        item.funcao,
        item.obra,
        item.dataInicio || item.data || "",
        item.dataFim || item.data || "",
        item.periodo || montarPeriodoLegado(item),
        horas,
        item.dias || "",
        valorHora,
        horas * valorHora,
        item.cidCodigo || "",
        item.cidAbreviacao || "",
        item.cidDescricao || "",
        item.cidCapitulo || "",
        item.cidGrupo || "",
        item.categoria || "",
        item.subcategoria || "",
        item.motivo || ""
      ].map(formatarCsv).join(";");
    });

    baixarArquivo("formularios-medicos-filtrados.csv", [cabecalho.join(";"), ...linhas].join("\n"));
  }

  return (
    <>
      <section className="config-panel">
        <label>
          Jornada/dia
          <input type="number" min="1" step="0.5" value={config.jornadaDia} onChange={(event) => setConfig({ ...config, jornadaDia: Number(event.target.value) })} />
        </label>
        <label>
          Dias úteis/mês
          <input type="number" min="1" value={config.diasUteisMes} onChange={(event) => setConfig({ ...config, diasUteisMes: Number(event.target.value) })} />
        </label>
        <label>
          Valor hora padrão (R$)
          <input type="number" min="0" step="0.01" value={config.valorHoraPadrao} onChange={(event) => setConfig({ ...config, valorHoraPadrao: Number(event.target.value) })} />
        </label>
      </section>

      <section className="stats">
        <Stat valor={metricas.totalRegistros} titulo="Registros" />
        <Stat valor={formatarNumero(metricas.horasAusentes)} titulo="Horas ausentes" />
        <Stat valor={`${formatarNumero(metricas.absenteismo)}%`} titulo="Absenteísmo" />
        <Stat valor={formatarMoeda(metricas.custo)} titulo="Custo estimado" />
      </section>

      <section className="filters">
        <label className="wide">
          Pesquisa geral
          <input value={filtros.busca} onChange={(event) => setFiltros({ ...filtros, busca: event.target.value })} placeholder="Filtrar por nome, obra, função ou CID" />
        </label>
        <SelectFiltro label="Nome" valor={filtros.nome} opcoes={opcoes.nomes} onChange={(valor) => setFiltros({ ...filtros, nome: valor })} />
        <SelectFiltro label="Obra" valor={filtros.obra} opcoes={opcoes.obras} onChange={(valor) => setFiltros({ ...filtros, obra: valor })} />
        <SelectFiltro label="Função" valor={filtros.funcao} opcoes={opcoes.funcoes} onChange={(valor) => setFiltros({ ...filtros, funcao: valor })} />
        <SelectFiltro label="CID" valor={filtros.cid} opcoes={opcoes.cids} onChange={(valor) => setFiltros({ ...filtros, cid: valor })} />
        <label>
          Data inicial
          <input type="date" value={filtros.dataInicio} onChange={(event) => setFiltros({ ...filtros, dataInicio: event.target.value })} />
        </label>
        <label>
          Data final
          <input type="date" value={filtros.dataFim} onChange={(event) => setFiltros({ ...filtros, dataFim: event.target.value })} />
        </label>
      </section>

      <div className="dashboard-toolbar">
        <button type="button" onClick={() => setFiltros({ busca: "", nome: "", obra: "", funcao: "", cid: "", dataInicio: "", dataFim: "" })}>Limpar filtros</button>
        <button type="button" onClick={exportarCsv}>Baixar planilha CSV</button>
      </div>

      <section className="charts">
        <BarChart titulo="Índice por nome" dados={agrupar(filtrados, "nome", config)} />
        <BarChart titulo="Índice por obra" dados={agrupar(filtrados, "obra", config)} />
        <BarChart titulo="Índice por função" dados={agrupar(filtrados, "funcao", config)} />
        <BarChart titulo="Índice por CID" dados={agruparCid(filtrados, config)} />
      </section>

      <section className="table-panel">
        <div className="section-title">
          <strong>Formulários</strong>
          <span>{filtrados.length} de {registros.length} registro(s)</span>
        </div>

        {filtrados.length === 0 ? (
          <p className="empty">Nenhum formulário encontrado.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nome</th>
                  <th>Obra</th>
                  <th>Função</th>
                  <th>Data</th>
                  <th>CID</th>
                  <th>Horas</th>
                  <th>Custo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item) => {
                  const horas = calcularHorasRegistro(item);
                  const custo = horas * Number(item.valorHora || config.valorHoraPadrao || 0);
                  return (
                    <tr key={item.id}>
                      <td>{item.tipo === "declaracao" ? "Declaração" : "Atestado"}</td>
                      <td><strong>{item.nome}</strong><small>{item.id}</small></td>
                      <td>{item.obra || "Não informado"}</td>
                      <td>{item.funcao || "Não informado"}</td>
                      <td>{formatarData(item.dataInicio || item.data)}{item.dataFim && item.dataFim !== item.dataInicio ? ` a ${formatarData(item.dataFim)}` : ""}</td>
                      <td><strong>{item.cidCodigo || "Opcional"}</strong><small>{item.cidDescricao || item.cidAbreviacao || ""}</small></td>
                      <td>{formatarNumero(horas)}</td>
                      <td>{formatarMoeda(custo)}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" onClick={() => setEditando(item)}>Editar</button>
                          <button type="button" className="danger" onClick={() => excluirRegistro(item.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editando && (
        <EditModal registro={editando} setRegistro={setEditando} onSalvar={salvarEdicao} onFechar={() => setEditando(null)} />
      )}
    </>
  );
}

function LoginGate({ onEntrar }) {
  const [senha, setSenha] = React.useState("");
  const [erro, setErro] = React.useState("");

  function entrar(event) {
    event.preventDefault();
    if (senha === DASHBOARD_PASSWORD) {
      sessionStorage.setItem("dashboardAutenticado", "true");
      onEntrar();
      return;
    }
    setErro("Senha inválida.");
  }

  return (
    <form className="login-card" onSubmit={entrar}>
      <strong>Acesso restrito ao RH</strong>
      <p>Digite a senha do dashboard para visualizar e manipular os dados.</p>
      <label>
        Senha
        <input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Senha do dashboard" autoFocus />
      </label>
      <button type="submit">Entrar</button>
      {erro && <span className="error">{erro}</span>}
    </form>
  );
}

function Stat({ valor, titulo }) {
  return (
    <article>
      <span>{valor}</span>
      <strong>{titulo}</strong>
    </article>
  );
}

function SelectFiltro({ label, valor, opcoes, onChange }) {
  return (
    <label>
      {label}
      <select value={valor} onChange={(event) => onChange(event.target.value)}>
        <option value="">Todos</option>
        {opcoes.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
      </select>
    </label>
  );
}

function BarChart({ titulo, dados }) {
  const maior = Math.max(...dados.map((item) => item.horas), 1);

  return (
    <article className="chart">
      <div className="section-title">
        <strong>{titulo}</strong>
        <span>Horas e custo</span>
      </div>
      {dados.length === 0 ? (
        <p className="empty compact">Sem dados.</p>
      ) : (
        <div className="bars">
          {dados.slice(0, 6).map((item) => (
            <div className="bar-row" key={item.label}>
              <span title={item.label}>{item.label}</span>
              <div className="bar-track">
                <i style={{ width: `${Math.max((item.horas / maior) * 100, 4)}%` }}></i>
              </div>
              <strong>{formatarNumero(item.horas)}h</strong>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function EditModal({ registro, setRegistro, onSalvar, onFechar }) {
  const tipo = registro.tipo || "atestado";

  function alterar(campo, valor) {
    const proximo = { ...registro, [campo]: valor };
    if (campo === "dataInicio" || campo === "dataFim") {
      const dias = calcularDiasAfastamento(campo === "dataInicio" ? valor : registro.dataInicio, campo === "dataFim" ? valor : registro.dataFim);
      proximo.dias = dias;
      proximo.horasAfastamento = dias ? dias * 8 : "";
    }
    if ((campo === "horaInicio" || campo === "horaFim") && tipo === "declaracao") {
      proximo.horasAfastamento = calcularHoras(campo === "horaInicio" ? valor : registro.horaInicio, campo === "horaFim" ? valor : registro.horaFim);
    }
    setRegistro(proximo);
  }

  function selecionarCid(item) {
    setRegistro({
      ...registro,
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

  const resultados = buscarCid(registro.cidBusca || "").slice(0, 5);

  return (
    <div className="modal-bg">
      <form className="edit-modal" onSubmit={onSalvar}>
        <div className="modal-header">
          <div>
            <strong>Editar formulário</strong>
            <span>{registro.id}</span>
          </div>
          <button type="button" className="close" onClick={onFechar}>Fechar</button>
        </div>

        <label>Nome<input value={registro.nome || ""} onChange={(event) => alterar("nome", event.target.value)} required /></label>
        <div className="grid-two">
          <label>Função<input value={registro.funcao || ""} onChange={(event) => alterar("funcao", event.target.value)} required /></label>
          <label>Obra<input value={registro.obra || ""} onChange={(event) => alterar("obra", event.target.value)} required /></label>
        </div>

        {tipo === "atestado" ? (
          <>
            <div className="grid-two">
              <label>Data inicial<input type="date" value={registro.dataInicio || ""} onChange={(event) => alterar("dataInicio", event.target.value)} required /></label>
              <label>Data final<input type="date" value={registro.dataFim || ""} onChange={(event) => alterar("dataFim", event.target.value)} required /></label>
            </div>
            <div className="grid-two">
              <label>Hora inicial<input type="time" value={registro.horaInicio || ""} onChange={(event) => alterar("horaInicio", event.target.value)} onInput={(event) => alterar("horaInicio", event.target.value)} /></label>
              <label>Hora final<input type="time" value={registro.horaFim || ""} onChange={(event) => alterar("horaFim", event.target.value)} onInput={(event) => alterar("horaFim", event.target.value)} /></label>
            </div>
          </>
        ) : (
          <>
            <label>Data da consulta/permanência<input type="date" value={registro.data || ""} onChange={(event) => alterar("data", event.target.value)} required /></label>
            <div className="grid-two">
              <label>Hora inicial<input type="time" value={registro.horaInicio || ""} onChange={(event) => alterar("horaInicio", event.target.value)} onInput={(event) => alterar("horaInicio", event.target.value)} required /></label>
              <label>Hora final<input type="time" value={registro.horaFim || ""} onChange={(event) => alterar("horaFim", event.target.value)} onInput={(event) => alterar("horaFim", event.target.value)} required /></label>
            </div>
          </>
        )}

        <div className="grid-two">
          <label>Horas de afastamento<input value={registro.horasAfastamento || ""} onChange={(event) => alterar("horasAfastamento", event.target.value)} /></label>
          <label>Valor hora<input value={registro.valorHora || ""} onChange={(event) => alterar("valorHora", event.target.value)} /></label>
        </div>

        <label>{tipo === "declaracao" ? "Observação" : "Descrição/observação"}<textarea rows="3" value={registro.motivo || ""} onChange={(event) => alterar("motivo", event.target.value)} required /></label>
        <label>CID {tipo === "declaracao" ? "(opcional)" : ""}<input value={registro.cidBusca || ""} onChange={(event) => alterar("cidBusca", event.target.value)} placeholder="Busque por código, nome ou abreviação" /></label>

        {registro.cidBusca && resultados.length > 0 && (
          <div className="cid-results dashboard-results">
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
          <label>Código<input value={registro.cidCodigo || ""} readOnly /></label>
          <label>Categoria<input value={registro.categoria || ""} readOnly /></label>
        </div>
        <div className="grid-two">
          <label>Capítulo<input value={registro.cidCapitulo || ""} readOnly /></label>
          <label>Grupo<input value={registro.cidGrupo || ""} readOnly /></label>
        </div>

        <button type="submit">Salvar alterações</button>
      </form>
    </div>
  );
}

function aplicarFiltros(registros, filtros) {
  return registros.filter((item) => {
    const data = item.dataInicio || item.data || "";
    const texto = normalizar([item.nome, item.obra, item.funcao, item.cidCodigo, item.cidAbreviacao, item.cidDescricao, item.categoria, item.subcategoria].join(" "));
    const cid = [item.cidCodigo, item.cidAbreviacao, item.cidDescricao].filter(Boolean).join(" - ");
    return (!filtros.busca || texto.includes(normalizar(filtros.busca))) &&
      (!filtros.nome || item.nome === filtros.nome) &&
      (!filtros.obra || item.obra === filtros.obra) &&
      (!filtros.funcao || item.funcao === filtros.funcao) &&
      (!filtros.cid || cid === filtros.cid) &&
      (!filtros.dataInicio || data >= filtros.dataInicio) &&
      (!filtros.dataFim || data <= filtros.dataFim);
  });
}

function calcularMetricas(registros, config) {
  const totalColaboradores = Math.max(new Set(registros.map((item) => item.nome)).size, 1);
  const horasPrevistas = totalColaboradores * Number(config.jornadaDia || 0) * Number(config.diasUteisMes || 0);
  const horasAusentes = registros.reduce((soma, item) => soma + calcularHorasRegistro(item), 0);
  const custo = registros.reduce((soma, item) => soma + calcularHorasRegistro(item) * Number(item.valorHora || config.valorHoraPadrao || 0), 0);

  return {
    totalRegistros: registros.length,
    horasAusentes,
    horasPrevistas,
    absenteismo: horasPrevistas ? (horasAusentes / horasPrevistas) * 100 : 0,
    custo
  };
}

function agrupar(registros, campo, config) {
  const mapa = new Map();
  registros.forEach((item) => {
    const label = item[campo] || "Não informado";
    const atual = mapa.get(label) || { label, horas: 0, custo: 0 };
    const horas = calcularHorasRegistro(item);
    atual.horas += horas;
    atual.custo += horas * Number(item.valorHora || config.valorHoraPadrao || 0);
    mapa.set(label, atual);
  });
  return [...mapa.values()].sort((a, b) => b.horas - a.horas);
}

function agruparCid(registros, config) {
  const mapa = new Map();
  registros.forEach((item) => {
    const label = item.cidCodigo ? `${item.cidCodigo} ${item.cidAbreviacao || ""}`.trim() : "Sem CID";
    const atual = mapa.get(label) || { label, horas: 0, custo: 0 };
    const horas = calcularHorasRegistro(item);
    atual.horas += horas;
    atual.custo += horas * Number(item.valorHora || config.valorHoraPadrao || 0);
    mapa.set(label, atual);
  });
  return [...mapa.values()].sort((a, b) => b.horas - a.horas);
}

function montarOpcoes(registros) {
  const unicos = (valores) => [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return {
    nomes: unicos(registros.map((item) => item.nome)),
    obras: unicos(registros.map((item) => item.obra)),
    funcoes: unicos(registros.map((item) => item.funcao)),
    cids: unicos(registros.map((item) => [item.cidCodigo, item.cidAbreviacao, item.cidDescricao].filter(Boolean).join(" - ")))
  };
}

function calcularHorasRegistro(item) {
  if (Number(item.horasAfastamento)) return Number(item.horasAfastamento);
  if ((item.tipo || "atestado") === "atestado") return Number(item.dias || 0) * 8;
  return calcularHoras(item.horaInicio, item.horaFim) || 0;
}

function buscarCid(valor) {
  const termo = normalizar(valor);
  if (!termo) return [];
  return (window.CID_DATABASE || []).filter((item) =>
    normalizar([item.codigo, item.codigoCategoria, item.abreviacao, item.descricao, item.capitulo, item.grupo, item.categoria, item.subcategoria].join(" ")).includes(termo)
  );
}

function montarPeriodo(item) {
  if ((item.tipo || "atestado") === "atestado") {
    const partes = [`${formatarData(item.dataInicio)} a ${formatarData(item.dataFim)}`, `${item.dias} dia(s)`, `${formatarNumero(item.horasAfastamento || calcularHorasRegistro(item))} hora(s)`];
    if (item.horaInicio && item.horaFim) partes.push(`${item.horaInicio} às ${item.horaFim}`);
    return partes.join(" | ");
  }
  return `${formatarData(item.data)} | ${item.horaInicio} às ${item.horaFim} | ${formatarNumero(item.horasAfastamento || calcularHorasRegistro(item))} hora(s)`;
}

function montarPeriodoLegado(item) {
  if (item.periodo) return item.periodo;
  if (item.data) return formatarData(item.data);
  return "Não informado";
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

function baixarArquivo(nome, conteudo) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

function formatarCsv(valor) {
  return `"${String(valor ?? "").replaceAll('"', '""')}"`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

function formatarData(valor) {
  if (!valor) return "";
  return new Date(`${valor}T00:00:00`).toLocaleDateString("pt-BR");
}

function normalizar(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

ReactDOM.createRoot(document.getElementById("dashboardApp")).render(<DashboardAtestados />);
