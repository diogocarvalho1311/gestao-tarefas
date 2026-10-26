# DCarvalho

Um planejador pessoal de tarefas de trabalho, orientado pelo tempo disponível. Interface escura e armazenamento em SQLite local ou Cloudflare D1 na versão online. Tarefas de clientes, projetos pessoais e faculdade dividem a mesma capacidade semanal.

## Demonstração

**[Abrir demonstração — somente leitura](https://dcarvalho-tarefas.pages.dev/visualizacao)**

- Usuário: **visitante**
- Senha: **`DCarvalho-Visita2026!`**

Explore tarefas, clientes, projetos pessoais, faculdade, calendários e relatórios com **dados fictícios**. Busca, filtros, ordenação e exportação de relatórios estão disponíveis. O visitante não pode criar, editar ou excluir dados; essa restrição também é aplicada na API. A demonstração é independente do planejamento pessoal e não consulta o Notion.

## Acesso online

**https://dcarvalho-tarefas.pages.dev**

A versão online funciona com o computador desligado. O primeiro acesso usa um link privado de ativação para criar a senha; a senha nunca é incluída no código. Depois, basta abrir o endereço e entrar. O acesso pessoal é separado do visitante, sem cadastro público. Use **Sair da conta** ao terminar em um dispositivo compartilhado.

Os dados ficam em um banco D1 separado dos outros projetos da conta Cloudflare. A cópia local é preservada. **Local e nuvem são espaços independentes após a migração**; use o endereço online como principal para manter as edições em um só lugar. A leitura opcional do Notion continua sem criar, editar ou excluir informações remotas.

Em **Configurações → Baixar backup**, baixe um JSON das tarefas, planejamento, registros, relatórios e lixeira da versão que estiver aberta. O repositório GitHub guarda apenas código. Credenciais, bancos, exportações e links de ativação são ignorados pelo Git.

Instruções de manutenção, migração e recuperação de acesso: [docs/cloudflare.md](docs/cloudflare.md).

## Iniciar

Requer Node.js **22.19 ou superior** e npm. Na pasta do projeto:

```powershell
npm run dev
```

No primeiro uso, o comando instala as dependências automaticamente. Abra **http://localhost:3000**. Frontend e backend iniciam juntos; não é necessário executar dois servidores. Para encerrar, pressione `Ctrl+C` no terminal.

O projeto está em um drive sincronizado. Para evitar erros de instalação e problemas de bloqueio do SQLite, o inicializador mantém as dependências e os dados no disco local do Windows, dentro de `%LOCALAPPDATA%\Compasso`. O código continua na pasta original. Não é necessário rodar `npm install` nessa pasta. Cada cópia do projeto usa uma pasta identificada pelo caminho absoluto; renomear ou mover o projeto gera um novo espaço local. Para manter os dados ao mover, use o mesmo `DATABASE_PATH` absoluto no `.env`.

O inicializador copia o código para a pasta local ao executar cada comando. Ao editar os arquivos originais durante o desenvolvimento, reinicie `npm run dev` para atualizar a cópia em execução.

Para uso com os arquivos compilados:

```powershell
npm run build
npm start
```

## Uso diário

1. Crie tarefas em **Nova tarefa**. Selecione **Um cliente**, **Meu projeto**, **Minha tarefa** ou **Faculdade**. Projetos têm um nome; tarefas pessoais avulsas não precisam dele. Defina prioridade, prazo e estimativa em **minutos ou horas**, com atalhos de **15 min**, **30 min** e **1 hora**. Os status são A fazer, Em andamento e Concluída.
2. No **Planejamento semanal**, edite as horas disponíveis de cada dia. O valor é salvo ao sair do campo. A capacidade inicial é de 6h por dia útil e 0h no fim de semana.
3. Clique em **Planejar tarefa** para reservar tempo. Pesquise pelo nome e filtre por cliente/projeto e período do prazo; **Filtros** também oferece área e prioridade. Escolha o dia e a duração em minutos ou horas. Uma tarefa pode ter vários blocos. Clique no bloco para alterar sua duração, mover ou remover.
4. Confira os excessos por dia e na semana. Um prazo não reserva horas sozinho; somente os blocos consomem capacidade. É possível planejar acima da capacidade com aviso explícito.
5. Nos detalhes da tarefa, registre o tempo efetivamente trabalhado em minutos ou horas e a data. Conclua usando a caixa de seleção. Tempo restante = estimado − realizado, com mínimo de zero. A conclusão preserva blocos e registros.
6. Use **Meus projetos** para trabalhos vinculados a uma iniciativa e **Minhas tarefas** para pendências pessoais avulsas. Ao editar uma tarefa pessoal importada, pode escolher entre esses dois tipos sem alterar o Notion. A visão geral sempre mostra o uso completo da sua semana, incluindo clientes, projetos pessoais e faculdade.
7. Em **Relatórios**, selecione a semana e o cliente ou projeto. O texto usa a data de conclusão para entregas realizadas e blocos/prazos da semana seguinte para o próximo plano. Edite, salve o rascunho, copie ou exporte em PDF. Salve o rascunho antes de trocar de tela ou semana.
8. No **Calendário da faculdade**, navegue pelos meses e veja somente os prazos e blocos de estudo das tarefas acadêmicas. Pesquise e filtre por status ou disciplina. O botão **+** de cada dia permite reservar estudo; tarefas sem prazo nem bloco aparecem abaixo do calendário.

Exclusões e saídas com alterações não salvas usam pop-ups do próprio sistema. O status antigo Bloqueada passa a A fazer nos dados locais. A conexão com o Notion permanece somente leitura.

O app começa vazio. **Explorar exemplos** carrega tarefas fictícias claramente sinalizadas. **Limpar exemplos** remove somente esses exemplos e seus blocos/registros. A navegação entre semanas mantém o histórico. O botão de lixeira remove a tarefa deste aplicativo, inclusive quando importada do Notion. A remoção é local: a tarefa e seu histórico ficam arquivados no SQLite, e o botão **Desfazer** restaura tudo. Uma tarefa removida não reaparece nas consultas seguintes do Notion. O backup JSON também inclui a lixeira local.

## Notion — configurado para leitura

A credencial do seu `.env` foi validada e a fonte correta de tarefas foi identificada. Foram importadas **196 tarefas** sem duplicação: 144 de clientes, 20 pessoais/internas e 32 de Faculdade. Essa classificação respeita a propriedade Área e separa trabalhos sem cliente como projetos pessoais.

Para configurar outra instalação, basta copiar `.env.example` para `.env` e preencher:

```dotenv
NOTION_TOKEN=sua_credencial
NOTION_DATA_SOURCE_ID=38e9cd3e-bf24-815f-b168-000b1c06c60c
```

**Os outros campos são opcionais.** O app detecta os nomes e tipos das propriedades: Nome, Cliente, Data, Status e Área. `NOTION_DATA_SOURCE_ID` é o identificador da fonte de tarefas, não a credencial. Também aceita o ID de uma base com uma única fonte. Se ficar vazio, tenta localizar uma única base chamada Tarefas. `PORT` só muda a porta do app; `DATABASE_PATH` só muda o local do SQLite. Não é necessário preencher nomes de propriedades.

Após editar o `.env`, reinicie `npm run dev`. Use **Ler Notion** ou **Configurações & Notion → Validar e importar tarefas**. A consulta também acontece a cada cinco minutos enquanto a aba estiver visível. O token permanece no backend e não é enviado ao navegador.

O importador percorre todas as páginas da fonte e usa o ID da página para evitar duplicações. Status `Concluído` é exibido como `Concluída`. A área `Faculdade` aparece em seção própria; `Pessoal` fica em Meus projetos. Tarefas concluídas também são importadas. Registros arquivados ou na lixeira não são recuperados.

A base atual **não possui horas estimadas nem prioridade**: tarefas novas ficam **A estimar** e com prioridade Média, que pode ser ajustada localmente. Não são criados blocos automaticamente. O campo `Data` é exibido como prazo/data de referência; nunca é usado para inventar uma data de conclusão. Nos relatórios, tarefas antigas concluídas podem ser sugeridas pela Data de referência do Notion, sempre sinalizadas para revisão; isso não cria uma data de conclusão.

A conexão continua **somente leitura**: não há chamadas de criação, edição, arquivamento ou exclusão no Notion. As alterações locais em título, cliente, data e status são sinalizadas e preservadas quando houver conflito. Estimativas, prioridades ausentes da fonte, disciplina/projeto local, observações e planejamento permanecem no SQLite. Nenhuma propriedade nova foi criada.

A fonte de **Relatórios Semanais** também foi identificada, mas não há publicação automática: nesta entrega a exportação gera um PDF local. Detalhes em [docs/notion-mapping.md](docs/notion-mapping.md). API: [fontes de dados do Notion](https://developers.notion.com/reference/retrieve-a-data-source), versão `2025-09-03`.

## Tabelas e clientes

Ao abrir uma lista, a coluna **Status** vem primeiro e a ordem inicial é **A fazer → Em andamento → Concluída**. Clique no título de uma coluna para ordenar; clique novamente para inverter. Textos usam A–Z/Z–A, horas usam valores numéricos, datas seguem a ordem cronológica e prioridades seguem Baixa → Média → Alta. Datas e estimativas ausentes ficam no final. A mesma tabela é utilizada em todas as categorias de tarefas.

Os pontos têm cores fixas: **CWB Kids rosa**, **Lucri verde**, **Minhas tarefas amarelo** e **Meus projetos roxo**. As cores de prioridade continuam independentes dessas cores.

Os atalhos **Lucri** e **CWB Kids** no menu abrem as tarefas de cada cliente com busca, filtros e ordenação. Ao criar uma tarefa nessa seção, o cliente já vem preenchido. Os números no menu indicam tarefas pendentes.

## Relatórios com tarefas vinculadas

As seções de realizados e próximo planejamento começam por listas de tarefas selecionadas automaticamente. É possível marcar/desmarcar, pesquisar e adicionar outras tarefas concluídas ou pendentes do cliente/projeto escolhido. O botão **Puxar tarefas automaticamente** atualiza as seleções sem apagar os complementos livres nem os comentários.

Realizados: tarefas concluídas com data de conclusão no período. Para tarefas antigas importadas que não têm essa data, a Data do Notion é usada **somente como referência de seleção**, com aviso para revisão. Nenhuma data de conclusão é criada ou alterada. Próximo planejamento: tarefas pendentes com bloco ou prazo na semana seguinte.

Cada seção possui um **Complemento livre** secundário. Ao copiar, salvar ou exportar, o app junta os nomes das tarefas e esse texto livre. Os rascunhos antigos são preservados como complementos livres. Marcar “Enviado” continua sendo apenas um registro manual.

O resumo mostra entregas selecionadas, horas realmente registradas na semana, horas registradas nas entregas selecionadas e blocos planejados para a próxima semana. Não usa horas de outras semanas nem estimativas como horas realizadas.

## Exportação dos relatórios

A opção **Exportar PDF** aparece somente em **Relatórios**. O PDF usa fundo cinza escuro como a interface, metadados, quatro indicadores e as três seções de conteúdo. CWB Kids usa detalhes rosa, Lucri verde e outros clientes/projetos laranja. Todas as páginas são escuras, com quebra automática e numeração no rodapé.

O PDF considera as seleções e os complementos atuais, mesmo antes de salvar o rascunho. Nada é publicado no Notion. A tipografia da interface usa Geist empacotada localmente; `src/theme.css` concentra a aparência.

## Dados e backup

O terminal informa o diretório exato dos dados ao iniciar: `%LOCALAPPDATA%\Compasso\data-<identificador>\compasso.sqlite`. Também pode definir um `DATABASE_PATH` absoluto no `.env`. Evite colocar um SQLite aberto em drive sincronizado.

- Em **Configurações → Baixar backup**, exporte todos os dados para JSON, incluindo tarefas, planejamento, disponibilidades, horas e relatórios.
- Para um backup que possa ser restaurado diretamente, **encerre o aplicativo** e copie a pasta `data-<identificador>` inteira. Para restaurar, com o app parado, substitua essa pasta pelo backup ou aponte `DATABASE_PATH` para a cópia do SQLite. Não copie o banco em uso sem seus arquivos `-wal`/`-shm`.
- A importação de backup JSON pela interface não está incluída. Guarde o backup SQLite para restauração direta.
- `.env` contém credenciais e não entra no backup JSON. Não o publique.

O servidor local aceita apenas conexões locais. Duas abas abertas não sobrescrevem alterações silenciosamente: uma revisão antiga é recusada e os dados são atualizados para uma nova tentativa. A persistência local usa transações SQLite e gravação síncrona completa; a versão online grava o documento e a revisão em uma única atualização condicional no D1.

## Verificações

```powershell
npm test
npm run build
npm run test:smoke
```

Os testes verificam cálculos de capacidade e divisão em dias, datas, relatórios por cliente/projeto/faculdade, ordenação, exclusão reversível, PDF com várias páginas, importação sem duplicação/conflitos, validação e um fluxo HTTP completo com reinício usando um banco temporário. Não acessam nem modificam o Notion real.

## Organização

```text
src/            Interface React + TypeScript, estilos Tailwind/CSS e ícones Lucide
shared/         Tipos e regras de planejamento compartilhadas
server/         API Express, validação, SQLite e leitura do Notion
cloudflare/     API online, autenticação e migrações do D1
scripts/        Inicializador local, instalação e compilação
tests/          Verificações de domínio, integração e persistência
docs/           Mapeamento observado do Notion
```

O SQLite local utiliza o módulo integrado `node:sqlite`; no Node 22 pode aparecer um aviso de recurso experimental. O uso local não exige instalar banco nem configurar autenticação. A versão online utiliza Workers e D1 e exige conexão com a conta Cloudflare para manutenção.
