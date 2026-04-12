const API_URL = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

function updateNav() {
  const user = getUser();
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  
  const links = nav.querySelectorAll('.dynamic-link');
  links.forEach(l => l.remove());

  if (user) {
    if (user.role === 'admin') {
      nav.innerHTML += `<a href="admin.html" class="dynamic-link">Admin</a>`;
    }
    nav.innerHTML += `
      <a href="orders.html" class="dynamic-link">Orders</a>
      <a onclick="logout()" class="dynamic-link" style="cursor:pointer">Logout (${user.name})</a>`;
  } else {
    nav.innerHTML += `
      <a href="login.html" class="dynamic-link">Login</a>`;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function showSection(sectionId) {
  if (window.location.pathname.indexOf('index.html') === -1 && window.location.pathname !== '/' && !window.location.pathname.endsWith('frontend/')) {
    window.location.href = 'index.html';
    return;
  }
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  const el = document.getElementById(sectionId);
  if(el) el.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  updateNav();
});
