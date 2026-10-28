import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};
const response = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "GET") return response(405, { error: "method_not_allowed" });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return response(401, { error: "authentication_required" });

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return response(401, { error: "invalid_session" });
  if (data.user.app_metadata?.role !== "admin") {
    return response(403, { error: "admin_required" });
  }

  const now = Date.now();
  const periods = [
    { key: "24h", ms: 24 * 60 * 60 * 1000 },
    { key: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
    { key: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
  ];
  const metrics: Record<string, unknown> = {};
  for (const period of periods) {
    const since = new Date(now - period.ms).toISOString();
    const { data: summary, error: summaryError } = await db.rpc("cinehub_telemetry_summary", {
      since_time: since,
    });
    if (summaryError) {
      console.error("telemetry_summary_failed", summaryError.code);
      return response(503, { error: "metrics_temporarily_unavailable" });
    }
    metrics[period.key] = summary;
  }
  return response(200, { ok: true, metrics });
});
