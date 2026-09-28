import { useMemo, useState } from "react";
import { Search, Copy, Check } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { useCertificates, useWorkers, useAllResults } from "../hooks/useFirestoreData";
import { useSettings } from "../state/SettingsContext";
import { computeWorkerDistricts, filterWorkers, filterCertificates, hasActiveFilters } from "../lib/filters";
import { verifyCertificate } from "../lib/certificateCrypto";
import { formatDate, daysUntil } from "../lib/format";
import { moduleLabel } from "../lib/aggregate";

const VERDICT_META = {
  VALID: { status: "good", label: "Verified & Valid", banner: "banner-good" },
  EXPIRED: { status: "warning", label: "Certificate Expired", banner: "banner-warning" },
  TAMPERED: { status: "critical", label: "Signature Mismatch / Tampered", banner: "banner-critical" },
  "NOT FOUND": { status: "critical", label: "Certificate Not Found", banner: "banner-critical" },
};

function VerifierTool({ certificates }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  function runVerify(id) {
    const trimmed = id.trim();
    if (!trimmed) return;
    const cert = certificates.find((c) => c.id.toLowerCase() === trimmed.toLowerCase());
    if (!cert) {
      setResult({ verdict: "NOT FOUND" });
      return;
    }
    setResult({ cert, ...verifyCertificate(cert) });
  }

  function copyHash(hash) {
    navigator.clipboard?.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const meta = result ? VERDICT_META[result.verdict] : null;

  return (
    <Card title="Interactive QR / Hash Verifier" subtitle="Paste a certificate ID scanned from a worker's QR badge">
      <div className="verifier-input-row">
        <div className="search-field search-field-wide">
          <Search size={14} />
          <input
            placeholder="e.g. JH-FIRE-324968"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runVerify(query)}
          />
        </div>
        <button className="btn btn-gold" onClick={() => runVerify(query)}>
          Verify
        </button>
      </div>

      {result && (
        <div className={`verdict-banner ${meta.banner}`}>
          <span className="verdict-label">{meta.label}</span>
        </div>
      )}

      {result?.cert && (
        <>
          <div className="attribute-grid">
            <div>
              <span className="attr-label">Certificate ID</span>
              <span className="mono">{result.cert.id}</span>
            </div>
            <div>
              <span className="attr-label">Worker</span>
              <span>
                {result.cert.workerName} ({result.cert.workerId})
              </span>
            </div>
            <div>
              <span className="attr-label">Module</span>
              <span>{moduleLabel(result.cert.moduleId) || result.cert.title}</span>
            </div>
            <div>
              <span className="attr-label">Score</span>
              <span className="mono">{result.cert.score}%</span>
            </div>
            <div>
              <span className="attr-label">Organization</span>
              <span>{result.cert.organization ?? "—"}</span>
            </div>
            <div>
              <span className="attr-label">Issued</span>
              <span>{formatDate(result.cert.issuedDate)}</span>
            </div>
            <div>
              <span className="attr-label">Expires</span>
              <span>{formatDate(result.cert.expiryDate)}</span>
            </div>
          </div>

          <div className="crypto-box">
            <p className="crypto-heading">HMAC-SHA256 Signature Audit</p>
            <p className="crypto-row">
              <span className="attr-label">Payload</span>
              <span className="mono">{result.payload}</span>
            </p>
            <p className="crypto-row">
              <span className="attr-label">Computed Hash</span>
              <span className="mono">{result.computedHash}</span>
              <button className="icon-btn" onClick={() => copyHash(result.computedHash)} title="Copy hash">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </p>
            <p className="crypto-row">
              <span className="attr-label">Stored Hash</span>
              <span className="mono">{result.cert.signatureHash}</span>
            </p>
          </div>
        </>
      )}
    </Card>
  );
}

export function Certificates() {
  const { data: certificates, loading: certsLoading, error: certsError } = useCertificates();
  const workers = useWorkers();
  const results = useAllResults();
  const { filters, thresholds } = useSettings();
  const [search, setSearch] = useState("");

  const loading = certsLoading || workers.loading || results.loading;
  const error = certsError || workers.error || results.error;

  const workerDistricts = useMemo(() => computeWorkerDistricts(results.data), [results.data]);
  const filteredWorkerIds = useMemo(
    () => new Set(filterWorkers(workers.data, filters, workerDistricts).map((w) => w.id)),
    [workers.data, filters, workerDistricts]
  );
  const globallyFiltered = useMemo(
    () => filterCertificates(certificates, filters, filteredWorkerIds),
    [certificates, filters, filteredWorkerIds]
  );

  const rows = useMemo(() => {
    return globallyFiltered
      .map((c) => ({ ...c, verdict: verifyCertificate(c).verdict, daysLeft: daysUntil(c.expiryDate) }))
      .filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.id.toLowerCase().includes(q) || (c.workerName ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  }, [globallyFiltered, search]);

  if (loading) return <LoadingState label="Loading certificate ledger…" />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="page-stack">
      <VerifierTool certificates={certificates} />

      {hasActiveFilters(filters) && (
        <p className="filter-notice">{globallyFiltered.length} of {certificates.length} certificates match the active filters above.</p>
      )}

      <Card
        title="Public Certificate Ledger"
        subtitle={`${globallyFiltered.length} certificates issued`}
        action={
          <div className="search-field">
            <Search size={14} />
            <input placeholder="Search cert ID or worker…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
      >
        {rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Worker</th>
                  <th>Module</th>
                  <th>Score</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const meta = VERDICT_META[c.verdict];
                  return (
                    <tr key={c.id}>
                      <td className="mono">{c.id}</td>
                      <td>{c.workerName ?? c.workerId}</td>
                      <td>{moduleLabel(c.moduleId) || c.title}</td>
                      <td className="mono">{c.score}%</td>
                      <td>
                        {formatDate(c.expiryDate)}
                        {c.daysLeft !== null && c.daysLeft >= 0 && c.daysLeft <= thresholds.certExpiryWarningDays && c.verdict === "VALID" && (
                          <span className="inline-tag inline-tag-warning">{c.daysLeft}d left</span>
                        )}
                      </td>
                      <td>
                        <Badge status={meta.status}>{meta.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState label="No certificates match this search." />
        )}
      </Card>
    </div>
  );
}
