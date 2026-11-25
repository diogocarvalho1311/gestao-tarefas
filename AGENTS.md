# Gestao de tarefas

## Cloudflare

- Conta pessoal: `carvalhodiogo746@gmail.com`, perfil `pessoal`.
- Antes de comandos remotos, confira `npx cf auth whoami --profile pessoal`.
- Use `--profile pessoal` em comandos de recursos do CLI cf.
- Para build e deploy, preserve Pages e Wrangler. Use os comandos npm do
  projeto: eles verificam a identidade no cf e passam a credencial atual
  ao processo Wrangler, sem gravar outra sessão nem trocar os perfis.
- `cloudflare/account.json` define conta, perfil e e-mail esperados.
  `wrangler.jsonc` define o projeto Pages e o banco D1 pessoal.
- Nunca publique `.env`, `.cloudflare`, bancos ou backups. A demonstração
  pública em `/visualizacao` usa somente dados fictícios.
- Preserve a senha e os dados de produção. Não faça testes destrutivos
  no banco remoto. A cópia de execução local fica fora do Drive.
