import { useCallback, useState } from "react";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Yes, continue",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !busy && onCancel?.()}>
      <div
        className="modal-card card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title">{title}</h2>
        {typeof message === "string" ? <p>{message}</p> : message}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn primary${danger ? " danger" : ""}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Promise-based confirm helper for CRUD actions.
 * Usage:
 *   const [askConfirm, confirmDialog] = useConfirm();
 *   if (!(await askConfirm({ title, message, danger }))) return;
 */
export function useConfirm() {
  const [state, setState] = useState(null);

  const askConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        title: "Are you sure?",
        message: "Please confirm this action.",
        confirmLabel: "Yes, continue",
        cancelLabel: "Cancel",
        danger: false,
        ...options,
        resolve,
      });
    });
  }, []);

  function close(result) {
    state?.resolve?.(result);
    setState(null);
  }

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(state)}
      title={state?.title}
      message={state?.message}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      danger={state?.danger}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return [askConfirm, confirmDialog];
}
