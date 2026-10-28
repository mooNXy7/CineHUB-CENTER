import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const allowedEvents = new Set([
  "app_open", "session_start", "heartbeat", "session_end",
  "app_error", "playback_start", "playback_error", "playback_success",
]);
const appPlatforms: Record<string, Set<string>> = {
  "cinehub-web": new Set(["web"]),
  "cinehub-mobile": new Set(["android_mobile"]),
  "cinehub-tv": new Set(["android_tv"]),
};
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const response = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

async function hash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response(405, { error: "method_not_allowed" });
  if (PUBLISHABLE_KEY && req.headers.get("apikey") !== PUBLISHABLE_KEY) {
    return response(401, { error: "invalid_client_key" });
  }
  const length = Number(req.headers.get("content-length") || "0");
  if (length > 8192) return response(413, { error: "payload_too_large" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return response(400, { error: "invalid_json" }); }
  const eventId = String(body.event_id || "");
  const eventName = String(body.event || "");
  const appId = String(body.app_id || "");
  const platform = String(body.platform || "");
  const appVersion = String(body.app_version || "unknown").slice(0, 40);
  const installationId = String(body.installation_id || "");
  const sessionId = String(body.session_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(eventId) || !allowedEvents.has(eventName) ||
      !appPlatforms[appId]?.has(platform) ||
      !/^[0-9a-f-]{36}$/i.test(installationId) ||
      (sessionId && !/^[0-9a-f-]{36}$/i.test(sessionId))) {
    return response(400, { error: "invalid_event" });
  }
  const inputProps = (body.properties && typeof body.properties === "object" && !Array.isArray(body.properties))
    ? body.properties as Record<string, unknown> : {};
  const properties: Record<string, string | number | boolean> = {};
  for (const key of ["error_code", "player", "screen", "duration_bucket"]) {
    const value = inputProps[key];
    if (["string", "number", "boolean"].includes(typeof value)) {
      properties[key] = typeof value === "string" ? value.slice(0, 80) : value as number | boolean;
    }
  }
  const row = {
    event_id: eventId,
    event_name: eventName,
    app_id: appId,
    platform,
    app_version: appVersion,
    installation_hash: await hash(installationId),
    session_hash: sessionId ? await hash(sessionId) : null,
    properties,
    // Never trust a client timestamp; received_at is assigned by Postgres.
  };
  const { error } = await db.from("cinehub_telemetry_events").insert(row);
  if (error?.code === "23505") return response(200, { ok: true, duplicate: true });
  if (error) {
    console.error("telemetry_insert_failed", error.code);
    return response(503, { error: "temporarily_unavailable" });
  }
  return response(202, { ok: true });
});
