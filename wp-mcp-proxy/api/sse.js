// api/sse.js
import fetch from "node-fetch";

/**
 * Prosty proxy dla MCP (HTTP + SSE) -> WordPress MCP
 * Adres Vercel:   https://TWÓJ-PROJEKT.vercel.app/api/sse
 * Adres WordPress: process.env.WP_MCP_URL
 */

export default async function handler(req, res) {
  const targetUrl = process.env.WP_MCP_URL; // np. https://bonasavine.pl/wp-json/wp/v2/wpmcp/streamable
  const token = process.env.WP_MCP_TOKEN;

  if (!targetUrl || !token) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("WP_MCP_URL / WP_MCP_TOKEN nie są ustawione");
    return;
  }

  // Budujemy nagłówki do WordPressa
  const headers = { ...req.headers };

  // Nadpisujemy host na host WordPressa
  const targetHost = new URL(targetUrl).host;
  headers.host = targetHost;

  // Wymuszamy autoryzację do WordPressa
  headers.authorization = `Bearer ${token}`;

  // Niektóre nagłówki mogą przeszkadzać
  delete headers["content-length"];
  delete headers["transfer-encoding"];

  // Tworzymy body (dla GET brak)
  const body =
    req.method === "GET" || req.method === "HEAD" ? undefined : req;

  // Robimy fetch do WordPress MCP
  const wpRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  // Przekazujemy status i nagłówki
  res.statusCode = wpRes.status;
  wpRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });

  // Streamujemy odpowiedź (ważne dla SSE)
  if (wpRes.body) {
    wpRes.body.pipe(res);
  } else {
    res.end();
  }
}

// small change to trigger redeploy
