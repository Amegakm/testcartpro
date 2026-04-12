let products = [];
let selectedProduct = null;

async function fetchProducts() {
  try {
    products = await apiFetch('/products');
    renderProducts();
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

function renderProducts() {
  const container = document.getElementById('product-list');
  if (!container) return;
  container.innerHTML = '';
  products.forEach(product => {
    container.innerHTML += `
      <div class="card" onclick="openModal(${product.id})">
        <img src="${product.image}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <div class="card-content">
          <h3>${product.name}</h3>
          <div class="price">₹${product.price}</div>
          <button class="add-btn" onclick="event.stopPropagation(); addToCart(${product.id})">Add to Cart</button>
        </div>
      </div>`;
  });
}

function openModal(id) {
  selectedProduct = products.find(p => p.id === id);
  if (!selectedProduct) return;
  document.getElementById('modalImage').src = selectedProduct.image;
  document.getElementById('modalTitle').innerText = selectedProduct.name;
  document.getElementById('modalDescription').innerText = selectedProduct.description;
  document.getElementById('modalPrice').innerText = 'Price: ₹' + selectedProduct.price;
  document.getElementById('productModal').style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.style.display = 'none';
}

function addFromModal() {
  if (selectedProduct) addToCart(selectedProduct.id);
  closeModal();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('product-list')) {
    fetchProducts();
  }
});
