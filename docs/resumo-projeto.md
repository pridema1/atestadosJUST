# Resumo do projeto

## Objetivo

Sistema interno da Construtora JUST para registrar e acompanhar atestados médicos e declarações, com foco em absenteísmo, horas de afastamento e visão operacional por obra.

## Estrutura tecnica

- Next.js 16 com App Router e TypeScript.
- React Server Components por padrão; componentes com estado, eventos, React Query, Zustand ou APIs de browser usam `"use client"`.
- Zustand guarda estado local de sessão/protótipo (`src/stores/atestados-store.ts`).
- React Query centraliza interface de leitura da tela (`src/hooks/use-atestados.ts`), enquanto Zustand fornece dados vivos para protótipo local.
- shadcn/ui base-nova fornece componentes de UI em `src/components/ui`.
- CSS Modules organizam estilos de telas e componentes compostos (`*.module.css`).
- Logo oficial fica em `public/just-logo.png` e e usada no shell lateral com `next/image`.
- Fonte usa stack local (`Arial`, `Helvetica`, sans-serif) para build não depender de Google Fonts.
- Tema principal usa azul `#2563EB` com texto branco `#FFFFFF` em elementos ativos e botões primários. Ações seguem: editar `#2563EB`, salvar `#16A34A`, excluir `#DC2626`, cancelar `#6B7280`, sempre com texto branco.
- SharePoint será a origem de dados final; estado local inicia vazio, sem registros demo.

## Padrões de código

- Mudanças pequenas, explícitas e com verificação por build/lint quando possível.
- Usar `@/*` para imports internos.
- Preservar App Router em `src/app`.
- Usar `FieldGroup`, `Field`, `FieldLabel` e controles shadcn para formulários.
- Usar `buttonVariants` para links com aparência de botão.
- Usar ícones `lucide-react` em botões com `data-icon`.
- Usar CSS Modules para layout, grid, página e shell; usar shadcn para componentes reutilizáveis.
- Usar `caveman:caveman` sempre que possível nas respostas para manter comunicação curta e técnica.
- Usar `build-web-apps` como padrão para tarefas de frontend, dashboards, UI, responsividade e QA visual.
- Evitar abstrações novas até haver uso real em mais de um ponto.

## Telas atuais

- `/login`: autenticação visual simples com usuário e senha. Valida campos vazios e notifica no canto superior direito.
- `/inicio`: tela inicial com shell lateral, CTA para novo formulário e cards de métricas.
- `/novo-formulario`: formulário de registro de atestado ou declaração médica. Usa toggle de tipo, valida obrigatórios por tipo, mostra dropdown de opções CID antes de preencher campos, autocompleta dias por data inicial/final e autocompleta horas da declaração por hora inicial/final.
- `/dashboard`: resumo com filtros por nome, obra, função, CID e datas; cards de indicadores; card de absenteísmo com tooltip da fórmula; gráficos dinâmicos por nome, obra, função e CID com alternância lista linear fina/pizza, toggle por gráfico entre horas e custo em R$ e filtro dos gráficos por atestado, declaração ou todos; tabela completa compacta e responsiva; exportação CSV; ações para editar e excluir registros. Horas de atestado são calculadas por dias de afastamento vezes jornada/dia.

## SharePoint: opções sugeridas

1. Microsoft Graph + MSAL no Next: login Microsoft, token do usuário e leitura/escrita em listas do SharePoint. Melhor para controle por usuário e auditoria.
2. API Route do Next como BFF: frontend chama `/api`, backend usa Graph com permissão de aplicação. Melhor para esconder segredos e padronizar validações.
3. Power Automate como camada de gravação: app envia payload para fluxo, fluxo grava na lista. Mais simples para ambiente Microsoft, menos flexível para consultas complexas.

Recomendação inicial: BFF em Route Handlers do Next + Microsoft Graph, com listas SharePoint versionadas por ambiente. Evita expor credenciais, facilita validar schema e permite trocar estratégia sem reescrever UI.

## Próximo passo técnico para SharePoint

- Definir site, lista e colunas.
- Definir autenticação: usuário Microsoft ou permissão de aplicação.
- Criar contrato TypeScript para mapear campos da lista para `MedicalCertificate`.
- Substituir mock de `src/lib/atestados.ts` por funções de leitura/escrita via Graph.
