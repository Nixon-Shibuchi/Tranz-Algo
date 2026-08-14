import { useEffect, useState } from "react";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import { money } from "../format";
import { STOCK_STATUS_SHORT, stockStatus } from "../stock";

const empty = {
  sku: "",
  name: "",
  category: "",
  brand: "",
  unit: "pcs",
  barcode: "",
  origin_country: "",
  default_weight_kg: "",
  reorder_level: "",
  tax_profile_id: "",
  description: "",
};

function toPayload(form) {
  return {
    sku: form.sku.trim(),
    name: form.name.trim(),
    category: form.category || null,
    brand: form.brand || null,
    unit: form.unit || "pcs",
    barcode: form.barcode || null,
    origin_country: form.origin_country || null,
    description: form.description || null,
    default_weight_kg: form.default_weight_kg ? Number(form.default_weight_kg) : null,
    reorder_level: form.reorder_level ? Number(form.reorder_level) : null,
    tax_profile_id: form.tax_profile_id ? Number(form.tax_profile_id) : null,
  };
}

function fromProduct(p) {
  return {
    sku: p.sku || "",
    name: p.name || "",
    category: p.category || "",
    brand: p.brand || "",
    unit: p.unit || "pcs",
    barcode: p.barcode || "",
    origin_country: p.origin_country || "",
    default_weight_kg: p.default_weight_kg ?? "",
    reorder_level: p.reorder_level ?? "",
    tax_profile_id: p.tax_profile_id ?? "",
    description: p.description || "",
  };
}

export default function ProductsPage() {
  const [askConfirm, confirmDialog] = useConfirm();
  const [products, setProducts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    const [p, t] = await Promise.all([api("/products"), api("/tax-profiles")]);
    setProducts(p);
    setProfiles(t);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function resetForm() {
    setForm(empty);
    setEditingId(null);
    setShowMore(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const confirmed = await askConfirm(
      editingId
        ? {
            title: "Update product?",
            message: `Save changes to ${form.sku || "this product"}?`,
            confirmLabel: "Yes, update",
          }
        : {
            title: "Create product?",
            message: `Add ${form.sku || "this product"} to the catalogue?`,
            confirmLabel: "Yes, create",
          }
    );
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      const payload = toPayload(form);
      if (editingId) {
        await api(`/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setOk("Product updated.");
      } else {
        await api("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setOk("Product created.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm(fromProduct(p));
    setShowMore(true);
    setError("");
    setOk("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDelete(p) {
    const confirmed = await askConfirm({
      title: "Delete product?",
      message: `Permanently delete ${p.sku} (${p.name})? This cannot be undone.`,
      confirmLabel: "Yes, delete",
      danger: true,
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      await api(`/products/${p.id}`, { method: "DELETE" });
      if (editingId === p.id) resetForm();
      setOk("Product deleted.");
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
          <h1>Products</h1>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      <form className="card form-grid" onSubmit={onSubmit}>
        <h2>{editingId ? "Edit product" : "Add product"}</h2>
        <label>
          SKU *
          <input
            required
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
        </label>
        <label>
          Name *
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Default weight per unit (kg)
          <input
            placeholder="e.g. 5"
            value={form.default_weight_kg}
            onChange={(e) => setForm({ ...form, default_weight_kg: e.target.value })}
          />
        </label>
        <label>
          Unit
          <select
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          >
            <option value="pcs">pcs</option>
            <option value="carton">carton</option>
            <option value="kg">kg</option>
            <option value="pair">pair</option>
            <option value="set">set</option>
          </select>
        </label>

        <div className="span-2 actions-inline">
          <button
            type="button"
            className="btn link"
            onClick={() => setShowMore((v) => !v)}
          >
            {showMore ? "Hide extra fields" : "Show extra fields"}
          </button>
        </div>

        {showMore && (
          <>
            <label>
              Category
              <input
                placeholder="Electronics"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </label>
            <label>
              Brand
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </label>
            <label>
              Origin country
              <input
                placeholder="China"
                value={form.origin_country}
                onChange={(e) => setForm({ ...form, origin_country: e.target.value })}
              />
            </label>
            <label>
              Reorder level
              <input
                value={form.reorder_level}
                onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
              />
            </label>
            <label>
              Tax profile
              <select
                value={form.tax_profile_id}
                onChange={(e) => setForm({ ...form, tax_profile_id: e.target.value })}
              >
                <option value="">None</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Barcode (optional)
              <input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
            </label>
            <label className="span-2">
              Description
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
          </>
        )}

        <div className="span-2 actions-inline">
          <button className="btn primary">
            {editingId ? "Update product" : "Create product"}
          </button>
          {editingId && (
            <button type="button" className="btn" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="card table-wrap">
        <div className="table-head">
          <h2>Product list</h2>
          <span className="muted">{products.length} item(s)</span>
        </div>
        {products.length === 0 ? (
          <p className="muted empty-state">No products yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Unit</th>
                <th>Weight</th>
                <th>Stock</th>
                <th>Retail</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>
                    <div>{p.name}</div>
                    {(p.category || p.origin_country) && (
                      <div className="cell-sub">
                        {[p.category, p.origin_country].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td>{p.unit || "pcs"}</td>
                  <td>{p.default_weight_kg ?? "—"}</td>
                  <td>
                    <div className="stock-inline">
                      <strong>{p.stock_on_hand}</strong>
                      <span className={`badge stock-badge stock-${stockStatus(p)}`}>
                        {STOCK_STATUS_SHORT[stockStatus(p)]}
                      </span>
                    </div>
                  </td>
                  <td>{money(p.active_retail_price)}</td>
                  <td className="row-actions">
                    <button type="button" className="btn ghost" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button type="button" className="btn ghost danger-text" onClick={() => onDelete(p)}>
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
