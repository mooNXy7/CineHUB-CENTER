# Telemetria CineHUB — proposta de integração

## Objetivo

Contabilizar instalações/dispositivos identificados, aberturas do app, sessões e usuários ativos por período, sem fingir que o GitHub consegue observar o uso dos aplicativos.

## Estado atual

A telemetria **não está implementada**. Não há endpoint conectado aos aplicativos CineHUB TV ou Mobile, nem banco de dados de eventos. O dashboard deve exibir ausência de dados como "não conectado", nunca como zero usuários.

## Eventos mínimos propostos

- `app_open`: abertura do aplicativo.
- `session_start`: início de uma sessão.
- `heartbeat`: sinal periódico opcional para estimar atividade em janela curta.
- `session_end`: encerramento, quando o app consegue detectá-lo.
- `app_error`: falha não fatal ou crash report, após desenho separado de privacidade.

Cada evento deve conter apenas: nome do evento permitido, versão do app, plataforma (TV/Mobile), timestamp do servidor e um identificador aleatório de instalação rotacionável. Não coletar nome, e-mail, endereço, localização precisa, lista de reprodução, histórico de visualização ou URLs de streams.

## Métricas e definições

- **Aberturas:** contagem de eventos `app_open` recebidos e validados.
- **Dispositivos identificados:** IDs pseudônimos únicos observados no período selecionado; não equivalem a pessoas.
- **Sessões:** sessões iniciadas com deduplicação e regras documentadas para timeout.
- **Ativos agora:** instalações com heartbeat/sessão válida dentro de uma janela configurada (por exemplo, 5 minutos); deixar claro que é uma estimativa.
- **Ativos diários/mensais:** IDs pseudônimos distintos com ao menos um evento elegível no período.

## Segurança e privacidade obrigatórias antes de ligar

1. Publicar aviso de privacidade claro e definir base legal, finalidade, retenção e canal de contato apropriados.
2. Criar endpoint server-side autenticado por app/ambiente, com validação estrita, rate limiting e limites de payload.
3. Não embutir segredos de servidor no APK nem no JavaScript público. Chaves compartilhadas dentro de APK podem ser extraídas; usar proteção contra abuso e credenciais rotacionáveis, não confiar em um segredo fixo no cliente.
4. Evitar identificadores persistentes desnecessários; permitir rotação e exclusão conforme política.
5. Armazenar eventos em banco com acesso restrito, criptografia e retenção limitada; expor ao painel apenas agregados.
6. Proteger o painel administrativo com autenticação e autorização no servidor.
7. Testar eventos sintéticos e validar deduplicação antes de mostrar números como produção.

## Contrato de API sugerido

`POST /v1/events`

Payload de exemplo (somente contrato; ainda não existe endpoint ativo):

```json
{
  "event": "app_open",
  "platform": "tv",
  "app_version": "1.3.3",
  "installation_id": "random-pseudonymous-id",
  "occurred_at": "2026-10-28T12:00:00Z"
}
```

O servidor deve validar e registrar o timestamp de recebimento próprio. O campo de exemplo não representa dado real de nenhum usuário.

## Próximas tarefas

- Selecionar backend e armazenamento (por exemplo, Worker + D1, se confirmado no ambiente).
- Criar endpoint e testes automatizados.
- Implementar dashboard administrativo protegido.
- Integrar Mobile e TV em mudanças separadas e testáveis.
- Validar com eventos sintéticos antes de ativar coleta real.
