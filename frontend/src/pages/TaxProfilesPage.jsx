import { useEffect, useState } from "react";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import { percent } from "../format";

const empty = { name: "", duty_rate: "0.10", vat_rate: "0.16", notes: "" };

export default function TaxProfilesPage() {
  const [askConfirm, confirmDialog] = useConfirm();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setRows(await api("/tax-profiles"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function resetForm() {
    setForm(empty);
    setEditingId(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const confirmed = await askConfirm(
      editingId
        ? {
            title: "Update tax profile?",
            message: `Save changes to "${form.name || "this profile"}"?`,
            confirmLabel: "Yes, update",
          }
        : {
            title: "Create tax profile?",
            message: `Add "${form.name || "this profile"}" with the rates entered?`,
            confirmLabel: "Yes, create",
          }
    );
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      const payload = {
        name: form.name.trim(),
        duty_rate: Number(form.duty_rate),
        vat_rate: Number(form.vat_rate),
        notes: form.notes || null,
      };
      if (editingId) {
        await api(`/tax-profiles/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setOk("Tax profile updated.");
      } else {
        await api("/tax-profiles", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setOk("Tax profile created.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(r) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      duty_rate: String(r.duty_rate),
      vat_rate: String(r.vat_rate),
      notes: r.notes || "",
    });
  }

  async function onDelete(r) {
    const confirmed = await askConfirm({
      title: "Delete tax profile?",
      message: `Permanently delete "${r.name}"? This cannot be undone.`,
      confirmLabel: "Yes, delete",
      danger: true,
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      await api(`/tax-profiles/${r.id}`, { method: "DELETE" });
      if (editingId === r.id) resetForm();
      setOk("Tax profile deleted.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {confirmDialog}
      <div className="page-head">
        <div>
          <h1>Tax profiles</h1>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      <form className="card form-grid" onSubmit={onSubmit}>
        <h2>{editingId ? "Edit profile" : "Add profile"}</h2>
        <label>
          Name *
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Duty rate (e.g. 0.10 = 10%)
          <input
            value={form.duty_rate}
            onChange={(e) => setForm({ ...form, duty_rate: e.target.value })}
          />
        </label>
        <label>
          VAT rate (e.g. 0.16 = 16%)
          <input
            value={form.vat_rate}
            onChange={(e) => setForm({ ...form, vat_rate: e.target.value })}
          />
        </label>
        <label>
          Notes
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        <div className="span-2 actions-inline">
          <button className="btn primary">{editingId ? "Update" : "Create"}</button>
          {editingId && (
            <button type="button" className="btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="card table-wrap">
        <div className="table-head">
          <h2>Profiles</h2>
          <span className="muted">{rows.length} profile(s)</span>
        </div>
        {rows.length === 0 ? (
          <p className="muted empty-state">No tax profiles yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Duty</th>
                <th>VAT</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{percent(r.duty_rate)}</td>
                  <td>{percent(r.vat_rate)}</td>
                  <td>{r.notes || "—"}</td>
                  <td className="row-actions">
                    <button type="button" className="btn ghost" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn ghost danger-text"
                      onClick={() => onDelete(r)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
