import { parseMediaType } from "https://deno.land/std/media_types/mod.ts";
import type { Context } from "npm:@netlify/edge-functions";


export default async function (request: Request, _context: Context) {
  return await withResponseCommonHeaders(async () => {
    if (["HEAD", "OPTIONS"].includes(request.method)) {
      return await onRequestOptions(request);
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
      });
    }
    try {
      return await onRequestPost(request);
    } catch (error) {
      return asErrRes("" + error);
    }
  });
}


function asErrRes(message: string, status = 400) {
  return Response.json(
    {
      errors: [{message}],
    },
    {
      status,
    },
  );
}

async function withResponseCommonHeaders(f: () => Promise<Response>) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, HEAD, POST",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  const res = await f();
  for (const [name, value] of Object.entries(headers)) {
    res.headers.append(name, value);
  }
  return res;
}

async function onRequestOptions(request: Request) {
  return new Response(null, {
    status: 204, // No Content
    headers: {
      Allow: "OPTIONS, HEAD, POST",
    },
  });
}

async function onRequestPost(request: Request): Promise<Response> {
  if (!request.headers.has("Authorization")) {
    return asErrRes("Authorization header is missing", /*status=*/401);
  }
  const additionalHeaders = {
    authorization: request.headers.get("Authorization"),
  };

  const body = await request.json();
  return await fetchQL(body, additionalHeaders);
}

const SPLANET_API_ENDPOINT =
  "https://api.lp1.av5ja.srv.nintendo.net/api/graphql";

const LANG = "ja-JP";
const IKSM_WEBVIEW_VERSION = "4.0.0-091d4283";
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 8.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/58.0.3029.125 Mobile Safari/537.36';

function makeRequestHeaders(additionalHeaders: object) {
  return Object.assign({
    'User-Agent': USER_AGENT,
    'Accept': '*/*',
    'Referrer': 'https://api.lp1.av5ja.srv.nintendo.net/',
    'X-Requested-With': 'XMLHttpRequest',
    'content-type': 'application/json',
    "X-Web-View-Ver": IKSM_WEBVIEW_VERSION,
    "Accept-Language": LANG, // TODO:
  }, additionalHeaders);
}

async function fetchQL(
  body: object,
  additionalHeaders: object,
) {
  const headers = makeRequestHeaders(additionalHeaders);

  const res = await fetch(SPLANET_API_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok || !isJsonContentType(res.headers.get("Content-Type") || '')) {
    return asErrRes(await res.text() || res.statusText, res.status);
  }

  return Response.json(await res.json(), { status: res.status });
}


function isJsonContentType(contentType: string) {
  const [type, _] = parseMediaType(contentType);
  return type === "application/json";
}
