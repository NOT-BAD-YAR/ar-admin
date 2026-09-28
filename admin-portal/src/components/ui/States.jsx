import { Loader2, Inbox, AlertOctagon } from "lucide-react";

export function LoadingState({ label = "Loading live data…" }) {
  return (
    <div className="state-block">
      <Loader2 className="spin" size={20} />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ label = "No records yet." }) {
  return (
    <div className="state-block">
      <Inbox size={20} />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ error }) {
  return (
    <div className="state-block state-error">
      <AlertOctagon size={20} />
      <div>
        <p>Couldn't reach Firestore.</p>
        <p className="state-detail mono">{error?.message ?? String(error)}</p>
      </div>
    </div>
  );
}
