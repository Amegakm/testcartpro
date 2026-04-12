import { useEffect, useState, useContext } from 'react';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [productData, setProductData] = useState({ name: '', price: '', image: '', description: '' });

  const fetchAdminOrders = async () => {
    try {
      const data = await apiFetch('/admin/orders');
      setOrders(data);
    } catch (e) { console.error('Admin fetching failed', e); }
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
        body: JSON.stringify({ status })
      });
      alert('Order Updated!');
      fetchAdminOrders();
    } catch (e) {
      alert('Failed updating');
      console.error(e);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      alert('Product created completely');
      setProductData({ name: '', price: '', image: '', description: '' });
    } catch (e) {
      alert('Product creation failure');
      console.error(e);
    }
  };

  return (
    <div>
      <div className="form-container" style={{ marginTop: '40px', marginBottom: '40px' }}>
        <h2>Add New Product</h2>
        <form onSubmit={addProduct}>
          <input type="text" placeholder="Product Name" value={productData.name} onChange={e=>setProductData({...productData, name: e.target.value})} required />
          <input type="number" placeholder="Price (INR)" value={productData.price} onChange={e=>setProductData({...productData, price: e.target.value})} required />
          <input type="text" placeholder="Image URL" value={productData.image} onChange={e=>setProductData({...productData, image: e.target.value})} />
          <input type="text" placeholder="Description" value={productData.description} onChange={e=>setProductData({...productData, description: e.target.value})} />
          <button type="submit" className="btn btn-green btn-full">Publish</button>
        </form>
      </div>

      <div className="table-container" style={{ paddingTop: 0 }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Manage Orders</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.user_name} ({o.user_email})</td>
                <td>₹{o.total}</td>
                <td>
                  <select 
                    defaultValue={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
                <td><button className="btn" onClick={() => fetchAdminOrders()}>Refresh</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
