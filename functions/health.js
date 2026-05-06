/**
 * Cloudflare Pages Functions - /health 代理
 */
import { handleOptions, proxyToRailway, proxyError } from "./_lib.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return handleOptions();

  try {
    return await proxyToRailway("/health", "");
  } catch (err) {
    return proxyError(err);
  }
}
