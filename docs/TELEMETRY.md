# CineHUB Telemetry — implantação de teste

## O que foi preparado
- Supabase migration para uma tabela privada de eventos.
- Edge Function `cinehub-telemetry` que valida e grava eventos usando a chave de serviço apenas no servidor.
- Cliente de telemetria de teste em Web e TV.
- O cliente só envia eventos quando a URL contém `?telemetry=1`; portanto, o código em branch não ativa coleta normal.

## Projeto alvo
Os clientes Web/TV atuais apontam para o projeto Supabase `qdheeiitzlvynshvkwcs` para o catálogo. Antes de publicar, confirmar no dashboard Supabase que este é o projeto correto para telemetria compartilhada.

## Arquivos de backend
- `supabase/migrations/202610280001_cinehub_telemetry.sql`: tabela e RLS.
- `supabase/functions/cinehub-telemetry/index.ts`: endpoint de ingestão.
- `supabase/config.toml`: configuração da função.

## Arquivos cliente
- Web: `src/js/telemetry.js`, carregado antes do app principal.
- TV: `android/CineHUB-TV/src/main/assets/cinehub/js/telemetry.js`, carregado antes do app principal.
- Mobile abre o CineHUB Web com `?mobile=1`; por isso compartilha o cliente Web e é identificado pelo user-agent nativo. A versão aparece como `unknown` até o WebView expor uma versão verificável.

## Publicação necessária
1. Confirmar o projeto alvo no Supabase.
2. Aplicar a migration no SQL Editor.
3. Fazer deploy da função `cinehub-telemetry`.
4. Configurar secret `SUPABASE_PUBLISHABLE_KEY` com a publishable key atual. A função também usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do ambiente Supabase; nunca colocar a service-role key no GitHub ou nos apps.
5. Testar via URL com `?telemetry=1`, verificar linhas na tabela e depois desativar a flag de teste.

## Contrato e privacidade
Eventos aceitos: `app_open`, `session_start`, `heartbeat`, `session_end`, `app_error`, `playback_start`, `playback_error`, `playback_success`. O cliente não envia título assistido, URL de stream, nome, e-mail ou localização. A função reduz propriedades a uma allowlist e faz hash dos IDs no servidor.

## Limitações antes de produção
- A publishable key é pública e extraível; não é autenticação forte. A função precisa de rate limiting/antiabuso antes de produção.
- CORS está aberto para permitir apps em múltiplas origens.
- Configurar retenção/exclusão periódica e publicar aviso de privacidade antes de ativar coleta geral.
- O painel ainda precisa de endpoint de métricas agregadas com autenticação de administrador; não consultar a tabela diretamente do browser.
- Playback events são suportados pelo contrato, mas os callbacks do player ainda não foram ligados nesta etapa.
