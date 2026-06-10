## Diretrizes para IAs

Estas regras priorizam mudancas pequenas, explicitas e verificaveis. Para tarefas triviais, use julgamento e evite burocracia.

1. Antes de implementar, leia `docs/resumo-projeto.md` e valide se a mudanca segue a estrutura tecnica e os padroes atuais.
2. Se a mudanca alterar stack, arquitetura, rotas, padroes de codigo, estado, dados ou integracao SharePoint, atualize `docs/resumo-projeto.md`.
3. Declare suposicoes relevantes antes de implementar.
4. Se houver mais de uma interpretacao com impacto em regra de negocio, API, schema ou UX, pergunte antes de seguir.
5. Se a ambiguidade for pequena e o padrao existente responder, siga o padrao do codigo.
6. Nao implemente features alem do pedido.
7. Nao crie abstracoes para uso unico.
8. Toque apenas nos arquivos necessarios.
9. Nao reformate, refatore ou melhore codigo adjacente sem relacao direta com a tarefa.
10. Mantenha o estilo local.
11. Remova imports, variaveis e funcoes que ficarem orfaos por causa da mudanca.
12. Se notar codigo morto ou problema nao relacionado, mencione; nao corrija sem pedido.
13. Transforme a tarefa em criterios verificaveis e valide fluxo feliz e falhas relevantes.
14. Use Context7 MCP para docs de bibliotecas quando disponivel. Se nao estiver disponivel, use docs oficiais ou docs locais do pacote.
15. Ao introduzir padrao novo, atualize este arquivo e/ou `.codex/rules/`.
16. Use a skill `caveman:caveman` sempre que possivel para respostas curtas, mantendo precisao tecnica. Nao use caveman quando clareza, seguranca ou confirmacao de acao irreversivel exigir texto normal.
