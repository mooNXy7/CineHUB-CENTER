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


-- Aggregated metrics for a future authenticated admin endpoint.
create or replace function public.cinehub_telemetry_summary(since_time timestamptz)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'since', since_time,
    'generated_at', now(),
    'events', count(*),
    'opens', count(*) filter (where event_name = 'app_open'),
    'sessions', count(*) filter (where event_name = 'session_start'),
    'errors', count(*) filter (where event_name = 'app_error'),
    'playback_starts', count(*) filter (where event_name = 'playback_start'),
    'playback_errors', count(*) filter (where event_name = 'playback_error'),
    'playback_successes', count(*) filter (where event_name = 'playback_success'),
    'unique_installations', count(distinct installation_hash),
    'by_app', coalesce((
      select jsonb_agg(jsonb_build_object('app_id', app_id, 'events', n))
      from (
        select app_id, count(*) as n
        from public.cinehub_telemetry_events
        where received_at >= since_time
        group by app_id
        order by app_id
      ) a
    ), '[]'::jsonb),
    'by_version', coalesce((
      select jsonb_agg(jsonb_build_object('app_id', app_id, 'app_version', app_version, 'events', n))
      from (
        select app_id, app_version, count(*) as n
        from public.cinehub_telemetry_events
        where received_at >= since_time
        group by app_id, app_version
        order by app_id, app_version
        limit 50
      ) v
    ), '[]'::jsonb)
  )
  from public.cinehub_telemetry_events
  where received_at >= since_time;
$$;

revoke all on function public.cinehub_telemetry_summary(timestamptz) from public, anon, authenticated;
grant execute on function public.cinehub_telemetry_summary(timestamptz) to service_role;
