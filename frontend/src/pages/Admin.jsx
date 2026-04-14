import { useEffect, useState, useContext } from 'react';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  pending:   { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  shipped:   { bg: '#dbeafe', color: '#1e40af', label: 'Shipped' },
  delivered: { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const PAYMENT_LABELS = {
  cod_pending: '🚚 COD',
  pending:     '💳 Razorpay (Pending)',
  successful:  '✅ Razorpay (Paid)',
  failed:      '❌ Razorpay (Failed)',
  N_A:         '—',
};

export default function Admin() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]        = useState(true);
  const [expandedId, setExpandedId]  = useState(null);
  const [search, setSearch]          = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [productData, setProductData] = useState({
    name: '', price: '', image: '', description: ''
  });

  const fetchAdminOrders = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/orders');
      setOrders(data);
    } catch (e) {
      console.error('Admin fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      alert('Access Denied: Admins Only');
      return navigate('/');
    }
    fetchAdminOrders();
  }, [user, navigate]);

  const handleStatusChange = async (id, status) => {
    try {
      await apiFetch(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setOrders(prev =>
        prev.map(o => (o.id === id ? { ...o, status } : o))
      );
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      alert('✅ Product published!');
      setProductData({ name: '', price: '', image: '', description: '' });
    } catch (e) {
      alert('Product creation failed');
    }
  };

  // Filter + search
  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      String(o.id).includes(q) ||
      o.user_name?.toLowerCase().includes(q) ||
      o.user_email?.toLowerCase().includes(q) ||
      o.shipping_address?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    shipped:   orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="admin-page">

      {/* ── Header ───────────────────────────────────── */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">Manage orders & products</p>
        </div>
        <button className="btn" onClick={fetchAdminOrders}>↻ Refresh</button>
      </div>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="admin-stats">
        {[
          { label: 'Total Orders',   value: stats.total,     color: '#6366f1' },
          { label: 'Pending',        value: stats.pending,   color: '#f59e0b' },
          { label: 'Shipped',        value: stats.shipped,   color: '#3b82f6' },
          { label: 'Delivered',      value: stats.delivered, color: '#16a34a' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
            <span className="stat-num" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Orders Section ───────────────────────────── */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="section-heading" style={{ marginBottom: 0 }}>📦 All Orders</h2>
          <div className="admin-filters">
            <input
              className="admin-search"
              placeholder="Search by name, email, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="admin-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="admin-loading">Loading orders...</p>
        ) : filtered.length === 0 ? (
          <p className="admin-loading">No orders found.</p>
        ) : (
          <div className="order-cards">
            {filtered.map(order => {
              const payKey = (order.payment_status || '').replace(/-/g, '_');
              const payLabel = PAYMENT_LABELS[payKey] || order.payment_status || '—';
              const s = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              const isExpanded = expandedId === order.id;

              return (
                <div key={order.id} className="order-card">
                  {/* Card Header */}
                  <div
                    className="order-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="order-meta">
                      <span className="order-id">#{order.id}</span>
                      <span className="order-user">
                        👤 {order.user_name}
                        <small>{order.user_email}</small>
                      </span>
                    </div>

                    <div className="order-meta-right">
                      <span className="order-total">₹{Number(order.total).toFixed(2)}</span>
                      <span className="order-payment">{payLabel}</span>
                      <span
                        className="order-status-badge"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                      <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="order-card-body">
                      {/* Address */}
                      <div className="order-detail-row">
                        <strong>📍 Delivery Address</strong>
                        <p>{order.shipping_address || '—'}</p>
                      </div>

                      {/* Date */}
                      <div className="order-detail-row">
                        <strong>🕐 Placed On</strong>
                        <p>{new Date(order.created_at).toLocaleString('en-IN')}</p>
                      </div>

                      {/* Items */}
                      <div className="order-detail-row">
                        <strong>🛒 Items Ordered</strong>
                        <div className="order-items-list">
                          {(order.items || []).map((item, i) => (
                            <div key={i} className="order-item-row">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="order-item-img" />
                              )}
                              <span className="order-item-name">{item.name}</span>
                              <span className="order-item-qty">x{item.quantity}</span>
                              <span className="order-item-price">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="order-detail-row order-status-row">
                        <strong>Update Status</strong>
                        <select
                          className="admin-select"
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Product ─────────────────────────────── */}
      <div className="admin-section">
        <h2 className="section-heading">➕ Add New Product</h2>
        <form className="admin-product-form" onSubmit={addProduct}>
          <input
            type="text" placeholder="Product Name"
            value={productData.name}
            onChange={e => setProductData({ ...productData, name: e.target.value })}
            required
          />
          <input
            type="number" placeholder="Price (₹)"
            value={productData.price}
            onChange={e => setProductData({ ...productData, price: e.target.value })}
            required
          />
          <input
            type="text" placeholder="Image URL"
            value={productData.image}
            onChange={e => setProductData({ ...productData, image: e.target.value })}
          />
          <input
            type="text" placeholder="Description"
            value={productData.description}
            onChange={e => setProductData({ ...productData, description: e.target.value })}
          />
          <button type="submit" className="btn btn-green">Publish Product</button>
        </form>
      </div>

    </div>
  );
}
