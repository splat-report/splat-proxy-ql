import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const GOOGLE_CLOUD_PROJECT = Deno.env.get("GOOGLE_CLOUD_PROJECT");

const app = initializeApp({
  projectId: GOOGLE_CLOUD_PROJECT,
});

const db = getFirestore(app);

type SessionId = string;

export function makeSessionId(): SessionId {
  return crypto.randomUUID();
}

const qlCollectionRef = collection(db, "proxy");
const sessionCollectionRef = collection(db, "sessions");

export async function pushProxyed(
  sessionId: SessionId,
  query,
  response,
  annotations,
) {
  const data = {
    sessionId,
    created: serverTimestamp(),
    query: query,
    response: {
      json: response,
    },
    metadata: {
      annotations: annotations || {},
    },
  };

  const dataRef = await addDoc(qlCollectionRef, data);

  //const sessionQlRef = doc(collection(doc(sessionCollectionRef, sessionId), 'ql'), dataRef.id);
  //await setDoc(sessionQlRef, dataRef);
}
