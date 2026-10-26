# Notion — mapeamento validado em 26/10/2026

A credencial do `.env` foi testada pela API oficial. As leituras anteriores via MCP mostravam outras fontes; os IDs abaixo foram confirmados no workspace acessível pela credencial do aplicativo.

## Bases atuais

| Base | ID da base | ID da fonte de dados |
|---|---|---|
| 📋 Tarefas | `38e9cd3e-bf24-81cc-bf91-d7618d62f1a6` | `38e9cd3e-bf24-815f-b168-000b1c06c60c` |
| 📊 Relatórios Semanais | `38e9cd3e-bf24-818c-a5b7-de24b633e74a` | `38e9cd3e-bf24-8133-97f1-000bf8133323` |

O ID da fonte de tarefas foi corrigido no `.env`, preservando a credencial. Não houve mudança no Notion.

## Propriedades de tarefas

| Propriedade | Tipo da API | Uso no app |
|---|---|---|
| Nome | title | Título |
| Cliente | select | CWB Kids ou Lucri |
| Data | date | Prazo / data de referência, sem reservar horas |
| Status | select | A fazer, Em andamento, Concluído |
| Área | select | Trabalho, Pessoal, Faculdade |
| Periodicidade | select | Diária, Semanal, Mensal; mantida no Notion |

Não há propriedades de prioridade ou estimativa na fonte. Não foram criadas. A prioridade inicial é Média; horas são definidas localmente. A periodicidade não gera tarefas recorrentes automaticamente nesta versão.

Importação paginada confirmada: **196 tarefas**. Por área original: 149 Trabalho, 14 Pessoal, 32 Faculdade e uma sem área. Por cliente: 81 Lucri, 63 CWB Kids e 52 sem cliente. Status: 147 Concluído, 44 A fazer, 3 Em andamento e dois sem status, exibidos como A fazer.

No app, Faculdade é uma categoria própria. Trabalho sem cliente e Pessoal ficam em Meus projetos. A distribuição local é 144 de clientes, 20 pessoais/internas e 32 de Faculdade. O nome de disciplina/projeto pode ser preenchido localmente sem alterar a Área no Notion.

Não se deduz a data de conclusão a partir de Data. As tarefas antigas concluídas não recebem uma data fictícia de conclusão. O relatório pode sugerir tarefas pela Data do Notion como referência, explicitamente sinalizada para revisão.

## Relatórios

Propriedades confirmadas: Nome (title), Cliente (select: CWB Kids/Lucri), Período (date), Status (select: Rascunho/Enviado).

Os PDFs fornecidos pelo usuário usam título com período e cliente, uma tabela de metadados e três seções:

1. O que eu fiz de mais relevante na semana passada?
2. O que está planejado de mais relevante para realizar essa semana?
3. Comentários.

A tela e o PDF local seguem esse formato. O PDF é baixado diretamente no navegador e respeita os textos editados. Não há publicação ou escrita na base de relatórios.

## Garantias da leitura

Todas as chamadas remotas são GET ou POST em `/search` e `/data_sources/<id>/query`. Não existem chamadas remotas de criação, modificação ou exclusão. Os IDs de página identificam as tarefas no SQLite; novas leituras não criam cópias. Campos locais de planejamento são preservados. Edições em campos compartilhados são sinalizadas e não são sobrescritas silenciosamente.

## Exclusão local e organização pessoal

A lixeira arquiva a tarefa, seus blocos e apontamentos apenas no SQLite. Um registro impede que a próxima consulta ao Notion recrie a tarefa removida. Desfazer restaura todo o conjunto. Nenhuma chamada de exclusão ou arquivamento é enviada ao Notion.

O campo local personalType separa projetos pessoais de tarefas avulsas. Esse campo e o nome do projeto ficam locais; a propriedade Área do Notion é preservada.
