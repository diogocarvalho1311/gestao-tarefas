# Contexto do projeto — DCarvalho / gestao-tarefas

> Documento de continuidade para troca de computador e retomada por uma pessoa ou agente.
> Levantamento: **2026-11-05**, fuso `America/Sao_Paulo`.
> Autoria: síntese do Codex baseada nos arquivos e no histórico Git disponíveis nesta instalação.
> Este arquivo preserva contexto técnico e operacional; **não substitui o backup dos dados nem das credenciais**.

## 1. Leia primeiro

O **DCarvalho** é um planejador pessoal de tarefas orientado pelo tempo disponível. Reúne trabalho para clientes, projetos pessoais, tarefas avulsas e faculdade numa capacidade semanal única. O nome interno do pacote e das pastas de execução ainda é **Compasso**; não são dois aplicativos distintos.

O projeto está implementado e tem documentação de uma versão online em Cloudflare Pages, com dados em D1, além da versão local com SQLite. O aplicativo não depende do computador pessoal ligado para atender a versão online.

As quatro distinções mais importantes para continuar o trabalho são:

1. **Código não é dado:** o Git contém código; SQLite, `.env`, referências e arquivos privados estão fora do versionamento.
2. **Local não é nuvem:** depois da migração inicial, SQLite e D1 são independentes. Não existe sincronização entre eles.
3. **Notion é somente leitura:** editar, concluir ou remover no aplicativo não escreve no Notion.
4. **Planejado não é realizado:** blocos reservam capacidade; apontamentos registram horas efetivamente trabalhadas; prazo não reserva horas.

Para usar o sistema no novo PC, o acesso online pode continuar pelo mesmo endereço e senha pessoal. Para desenvolver e preservar também o ambiente local, siga as seções 3 e 4.

## 2. Identificação e estado encontrado

| Item | Situação observada |
| --- | --- |
| Diretório de origem | `H:\Meu Drive\projetos-vscode\gestao-tarefas` |
| Repositório | `https://github.com/diogocarvalho1311/gestao-tarefas.git` |
| Branch | `main` |
| HEAD analisado | `4cd6d17f39d11948483d435bbd775271cf061308` |
| Último commit | `4cd6d17` — Ajusta títulos dos relatórios para a semana anterior e datas com ponto; 2026-11-02 |
| Estado antes deste documento | Árvore de trabalho limpa; 63 arquivos rastreados |
| Comparação com `origin/main` | 0 commits à frente e 0 atrás da referência **local**, sem executar fetch |
| Nome do pacote | `compasso`, versão `1.0.0`, privado, ESM |
| Ambiente encontrado | Windows / PowerShell; Node `v22.19.0`; npm `11.6.0` |
| Requisito documentado | Node.js 22.19 ou superior e npm |
| Aplicativo online documentado | `https://dcarvalho-tarefas.pages.dev` |
| Demonstração documentada | `https://dcarvalho-tarefas.pages.dev/visualizacao` |

Não foi encontrado `AGENTS.md` dentro deste projeto no levantamento. As regras do repositório vizinho `produtos-lucri` são próprias daquele repositório; a presença de Lucri como cliente aqui não torna os dois projetos um só.

Este levantamento não consultou contas remotas, registros pessoais do banco nem conversas antigas. Disponibilidade online, contagens atuais na nuvem, permissões e validade de credenciais não foram verificadas. Os números de importação nas seções seguintes são registros históricos dos documentos do projeto.

## 3. Antes de entregar ou apagar o PC antigo

### 3.1 O que precisa ser preservado

| Material | Onde está nesta instalação | Como tratar na mudança |
| --- | --- | --- |
| Código, documentação e histórico | Pasta do projeto e `.git/` | Copiar integralmente ou recuperar do remoto; conferir alterações locais |
| Este documento | `CONTEXTO-DO-PROJETO.md` na raiz | Levar junto; só chegará por clone depois de ser versionado e enviado |
| Credencial do Notion | `.env` na raiz | Transferir por meio privado; não colar neste documento nem versionar |
| SQLite local | `%LOCALAPPDATA%\Compasso\data-8d2512e380a4\` | Parar o app e copiar a pasta inteira para armazenamento privado |
| Referências de design e relatório | `refs/` | Copiar separadamente se fizer clone; esta pasta é ignorada pelo Git |
| Artefatos administrativos privados | `.cloudflare/` | Avaliar e preservar em local privado; podem conter dados e token de ativação |
| Conta Cloudflare | Acesso à conta pelo navegador/Wrangler | Garantir acesso à conta e autenticar novamente no novo PC |
| Conta GitHub e senha pessoal do app | Contas / gerenciador de senhas | Garantir acesso; não dependem de copiar o código |
| Banco de produção | D1 da conta Cloudflare | Continua na nuvem; obter backup próprio antes de procedimentos de recuperação |

**Ponto crítico observado:** o banco local possui os arquivos `compasso.sqlite`, `compasso.sqlite-wal` e `compasso.sqlite-shm`. Parte dos dados pode estar no WAL. Não presumir que copiar apenas o arquivo principal enquanto o app está aberto produzirá um backup completo.

Caminho absoluto identificado para o banco local padrão:

```text
C:\Users\Diogo Carvalho\AppData\Local\Compasso\data-8d2512e380a4\compasso.sqlite
```

O `.env` encontrado declara `NOTION_TOKEN` e `NOTION_DATA_SOURCE_ID`. Seus valores não foram reproduzidos neste documento. Não há `DATABASE_PATH` declarado nesse arquivo no levantamento; uma variável externa ao arquivo ainda pode alterar o caminho efetivo. O caminho impresso pelo inicializador é o padrão, e não necessariamente um override de ambiente.

### 3.2 Sequência recomendada de backup

- [ ] No endereço online, entrar como proprietário e usar **Configurações → Baixar backup**. Guardar o JSON em local privado.
- [ ] Se houver uso local, baixar também o backup pela versão local; os dois ambientes podem ter conteúdos diferentes.
- [ ] Encerrar o aplicativo local com `Ctrl+C` e confirmar que o processo terminou.
- [ ] Copiar a pasta `data-8d2512e380a4` inteira, com os arquivos presentes, para uma pasta privada de transferência.
- [ ] Preservar `.env`, `refs/` e os arquivos privados necessários de `.cloudflare/`, separadamente do Git.
- [ ] Confirmar acesso às contas GitHub e Cloudflare e à senha pessoal do aplicativo.
- [ ] No novo PC, conferir arquivos e abrir a cópia restaurada antes de descartar o backup ou apagar o PC antigo.

Arquivos encontrados em `refs/`, todos ignorados pelo Git:

- `19-25.10 - Lucri.pdf` e `19-25.10 - CWB Kids.pdf`: referências dos relatórios fornecidos pelo usuário.
- `DESIGN.md`: referência visual original de interface clara.
- `image.png`: imagem de referência; seu conteúdo visual não foi revalidado neste levantamento.

Em `.cloudflare/` foram encontrados `deployment.json`, `Primeiro acesso.url`, `local-before-migration-1793046637396.json` e `live-comparison.json`. Os conteúdos não foram abertos neste levantamento. O código documenta que os dois primeiros podem conter a credencial temporária de ativação, e o arquivo de pré-migração contém uma cópia de dados. Não tratar esses arquivos como backup atual da produção.

**O JSON baixado pela interface não tem importador de restauração na UI.** Inclui estado e lixeira, mas não todos os metadados administrativos: não inclui `.env`, autenticação ou as baselines de importação do Notion. Para restauração integral local, preservar SQLite; para hospedagem, preservar/exportar D1. Um `.gitignore` também não impede sincronização privada pelo Google Drive.

## 4. Retomar no novo computador

### 4.1 Recuperar o código e iniciar

Instalar Git e Node compatível. Recuperar a pasta sincronizada ou clonar o repositório, sem sobrescrever uma cópia que tenha alterações locais:

```powershell
git clone https://github.com/diogocarvalho1311/gestao-tarefas.git
Set-Location gestao-tarefas
git status --short
node --version
npm --version
```

Se a pasta já foi copiada pelo Drive, apenas entrar nela e verificar o estado. Recolocar o `.env` privado ou, numa instalação sem esse arquivo, copiar `.env.example` para `.env` e preencher a credencial fora do Git.

```powershell
npm run dev
```

Abrir `http://localhost:3000`. Frontend e backend iniciam juntos. O primeiro comando prepara automaticamente as dependências fora do Drive; não é necessário executar `npm install` na pasta sincronizada. Não copiar `node_modules/` ou o runtime antigo para fazer a instalação funcionar.

### 4.2 Restaurar os dados locais

O inicializador calcula a chave a partir dos primeiros 12 caracteres do SHA-256 do **caminho absoluto** do projeto. Na origem, a chave é `8d2512e380a4`. Mudar letra de unidade ou caminho pode gerar uma chave diferente e uma base vazia. Mesmo mantendo o caminho do projeto, um novo Windows terá outro `%LOCALAPPDATA%` e não receberá os dados só pelo clone.

Com o app parado, restaurar o backup SQLite em uma pasta local privada do novo computador. Uma opção é informar um caminho absoluto explícito no `.env`, ajustado à pasta realmente restaurada:

```dotenv
# Exemplo de caminho para adaptar; não é um segredo.
DATABASE_PATH=C:/DadosPrivados/DCarvalho/compasso.sqlite
```

Preservar os arquivos auxiliares junto do banco quando presentes no backup. Não apontar para SQLite aberto dentro do Drive. Não substituir uma base existente sem primeiro preservar essa base. Ao reiniciar, conferir tarefas, blocos, horas, relatórios e revisões; uma tela vazia não prova que os dados antigos foram perdidos — verificar caminho e backup primeiro.

### 4.3 Conferir a instalação

Executar em sequência, na pasta original do projeto:

```powershell
npm test
npm run build
npm run test:smoke
```

Os comandos compartilham a cópia de execução; não rodá-los em paralelo. Depois de configurar o Notion, a leitura real pode modificar os dados do aplicativo importando tarefas: fazer essa verificação deliberadamente, após restaurar e conferir os dados. Não é uma etapa obrigatória dos testes automatizados.

Para continuar apenas usando a versão online, não é necessário restaurar o SQLite ou fazer deploy. A senha de acesso online e o banco D1 continuam associados à hospedagem existente.

## 5. Arquitetura e mapa dos arquivos

```text
gestao-tarefas/
├── src/                 React: telas, componentes e exportação de PDF
│   ├── App.tsx          Navegação, filtros, formulários e chamadas à API
│   ├── main.tsx         Providers, SessionGate e ordem dos estilos
│   ├── styles.css       Base da interface e layouts
│   ├── theme.css        Aparência atual e adaptações visuais
│   ├── components/      Tabelas, relatórios, revisão, calendário, login etc.
│   └── lib/             export-report.ts
├── shared/              Tipos, datas e regras compartilhadas entre ambientes
├── server/              Express, SQLite, validação e importação do Notion
├── cloudflare/          API online, autenticação, persistência D1 e migrações
├── scripts/             Inicializador, build de Pages e administração
├── tests/               Testes de domínio, integração e smoke HTTP
├── docs/                Operação Cloudflare e mapeamento Notion
├── public/              Cabeçalhos de segurança e roteamento de Functions
├── refs/                Referências locais ignoradas pelo Git
├── .cloudflare/         Artefatos privados ignorados pelo Git
├── .env.example         Modelo sem credencial
├── package.json         Comandos e dependências
└── wrangler.jsonc       Projeto Pages e binding DB do D1
```

Fluxo local: navegador → Express em loopback → SQLite. Em desenvolvimento, Vite é middleware do Express. Em `npm start`, o Express serve `dist/`.

Fluxo online: navegador → Pages → `/api/*` em `dist/_worker.js` → D1. Assets estáticos são servidos pelo Pages. A leitura de Notion ocorre no backend em ambos os ambientes, nunca com token exposto ao frontend.

| Responsabilidade | Arquivos principais |
| --- | --- |
| Tipos `Task`, `State`, `Report`; capacidade e datas | `shared/domain.ts` |
| Candidatos, títulos, composição e métricas de relatório | `shared/domain.ts`, `shared/reports.ts` |
| Revisões retrospectivas | `shared/daily-review.ts`, `src/components/DailyReview.tsx` |
| Busca do seletor e ordenação das tabelas | `shared/task-filters.ts`, `shared/task-sorting.ts` |
| Calendário acadêmico | `shared/academic-calendar.ts`, `src/components/AcademicCalendar.tsx` |
| Cores por cliente/área e demonstração | `shared/client-theme.ts`, `shared/demo.ts` |
| API local, schemas e persistência | `server/index.ts`, `server/validation.ts`, `server/store.ts` |
| Integração com Notion | `server/notion.ts` |
| API e persistência online | `cloudflare/worker.ts`, `cloudflare/workspace.ts` |
| Login e isolamento de visitante | `cloudflare/auth.ts`, `src/components/SessionGate.tsx` |
| Relatório na UI e PDF | `src/components/Reports.tsx`, `src/lib/export-report.ts` |
| Atalhos externos por área | `src/components/WorkspaceLinks.tsx` |
| Confirmações e duração em minutos/horas | `src/components/ConfirmProvider.tsx`, `src/components/DurationInput.tsx` |

Stack declarada: React 19, TypeScript 5.9, Vite 6, Tailwind 4, Express 5, Zod 4, jsPDF 3, Lucide e Geist local. SQLite usa `node:sqlite`; não existe servidor de banco para instalar no modo local. Cloudflare usa Wrangler 4, Workers/Pages Functions e D1. As versões exatas resolvidas devem ser consultadas em `package-lock.json`; os intervalos do manifesto não fixam todas as versões.

## 6. Como funciona o inicializador

`scripts/run.mjs` mantém código-fonte no projeto e execução em disco local, evitando dependências e SQLite no Drive sincronizado:

```text
%LOCALAPPDATA%\Compasso\
├── runtime-<chave>\       Cópia de execução, dependências e build
├── data-<chave>\          SQLite persistente da cópia do projeto
└── npm-cache\            Cache de instalação
```

Em sistemas sem `LOCALAPPDATA`, o código usa `XDG_DATA_HOME` ou a pasta de dados do usuário. A operação efetivamente observada aqui é Windows.

- A cada comando, copia `src`, `server`, `shared`, `tests`, `scripts`, `cloudflare`, `public` e configurações para o runtime.
- Copia `.env` quando presente; define `DCARVALHO_SOURCE_DIR` e `COMPASSO_DEFAULT_DB` para os subprocessos.
- Usa um marcador `.installed` baseado nas dependências declaradas. Quando precisa instalar, roda `npm install` no runtime e pode copiar o lockfile resultante para a origem.
- **Editar no projeto original exige reiniciar `npm run dev`** para atualizar a cópia. O watcher acompanha o runtime, não a origem sincronizada.
- Não editar `runtime-*` como fonte definitiva: a próxima execução copia os arquivos originais novamente.
- Precedência de banco na API: `DATABASE_PATH` → `COMPASSO_DEFAULT_DB` → `./data/compasso.sqlite`.
- O build executa `tsc --noEmit`, Vite e copia `dist/` para a origem. `npm start` exige esse build.
- `dist/`, dependências e caches são recriáveis. `data-*` e credenciais exigem preservação.

## 7. Comportamentos que devem ser preservados

### 7.1 Tarefas e capacidade

- Áreas técnicas: `client`, `personal`, `academic`. Em pessoal, `personalType` distingue `project` e `task`; dados antigos com nome de projeto continuam compatíveis.
- Status: **A fazer → Em andamento → Concluída**. O antigo status local `Bloqueada` é convertido para A fazer pelo armazenamento local.
- Prioridade: Alta, Média, Baixa. Novas tarefas manuais começam com estimativa de 1h no formulário; importadas sem estimativa têm 0 e aparecem como **A estimar**.
- Capacidade inicial: 6h por dia útil e 0h no fim de semana; cada dia pode ser alterado entre 0 e 24h.
- Uma tarefa aceita vários blocos em dias diferentes. Prazo não cria bloco. Concluir não apaga blocos nem apontamentos históricos.
- É permitido planejar acima da capacidade, com aviso. Saldo = disponível − planejado; restante = máximo entre zero e estimado − realizado.
- Duração é armazenada em **horas numéricas**, inclusive frações. A interface aceita minutos ou horas e formata como `1h 30min`; não reinterpretar frações como minutos.
- A visão geral usa toda a capacidade semanal, incluindo as diversas áreas. O calendário acadêmico mostra somente tarefas acadêmicas.
- Datas de trabalho usam `YYYY-MM-DD`; `today()` e conversão de conclusão usam `America/Sao_Paulo`. A semana começa na segunda. A aritmética de dias usa meio-dia UTC para evitar deslocamentos involuntários.

### 7.2 Navegação e experiência

Telas: Visão geral, Planejamento semanal, Tarefas, Mapa de tarefas, Relatórios e Calendário da faculdade. A sidebar contém atalhos de Lucri, CWB Kids, Meus projetos, Minhas tarefas e Faculdade. Busca, filtros e ordenação ajudam a localizar tarefas e reservar blocos.

O mapa oferece visualização pelo tamanho das tarefas. Tabelas compartilham `TasksTable`: Status vem primeiro e sua ordem permanece fixa mesmo ao ordenar outra coluna. Datas/estimativas ausentes ficam no fim do grupo. As contagens da sidebar representam tarefas pendentes.

Atalhos de Lucri incluem dashboard e Meta Ads; CWB Kids inclui Nuvemshop e Meta Ads; Faculdade inclui UFPR Virtual e Teams. Os destinos estão em `WorkspaceLinks.tsx`. Não é necessário copiar URLs administrativas longas para novos documentos.

Confirmações de exclusão e de saída com rascunho usam componentes do próprio app. A exclusão disponibiliza **Desfazer** por 12 segundos na UI; a tarefa continua arquivada no armazenamento depois de desaparecer esse aviso. Não há uma tela completa de lixeira documentada.

### 7.3 Revisão diária

- Guarda `dailyReviewStartDate` e `dailyReviews` no estado e no backup.
- A fila contém dias anteriores sem resposta desde o marco de acompanhamento; não cria anos de pendências a partir das datas antigas do Notion.
- Mostra a pendência mais antiga, permite escolher outra e continua cobrando datas não respondidas.
- O dia é recalculado periodicamente e ao retornar à aba, seguindo São Paulo.
- Primeiro selecionar concluídas, depois em andamento e então o total de tempo por tarefa naquela data.
- O valor informado **substitui o total da tarefa naquele dia**; não soma novamente ao total antigo e não altera outros dias. Zero remove o tempo daquele dia para a tarefa.
- Rejeita datas de hoje/futuras, tarefas duplicadas e total diário acima de 24h; valida tudo antes de aplicar.
- Conclusões retrospectivas usam a data da revisão. Uma resposta antiga não reabre tarefa concluída ou revisada posteriormente.
- Cada data só pode ser finalizada uma vez. Salvar sem atividades encerra aquela pendência sem inventar horas.
- Visitante não registra revisão nem recebe o aviso. **Mais tarde** preserva pendências.

## 8. Relatórios: regra atual e correções recentes

Esta foi a área dos dois últimos commits. **A semana selecionada é a semana do planejamento.** Realizados e horas usam a semana imediatamente anterior.

Exemplo confirmado nos testes: ao selecionar **02–08/11/2026**, realizados e horas vêm de **26/10–01/11/2026**, e planejamento vem de **02–08/11/2026**. O título automático fica **26.10 - 01.11 - Lucri**.

- Candidatos de realizados: tarefas concluídas com `completedAt` na semana anterior. Para antigas sem essa data, `due` pode servir somente como referência de seleção, com aviso de revisão; não preencher `completedAt` com essa hipótese.
- Candidatos de planejamento: pendentes com bloco ou prazo na semana selecionada.
- Separação por cliente/projeto/disciplinas usa `groupKey`: `client:<cliente>`, `personal:<projeto>` ou `academic:<disciplina>`. Rascunho usa chave `<semana>|<grupo>`.
- O relatório guarda IDs selecionados (`doneTaskIds`, `nextTaskIds`) e complementos livres (`doneNotes`, `nextNotes`), além de comentários, título e status.
- Rascunhos antigos com apenas texto são preservados como complementos livres. `composeReport` combina tarefas e textos.
- **Puxar tarefas automaticamente** recalcula seleções com o estado já carregado, preservando complementos/comentários. **Ler Notion** é a ação que atualiza a fonte externa.
- Métricas: entregas selecionadas; tempo registrado na semana anterior do grupo; tempo dessa mesma semana nas entregas selecionadas; horas de blocos na semana selecionada. Não usar estimativa como horas realizadas.
- Títulos automáticos antigos reconhecidos são atualizados; títulos personalizados são preservados. O padrão usa pontos nas datas e, dentro do mesmo mês, pode compactar para `DD-DD.MM`.
- A indicação de período nos metadados continua representando a semana selecionada de planejamento, embora o título represente a semana anterior.
- Copiar e exportar usam o rascunho atual, inclusive edições ainda não salvas. Título do PDF e nome do arquivo seguem o campo de título atual.
- Salvar antes de trocar tela/semana/grupo. `Enviado` é apenas marcação manual; não envia nem publica nada.

As três seções mantêm o formato das referências do usuário: “O que eu fiz de mais relevante na semana passada?”, “O que está planejado de mais relevante para realizar essa semana?” e “Comentários”.

O PDF é gerado no navegador por jsPDF, com páginas A4 escuras, metadados, indicadores, três seções e numeração. Detalhes rosa para CWB Kids, verde para Lucri e laranja para outros grupos. A interface usa Geist; o gerador de PDF usa Helvetica do jsPDF. Não presumir que a fonte da UI está incorporada ao PDF.

## 9. Integração com Notion

Fontes principais: `server/notion.ts`, `.env.example` e [docs/notion-mapping.md](docs/notion-mapping.md). API fixada no código em `Notion-Version: 2025-09-03`.

| Fonte | Database ID | Data source ID |
| --- | --- | --- |
| Tarefas | `38e9cd3e-bf24-81cc-bf91-d7618d62f1a6` | `38e9cd3e-bf24-815f-b168-000b1c06c60c` |
| Relatórios Semanais | `38e9cd3e-bf24-818c-a5b7-de24b633e74a` | `38e9cd3e-bf24-8133-97f1-000bf8133323` |

Esses IDs identificam recursos, não substituem a credencial. A integração deve ter acesso à fonte correta. O documento histórico registra divergência entre fontes antes vistas por MCP e as acessíveis pelo token do app; não substituir a fonte usando apenas resultados de outro conector.

Configuração mínima:

```dotenv
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=38e9cd3e-bf24-815f-b168-000b1c06c60c
```

O valor de `NOTION_TOKEN` deve ser preenchido privadamente. `.env.example` também documenta overrides de propriedades, filtro opcional de responsável, porta e caminho de banco. O código aceita ainda `NOTION_PRIORITY_PROPERTY`. Reiniciar o app após alterar `.env`.

Mapeamento observado em 26/10/2026: Nome/title → título; Cliente/select → cliente; Data/date → prazo ou referência; Status/select → status; Área/select → área. Periodicidade existe na fonte, mas não gera recorrência no app. A fonte observada não tinha prioridade nem estimativa: prioridade inicial Média, estimativa zero, sem blocos automáticos.

Registro histórico: 196 tarefas importadas sem duplicação, classificadas no app em 144 de clientes, 20 pessoais/internas e 32 acadêmicas. Esses números não são contagens atuais garantidas.

Regras do importador:

- Descobre propriedades por nome e tipo; aceita ID de data source ou database com fonte única. Sem ID, procura uma única fonte com nome compatível com tarefas.
- Percorre paginação de 100 registros; usa ID da página do Notion como identidade para evitar duplicatas.
- Requisições remotas são leitura: GET e POST de busca/consulta. Não cria, atualiza, arquiva ou exclui páginas.
- Faculdade tem categoria própria. Pessoal e trabalho sem cliente entram em pessoal; a distinção e o nome do projeto podem ser ajustados localmente.
- Preserva estimativa, planejamento, notas e prioridade local quando a fonte não fornece prioridade. Não inventa conclusão histórica a partir de prazo.
- Campos compartilhados editados localmente marcam `dirty`. Se a fonte diverge da baseline, marca conflito e preserva a edição local.
- Resolver conflito limpa as marcas para permitir que a **próxima leitura** aplique os campos remotos; não é uma escrita no Notion.
- Tarefas removidas localmente têm tombstone na lixeira e não reaparecem numa nova leitura. Itens remotos arquivados/na lixeira são ignorados pela importação; isso não constitui espelhamento com exclusão automática dos já importados.
- Consulta manual pela UI e a cada cinco minutos enquanto a aba está visível; não existe agendamento de fundo independente do navegador.
- Relatórios Semanais foi identificada como fonte, mas não há publicação automática nem integração de escrita com ela.

## 10. Persistência e API

### 10.1 Estado e armazenamento

`State` reúne `tasks`, `blocks`, `timeEntries`, `availability`, `reports`, `revision` e os campos opcionais de revisão diária. `Task` guarda origem Notion, marca de edição local, possível conflito e tempo realizado. `actual` acompanha a soma dos apontamentos.

SQLite local (`server/store.ts`):

- `app_state`: documento JSON único do estado.
- `notion_baselines`: campos importados usados para reconhecer divergências.
- `task_trash`: tarefa removida, blocos, apontamentos e data da remoção.
- Modo WAL e `synchronous=FULL`; exclusão/restauração e importação usam transações.

D1 (`cloudflare/workspace.ts`):

- `workspace`: uma linha com `revision` e documento `{ state, trash, baselines }`.
- `owner`, `sessions`, `auth_attempts`, `viewer_access`, `viewer_sessions`: autenticação e controle de acesso.
- Escrita condicional `UPDATE ... WHERE revision = ?`; estado e revisão mudam juntos. Não substituir o documento por uma cópia antiga.

Ambos os backends rejeitam revisão desatualizada com HTTP 409 para evitar sobrescrita por outra aba/dispositivo. A UI recarrega o estado e exige nova tentativa. A leitura do Notion tem tratamento próprio; não remover a proteção de concorrência.

### 10.2 Rotas para manutenção

| Operação | Rotas principais |
| --- | --- |
| Estado, diagnóstico e backup | `GET /api/state`, `/api/health`, `/api/backup` |
| Tarefas e restauração | `POST /api/tasks`; `PUT/DELETE /api/tasks/:id`; `POST /api/tasks/:id/restore` |
| Disponibilidade | `PUT /api/availability` |
| Blocos | `POST /api/blocks`; `PUT/DELETE /api/blocks/:id` |
| Tempo realizado | `POST /api/time`; `DELETE /api/time/:id` |
| Revisão e relatório | `POST /api/daily-reviews`; `PUT /api/reports` |
| Notion | `GET /api/notion`; `POST /api/notion/sync`; `POST /api/notion/resolve/:id` |
| Exemplos locais | `POST/DELETE /api/examples` |
| Autenticação online | `/api/auth/session`, `/setup`, `/login`, `/logout` sob `/api/auth` |
| Visitante online | `/api/view/auth/*`, `/api/view/state`, `/api/view/notion` |

As escritas usam JSON e geralmente incluem `revision`; autenticação e leitura do Notion têm fluxo específico. Os schemas Zod de `server/validation.ts` são reutilizados no backend online. A API local escuta em `127.0.0.1`, sem login local, e rejeita origens externas. Não expor esse servidor diretamente à internet.

## 11. Cloudflare: hospedagem e manutenção

Configuração existente em `wrangler.jsonc`:

- Projeto Pages: `dcarvalho-tarefas`; build em `./dist`.
- D1: `dcarvalho-gestao`; binding `DB`; database ID `96bb3f3a-be99-4273-b5ed-7de9e34d0562`.
- Compatibilidade: `2026-10-01`, flag `nodejs_compat`.
- Conta administrativa identificada em `cloudflare/account.json`; não é um token. `CLOUDFLARE_ACCOUNT_ID` pode sobrescrever a conta nos scripts administrativos.
- O Worker antigo `dcarvalho-gestao` é redirecionador 308 para Pages. Arquivos: `cloudflare/redirect.ts` e `cloudflare/redirect.wrangler.jsonc`.

`scripts/build-pages.mjs` usa esbuild para gerar `dist/_worker.js`. `public/_routes.json` encaminha `/api/*` para Functions; `public/_headers` e o worker configuram cabeçalhos de segurança. GitHub não tem deploy automático documentado a cada push.

### 11.1 Comandos e efeitos

| Comando | Efeito |
| --- | --- |
| `npm run cloudflare:dev` | Compila e abre Pages local em `localhost:3199`, com D1 local independente |
| `npm run cloudflare:status` | Consulta contagens/revisão/ativação na nuvem sem imprimir tarefas |
| `npm run cloudflare:migrate` | **Aplica migrações no D1 remoto**, não no banco de testes |
| `npm run cloudflare:deploy` | Compila e publica em Pages, projeto existente, branch main |
| `npm run cloudflare:secrets` | Configura `NOTION_*` do ambiente como segredos de produção e, se aplicável, ativação |
| `npm run cloudflare:import` | Copia SQLite para nuvem somente se o workspace remoto estiver vazio e com revisão zero |
| `npm run cloudflare:viewer` | Configura hash da senha pública de visitante e revoga as sessões de visitante |
| `node scripts/run.mjs cloudflare-activation` | Gera atalho privado com fragmento de ativação a partir do estado privado |

Esses comandos são referência de manutenção, **não etapas obrigatórias da troca de PC**. Não executar migração remota, importação, troca de senha ou deploy apenas para restaurar contexto.

No novo PC, autenticar o Wrangler na conta existente para administrar. O script aceita `CLOUDFLARE_API_TOKEN` ou lê o OAuth do Wrangler no caminho Windows `%APPDATA%\xdg.config\.wrangler\config\default.toml`. O código sugere `npx wrangler login` quando não há sessão. Essa autenticação não é a senha pessoal do app e não vem pelo Git; se o login for gravado em outro caminho por uma versão diferente do Wrangler, revisar `scripts/cloudflare.mjs` antes de supor que o token é inválido.

Quando houver uma atualização autorizada para publicar, a sequência documentada é `npm test` → `npm run cloudflare:migrate` → `npm run cloudflare:deploy`, sempre sequencial. Deploy não importa nem substitui o workspace existente.

### 11.2 Migrações existentes

1. `0001_workspace.sql`: workspace, proprietário, sessões e tentativas de autenticação.
2. `0002_viewer_access.sql`: papel nas sessões e configuração inicial de visitante.
3. `0003_isolated_viewer_sessions.sql`: sessões de visitante separadas; renomeia tabela para `viewer_access` e remove sessões viewer da tabela antiga.
4. `0004_daily_review_start.sql`: persiste o início das revisões sem inventar anos de pendências; atualiza revisão do estado quando necessário.

Não editar migrações já aplicadas. Criar novo SQL para mudanças de esquema. Para testes locais de Workers, preparar migrações em modo `--local` e `.dev.vars`; nunca usar `--remote` como preparação de teste. O runtime local do Wrangler fica separado do D1 de produção.

### 11.3 Autenticação e recuperação

O proprietário cria a senha por link privado de ativação, sem cadastro público. O token vai no fragmento, é removido da barra pela UI, tem hash como segredo e validade de três dias antes da criação da senha. Senhas usam PBKDF2 SHA-256 com salt individual e 100.000 iterações. Sessões persistem hashes, não os tokens originais, e usam cookie `HttpOnly`, `Secure`, `SameSite=Strict`.

Sessão do proprietário dura 14 dias e a do visitante um dia. Há limitação de tentativas e rejeição de origens externas. Não criar um novo proprietário ou trocar dados para fazer login em outro PC: usar a senha existente.

A recuperação de senha descrita em [docs/cloudflare.md](docs/cloudflare.md) exige administração do D1, backup prévio, revogação de sessões e remoção do registro de proprietário, seguida de nova ativação. **Não alterar a tabela `workspace`**. É procedimento deliberado de recuperação, não rotina de reinstalação; não foi executado neste levantamento.

### 11.4 Demonstração pública

`/visualizacao` tem login de visitante; as credenciais públicas estão no README. A sessão usa cookie `__Host-dcarvalho-viewer` e tabela `viewer_sessions`, separados de `__Host-dcarvalho` e `sessions` do proprietário. O texto de usuário visitante é informativo; a UI autentica com a senha de demonstração.

Os dados vêm de `shared/demo.ts`, com datas relativas à semana atual, sem consultar o workspace pessoal nem Notion. A API recusa mutações e backup pessoal com 403. Filtros, consultas e exportação dos relatórios fictícios são permitidos. Os únicos POSTs permitidos ao visitante são de autenticação/encerramento de sua própria sessão. A separação precisa continuar no backend, mesmo se a UI já esconder controles.

## 12. Direção visual e referências

A implementação atual é escura, com acento laranja, fonte Geist empacotada localmente nos pesos 400/500/600 e ícones Lucide. `src/main.tsx` importa primeiro `styles.css` e depois `theme.css`; a ordem importa para a aparência efetiva.

Tokens atuais de `theme.css`: fundo `#101010`, painel `#202020`, superfície elevada `#292929`, linha `#343434`, texto secundário `#a0a0a0`, texto principal `#f1f0ee`, acento `#e18b5e` e ação sólida `#b9562d`.

Identificação por cliente/área: CWB Kids rosa (`#e792bb`), Lucri verde (`#90c9a3`), Minhas tarefas amarelo e Meus projetos roxo; as cores de prioridade são independentes. `shared/client-theme.ts` também define laranja de outros grupos (`#e29a67`).

`refs/DESIGN.md` é uma referência anterior clara e monocromática. O comentário de `theme.css` registra adaptação à paleta preta/laranja do usuário. Não reaplicar os tokens claros da referência sobre a interface atual por pressupor que representam a decisão mais recente. Tampouco importar automaticamente a identidade de outro repositório porque um cliente se chama Lucri.

## 13. Verificação e diagnóstico

| Arquivo de teste | Cobertura principal registrada no código |
| --- | --- |
| `tests/domain.test.ts` | Semana, capacidade, blocos, restante, validação e SQLite |
| `tests/calendar-duration.test.ts` | Minutos, filtros e calendário acadêmico |
| `tests/tasks.test.ts` | Ordenação, pessoal/projeto e exclusão reversível |
| `tests/notion.test.ts` | Paginação, idempotência, conflitos e mapeamento com mocks |
| `tests/report.test.ts` | Períodos, viradas de semana/ano, métricas, títulos e PDF longo |
| `tests/daily-review.test.ts` | Revisão atômica, horas, fila de pendências e atualizações posteriores |
| `tests/cloudflare.test.ts` | Login, sessão, segurança, persistência, visitante e migrações em banco de teste |
| `tests/smoke.ts` | Fluxo HTTP e persistência após reinícios com SQLite temporário |

O smoke usa porta 3197, banco temporário e `NOTION_TOKEN` vazio; não precisa do Notion real. A suíte de Cloudflare usa um adaptador de teste, não aplica migrações na conta real. A documentação anterior também relata validação de Workers com navegador; essa validação não foi repetida neste levantamento.

| Sintoma | Primeiro ponto a conferir |
| --- | --- |
| Lista vazia após mudar de PC/pasta | Chave do caminho, SQLite restaurado, `DATABASE_PATH`; distinguir local e online |
| Código editado não aparece | Reiniciar comando para recópia da origem ao runtime |
| Falha de SQLite ou instalação no Drive | Executar pelo inicializador; dados/dependências devem ficar no disco local |
| Erro 409 ao salvar | Estado mudou em outra aba; recarregar e repetir, sem remover controle de revisão |
| Erro 401 online | Sessão expirada; entrar novamente no domínio correto |
| Notion não configurado | `.env` local ou segredos de Pages, reinício, permissão da integração e fonte correta |
| Relatório parece uma semana deslocado | Realizados/título são da semana anterior; planejamento é da selecionada |
| Tarefa removida não volta do Notion | Tombstone local intencional; usar restauração, não recriar por importação |
| Não consigo importar o JSON de backup | Importador pela interface ainda não existe |

## 14. Histórico útil para retomar decisões

| Commit | Mudança registrada |
| --- | --- |
| `7d63717` | Implementação inicial de tarefas, planejamento e relatórios locais |
| `3457da4` | Hospedagem Cloudflare com D1 e acesso privado |
| `aa7ee84` | Mudança para Pages preservando D1 |
| `d0ef8b2`, `ba1e0c1` | Clientes agrupados e UFPR Virtual |
| `7b3e2c0` | Demonstração pública somente leitura |
| `f03e80a`, `cb6212d` | Status primeiro e grupos de status em ordem fixa |
| `7f40941` | Revisão diária de status e tempo |
| `69dc9bc`, `a3028c4` | Ações sem corte, horas realizadas e consistência dos cards semanais |
| `031efc3` | Layout da revisão e manutenção dos dias anteriores pendentes |
| `6582a29` | Atalhos de Lucri, CWB Kids e Teams |
| `300aba1` | Períodos corretos de tarefas nos relatórios semanais |
| `4cd6d17` | Título pela semana anterior e datas com ponto |

Consultar `git show <commit>` para conhecer o detalhe de uma decisão. Não inferir exigências novas apenas pelo nome de um commit.

## 15. Limites atuais e pendências da transição

Limites existentes, sem tratá-los como tarefas já autorizadas:

- Não há importação de JSON de backup pela interface.
- Não há sincronização SQLite ↔ D1, escrita no Notion ou publicação automática de relatórios.
- Periodicidade do Notion não gera recorrências automaticamente.
- A primeira importação para nuvem só aceita workspace vazio com revisão zero; não serve para mesclar bancos depois.
- Referências e segredos ignorados não vêm no clone. Uma cópia antiga de pré-migração não garante recuperação dos dados atuais.
- O inicializador compartilha runtime entre comandos, recopia arquivos a cada execução e não oferece atualização automática da origem para o runtime já aberto.

Pendências reais da troca de computador:

- [ ] Fazer e conferir backups de dados e materiais privados.
- [ ] Garantir que este Markdown acompanhe a cópia de transferência; se depender do GitHub, versioná-lo e enviá-lo quando autorizado.
- [ ] Confirmar autenticação das contas e senha do aplicativo no novo PC.
- [ ] Reinstalar o ambiente, restaurar SQLite quando necessário e conferir a aplicação.
- [ ] Rodar os testes e build no novo ambiente; registrar os resultados se houver mudanças.

Não foi localizado um backlog separado com novos recursos aprovados. As limitações acima descrevem o código atual e não constituem aprovação para implementá-las. Nenhum commit, push, deploy, alteração de credencial ou migração de dados foi realizado para criar este documento.

## 16. Texto pronto para iniciar uma nova conversa

```text
Estou retomando o projeto gestao-tarefas / DCarvalho em outro computador.
Leia CONTEXTO-DO-PROJETO.md, README.md, docs/cloudflare.md e
docs/notion-mapping.md. Confira também o estado atual do Git e eventuais
instruções locais antes de editar.

O app é React/TypeScript com API Express+SQLite local e Pages Functions+D1
online. O nome interno Compasso ainda aparece no pacote e nos diretórios.
Execute os comandos pelo scripts/run.mjs, via npm, para manter dependências
e SQLite fora do Drive. A origem é copiada para um runtime local; mudanças
no código original exigem reinício do comando.

Local e nuvem não se sincronizam. Primeiro verifique de qual ambiente estou
falando e preserve dados existentes. Não exponha .env, bancos ou arquivos
privados de .cloudflare. Notion permanece somente leitura; não invente
datas de conclusão e preserve conflitos e exclusões locais.

Relatórios usam realizados e horas da semana anterior à selecionada, e
planejamento da semana selecionada. Títulos automáticos identificam a
semana anterior com pontos nas datas; títulos personalizados são mantidos.
Preserve revisão diária, controle de concorrência e isolamento da demo.

O documento é um retrato de 2026-11-05, baseado no commit 4cd6d17.
Confirme o código atual antes de assumir que o retrato ainda está atualizado.
A tarefa que quero executar agora é: [descrever a próxima solicitação].
```

## 17. Fontes e validação deste documento

Fontes consultadas: README; documentos em `docs/`; manifesto, configurações e `.gitignore`; scripts; tipos e regras em `shared/`; persistência, API e importador em `server/`; autenticação, worker, workspace e migrações em `cloudflare/`; interface, componentes, estilos e gerador de PDF; código dos testes; referência textual de design; histórico, branch e estado Git. Para materiais privados, o levantamento registrou nomes/presença; valores de credenciais e conteúdo dos bancos não foram incluídos.

As orientações de transferência são síntese operacional derivada dessas fontes. Nenhum fato depende de memória de conversas anteriores inacessíveis. Em caso de divergência futura, confrontar esta fotografia com o código e os dados reais, preservando o trabalho existente.

Validação desta entrega: documentação confrontada com os arquivos, comandos, caminhos e commits observados; verificação final de links locais, formato e escopo das alterações. Testes da aplicação e build **não foram executados nesta entrega exclusivamente documental**. A existência dos testes não equivale a resultado aprovado nesta data.
