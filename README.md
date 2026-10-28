# CineHUB CENTER

Central de monitoramento do ecossistema CineHUB.

## Estado inicial

Esta primeira versão é uma interface estática que consulta a API pública do GitHub no navegador, sem token privilegiado. Mostra metadados reais dos repositórios configurados, commits recentes, releases publicadas, issues abertas e execuções recentes de GitHub Actions.

## Projetos monitorados

- `mooNXy7/CineHUB` — Mobile
- `mooNXy7/CineHUB-TV` — TV
- `mooNXy7/CineHUB-WEB` — Web
- `mooNXy7/CineHUB-ACERVO` — Acervo

## Publicação

Pode ser publicado como site estático no Cloudflare Pages ou GitHub Pages apontando para a raiz do repositório. O arquivo de entrada é `index.html`.

## Limitações importantes

- O painel atual é observacional: não publica OTA, não altera repositórios e não executa deploys.
- A atualização automática do navegador consulta os endpoints públicos do GitHub a cada 60 segundos. Para monitoramento confiável, webhooks e histórico persistente, configurar um serviço de backend.
- Issues e falhas de Actions ajudam a sinalizar problemas, mas não detectam automaticamente todos os bugs em produção.
- Estatísticas de dispositivos ainda não estão conectadas. Para contar aberturas, sessões e dispositivos ativos, é necessário integrar os apps com uma API de telemetria, definir política de privacidade e armazenar dados agregados de forma segura.
- A área administrativa ainda não tem autenticação. Não colocar dados privados ou ações privilegiadas em produção antes de proteger o acesso (por exemplo, Cloudflare Access) e configurar backend.
- Nunca colocar tokens de GitHub, chaves de API ou segredos no JavaScript público.

## Referências autorizadas

Os repositórios de Gabriel Saimo informados pelo responsável podem ser consultados como referências técnicas, respeitando licenças, atribuição e permissões de terceiros. A interface e identidade do CineHUB devem permanecer próprias.

## Próximas etapas recomendadas

1. Validar o layout e o monitoramento de metadados reais.
2. Configurar deploy contínuo no Cloudflare Pages.
3. Configurar monitoramento server-side via GitHub Actions/webhooks e histórico persistente.
4. Adicionar autenticação administrativa.
5. Implementar endpoint de telemetria e integrar Mobile/TV somente após desenho de privacidade e aprovação explícita.
