# Resumo do projeto

## Objetivo

Sistema interno da Construtora JUST para registrar e acompanhar atestados medicos e declaracoes, com foco em absenteismo, horas de afastamento e visao operacional por obra.

## Estrutura tecnica

- Next.js 16 com App Router e TypeScript.
- React Server Components por padrao; componentes com estado, eventos, React Query, Zustand ou APIs de browser usam `"use client"`.
- Zustand guarda estado local de sessao/prototipo (`src/stores/atestados-store.ts`).
- React Query centraliza interface de leitura da tela (`src/hooks/use-atestados.ts`), enquanto Zustand fornece dados vivos para prototipo local.
- shadcn/ui base-nova fornece componentes de UI em `src/components/ui`.
- CSS Modules organizam estilos de telas e componentes compostos (`*.module.css`).
- Logo oficial fica em `public/just-logo.png` e e usada no shell lateral com `next/image`.
- Fonte usa stack local (`Arial`, `Helvetica`, sans-serif) para build nao depender de Google Fonts.
- SharePoint sera a origem de dados final; mock atual existe apenas para fluxo inicial verificavel.

## Padroes de codigo

- Mudancas pequenas, explicitas e com verificacao por build/lint quando possivel.
- Usar `@/*` para imports internos.
- Preservar App Router em `src/app`.
- Usar `FieldGroup`, `Field`, `FieldLabel` e controles shadcn para formularios.
- Usar `buttonVariants` para links com aparencia de botao.
- Usar icones `lucide-react` em botoes com `data-icon`.
- Usar CSS Modules para layout, grid, pagina e shell; usar shadcn para componentes reutilizaveis.
- Usar `caveman:caveman` sempre que possivel nas respostas para manter comunicacao curta e tecnica.
- Evitar abstracoes novas ate haver uso real em mais de um ponto.

## Telas atuais

- `/login`: autenticao visual simples com usuario e senha. Valida campos vazios e notifica no canto superior direito.
- `/inicio`: tela inicial com shell lateral, CTA para novo formulario e cards de metricas.
- `/novo-formulario`: formulario de registro de atestado ou declaracao medica. Usa toggle de tipo, valida obrigatorios por tipo e autocompleta CID a partir dos CSVs em `src/lib/cid-data.ts`.
- `/dashboard`: resumo com filtros por nome, obra, funcao, CID e datas; cards de indicadores; graficos dinamicos por nome, obra, funcao e CID com alternancia barra/pizza; tabela completa; exportacao CSV; acoes para editar e excluir registros.

## SharePoint: opcoes sugeridas

1. Microsoft Graph + MSAL no Next: login Microsoft, token do usuario e leitura/escrita em listas do SharePoint. Melhor para controle por usuario e auditoria.
2. API Route do Next como BFF: frontend chama `/api`, backend usa Graph com permissao de aplicacao. Melhor para esconder segredos e padronizar validacoes.
3. Power Automate como camada de gravacao: app envia payload para fluxo, fluxo grava na lista. Mais simples para ambiente Microsoft, menos flexivel para consultas complexas.

Recomendacao inicial: BFF em Route Handlers do Next + Microsoft Graph, com listas SharePoint versionadas por ambiente. Evita expor credenciais, facilita validar schema e permite trocar estrategia sem reescrever UI.

## Proximo passo tecnico para SharePoint

- Definir site, lista e colunas.
- Definir autenticacao: usuario Microsoft ou permissao de aplicacao.
- Criar contrato TypeScript para mapear campos da lista para `MedicalCertificate`.
- Substituir mock de `src/lib/atestados.ts` por funcoes de leitura/escrita via Graph.
