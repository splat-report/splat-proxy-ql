import { pushProxyed } from "./operations.ts";
import { initializeApp } from "firebase/app";
import {
  collection,
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";

const isDev = Deno.env.get("NETLIFY_DEV") === "true";
const LOCAL_GOOGLE_CLOUD_PROJECT = "proxy-ql-splat-report-local";

const GOOGLE_CLOUD_PROJECT = Deno.env.get("GOOGLE_CLOUD_PROJECT") ||
  LOCAL_GOOGLE_CLOUD_PROJECT;
if (!GOOGLE_CLOUD_PROJECT) {
  throw new Error("GOOGLE_CLOUD_PROJECT environment variable is not set");
}

const app = initializeApp({
  projectId: GOOGLE_CLOUD_PROJECT,
}, "proxy-ql");

const db = getFirestore(app);
if (isDev) {
  console.debug("Using Firestore Emulator");
  connectFirestoreEmulator(db, "localhost", 8080);
}

const qlCollectionRef = collection(db, "proxy");
const sessionCollectionRef = collection(db, "sessions");

export async function collectData(query, data, options, isDev = false) {
  await pushProxyed(qlCollectionRef, options.sessionId, query, data, {});
}
