import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";

// ── Menu item row (list view) ─────────────────────────────────────────────────
function VMenuItemRow({ item, onToggle, onEdit }) {
  return (
    <div
      className="vm-item-row"
      style={{ opacity: item.available ? 1 : 0.5, cursor: "pointer" }}
      onClick={() => onEdit(item)}
    >
      <div className="mi-photo">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="mi-photo-img" />
        ) : (
          <span className="mi-emoji">{item.image}</span>
        )}
      </div>
      <div className="mi-info">
        <div className="mi-name">{item.name}</div>
        {item.description ? <div className="mi-desc">{item.description}</div> : null}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
          <span className="mi-price">${Number(item.price).toFixed(2)}</span>
          {item.popular && <span style={{ fontSize: 11, fontWeight: 700, color: "#e53935" }}>🔥 Popular</span>}
          {item.prep_time_minutes ? <span style={{ fontSize: 11, color: "var(--muted)" }}>⏱ {item.prep_time_minutes} min</span> : null}
          {item.order_count > 0 ? <span style={{ fontSize: 11, color: "var(--muted)" }}>{item.order_count} ordered</span> : null}
        </div>
      </div>
      <div className="mi-right" onClick={e => e.stopPropagation()}>
        <button
          className={`toggle ${item.available ? "on" : ""}`}
          onClick={() => onToggle(item)}
          title={item.available ? "Hide from menu" : "Show on menu"}
        />
      </div>
    </div>
  );
}

// ── Inline field ──────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="form-group" style={{ marginBottom: error ? 4 : 16 }}>
      <label className="form-label">{label}</label>
      {children}
      {error && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

const EMPTY = {
  name: "", price: "", image: "🍽️", image_url: "",
  description: "", available: true, popular: false, prep_time_minutes: "",
};

// ── Add / Edit modal ──────────────────────────────────────────────────────────
function ItemModal({ form, setForm, isAdding, saving, uploadingPhoto,
                     fileInputRef, onSave, onDelete, onClose, onPickPhoto, onRemovePhoto }) {
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                         e.name  = "Item name is required.";
    if (!form.price || isNaN(parseFloat(form.price))) e.price = "Enter a valid price.";
    if (parseFloat(form.price) <= 0)               e.price = "Price must be greater than 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) onSave(); };

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-sheet"
        style={{ maxHeight: "92vh", overflowY: "auto", paddingBottom: 32 }}
      >
        {/* Header */}
        <div className="modal-title">
          {isAdding ? "Add Menu Item" : "Edit Item"}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Photo / Emoji ── */}
        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Photo</label>
          {form.image_url ? (
            <div style={{ position: "relative", marginBottom: 8 }}>
              <img
                src={form.image_url}
                alt="Menu item"
                style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 14, border: "1px solid var(--border)", display: "block" }}
              />
              <button
                type="button"
                onClick={onRemovePhoto}
                style={{
                  position: "absolute", top: 8, right: 8,
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(15,15,15,0.7)", border: "none",
                  color: "white", fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              style={{
                width: "100%", height: 110, borderRadius: 14,
                border: "1.5px dashed var(--border)", background: "var(--bg)",
                color: "var(--muted)", fontSize: 13, fontWeight: 600,
                cursor: uploadingPhoto ? "not-allowed" : "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 6, fontFamily: "DM Sans, sans-serif", marginBottom: 8,
              }}
            >
              {uploadingPhoto
                ? <><span style={{ fontSize: 22 }}>🔄</span>Uploading…</>
                : <><span style={{ fontSize: 22 }}>📷</span>Tap to add a photo<span style={{ fontSize: 11, fontWeight: 400 }}>JPG or PNG · max 5MB</span></>
              }
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} />
        </div>

        {/* ── Emoji fallback ── */}
        <Field label="Emoji icon (shown if no photo)">
          <input
            className="form-input"
            value={form.image}
            onChange={e => set("image", e.target.value)}
            style={{ fontSize: 24, textAlign: "center", letterSpacing: 4 }}
            maxLength={4}
          />
        </Field>

        {/* ── Name ── */}
        <Field label="Item name *" error={errors.name}>
          <input
            className="form-input"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Nyama Choma Plate"
            style={{ borderColor: errors.name ? "#ef4444" : undefined }}
          />
        </Field>

        {/* ── Description ── */}
        <Field label="Description">
          <textarea
            className="form-input"
            value={form.description}
            onChange={e => set("description", e.target.value)}
            placeholder="What's in it? What makes it special?"
            rows={3}
            style={{ resize: "none", fontFamily: "DM Sans, sans-serif", lineHeight: 1.5 }}
          />
        </Field>

        {/* ── Price + Prep time ── */}
        <div className="form-row" style={{ gap: 12, marginBottom: errors.price ? 4 : 16 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Price *</label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 14, color: "var(--muted)", fontWeight: 600, pointerEvents: "none",
              }}>$</span>
              <input
                className="form-input"
                type="number"
                step="0.50"
                min="0"
                value={form.price}
                onChange={e => set("price", e.target.value)}
                placeholder="0.00"
                style={{
                  paddingLeft: 26,
                  borderColor: errors.price ? "#ef4444" : undefined,
                }}
              />
            </div>
            {errors.price && <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>{errors.price}</p>}
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">Prep time (min)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="1"
              value={form.prep_time_minutes}
              onChange={e => set("prep_time_minutes", e.target.value)}
              placeholder="e.g. 15"
            />
          </div>
        </div>

        {/* ── Available toggle ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg)", border: "1.5px solid var(--border)",
          borderRadius: 12, padding: "13px 14px", marginBottom: 10,
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Available on menu</p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
              {form.available ? "Customers can order this" : "Hidden from customers"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("available", !form.available)}
            style={{
              width: 46, height: 27, borderRadius: 14, border: "none", cursor: "pointer",
              background: form.available ? "#22c55e" : "var(--border)",
              position: "relative", flexShrink: 0, transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 3,
              left: form.available ? 22 : 3,
              width: 21, height: 21, borderRadius: "50%", background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.2s",
            }} />
          </button>
        </div>

        {/* ── Popular toggle ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg)", border: "1.5px solid var(--border)",
          borderRadius: 12, padding: "13px 14px", marginBottom: 24,
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>🔥 Mark as popular</p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
              Highlighted on your menu to attract orders
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("popular", !form.popular)}
            style={{
              width: 46, height: 27, borderRadius: 14, border: "none", cursor: "pointer",
              background: form.popular ? "#e53935" : "var(--border)",
              position: "relative", flexShrink: 0, transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 3,
              left: form.popular ? 22 : 3,
              width: 21, height: 21, borderRadius: "50%", background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.2s",
            }} />
          </button>
        </div>

        {/* ── Save ── */}
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={saving}
          style={{ marginBottom: !isAdding ? 0 : undefined }}
        >
          {saving ? "Saving…" : isAdding ? "Add to Menu" : "Save Changes"}
        </button>

        {/* ── Delete (edit only) ── */}
        {!isAdding && (
          <button
            onClick={onDelete}
            disabled={saving}
            style={{
              width: "100%", background: "none", border: "none",
              color: "#ef4444", fontSize: 14, fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer", marginTop: 14,
              fontFamily: "DM Sans, sans-serif", padding: "10px 0",
              opacity: saving ? 0.5 : 1,
            }}
          >
            🗑 Remove this item
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function VMenuTab({ showToast }) {
  const [menu,           setMenu]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingId,      setEditingId]      = useState(null);
  const [isAdding,       setIsAdding]       = useState(false);
  const [form,           setForm]           = useState(EMPTY);
  const fileInputRef = useRef(null);

  useEffect(() => {
    vendorsApi.myMenu()
      .then(({ menu }) => setMenu(menu))
      .catch(e => showToast("⚠️ " + e.message))
      .finally(() => setLoading(false));
  }, []);

  const handlePhotoPick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("⚠️ Image must be under 5MB"); return; }
    setUploadingPhoto(true);
    try {
      const { url } = await vendorsApi.uploadMenuPhoto(file);
      setForm(f => ({ ...f, image_url: url }));
      showToast("📸 Photo uploaded!");
    } catch (e) {
      showToast("⚠️ " + e.message);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleAvail = async (item) => {
    try {
      const { item: updated } = await vendorsApi.updateItem(item.id, { available: !item.available });
      setMenu(prev => prev.map(m => m.id === item.id ? updated : m));
      showToast(item.available ? `⏸ "${item.name}" hidden` : `✅ "${item.name}" back on menu`);
    } catch (e) {
      showToast("⚠️ " + e.message);
    }
  };

  const openEdit = (item) => {
    setForm({
      ...item,
      price:             String(item.price),
      image_url:         item.image_url || "",
      prep_time_minutes: item.prep_time_minutes != null ? String(item.prep_time_minutes) : "",
    });
    setEditingId(item.id);
    setIsAdding(false);
  };

  const openAdd = () => { setForm(EMPTY); setIsAdding(true); setEditingId(null); };
  const closeModal = () => { setEditingId(null); setIsAdding(false); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name:            form.name.trim(),
        description:     form.description.trim(),
        price:           parseFloat(form.price),
        image:           form.image,
        imageUrl:        form.image_url || null,
        available:       form.available,
        popular:         form.popular,
        prepTimeMinutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes, 10) : null,
      };
      if (isAdding) {
        const { item } = await vendorsApi.addItem(payload);
        setMenu(prev => [...prev, item]);
        showToast("✨ Item added to menu!");
      } else {
        const { item } = await vendorsApi.updateItem(editingId, payload);
        setMenu(prev => prev.map(m => m.id === editingId ? item : m));
        showToast("✏️ Item updated!");
      }
      closeModal();
    } catch (e) {
      showToast("⚠️ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    setSaving(true);
    try {
      await vendorsApi.deleteItem(editingId);
      setMenu(prev => prev.filter(m => m.id !== editingId));
      showToast("🗑 Item removed");
      closeModal();
    } catch (e) {
      showToast("⚠️ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const available = menu.filter(m => m.available);
  const hidden    = menu.filter(m => !m.available);
  const showModal = isAdding || editingId !== null;

  if (loading) return (
    <div className="vd-content">
      <div className="empty-orders"><div className="emoji">⏳</div><p>Loading menu…</p></div>
    </div>
  );

  return (
    <div className="vd-content">

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Live items</div>
          <div className="stat-value green">{available.length}</div>
          <div className="stat-sub">visible to customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Hidden</div>
          <div className="stat-value" style={{ color: "var(--muted)" }}>{hidden.length}</div>
          <div className="stat-sub">not on menu</div>
        </div>
      </div>

      {/* Empty state */}
      {menu.length === 0 && (
        <div className="empty-orders" style={{ marginTop: 32 }}>
          <div className="emoji">🍽️</div>
          <p>No items yet — add your first menu item</p>
        </div>
      )}

      {/* Live items */}
      {available.length > 0 && (
        <>
          <div className="vd-section-title">Live on Menu</div>
          {available.map(item => (
            <VMenuItemRow key={item.id} item={item} onToggle={toggleAvail} onEdit={openEdit} />
          ))}
        </>
      )}

      {/* Hidden items */}
      {hidden.length > 0 && (
        <>
          <div className="vd-section-title" style={{ color: "var(--muted)" }}>Hidden</div>
          {hidden.map(item => (
            <VMenuItemRow key={item.id} item={item} onToggle={toggleAvail} onEdit={openEdit} />
          ))}
        </>
      )}

      {/* Add button */}
      <button className="btn-add-item" onClick={openAdd}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Add Menu Item
      </button>

      {/* Modal */}
      {showModal && (
        <ItemModal
          form={form}
          setForm={setForm}
          isAdding={isAdding}
          saving={saving}
          uploadingPhoto={uploadingPhoto}
          fileInputRef={fileInputRef}
          onSave={save}
          onDelete={deleteItem}
          onClose={closeModal}
          onPickPhoto={handlePhotoPick}
          onRemovePhoto={() => setForm(f => ({ ...f, image_url: "" }))}
        />
      )}
    </div>
  );
}
