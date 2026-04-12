async function loadOrders() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }
  
  const list = document.getElementById('orders-list');
  if(!list) return;

  try {
    const orders = await apiFetch('/orders');
    
    if (orders.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding: 40px;">You have no orders yet.</div>`;
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
        <div style="background: white; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <h3 style="margin: 0; color: #1e293b;">Order #${o.id}</h3>
            <strong style="color: ${o.status === 'delivered' ? '#16a34a' : '#eab308'}; background: #f8fafc; padding: 4px 12px; border-radius: 9999px; font-size: 12px; border: 1px solid #e2e8f0;">
              ${o.status.toUpperCase()}
            </strong>
          </div>
          <div style="color: #64748b; font-size: 13px; margin-bottom: 10px;">Placed on: ${new Date(o.created_at).toLocaleDateString()}</div>
          ${itemsHtml}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #e2e8f0;">
            <strong style="font-size: 16px;">Total Amount Paid</strong>
            <strong style="font-size: 18px; color: #3b82f6;">₹${o.total}</strong>
          </div>
        </div>`;
    });
  } catch (e) { 
    list.innerHTML = `<div style="text-align:center; color:red; padding: 40px;">Error loading orders</div>`; 
  }
}

document.addEventListener('DOMContentLoaded', loadOrders);
