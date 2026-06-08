import { useState, useEffect } from "react";
import { vendorsApi } from "../api/index.js";

function VMenuItemRow({ item, onToggle, onEdit }) {
  return (
    <div className="vm-item-row" style={{ opacity: item.available ? 1 : 0.55 }}>
      <div className="mi-emoji">{item.image}</div>
      <div className="mi-info">
        <div className="mi-name">{item.name}</div>
        <div className="mi-desc">{item.description}</div>
        <div className="mi-price">${Number(item.price).toFixed(2)}</div>
      </div>
      <div className="mi-right">
        <button className={`toggle ${item.available ? "on" : ""}`} onClick={() => onToggle(item)} />
        <button className="btn-edit" onClick={() => onEdit(item)}>Edit</button>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: "", price: "", image: "🍽️", description: "", available: true, popular: false };

export default function VMenuTab({ showToast }) {
  const [menu, setMenu]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [isAdding, setIsAdding]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);

  useEffect(() => {
    vendorsApi.myMenu()
      .then(({ menu }) => setMenu(menu))
      .catch(e => showToast("⚠️ " + e.message))
      .finally(() => setLoading(false));
  }, []);

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
    setForm({ ...item, price: String(item.price) });
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
      const payload = { ...form, price: parseFloat(form.price) };
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
              <label className="form-label">Emoji Icon</label>
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
                <label className="form-label">Available?</label>
                <div style={{ paddingTop: 8 }}>
                  <button className={`toggle ${form.available ? "on" : ""}`} onClick={() => setForm({...form, available: !form.available})} />
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
