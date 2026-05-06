/**
 * CF Pages Functions - 共享配置与工具
 */
export const RAILWAY = "https://lof-premium-tracker-production.up.railway.app";

export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function proxyToRailway(pathname, search) {
  const target = RAILWAY + pathname + search;
  const response = await fetch(target, {
    headers: {
      "User-Agent": "CF-Pages-Proxy/1.0",
      "Accept": "application/json",
    },
  });
  const ct = response.headers.get("Content-Type") || "application/json";
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": ct,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
      "X-Proxy-From": "CF-Pages-Functions",
    },
  });
}

export function proxyError(err) {
  return new Response(
    JSON.stringify({ code: 503, message: "Railway unreachable: " + err.message }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
