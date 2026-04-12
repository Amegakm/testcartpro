import { useEffect, useState, useContext } from 'react';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
  const [orders, setOrders] = useState([]);
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
      }
    };
    fetchOrders();
  }, [user, navigate]);

  return (
    <div className="table-container">
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>My Orders</h2>
      {orders.length === 0 ? (
        <p style={{ textAlign: 'center' }}>You have no orders yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>₹{o.total}</td>
                <td><strong style={{ color: o.status === 'delivered' ? '#16a34a' : (o.status === 'shipped' ? '#eab308' : '#64748b') }}>{o.status.toUpperCase()}</strong></td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
