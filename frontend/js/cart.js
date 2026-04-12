let globalCart = [];

async function loadCart() {
  if (!getToken()) return;
  try {
    globalCart = await apiFetch('/cart');
    updateCartUI();
  } catch (e) {
    console.error('Failed fetching cart', e);
  }
}

async function addToCart(product_id) {
  if (!getToken()) {
    alert("Please log in to add items.");
    window.location.href = 'login.html';
    return;
  }
  try {
    await apiFetch('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ product_id, quantity: 1 })
    });
    
    await loadCart();
    
    const el = document.getElementById('cart-panel');
    if (el && !el.classList.contains('active')) el.classList.add('active');
  } catch (e) { 
    alert("Error adding to cart: " + e.message); 
  }
}

async function removeFromCart(product_id) {
  try {
    await apiFetch('/cart/remove', {
      method: 'POST',
      body: JSON.stringify({ product_id })
    });
    loadCart();
  } catch (e) { alert("Error removing from cart: " + e.message); }
}

function updateCartUI() {
  const container = document.getElementById('cart-items');
  const count = document.getElementById('cart-count');
  const totalElem = document.getElementById('cart-total');
  if(!container) return;

  container.innerHTML = '';
  let total = 0;
  let qCount = 0;

  globalCart.forEach(item => {
    total += (item.price * item.quantity);
    qCount += item.quantity;
    container.innerHTML += `
      <div class="cart-item">
        <span>${item.name} (x${item.quantity}) - ₹${item.price}</span>
        <button onclick="removeFromCart(${item.product_id})">X</button>
      </div>`;
  });

  if(count) count.innerText = qCount;
  if(totalElem) totalElem.innerText = total;
}

function toggleCart() {
  const el = document.getElementById('cart-panel');
  if(el) el.classList.toggle('active');
}

async function checkout() {
  if (!getToken()) return alert("Please log in.");
  if (globalCart.length === 0) return alert("Your cart is empty.");
  
  const addressElem = document.getElementById('shipping-address');
  const address = addressElem ? addressElem.value.trim() : '';
  if (!address) return alert("Please enter a shipping address before checkout.");

  const total = globalCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  try {
    await apiFetch('/orders/create', {
      method: 'POST',
      body: JSON.stringify({ items: globalCart, total, address })
    });
    
    alert('Order Placed Successfully!');
    window.location.href = 'orders.html';
  } catch (error) {
    alert('Checkout failed: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cart-items')) loadCart();
});
