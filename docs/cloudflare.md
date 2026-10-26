# Cloudflare — DCarvalho

O frontend React é servido pelo Cloudflare Pages. `cloudflare/worker.ts` é compilado para `dist/_worker.js` no modo avançado de Pages Functions e atende `/api/*`, usando D1 para estado, histórico e autenticação. `wrangler.jsonc` identifica o projeto Pages e o banco exclusivo; `cloudflare/account.json` identifica a conta de administração. Outros projetos não são alterados.

## Acesso e dados

- URL: https://dcarvalho-tarefas.pages.dev
- O acesso aos dados requer sessão válida. A criação de senha exige um token aleatório de primeiro acesso; não há cadastro público.
- O token é enviado no fragmento do link, removido da barra de endereço pelo aplicativo e validado contra um hash armazenado como segredo do Pages. O link vale por três dias e deixa de funcionar após a criação da senha.
- Senhas usam PBKDF2 SHA-256 com salt individual e 100.000 iterações. Sessões aleatórias são armazenadas apenas como hash no banco, expiram em 14 dias e usam cookie `HttpOnly`, `Secure` e `SameSite=Strict`.
- Tentativas de autenticação são limitadas por IP. Escritas recusam origens externas e revisões desatualizadas. Não há CORS público para os dados.
- A migração preserva tarefas, blocos, registros de tempo, relatórios, disponibilidade, lixeira e referências de importação do Notion. Depois da cópia inicial, os bancos local e online não se sincronizam.
- O banco é persistente e não é recriado nos deploys. Migrações aplicadas não devem ser editadas; novas mudanças de esquema exigem novos arquivos SQL.
- O Cloudflare Access não estava habilitado nesta conta na configuração inicial; a aplicação usa seu próprio login. Habilitar Access futuramente é opcional.

## Atualizar a versão online

Requer Node.js 22.19 ou superior e uma conta autenticada no Wrangler com acesso ao Pages e D1. O inicializador mantém dependências e ambiente de execução fora do drive sincronizado.

```powershell
npm test
npm run cloudflare:migrate
npm run cloudflare:deploy
```

Os comandos devem rodar em sequência, pois compartilham a cópia de execução local. O deploy compila TypeScript/frontend e gera o módulo de Pages Functions antes de publicar. Não executa importação nem substitui dados existentes. O GitHub contém o código, sem deploy automático a cada push.

O endereço anterior em Workers redireciona para Pages. A configuração desse redirecionamento fica em `cloudflare/redirect.wrangler.jsonc`. A mudança usa o mesmo banco e preserva os dados e a senha; é necessário entrar novamente no novo domínio.

Para checar contagens e o estado da ativação sem exibir registros:

```powershell
npm run cloudflare:status
```

## Primeira migração e segredos

`npm run cloudflare:import` faz uma leitura consistente do SQLite local e salva uma cópia privada em `.cloudflare/`. A importação é aceita apenas se o banco online estiver vazio e com revisão zero. Isso impede que uma nova execução sobrescreva alterações feitas online. O conteúdo é conferido por hash após a gravação. Para outra instalação, ajuste a conta em `cloudflare/account.json` e o banco em `wrangler.jsonc` antes de provisionar e aplicar migrações.

`npm run cloudflare:secrets` configura os valores `NOTION_*` do `.env` como segredos do ambiente de produção do Pages. Enquanto a senha não foi criada, também gera o segredo de ativação e guarda o token apenas em `.cloudflare/deployment.json`, ignorado pelo Git. Não expõe esses valores no terminal. A credencial do Notion permanece no backend.

Para gerar o atalho privado de primeiro acesso ou renovar um link expirado antes de criar a senha:

```powershell
npm run cloudflare:secrets
node scripts/run.mjs cloudflare-activation
```

Abra `.cloudflare/Primeiro acesso.url` no seu computador. Esse arquivo contém uma credencial temporária; não o envie ao GitHub nem a terceiros. Os testes locais usam outro token e outro banco, sem alterar a senha de produção.

Se esquecer a senha, a recuperação exige administrar o banco D1 pela conta Cloudflare. Preserve um backup, remova as sessões e a linha da tabela `owner`, e execute os comandos de ativação acima. Não altere a tabela `workspace`. Isso revoga o acesso antigo e permite criar uma nova senha pelo link privado.

## Backups

O botão **Baixar backup** exige login e inclui a lixeira local do app. Para recuperação integral da hospedagem, use também a exportação do banco D1 ou o Time Travel disponível na conta Cloudflare; estes incluem os metadados de autenticação. A importação de JSON pela interface ainda não está disponível. Os arquivos privados em `.cloudflare/` não são sincronizados pelo Git.

## Desenvolvimento e verificação

`npm run cloudflare:dev` usa o runtime Workers em `http://localhost:3199` com um D1 local independente. Aplique antes as migrações com Wrangler em modo `--local` e configure `.dev.vars` para o primeiro acesso local. Nunca use `--remote` em testes.

Os testes de `tests/cloudflare.test.ts` verificam autenticação, ativação única, expiração e revogação de sessão, limites de tentativas, rejeição de origens externas, minutos, persistência, exclusão reversível e gravações concorrentes. O fluxo também é validado no runtime Workers com navegador.

Referências: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [D1](https://developers.cloudflare.com/d1/), [Wrangler](https://developers.cloudflare.com/workers/wrangler/).
