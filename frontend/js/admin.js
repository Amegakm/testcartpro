const user = getUser();
if (!user || user.role !== 'admin') {
  alert('Access Denied');
  window.location.href = 'index.html';
}

async function loadAdminOrders() {
  try {
    const orders = await apiFetch('/admin/orders');
    const list = document.getElementById('admin-orders');
    if (orders.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding: 40px;">No orders found.</div>`;
      return;
    }
    list.innerHTML = '';
    orders.forEach(o => {
      let itemsHtml = o.items ? o.items.map(i => `
        <div style="display: flex; align-items: center; gap: 15px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
          <img src="${i.image}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;">
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: 500;">${i.name}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Qty: ${i.quantity} × ₹${i.price}</p>
          </div>
          <div style="font-weight: 600;">₹${i.quantity * i.price}</div>
        </div>
      `).join('') : '';

      list.innerHTML += `
        <div style="background: white; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 12px; border: 1px solid #cbd5e1; position:relative;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <h3 style="margin: 0; color: #0f172a;">Order #${o.id}</h3>
              <div style="color: #64748b; font-size: 13px; margin-top: 5px;">
                <strong>Customer:</strong> ${o.user_name} (${o.user_email})<br>
                <strong>Date:</strong> ${new Date(o.created_at).toLocaleString()}<br>
                <strong>Shipping Address:</strong> <span style="color:#ef4444; font-weight:500;">${o.shipping_address || 'N/A'}</span>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
               <select id="status_${o.id}" style="padding:6px; border-radius:6px; border:1px solid #94a3b8; font-family:inherit;">
                <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
                <option value="shipped" ${o.status==='shipped'?'selected':''}>Shipped</option>
                <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
               </select>
               <button class="btn btn-green" onclick="updateOrderStatus(${o.id})" style="padding: 6px 12px; font-size:12px;">Update Status</button>
            </div>
          </div>
          ${itemsHtml}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 2px dashed #e2e8f0;">
            <strong style="font-size: 16px;">Total Order Value</strong>
            <strong style="font-size: 18px; color: #16a34a;">₹${o.total}</strong>
          </div>
        </div>`;
    });
  } catch (e) {
    list.innerHTML = `<div style="text-align:center; color:red; padding: 40px;">Error loading orders</div>`; 
  }
}

async function updateOrderStatus(id) {
  const status = document.getElementById(`status_${id}`).value;
  try {
    await apiFetch(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    alert('Status updated');
  } catch (e) { alert('Update failed'); }
}

async function addProduct(e) {
  e.preventDefault();
  try {
    await apiFetch('/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('p_name').value,
        price: document.getElementById('p_price').value,
        image: document.getElementById('p_image').value,
        description: document.getElementById('p_desc').value
      })
    });
    alert('Product added');
    e.target.reset();
  } catch (error) { alert('Failed to add product'); }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) form.addEventListener('submit', addProduct);
    loadAdminOrders();
});
