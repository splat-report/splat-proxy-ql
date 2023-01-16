import { Buffer } from "https://deno.land/std/io/buffer.ts";
import stringify from "https://esm.sh/json-stringify-deterministic";
import { pushProxyed } from "./operations.ts";
import { initializeApp } from "firebase/app";
import {
  collection,
  connectFirestoreEmulator,
  getFirestore,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";

const isDev = Deno.env.get("NETLIFY_DEV") === "true";
const LOCAL_GOOGLE_CLOUD_PROJECT = "proxy-ql-splat-report-local";

const GOOGLE_CLOUD_PROJECT = Deno.env.get("GOOGLE_CLOUD_PROJECT") ||
  LOCAL_GOOGLE_CLOUD_PROJECT;
if (!GOOGLE_CLOUD_PROJECT) {
  throw new Error("GOOGLE_CLOUD_PROJECT environment variable is not set");
}

const encoder = new TextEncoder();

const app = initializeApp({
  projectId: GOOGLE_CLOUD_PROJECT,
}, "proxy-ql");

const db = getFirestore(app);
if (isDev) {
  console.debug("Using Firestore Emulator");
  connectFirestoreEmulator(db, "localhost", 8080);
}

const qlCollectionRef = collection(db, "proxy");
const dedupCollection = collection(db, 'dedup');
const sessionCollectionRef = collection(db, "sessions");

export async function collectData(query, data, options, isDev = false) {
  const dataHash = await sha256Hash(stringify(data));
  const annotations = {
    "session": options.sessionId,
    "data-hash": dataHash,
  };

  const dedupId = `${options.sessionId}--${dataHash}`;
  const dedupDoc = doc(dedupCollection, dedupId);
  const dedup = await getDoc(dedupDoc);
  if (dedup.exists()) {
    if (isDev) {
      console.info('Skipped duplicated data', dataHash);
    }
    return;
  }

  const d = await pushProxyed(
    qlCollectionRef,
    options.sessionId,
    query,
    data,
    annotations,
  );

  await setDoc(dedupDoc, {/*exists true*/});
}

async function sha256Hash(data: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hash = Array.from(new Uint8Array(digest)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  return hash;
}
