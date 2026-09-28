import { useEffect, useState } from "react";
import { collection, collectionGroup, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";

function useLiveQuery(buildQuery, deps = []) {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    let unsub = () => {};
    try {
      const q = buildQuery();
      unsub = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ _path: d.ref.path, id: d.id, ...d.data() }));
          setState({ data, loading: false, error: null });
        },
        (error) => setState({ data: [], loading: false, error })
      );
    } catch (error) {
      setState({ data: [], loading: false, error });
    }
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

/** workers/{uid} — master worker profiles */
export function useWorkers() {
  return useLiveQuery(() => query(collection(db, "workers")));
}

/** certificates/{certId} — public certificate ledger */
export function useCertificates() {
  return useLiveQuery(() => query(collection(db, "certificates")));
}

/** collectionGroup: workers/*\/progress/{moduleId} across every worker */
export function useAllProgress() {
  return useLiveQuery(() => query(collectionGroup(db, "progress")));
}

/** collectionGroup: workers/*\/results/{resultId} across every worker */
export function useAllResults() {
  return useLiveQuery(() => query(collectionGroup(db, "results")));
}

/** workers/{uid}/results/{resultId} for one worker only */
export function useWorkerResults(workerId) {
  return useLiveQuery(
    () => query(collection(db, "workers", workerId, "results")),
    [workerId]
  );
}
