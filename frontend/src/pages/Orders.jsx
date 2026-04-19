import { useEffect, useState, useContext } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fef9c3', icon: '🕐' },
  shipped:   { label: 'Shipped',   color: '#3b82f6', bg: '#dbeafe', icon: '🚚' },
  delivered: { label: 'Delivered', color: '#16a34a', bg: '#dcfce7', icon: '✅' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indexLink, setIndexLink] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const parseDate = (val) => {
    if (!val) return new Date().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    return new Date(val).toISOString();
  };

  useEffect(() => {
    if (!user) return navigate('/login');
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      setIndexLink(null);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const ordersList = querySnapshot.docs.map(doc => {
          try {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              created_at: parseDate(data.createdAt || data.created_at)
            };
          } catch (e) {
            console.error('Error parsing order:', doc.id, e);
            return null;
          }
        }).filter(Boolean);
        setOrders(ordersList);
      } catch (err) {
        console.error('Failed fetching orders', err);
        let msg = err.message;
        if (msg.includes('index')) {
          const urlMatch = msg.match(/(https:\/\/console\.firebase\.google\.com[^\s]+)/);
          if (urlMatch) {
            setIndexLink(urlMatch[0]);
          }
          msg = 'Database indexing is required to show your orders. Please generate the index by clicking the button below. Once created, wait about 1-2 minutes and refresh.';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, navigate]);

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1 className="orders-title">My Orders</h1>
        <p className="orders-sub">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2', color: '#b91c1c', padding: '16px', 
          borderRadius: '12px', marginBottom: '24px', border: '1px solid #fecaca',
          fontSize: '14px', lineHeight: '1.5'
        }}>
          <strong>⚠️ Database Setup Required</strong><br/>
          {error}
          {indexLink && (
            <div style={{ marginTop: '12px' }}>
              <a href={indexLink} target="_blank" rel="noreferrer" style={{
                display: 'inline-block', padding: '10px 16px', background: '#b91c1c', 
                color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold'
              }}>
                Create Database Index
              </a>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="orders-empty">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div className="orders-empty-box">
          <span className="orders-empty-icon">🛍️</span>
          <h3>No orders yet!</h3>
          <p>Start shopping and your orders will appear here.</p>
          <button className="btn btn-green" onClick={() => navigate('/products')}>Browse Products</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === order.id;
            const itemCount = (order.items || []).reduce((a, i) => a + i.quantity, 0);

            return (
              <div key={order.id} className="order-history-card">
                <div
                  className="order-history-header"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="oh-group">
                    <div className="oh-previews">
                      {(order.items || []).slice(0, 4).map((item, i) => (
                        <img
                          key={i}
                          src={item.image}
                          alt={item.name}
                          className="oh-preview-img"
                          title={item.name}
                        />
                      ))}
                      {(order.items || []).length > 4 && (
                        <span className="oh-more">+{order.items.length - 4}</span>
                      )}
                    </div>
                    <div className="oh-left">
                      <span className="oh-order-id">
                        🚚 Deliver by {new Date(new Date(order.created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      <span className="oh-date">
                        Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      <span className="oh-items-count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="oh-right">
                    <span className="oh-total">₹{Number(order.total).toFixed(2)}</span>
                    <span
                      className="oh-status"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.icon} {s.label}
                    </span>
                    <span className="oh-chevron">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="order-history-body">
                    {order.shippingAddress && (
                      <div className="oh-address">
                        <span>📍</span>
                        <p>{order.shippingAddress}</p>
                      </div>
                    )}

                    <div className="oh-items">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="oh-item">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="oh-item-img"
                          />
                          <div className="oh-item-info">
                            <strong>{item.name}</strong>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <span className="oh-item-price">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="oh-footer">
                      <span>Order Total</span>
                      <strong>₹{Number(order.total).toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
