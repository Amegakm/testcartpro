import { useEffect, useState, useContext } from 'react';
import { apiFetch } from '../utils/api';
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
  const [expandedId, setExpandedId] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return navigate('/login');
    const fetchOrders = async () => {
      try {
        const data = await apiFetch('/orders');
        setOrders(data);
      } catch (err) {
        console.error('Failed fetching orders', err);
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

      {loading ? (
        <p className="orders-empty">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div className="orders-empty-box">
          <span className="orders-empty-icon">🛍️</span>
          <h3>No orders yet!</h3>
          <p>Start shopping and your orders will appear here.</p>
          <button className="btn btn-green" onClick={() => navigate('/')}>Browse Products</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === order.id;
            const itemCount = (order.items || []).reduce((a, i) => a + i.quantity, 0);

            return (
              <div key={order.id} className="order-history-card">
                {/* Card Header */}
                <div
                  className="order-history-header"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {/* Left — images + info grouped tight */}
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

                  {/* Right — total + status + toggle */}
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

                {/* Expanded Items */}
                {isExpanded && (
                  <div className="order-history-body">
                    {/* Shipping address if available */}
                    {order.shipping_address && (
                      <div className="oh-address">
                        <span>📍</span>
                        <p>{order.shipping_address}</p>
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
