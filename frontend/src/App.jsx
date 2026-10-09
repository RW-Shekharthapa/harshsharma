import { useState, useEffect } from 'react'
import './App.css'

const API = '/api'

const CATEGORIES = ['T-Shirt', 'Shirt', 'Jeans', 'Trousers', 'Jacket', 'Dress', 'Skirt', 'Shorts', 'Sweater', 'Other']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size']

const empty = { name: '', category: 'T-Shirt', size: 'M', color: '', quantity: 1, price: '' }

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/clothes`)
      setItems(await res.json())
    } catch {
      setError('Failed to load items')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = { ...form, quantity: Number(form.quantity), price: Number(form.price) }
    try {
      if (editId) {
        await fetch(`${API}/clothes/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await fetch(`${API}/clothes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      setForm(empty)
      setEditId(null)
      setShowForm(false)
      load()
    } catch {
      setError('Failed to save item')
    }
  }

  const handleEdit = (item) => {
    setForm({ name: item.name, category: item.category, size: item.size, color: item.color, quantity: item.quantity, price: item.price })
    setEditId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await fetch(`${API}/clothes/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = items.filter(i =>
    (filterCat === 'All' || i.category === filterCat) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.color.toLowerCase().includes(search.toLowerCase()))
  )

  const totalValue = filtered.reduce((s, i) => s + Number(i.price) * i.quantity, 0)

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1>👗 Cloth Manager</h1>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }}>+ Add Item</button>
        </div>
      </header>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Edit Item' : 'Add New Item'}</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="form">
              <label>Name
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Blue Denim Jacket" />
              </label>
              <div className="form-row">
                <label>Category
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label>Size
                  <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                    {SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>Color
                  <input required value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="e.g. Navy Blue" />
                </label>
                <label>Quantity
                  <input type="number" min="0" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </label>
              </div>
              <label>Price (₹)
                <input type="number" min="0" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="main">
        <div className="stats">
          <div className="stat"><span className="stat-val">{items.length}</span><span className="stat-label">Total Items</span></div>
          <div className="stat"><span className="stat-val">{items.reduce((s, i) => s + i.quantity, 0)}</span><span className="stat-label">Total Stock</span></div>
          <div className="stat"><span className="stat-val">₹{items.reduce((s, i) => s + Number(i.price) * i.quantity, 0).toFixed(2)}</span><span className="stat-label">Inventory Value</span></div>
        </div>

        <div className="toolbar">
          <input className="search" placeholder="Search by name or color..." value={search} onChange={e => setSearch(e.target.value)} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading && <p className="center">Loading...</p>}
        {!loading && filtered.length === 0 && <p className="center empty">No items found. Add your first cloth item!</p>}

        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Category</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th><th>Value</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="badge">{item.category}</span></td>
                    <td>{item.size}</td>
                    <td>
                      <span className="color-dot" style={{ background: item.color.toLowerCase().replace(/\s/g, '') }}></span>
                      {item.color}
                    </td>
                    <td className={item.quantity === 0 ? 'out' : ''}>{item.quantity}</td>
                    <td>₹{Number(item.price).toFixed(2)}</td>
                    <td>₹{(Number(item.price) * item.quantity).toFixed(2)}</td>
                    <td className="actions">
                      <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(item)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="summary">Showing {filtered.length} items · Total value: ₹{totalValue.toFixed(2)}</p>
          </div>
        )}
      </main>
    </div>
  )
}
