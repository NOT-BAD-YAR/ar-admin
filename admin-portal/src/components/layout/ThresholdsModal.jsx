import { X, RotateCcw } from "lucide-react";
import { useSettings } from "../../state/SettingsContext";

const FIELDS = [
  {
    key: "orientationWindowDays",
    label: "Orientation Window",
    help: "Days of tenure before a 0-certificate worker is flagged overdue (Mines Act 1952 rule).",
    suffix: "days",
  },
  {
    key: "passThreshold",
    label: "Module Pass Bar",
    help: "Minimum drill+quiz score (%) for a module attempt to count as passed.",
    suffix: "%",
  },
  {
    key: "certificateThreshold",
    label: "Certificate Bar",
    help: "Minimum score (%) required to issue a certificate — deliberately above the pass bar.",
    suffix: "%",
  },
  {
    key: "certExpiryWarningDays",
    label: "Expiry Warning Window",
    help: "Days before a certificate's expiryDate to start surfacing it as expiring soon.",
    suffix: "days",
  },
];

export function ThresholdsModal({ onClose }) {
  const { thresholds, setThresholds, resetThresholds } = useSettings();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h3 className="card-title">Compliance Threshold Settings</h3>
            <p className="card-subtitle">Adjust the statutory rule constants driving alerts across this portal</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="modal-body">
          {FIELDS.map((f) => (
            <div className="threshold-row" key={f.key}>
              <div>
                <label className="threshold-label" htmlFor={f.key}>
                  {f.label}
                </label>
                <p className="threshold-help">{f.help}</p>
              </div>
              <div className="threshold-input-wrap">
                <input
                  id={f.key}
                  type="number"
                  min={1}
                  max={f.suffix === "%" ? 100 : 365}
                  value={thresholds[f.key]}
                  onChange={(e) => setThresholds({ [f.key]: Number(e.target.value) || 0 })}
                />
                <span className="threshold-suffix">{f.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        <footer className="modal-footer">
          <button className="btn btn-ghost" onClick={resetThresholds}>
            <RotateCcw size={13} />
            Reset to defaults
          </button>
          <button className="btn btn-gold" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
