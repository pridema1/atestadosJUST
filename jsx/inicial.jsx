function getRegistros() {
  return JSON.parse(localStorage.getItem("atestadosMedicos")) || [];
}

function ResumoInicial() {
  const registros = getRegistros();
  const horas = registros.reduce((soma, item) => soma + Number(item.horasAfastamento || item.dias * 8 || 0), 0);
  const ultimo = registros[registros.length - 1];

  const cards = [
    {
      valor: registros.length,
      titulo: "Formulários enviados",
      texto: "Atestados e declarações salvos localmente no navegador."
    },
    {
      valor: horas,
      titulo: "Horas de afastamento",
      texto: "Base para taxa e custo de absenteísmo."
    },
    {
      valor: ultimo ? formatarData(ultimo.dataInicio || ultimo.data) : "Nenhum",
      titulo: "Último envio",
      texto: "Data do registro mais recente."
    }
  ];

  return (
    <>
      {cards.map((card) => (
        <article key={card.titulo}>
          <span>{card.valor}</span>
          <strong>{card.titulo}</strong>
          <p>{card.texto}</p>
        </article>
      ))}
    </>
  );
}

function formatarData(valor) {
  if (!valor) return "";
  return new Date(`${valor}T00:00:00`).toLocaleDateString("pt-BR");
}

ReactDOM.createRoot(document.getElementById("resumoInicial")).render(<ResumoInicial />);
