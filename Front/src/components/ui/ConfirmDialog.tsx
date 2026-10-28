import { X } from "lucide-react";
import { INK_FAINT } from "../../constants";

export function ConfirmDialog({
  title, message, confirmLabel = "Supprimer", onConfirm, onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel modal-panel-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onCancel} className="icon-btn-ghost">
            <X size={20} color={INK_FAINT} />
          </button>
        </div>
        <p className="modal-desc">{message}</p>
        <div className="form-actions">
          <button onClick={onCancel} className="btn btn-outline btn-flex">Annuler</button>
          <button onClick={onConfirm} className="btn btn-danger btn-flex">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
