import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import CsvImportButton from "../components/CsvImportButton";
import {
  FormActions,
  FormField,
  FormFold,
  FormPanel,
  FormSection,
} from "../components/WorkspaceForm";
import {
  LIST_PREVIEW_LIMIT,
  ListCapBar,
  ListDrawer,
  ListSearch,
} from "../components/ListDrawer";
import LoadingState from "../components/LoadingState";
import { mapProductRows } from "../csvImport";
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
  description: "",
};

function toPayload(form) {
  const sku = form.sku.trim();
  return {
    sku: sku || null,
    name: form.name.trim(),
    category: form.category || null,
    brand: form.brand || null,
    unit: form.unit || "pcs",
    barcode: form.barcode || null,
    origin_country: form.origin_country || null,
    description: form.description || null,
    default_weight_kg: form.default_weight_kg ? Number(form.default_weight_kg) : null,
    reorder_level: form.reorder_level ? Number(form.reorder_level) : null,
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
    description: p.description || "",
  };
}

function ProductTable({ products, onEdit, onDelete }) {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
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
            <td>
              <span className="mono-id">#{p.id}</span>
            </td>
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
              <button type="button" className="btn ghost" onClick={() => onEdit(p)}>
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
  );
}

export default function ProductsPage() {
  const [askConfirm, confirmDialog] = useConfirm();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [listQ, setListQ] = useState("");
  const [listDrawerOpen, setListDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const filteredProducts = useMemo(() => {
    const needle = listQ.trim().toLowerCase();
    const sorted = [...products].sort((a, b) => a.sku.localeCompare(b.sku));
    if (!needle) return sorted;
    return sorted.filter(
      (p) =>
        p.sku.toLowerCase().includes(needle) ||
        p.name.toLowerCase().includes(needle) ||
        String(p.id).includes(needle) ||
        (p.category || "").toLowerCase().includes(needle) ||
        (p.origin_country || "").toLowerCase().includes(needle)
    );
  }, [products, listQ]);

  const previewProducts = useMemo(() => {
    if (listQ.trim()) return filteredProducts;
    return filteredProducts.slice(0, LIST_PREVIEW_LIMIT);
  }, [filteredProducts, listQ]);

  async function load({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    try {
      setProducts(await api("/products"));
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
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
            message: `Save changes to ${form.name || form.sku || "this product"}?`,
            confirmLabel: "Yes, update",
          }
        : {
            title: "Create product?",
            message: `Add ${form.name || "this product"} to the catalogue${
              form.sku.trim() ? ` as ${form.sku.trim()}` : " (SKU will be auto-assigned)"
            }?`,
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
        const created = await api("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setOk(`Product created as ${created.sku} (#${created.id}).`);
      }
      resetForm();
      await load({ quiet: true });
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
      await load({ quiet: true });
    } catch (err) {
      setError(err.message);
    }
  }

  async function importProductsCsv(text) {
    setError("");
    setOk("");
    if (!text.trim()) {
      setError("Could not read that CSV file.");
      return;
    }
    const { ready, errors } = mapProductRows(text);
    if (!ready.length) {
      setError(
        errors[0] ||
          "No product rows found. Need a header row with at least name (and optional sku, weight)."
      );
      return;
    }
    const preview = ready
      .slice(0, 5)
      .map((r) => `${r.sku || "(auto SKU)"} — ${r.name}`)
      .join("; ");
    const more = ready.length > 5 ? ` … +${ready.length - 5} more` : "";
    const warn = errors.length ? ` ${errors.length} row(s) will be skipped.` : "";
    const confirmed = await askConfirm({
      title: `Import ${ready.length} product(s)?`,
      message: `${preview}${more}.${warn}`,
      confirmLabel: "Yes, import",
    });
    if (!confirmed) return;
    setImporting(true);
    let okCount = 0;
    const fail = [...errors];
    try {
      for (const row of ready) {
        const { __row, ...payload } = row;
        try {
          await api("/products", { method: "POST", body: JSON.stringify(payload) });
          okCount += 1;
        } catch (err) {
          fail.push(`Row ${__row}: ${err.message}`);
        }
      }
      await load({ quiet: true });
      if (okCount) setOk(`Imported ${okCount} product(s) from CSV.`);
      if (fail.length) setError(fail.slice(0, 4).join(" · "));
    } finally {
      setImporting(false);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div>
            <span className="page-kicker">Catalogue</span>
            <h1>Products</h1>
          </div>
        </div>
        <LoadingState
          label="Loading products"
          tips={["Fetching the catalogue…", "Sorting SKUs…"]}
        />
      </div>
    );
  }

  return (
    <div>
      {confirmDialog}
      <div className="page-head">
        <div>
          <span className="page-kicker">Catalogue</span>
          <h1>Products</h1>
        </div>
        <CsvImportButton
          label="Import CSV"
          hint="Columns: name, sku (optional), weight, unit, reorder_level, category…"
          busy={importing}
          onText={importProductsCsv}
        />
      </div>

      {importing && (
        <LoadingState
          label="Importing"
          tips={["Saving products from CSV…", "Remote database can take a moment…"]}
        />
      )}
      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      <FormPanel
        kicker={editingId ? "Editing" : "Catalogue entry"}
        title={editingId ? "Edit product" : "Add product"}
        hint="Name is required. Leave SKU blank to auto-assign an ID like PRD-0007."
        onSubmit={onSubmit}
      >
        <FormSection columns={2}>
          <FormField
            label="SKU"
            id="product-sku"
            hint={editingId ? "Unique catalogue code." : "Optional — auto PRD-000N if blank."}
          >
            <input
              id="product-sku"
              value={form.sku}
              onChange={set("sku")}
              placeholder={editingId ? "SOAP-LAV" : "Auto if blank"}
            />
          </FormField>
          <FormField label="Display name" required id="product-name">
            <input
              id="product-name"
              required
              value={form.name}
              onChange={set("name")}
              placeholder="Lavender bath soap"
            />
          </FormField>
        </FormSection>

        <FormSection columns={3}>
          <FormField label="Default weight" id="product-weight" hint="Per unit, in kg.">
            <input
              id="product-weight"
              inputMode="decimal"
              placeholder="0.15"
              value={form.default_weight_kg}
              onChange={set("default_weight_kg")}
            />
          </FormField>
          <FormField label="Sell unit" id="product-unit">
            <select id="product-unit" value={form.unit} onChange={set("unit")}>
              <option value="pcs">pcs</option>
              <option value="carton">carton</option>
              <option value="kg">kg</option>
              <option value="pair">pair</option>
              <option value="set">set</option>
            </select>
          </FormField>
          <FormField label="Reorder level" id="product-reorder" hint="Low-stock alert threshold.">
            <input
              id="product-reorder"
              inputMode="numeric"
              placeholder="10"
              value={form.reorder_level}
              onChange={set("reorder_level")}
            />
          </FormField>
        </FormSection>

        <FormFold
          open={showMore}
          onToggle={() => setShowMore((v) => !v)}
          label={showMore ? "Hide optional details" : "Optional details"}
          badge="6 fields"
        >
          <FormSection columns={2}>
            <FormField label="Category" id="product-category">
              <input
                id="product-category"
                placeholder="Toiletries"
                value={form.category}
                onChange={set("category")}
              />
            </FormField>
            <FormField label="Brand" id="product-brand">
              <input id="product-brand" value={form.brand} onChange={set("brand")} placeholder="Cape Clean" />
            </FormField>
            <FormField label="Origin country" id="product-origin">
              <input
                id="product-origin"
                placeholder="South Africa"
                value={form.origin_country}
                onChange={set("origin_country")}
              />
            </FormField>
            <FormField label="Barcode" id="product-barcode">
              <input id="product-barcode" value={form.barcode} onChange={set("barcode")} placeholder="Optional" />
            </FormField>
            <FormField label="Description" id="product-description" className="span-2">
              <textarea
                id="product-description"
                rows={2}
                value={form.description}
                onChange={set("description")}
                placeholder="Notes for your team"
              />
            </FormField>
          </FormSection>
        </FormFold>

        <FormActions>
          <button className="btn primary">{editingId ? "Update product" : "Create product"}</button>
          {editingId && (
            <button type="button" className="btn" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </FormActions>
      </FormPanel>

      <div className="card table-wrap">
        <div className="table-head">
          <h2>Product list</h2>
          <ListSearch
            id="product-list-search"
            value={listQ}
            onChange={setListQ}
            placeholder="SKU, name, category…"
          />
        </div>
        {products.length === 0 ? (
          <p className="muted empty-state">No products yet.</p>
        ) : filteredProducts.length === 0 ? (
          <p className="muted empty-state">No products match your search.</p>
        ) : (
          <>
            <ProductTable
              products={previewProducts}
              onEdit={startEdit}
              onDelete={onDelete}
            />
            {!listQ.trim() && (
              <ListCapBar
                total={filteredProducts.length}
                shown={previewProducts.length}
                noun="products"
                onOpen={() => setListDrawerOpen(true)}
              />
            )}
          </>
        )}
      </div>

      <ListDrawer
        open={listDrawerOpen}
        onClose={() => setListDrawerOpen(false)}
        title="All products"
        subtitle="Search or pick a row to edit."
      >
        <ListSearch
          id="product-drawer-search"
          value={listQ}
          onChange={setListQ}
          placeholder="SKU, name, category…"
        />
        {filteredProducts.length === 0 ? (
          <p className="muted empty-state">No products match your search.</p>
        ) : (
          <ProductTable
            products={filteredProducts}
            onEdit={(p) => {
              setListDrawerOpen(false);
              startEdit(p);
            }}
            onDelete={onDelete}
          />
        )}
      </ListDrawer>
    </div>
  );
}
