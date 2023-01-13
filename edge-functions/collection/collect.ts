import { makeSessionId, pushProxyed } from "./operations.ts";

export async function collectData(query, data, options, isDev = false) {
  await pushProxyed(options.sessionId, query, data, {});
}
