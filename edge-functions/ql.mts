import type {Config} from "@netlify/functions";
import {queries} from "../src/constants.mts"

const DEV = Deno.env.get("NETLIFY_LOCAL") === "true";

console.log(queries)

export const config: Config = {
  method: "POST",
  path: "/v2/ql",
};

type RequestBody = {
  query?: string,
  variables?: object,

  bulletToken?: {
    bullet: string,
    language: string,
    version: string,
    country: string,
    expiresAt?: number,
  },
};


export default async (req: Request) => {
  try {
    return await handleRequest(req);
  } catch (err) {
    errorLogIfDev(err);
    return createErrorResponse('' + err);
  }
}

function createErrorResponse(reason: string, options = {status: 400}) {
  const body = {reason};
  return Response.json(body, {status: options?.status ?? 400});
}

function errorLogIfDev(err: any) {
  if (DEV) {
    console.error(err);
  }
}


const USERAGENT = "Mozilla/5.0 (Linux; Android 8.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/58.0.3029.125 Mobile Safari/537.36";

async function handleRequest(req: Request) {
  const body: RequestBody = await req.json();
  const {query, variables, bulletToken} = body;
  if (!query) {
    return createErrorResponse("query is missing");
  }
  if (!variables ?? typeof variables !== "object") {
    return createErrorResponse("variables must be type of object")
  }
  if (!bulletToken) {
    return createErrorResponse("bullet is missing");
  }
  const headers = {
    "authorization": `Bearer ${bulletToken.bullet}`,
    "X-Web-View-Ver": bulletToken.version,
    "Accept-Language": bulletToken.language,
  };

  return await fetchQL(query, variables ?? {}, headers);
}


async function fetchQL(query: string, variables = {}, headers = {}) {
  const body = {
    variables,
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: query,
      },
    },
  };

  const url = "https://api.lp1.av5ja.srv.nintendo.net/api/graphql";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      'User-Agent': USERAGENT,
      'Accept': '*/*',
      'Referrer': 'https://api.lp1.av5ja.srv.nintendo.net/',
      'X-Requested-With': 'XMLHttpRequest',
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    return createErrorResponse("bullet token has expired", {status: 401})
  }
  if (!res.ok) {
    return createErrorResponse((await res.text()) || res.statusText, {status: res.status})
  }
  return Response.json(await res.json(), {
    headers: {
      "X-BULLETTOKEN-REMAINING": res.headers.get("x-bullettoken-remaining") ?? ""
    },
  })
}
