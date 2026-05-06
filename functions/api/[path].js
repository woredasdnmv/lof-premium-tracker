/**
 * Cloudflare Pages Functions - 全局API代理
 * 匹配 /api/* 和 /health 路径，转发到 Railway 后端
 */
import { handleOptions, proxyToRailway, proxyError } from "../_lib.js";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  const isApi = pathname.startsWith("/api/");
  const isHealth = pathname === "/health";
  if (!isApi && !isHealth) return context.next();

  if (context.request.method === "OPTIONS") return handleOptions();

  try {
    return await proxyToRailway(pathname, url.search);
  } catch (err) {
    return proxyError(err);
  }
}
