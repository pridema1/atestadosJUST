# Atestados JUST

Sistema web para registro e gestao de atestados medicos e declaracoes medicas da Construtora JUST.

## Stack

- Next.js 16 com App Router
- TypeScript
- Zustand para estado local do prototipo
- React Query como interface de leitura da tela
- shadcn/ui para componentes
- CSS Modules para estilos de paginas e composicoes
- Recharts via shadcn Chart para graficos
- SharePoint planejado como origem final dos dados

## Funcionalidades atuais

- Login visual simples para prototipo.
- Tela inicial com resumo operacional.
- Formulario com toggle entre `Atestado` e `Declaracao medica`.
- Validacao de campos obrigatorios por tipo de envio.
- Autocomplete de CID com codigo, abreviacao, descricao, capitulo, grupo, categoria e subcategoria.
- Dashboard com:
  - cards de registros, horas ausentes, absenteismo e custo estimado;
  - filtros por pesquisa geral, nome, obra, funcao, CID e periodo;
  - graficos por nome, obra, funcao e CID;
  - alternancia entre grafico de barras e pizza;
  - tabela de registros;
  - edicao e exclusao de registros;
  - exportacao CSV.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Validacao

```bash
npm run lint
npm run build
```

## Estrutura importante

- `src/app` rotas do App Router.
- `src/app/novo-formulario` tela de envio.
- `src/app/dashboard` dashboard e tabela.
- `src/components/ui` componentes shadcn.
- `src/stores/atestados-store.ts` estado local dos registros.
- `src/hooks/use-atestados.ts` leitura dos registros para telas.
- `src/lib/cid-data.ts` base CID gerada a partir dos CSVs.
- `docs/resumo-projeto.md` resumo tecnico e padroes do projeto.

## Observacao sobre dados

Os registros atuais ficam em memoria no navegador durante o prototipo. A integracao final recomendada e usar Microsoft Graph com SharePoint, preferencialmente por API Route/BFF no Next para evitar expor credenciais no cliente.
