import {
  CollectionReference,
  doc,
  serverTimestamp,
  addDoc,
  setDoc,
} from "firebase/firestore";

type SessionId = string;

export function makeSessionId(): SessionId {
  return crypto.randomUUID();
}

export async function pushProxyed(
  qlCollectionRef: CollectionReference,
  sessionId: SessionId,
  query,
  response,
  annotations,
) {
  const data = {
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
  return dataRef;

  //const sessionQlRef = doc(collection(doc(sessionCollectionRef, sessionId), 'ql'), dataRef.id);
  //await setDoc(sessionQlRef, dataRef);
}
