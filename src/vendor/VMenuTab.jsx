import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";

function VMenuItemRow({ item, onToggle, onEdit }) {
  return (
    <div className="vm-item-row" style={{ opacity: item.available ? 1 : 0.55 }}>
      <div className="mi-photo">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="mi-photo-img" />
        ) : (
          <span className="mi-emoji">{item.image}</span>
        )}
      </div>
      <div className="mi-info">
        <div className="mi-name">{item.name}</div>
        <div className="mi-desc">{item.description}</div>
        <div className="mi-price">${Number(item.price).toFixed(2)}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          {item.prep_time_minutes ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>⏱ {item.prep_time_minutes} min</span>
          ) : null}
          {item.order_count > 0 ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--orange)" }}>🔥 {item.order_count} ordered (30d)</span>
          ) : null}
        </div>
      </div>
      <div className="mi-right">
        <button className={`toggle ${item.available ? "on" : ""}`} onClick={() => onToggle(item)} />
        <button className="btn-edit" onClick={() => onEdit(item)}>Edit</button>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: "", price: "", image: "🍽️", image_url: "", description: "", available: true, popular: false, prep_time_minutes: "" };

export default function VMenuTab({ showToast }) {
  const [menu, setMenu]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [isAdding, setIsAdding]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
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
    if (file.size > 5 * 1024 * 1024) {
      showToast("⚠️ Image must be under 5MB");
      return;
    }
    setUploadingPhoto(true);
    try {
      const { url } = await vendorsApi.uploadMenuPhoto(file);
      setForm(f => ({ ...f, image_url: url }));
      showToast("📸 Photo uploaded!");
    } catch (e) {
      showToast("⚠️ " + e.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => setForm(f => ({ ...f, image_url: "" }));

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
    setForm({ ...item, price: String(item.price), image_url: item.image_url || "", prep_time_minutes: item.prep_time_minutes != null ? String(item.prep_time_minutes) : "" });
    setEditingId(item.id);
    setIsAdding(false);
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsAdding(true);
    setEditingId(null);
  };

  const closeModal = () => { setEditingId(null); setIsAdding(false); };

  const save = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        image: form.image,
        imageUrl: form.image_url || null,
        available: form.available,
        popular: form.popular,
        prepTimeMinutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes, 10) : null,
      };
      if (isAdding) {
        const { item } = await vendorsApi.addItem(payload);
        setMenu(prev => [...prev, item]);
        showToast("✨ Item added!");
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

  if (loading) return <div className="vd-content"><div className="empty-orders"><div className="emoji">⏳</div><p>Loading menu...</p></div></div>;

  return (
    <div className="vd-content">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Live items</div>
          <div className="stat-value green">{available.length}</div>
          <div className="stat-sub">visible to customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Hidden</div>
          <div className="stat-value" style={{ color: "#7a7065" }}>{hidden.length}</div>
          <div className="stat-sub">not on menu</div>
        </div>
      </div>

      {available.length > 0 && (
        <>
          <div className="vd-section-title">Live on Menu</div>
          {available.map(item => <VMenuItemRow key={item.id} item={item} onToggle={toggleAvail} onEdit={openEdit} />)}
        </>
      )}
      {hidden.length > 0 && (
        <>
          <div className="vd-section-title" style={{ color: "#7a7065" }}>Hidden</div>
          {hidden.map(item => <VMenuItemRow key={item.id} item={item} onToggle={toggleAvail} onEdit={openEdit} />)}
        </>
      )}

      <button className="btn-add-item" onClick={openAdd}>
        <span style={{ fontSize: 18 }}>+</span> Add Menu Item
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-sheet">
            <div className="modal-title">
              {isAdding ? "Add New Item" : "Edit Item"}
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Photo</label>
              {form.image_url ? (
                <div style={{ position: "relative", marginBottom: 4 }}>
                  <img
                    src={form.image_url}
                    alt="Menu item"
                    style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)" }}
                  />
                  <button
                    onClick={removePhoto}
                    type="button"
                    style={{
                      position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%",
                      background: "rgba(15,15,15,0.65)", border: "none", color: "white", fontSize: 14,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{
                    width: "100%", height: 100, borderRadius: 12, border: "1.5px dashed var(--border)",
                    background: "var(--bg)", color: "var(--muted)", fontSize: 13, fontWeight: 600,
                    cursor: uploadingPhoto ? "not-allowed" : "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  {uploadingPhoto ? (
                    <>🔄 Uploading…</>
                  ) : (
                    <>📷 Tap to add a photo<span style={{ fontSize: 11, fontWeight: 400 }}>JPG or PNG, up to 5MB</span></>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoPick}
                style={{ display: "none" }}
              />
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                No photo yet? The emoji below is used as a placeholder instead.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Emoji Icon (used if no photo)</label>
              <input className="form-input" value={form.image} onChange={e => setForm({...form, image: e.target.value})} style={{ fontSize: 22, textAlign: "center" }} />
            </div>
            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Nyama Choma Plate" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Short description" />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Price ($)</label>
                <input className="form-input" type="number" step="0.50" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Prep Time (min)</label>
                <input className="form-input" type="number" min="0" step="1" value={form.prep_time_minutes} onChange={e => setForm({...form, prep_time_minutes: e.target.value})} placeholder="e.g. 15" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Available?</label>
                <div style={{ paddingTop: 8 }}>
                  <button className={`toggle ${form.available ? "on" : ""}`} onClick={() => setForm({...form, available: !form.available})} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mark as Popular?</label>
                <div style={{ paddingTop: 8 }}>
                  <button className={`toggle ${form.popular ? "on" : ""}`} onClick={() => setForm({...form, popular: !form.popular})} />
                </div>
              </div>
            </div>

            <button className="btn-save" onClick={save} disabled={saving}>
              {saving ? "Saving..." : isAdding ? "Add to Menu" : "Save Changes"}
            </button>
            {!isAdding && (
              <button onClick={deleteItem} disabled={saving} style={{ width: "100%", background: "none", border: "none", color: "#ef4444", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 12, fontFamily: "DM Sans, sans-serif", padding: 8 }}>
                Remove this item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
