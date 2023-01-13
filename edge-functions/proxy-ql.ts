import { Context } from "https://edge.netlify.com/";
import { collectData } from "./collection/collect.ts";
import {
  PersistedQueriesReverse,
  PersistedQuery,
} from "./types/persisted-query.ts";
import { GraphQLResponse } from "./types/response-types.ts";
import { makeDataCollectionOptions } from "./collection/options.ts";

class KnownError extends Error {
  constructor(underlying, public status = 400) {
    super(underlying);
  }
}

async function withCommonHeaders(f:() => Promise<Response>) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, HEAD, POST",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  const res = await f();
  for (const [name, value] of Object.entries(headers)) {
    res.headers.append(name, value);
  }
  return res;
}

export default async function (request: Request, _context: Context) {
  return await withCommonHeaders(async() => {
    if (["HEAD", "OPTIONS"].includes(request.method)) {
      return await onRequestOptions(request);
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
      });
    }
    const isDev = Deno.env.get("NETLIFY_DEV") === "true";
    return await onRequestPost(request, isDev);
  });
}

async function onRequestOptions(request: Request) {
  return new Response(null, {
    status: 204, // No Content
    headers: {
      Allow: "OPTIONS, HEAD, POST",
    },
  });
}

async function onRequestPost(request: Request, isDev = false) {
  try {
    const query = await request.json().catch((error) => {
      throw asErrRes("Failed to parse request body");
    });
    if (!Reflect.has(query, "persistedQuery")) {
      return asErrRes(
        "Invalid query: must be in the form of { persistedQuery: ..., variables: ...}",
      );
    }
    if (!PersistedQueriesReverse[query.persistedQuery]) {
      console.warn("Specified query hash is unknown", query.persistedQuery);
    }

    const bulletToken = getBulletToken(request);
    if (!bulletToken) {
      return asErrRes("`Authorization' header is missing or invalid");
    }

    const dataCollectionOptions = makeDataCollectionOptions(request);

    const data = await fetchQL(query, bulletToken, isDev);
    if (dataCollectionOptions.allow) {
      try {
        await collectData(query, data, dataCollectionOptions, isDev);
      } catch (error) {
        if (isDev) {
          console.error(error);
        } else {
          console.error("Failed to collect data", "" + error);
        }
      }
    }

    return Response.json(data);
  } catch (error) {
    if (error instanceof KnownError) {
      return asErrRes("" + error, error.status);
    }
    if (isDev) {
      console.error(error);
    }
    return asErrRes("Something wrong");
  }
}

function asErrRes(message: string, status = 400) {
  return Response.json(
    {
      success: false,
      error: [message],
    },
    {
      status,
    },
  );
}

function getBulletToken(request: Request) {
  const bearer = request.headers.get("Authorization");
  if (!bearer || !bearer.startsWith("Bearer ")) {
    return null;
  }
  return bearer.substring("Bearer ".length);
}

const SPLANET_API_ENDPOINT =
  "https://api.lp1.av5ja.srv.nintendo.net/api/graphql";

const LANG = "ja-JP";
const IKSM_WEBVIEW_VERSION = "2.0.0-bd36a652";

function makeBulletHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Accept-Language": LANG, // TODO:
    "X-Web-View-Ver": IKSM_WEBVIEW_VERSION,
    "Content-Type": "application/json",
    "X-Requested-With": "com.nintendo.znca",
  };
}

async function fetchQL(
  query: PersistedQuery,
  token: string,
  isDev = false,
): Promise<GraphQLResponse<unknown>> {
  const headers = makeBulletHeaders(token);

  const persistedQueryHash = query.persistedQuery;
  const variables = query.variables;

  const body = {
    variables,
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: persistedQueryHash,
      },
    },
  };

  const res = await fetch(SPLANET_API_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    throw new KnownError(
      "Bullet token is invalid, maybe expired or network error.",
      401,
    );
  }
  if (res.status !== 200) {
    if (isDev) {
      console.error(res.statusText);
    }
    throw new KnownError("Something wrong in proxying response.", res.status);
  }

  const data: { errors?: { message: string }[] } = await res.json();

  if (Array.isArray(data.errors) && data.errors.length && isDev) {
    throw new KnownError(data.errors[0].message, 400);
  }

  return data as ResT;
}
