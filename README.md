# Gestao de Atestados Medicos

Aplicacao web estatica para registrar atestados e declaracoes medicas, filtrar dados e visualizar indicadores de absenteismo.

## Paginas

- `index.html`: entrada da aplicacao.
- `formulario.html`: formulario publico para envio.
- `dashboard.html`: area restrita para RH consultar, editar, excluir, filtrar e exportar registros.

## Dados sensiveis

Este repositorio nao inclui base real de funcionarios, planilhas de importacao, PDFs, screenshots de teste, `node_modules` ou arquivos locais.

Para usar autocomplete de colaboradores em ambiente interno, crie um arquivo local nao versionado seguindo este formato:

```js
window.COLABORADORES_DATABASE = [
  { codigo: "001", nome: "NOME DO COLABORADOR", obra: "OBRA", funcao: "FUNCAO", status: "Ativo" }
];
```

## Senha do dashboard

A senha publicada e placeholder: `ALTERE_ANTES_DE_USAR`.

Antes de uso real, configure uma senha fora do codigo versionado ou migre para autenticacao de backend. Senha em JavaScript no navegador nao e seguranca real.

## Executar local

Abra `index.html` no navegador ou sirva a pasta com um servidor estatico:

```bash
python -m http.server 8765
```
