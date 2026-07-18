import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";
import { fmt } from "../utils/currency.js";

function VMenuItemRow({ item, onToggle, onEdit }) {
  return (
    <div 
      className="vm-item-row" 
      style={{ 
        opacity: item.available ? 1 : 0.55,
        background: "#121212",
        border: "1px solid #222222",
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        gap: "16px",
        alignItems: "center",
        marginBottom: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
      }}
    >
      <div className="mi-photo" style={{ width: "56px", height: "56px", borderRadius: "10px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #262626", overflow: "hidden", flexShrink: 0 }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="mi-photo-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="mi-emoji" style={{ fontSize: "28px" }}>{item.image}</span>
        )}
      </div>
      
      <div className="mi-info" style={{ flex: 1, minWidth: 0 }}>
        <div className="mi-name" style={{ color: "#ffffff", fontSize: "15px", fontWeight: "700", marginBottom: "2px" }}>{item.name}</div>
        <div className="mi-desc" style={{ color: "#a0a0a0", fontSize: "12px", lineHeight: "1.4", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>
        <div className="mi-price" style={{ color: "#e53935", fontSize: "14px", fontWeight: "800" }}>{fmt(item.price)}</div>
        <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
          {item.prep_time_minutes ? (
            <span style={{ fontSize: "11px", fontWeight: "600", color: "#666666", background: "#1a1a1a", padding: "2px 6px", borderRadius: "4px" }}>⏱ {item.prep_time_minutes} min</span>
          ) : null}
          {item.order_count > 0 ? (
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#f97316", background: "rgba(249, 115, 22, 0.12)", padding: "2px 6px", borderRadius: "4px" }}>🔥 {item.order_count} ordered (30d)</span>
          ) : null}
        </div>
      </div>

      <div className="mi-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
        <button 
          className={`toggle ${item.available ? "on" : ""}`} 
          onClick={() => onToggle(item)} 
          style={{
            width: "38px", height: "22px", borderRadius: "11px", background: item.available ? "#e53935" : "#333333", position: "relative", border: "none", cursor: "pointer", transition: "0.2s"
          }}
        >
          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#ffffff", position: "absolute", top: "3px", left: item.available ? "19px" : "3px", transition: "0.2s" }} />
        </button>
        <button className="btn-edit" onClick={() => onEdit(item)} style={{ background: "none", border: "1px solid #333333", color: "#ffffff", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Edit</button>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: "", price: "", image: "🍔", image_url: "", description: "", available: true, popular: false, prep_time_minutes: "" };

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

  if (loading) return <div className="vd-content" style={{ background: "#000000", minHeight: "40vh" }}><div className="empty-orders" style={{ textAlign: "center", padding: "40px 0" }}><div className="emoji" style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div><p style={{ color: "#a0a0a0" }}>Loading menu...</p></div></div>;

  return (
    <div className="vd-content" style={{ marginTop: "12px" }}>
      {/* Metrics Row */}
      <div className="stats-row" style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <div className="stat-card" style={{ flex: 1, background: "#121212", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
          <div className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#666666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Live items</div>
          <div className="stat-value green" style={{ fontSize: "24px", fontWeight: "800", color: "#16a34a", margin: "4px 0 2px" }}>{available.length}</div>
          <div className="stat-sub" style={{ fontSize: "11px", color: "#666666" }}>visible to customers</div>
        </div>
        <div className="stat-card" style={{ flex: 1, background: "#121212", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
          <div className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#666666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hidden</div>
          <div className="stat-value" style={{ fontSize: "24px", fontWeight: "800", color: "#666666", margin: "4px 0 2px" }}>{hidden.length}</div>
          <div className="stat-sub" style={{ fontSize: "11px", color: "#666666" }}>not on menu</div>
        </div>
      </div>

      {available.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div className="vd-section-title" style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "800", color: "#ffffff", marginBottom: "12px" }}>Live on Menu</div>
          {available.map(item => <VMenuItemRow key={item.id} item={item} onToggle={toggleAvail} onEdit={openEdit} />)}
        </div>
      )}
      
      {hidden.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div className="vd-section-title" style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "800", color: "#666666", marginBottom: "12px" }}>Hidden</div>
          {hidden.map(item => <VMenuItemRow key={item.id} item={item} onToggle={toggleAvail} onEdit={openEdit} />)}
        </div>
      )}

      {/* Floating Add Trigger Button */}
      <button 
        className="btn-add-item" 
        onClick={openAdd}
        style={{ width: "100%", height: "50px", background: "#e53935", color: "#ffffff", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "24px", boxShadow: "0 4px 14px rgba(229,57,53,0.25)" }}
      >
        <span style={{ fontSize: "18px" }}>+</span> Add Menu Item
      </button>

      {/* Modern Black Editor Layer Overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", backdropFilter: "blur(4px)" }}>
          <div className="modal-sheet" style={{ background: "#121212", border: "1px solid #222222", width: "100%", maxWidth: "380px", borderRadius: "20px", padding: "20px", boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #1a1a1a", paddingBottom: "12px" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>
                {isAdding ? "Add New Item" : "Edit Item"}
              </span>
              <button className="modal-close" onClick={closeModal} style={{ background: "none", border: "none", color: "#666666", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            {/* Photo Picker Wrapper */}
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Photo</label>
              {form.image_url ? (
                <div style={{ position: "relative", marginBottom: "4px" }}>
                  <img
                    src={form.image_url}
                    alt="Menu item"
                    style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "12px", border: "1px solid #222222" }}
                  />
                  <button
                    onClick={removePhoto}
                    type="button"
                    style={{
                      position: "absolute", top: "8px", right: "8px", width: "28px", height: "28px", borderRadius: "50%",
                      background: "rgba(0,0,0,0.75)", border: "none", color: "white", fontSize: "14px",
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
                    width: "100%", height: "90px", borderRadius: "12px", border: "1.5px dashed #222222",
                    background: "#000000", color: "#666666", fontSize: "13px", fontWeight: "600",
                    cursor: uploadingPhoto ? "not-allowed" : "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: "4px"
                  }}
                >
                  {uploadingPhoto ? <>🔄 Uploading…</> : <>📷 Tap to add a photo<span style={{ fontSize: "10px", fontWeight: "400", color: "#444444" }}>JPG or PNG, up to 5MB</span></>}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoPick} style={{ display: "none" }} />
              <p style={{ fontSize: "11px", color: "#444444", marginTop: "6px", margin: 0 }}>Placeholder icon fallback active if image is skipped.</p>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Emoji Icon placeholder</label>
              <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", fontSize: "20px", textAlign: "center", outline: "none", boxSizing: "border-box" }} value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Item Name</label>
              <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", padding: "0 12px", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Nyama Choma Plate" />
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Description</label>
              <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", padding: "0 12px", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Short description" />
            </div>

            <div className="form-row" style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Price (TSh)</label>
                <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", padding: "0 12px", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} type="number" step="500" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="e.g. 5000" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Prep Time (min)</label>
                <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", padding: "0 12px", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} type="number" min="0" step="1" value={form.prep_time_minutes} onChange={e => setForm({...form, prep_time_minutes: e.target.value})} placeholder="e.g. 15" />
              </div>
            </div>

            <div className="form-row" style={{ display: "flex", gap: "10px", marginBottom: "24px", background: "#0a0a0a", padding: "10px", borderRadius: "12px", border: "1px solid #1a1a1a" }}>
              <div className="form-group" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <label className="form-label" style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", marginBottom: "4px" }}>Available?</label>
                <button 
                  className={`toggle ${form.available ? "on" : ""}`} 
                  onClick={() => setForm({...form, available: !form.available})}
                  type="button"
                  style={{ width: "38px", height: "22px", borderRadius: "11px", background: form.available ? "#e53935" : "#333333", position: "relative", border: "none", cursor: "pointer", transition: "0.2s" }}
                >
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#ffffff", position: "absolute", top: "3px", left: form.available ? "19px" : "3px", transition: "0.2s" }} />
                </button>
              </div>
              <div className="form-group" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <label className="form-label" style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", marginBottom: "4px" }}>Popular item?</label>
                <button 
                  className={`toggle ${form.popular ? "on" : ""}`} 
                  onClick={() => setForm({...form, popular: !form.popular})}
                  type="button"
                  style={{ width: "38px", height: "22px", borderRadius: "11px", background: form.popular ? "#e53935" : "#333333", position: "relative", border: "none", cursor: "pointer", transition: "0.2s" }}
                >
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#ffffff", position: "absolute", top: "3px", left: form.popular ? "19px" : "3px", transition: "0.2s" }} />
                </button>
              </div>
            </div>

            {/* Action Triggers */}
            <button className="btn-save" onClick={save} disabled={saving} style={{ width: "100%", height: "44px", background: "#e53935", color: "#ffffff", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "14px", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : isAdding ? "Add to Menu" : "Save Changes"}
            </button>
            {!isAdding && (
              <button onClick={deleteItem} disabled={saving} style={{ width: "100%", background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginTop: "12px", padding: "6px" }}>
                Remove this item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}