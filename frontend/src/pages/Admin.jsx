import { useEffect, useState, useContext } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  query, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
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
};

export default function Admin() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders]             = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading]            = useState(true);
  const [expandedId, setExpandedId]      = useState(null);
  const [search, setSearch]              = useState('');
  const [filterStatus, setFilterStatus]  = useState('all');
  const [productData, setProductData]    = useState({
    name: '', price: '', image: '', description: ''
  });
  const [apiError, setApiError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ImgBB API Config
  const IMGBB_API_KEY = '418fe40dcd0ada37e62dc663e8655cbf';

  const handleImageFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setApiError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        setProductData(prev => ({ ...prev, image: result.data.display_url }));
      } else {
        throw new Error(result.error.message || 'Upload failed');
      }
    } catch (e) {
      setApiError(`Image Upload Failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    } else {
      setApiError('Please drop a valid image file.');
    }
  };

  const parseDate = (val) => {
    if (!val) return new Date().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    return new Date(val).toISOString();
  };

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const prodList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableProducts(prodList);
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    // Optimistic UI update: instantly remove from screen
    setAvailableProducts(prev => prev.filter(p => p.id !== id));
    
    try {
      await deleteDoc(doc(db, 'products', id));
      // Optionally fetch again to ensure full sync
      fetchProducts();
    } catch (e) {
      console.error('Delete error:', e);
      alert(`Delete failed: ${e.message}. Please refresh the page.`);
      fetchProducts(); // Restore the item if deletion failed
    }
  };

  const fetchAdminOrders = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ordersList = querySnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            created_at: parseDate(data.createdAt || data.created_at)
          };
        } catch (err) {
          console.error(`Skipping corrupted order ${doc.id}:`, err);
          return null;
        }
      }).filter(Boolean);

      setOrders(ordersList);
    } catch (e) {
      console.error(e);
      let msg = e.message;
      if (msg.includes('index')) {
        msg = 'Database Index Required. See browser console for the creation link.';
      }
      setApiError(`Database Error: ${msg}`);
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
    fetchProducts();
  }, [user, navigate]);

  const handleStatusChange = async (id, status) => {
    try {
      const orderRef = doc(db, 'orders', id);
      await updateDoc(orderRef, { status });
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      alert(`Failed to update status: ${e.message}`);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        name: productData.name,
        price: parseInt(productData.price),
        image: productData.image,
        description: productData.description,
        createdAt: new Date()
      });
      alert('Product published! 🎉');
      setProductData({ name: '', price: '', image: '', description: '' });
      fetchAdminOrders();
      fetchProducts();
    } catch (e) {
      setApiError(`Action Failed: ${e.message}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const seedProducts = async () => {
    if (!window.confirm('Add all sample products to Firestore?')) return;
    try {
      const defaultProducts = [
        { name: 'Gaming Mouse', price: 1299, image: 'https://images.unsplash.com/photo-1527814050087-379381547969?w=500&q=80', description: 'High precision gaming mouse with RGB lighting' },
        { name: 'Mechanical Keyboard', price: 4999, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80', description: 'Mechanical keyboard with cherry switches' },
        { name: 'Wireless Headphones', price: 2499, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', description: 'Noise-cancelling wireless headphones' },
        { name: 'Laptop Backpack', price: 1999, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', description: 'Durable laptop backpack with USB charging' },
        { name: 'Smart Watch', price: 3999, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', description: 'Fitness tracking smart watch' },
        { name: 'Bluetooth Speaker', price: 1799, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80', description: 'Portable waterproof Bluetooth speaker' },
      ];

      const batch = writeBatch(db);
      defaultProducts.forEach(prod => {
        const newDocRef = doc(collection(db, 'products'));
        batch.set(newDocRef, { ...prod, createdAt: new Date() });
      });
      await batch.commit();

      alert('Products seeded successfully!');
      setProductData({ name: '', price: '', image: '', description: '' });
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert(`Seeding failed: ${e.message}`);
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      String(o.id).includes(q) ||
      o.userEmail?.toLowerCase().includes(q) ||
      o.shippingAddress?.toLowerCase().includes(q);
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
      {apiError && (
        <div style={{
          background: '#fee2e2', color: '#991b1b', padding: '16px 20px', 
          borderRadius: '12px', marginBottom: '24px', border: '1px solid #fecaca',
          fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>⚠️ {apiError}</span>
          <button onClick={() => setApiError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
      )}


      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">Manage orders & products</p>
        </div>
        <button className="btn" onClick={fetchAdminOrders}>↻ Refresh</button>
      </div>

      <div className="admin-stats">
        {[
          { label: 'Total Orders',   value: stats.total,     color: '#3b82f6' },
          { label: 'Pending',        value: stats.pending,   color: '#f59e0b' },
          { label: 'Shipped',        value: stats.shipped,   color: '#0ea5e9' },
          { label: 'Delivered',      value: stats.delivered, color: '#16a34a' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
            <span className="stat-num" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="section-heading" style={{ marginBottom: 0 }}>All Orders</h2>
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
              const payKey = (order.payment?.status || '').replace(/-/g, '_');
              const payLabel = PAYMENT_LABELS[payKey] || order.payment?.status || '—';
              const s = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              const isExpanded = expandedId === order.id;

              return (
                <div key={order.id} className="order-card">
                  <div
                    className="order-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="order-meta">
                      <span className="order-id">#{order.id.slice(-6)}</span>
                      <span className="order-user">
                        Customer
                        <small>{order.userEmail}</small>
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

                  {isExpanded && (
                    <div className="order-card-body">
                      <div className="order-detail-row">
                        <strong>Delivery Address</strong>
                        <p>{order.shippingAddress || '—'}</p>
                      </div>

                      <div className="order-detail-row">
                        <strong>Placed On</strong>
                        <p>{new Date(order.created_at).toLocaleString('en-IN')}</p>
                      </div>

                      <div className="order-detail-row">
                        <strong>Items Ordered</strong>
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

      <div className="admin-section">
        <h2 className="section-heading">Manage Products</h2>
        <div className="admin-product-list">
          {availableProducts.length === 0 ? (
            <p className="admin-loading">No products found.</p>
          ) : (
            <div className="manage-product-grid">
              {availableProducts.map(prod => (
                <div key={prod.id} className="manage-product-item">
                  <img src={prod.image} alt={prod.name} className="manage-product-img" />
                  <div className="manage-product-info">
                    <strong>{prod.name}</strong>
                    <span>₹{prod.price}</span>
                  </div>
                  <button 
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteProduct(prod.id)}
                    title="Delete Product"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-section">
        <h2 className="section-heading">Add New Product</h2>
        <button className="btn btn-green" onClick={seedProducts} style={{ marginBottom: '16px', width: '100%' }}>
          📦 Seed Sample Products
        </button>
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
          
          <div 
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input 
              type="file" 
              id="fileInput" 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={(e) => handleImageFile(e.target.files[0])}
            />
            {uploading ? (
              <div className="upload-text">Uploading image to ImgBB...</div>
            ) : productData.image ? (
              <div className="preview-container">
                <img src={productData.image} alt="Preview" className="preview-img" />
                <div className="upload-text">Image Uploaded! Drop another to change.</div>
              </div>
            ) : (
              <>
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  <strong>Click to upload</strong> or drag and drop<br/>
                  <span>Images only (PNG, JPG, GIF)</span>
                </div>
              </>
            )}
            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar" style={{ width: '100%', animation: 'loading 1s infinite linear' }}></div>
              </div>
            )}
          </div>

          <input
            type="text" placeholder="Description"
            value={productData.description}
            onChange={e => setProductData({ ...productData, description: e.target.value })}
          />
          <button type="submit" className="btn btn-green" disabled={uploading}>
            {uploading ? 'Waiting for Image...' : 'Publish Product'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.3, fontSize: '10px' }}>
        Backend: Firebase Firestore
      </div>
    </div>
  );
}
