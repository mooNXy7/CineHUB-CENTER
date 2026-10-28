-- CineHUB telemetry: private event storage. Apply in the existing Supabase project.
create table if not exists public.cinehub_telemetry_events (
  event_id uuid primary key,
  event_name text not null check (event_name in (
    'app_open','session_start','heartbeat','session_end',
    'app_error','playback_start','playback_error','playback_success'
  )),
  app_id text not null check (app_id in ('cinehub-web','cinehub-mobile','cinehub-tv')),
  platform text not null check (platform in ('web','android_mobile','android_tv')),
  app_version text not null default 'unknown',
  installation_hash text not null,
  session_hash text,
  properties jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create index if not exists cinehub_telemetry_received_at_idx
  on public.cinehub_telemetry_events (received_at desc);
create index if not exists cinehub_telemetry_app_received_idx
  on public.cinehub_telemetry_events (app_id, received_at desc);
create index if not exists cinehub_telemetry_event_received_idx
  on public.cinehub_telemetry_events (event_name, received_at desc);
create index if not exists cinehub_telemetry_installation_received_idx
  on public.cinehub_telemetry_events (installation_hash, received_at desc);

alter table public.cinehub_telemetry_events enable row level security;
revoke all on public.cinehub_telemetry_events from anon, authenticated;
grant all on public.cinehub_telemetry_events to service_role;

-- Do not grant direct client SELECT/INSERT. Only the Edge Function writes events.
