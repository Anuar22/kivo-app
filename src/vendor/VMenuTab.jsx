import { useState } from "react";
import { API_BASE } from "../data/index.js";

function VMenuItemRow({ item, onToggle, onEdit }) {
  return (
    <div className="vm-item-row" style={{ opacity: item.available ? 1 : 0.55 }}>
      <div className="mi-emoji">{item.image}</div>
      <div className="mi-info">
        <div className="mi-name">{item.name}</div>
        <div className="mi-desc">{item.description}</div>
        <div className="mi-price">${item.price.toFixed(2)}</div>
      </div>
      <div className="mi-right">
        <button className={`toggle ${item.available ? "on" : ""}`} onClick={() => onToggle(item.id)} />
        <button className="btn-edit" onClick={() => onEdit(item)}>Edit</button>
      </div>
    </div>
  );
}

export default function VMenuTab({ vmenu, setVmenu, showToast }) {
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({});

  const saveRemote = async (item) => {
    const token = localStorage.getItem("kivo_token");
    if (!token) return null;
    const response = await fetch(`${API_BASE}/api/vendor/menu${item.id ? `/${item.id}` : ""}`, {
      method: item.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) return null;
    return response.json();
  };

  const toggleAvail = (id) => {
    const item = vmenu.find(m => m.id === id);
    setVmenu(prev => prev.map(m => m.id === id ? { ...m, available: !m.available } : m));
    saveRemote({ ...item, available: !item.available });
    showToast(item.available ? `⏸ "${item.name}" hidden from menu` : `✅ "${item.name}" back on menu`);
  };

  const openEdit = (item) => {
    setForm({ ...item, price: item.price.toString() });
    setEditingItem(item.id);
    setIsAdding(false);
  };

  const openAdd = () => {
    setForm({ name: "", price: "", image: "🍽️", description: "", available: true });
    setIsAdding(true);
    setEditingItem(null);
  };

  const saveEdit = async () => {
    if (!form.name || !form.price) return;
    const nextItem = { ...form, price: parseFloat(form.price) };
    if (isAdding) {
      const saved = await saveRemote(nextItem);
      setVmenu(prev => [...prev, saved || { ...nextItem, id: Date.now() }]);
      showToast("✨ New item added to menu!");
    } else {
      const saved = await saveRemote({ ...nextItem, id: editingItem });
      setVmenu(prev => prev.map(m => m.id === editingItem ? (saved || { ...nextItem, id: m.id }) : m));
      showToast("✏️ Menu item updated!");
    }
    setEditingItem(null);
    setIsAdding(false);
  };

  const deleteItem = () => {
    const token = localStorage.getItem("kivo_token");
    if (token) {
      fetch(`${API_BASE}/api/vendor/menu/${editingItem}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setVmenu(prev => prev.filter(m => m.id !== editingItem));
    showToast("🗑 Item removed from menu");
    setEditingItem(null);
  };

  const closeModal = () => { setEditingItem(null); setIsAdding(false); };

  const available = vmenu.filter(m => m.available);
  const hidden = vmenu.filter(m => !m.available);
  const showModal = editingItem !== null || isAdding;

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
              <input className="form-input" value={form.image || ""} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="🍽️" style={{ fontSize: 22, textAlign: "center" }} />
            </div>
            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input className="form-input" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nyama Choma Plate" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Price ($)</label>
                <input className="form-input" type="number" step="0.50" value={form.price || ""} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Available?</label>
                <div style={{ paddingTop: 8 }}>
                  <button className={`toggle ${form.available ? "on" : ""}`} onClick={() => setForm({ ...form, available: !form.available })} />
                </div>
              </div>
            </div>

            <button className="btn-save" onClick={saveEdit}>
              {isAdding ? "Add to Menu" : "Save Changes"}
            </button>

            {!isAdding && (
              <button
                onClick={deleteItem}
                style={{ width: "100%", background: "none", border: "none", color: "#ef4444", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 12, fontFamily: "DM Sans, sans-serif", padding: "8px" }}
              >
                Remove this item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
