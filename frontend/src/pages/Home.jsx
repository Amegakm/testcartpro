import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <section className="section active">
        <div style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px', color: '#0f172a' }}>Welcome to TestCart Pro</h1>
          <p style={{ fontSize: '1.2rem', color: '#475569', lineHeight: '1.6', marginBottom: '30px' }}>
            A modern, full-stack e-commerce demo platform redesigned with a responsive <strong>React (Vite)</strong> frontend, 
            driven by a robust <strong>Node.js, Express, & MySQL</strong> backend.
          </p>
          <div style={{ textAlign: 'left', background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '40px' }}>
            <h3 style={{ marginBottom: '16px', color: '#1e293b' }}>Project Features:</h3>
            <ul style={{ listStylePosition: 'inside', color: '#64748b', fontSize: '1rem', lineHeight: '2' }}>
              <li>🛒 <strong>State Management</strong>: Real-time Context API cart handling</li>
              <li>🔐 <strong>Authentication</strong>: Secure JWT login & Role-based access control</li>
              <li>👨‍💻 <strong>Admin Dashboard</strong>: Complete order management & status tracking system</li>
              <li>💳 <strong>Payments</strong>: Integrated Razorpay checkout flow with COD support</li>
            </ul>
          </div>
          <Link to="/products" className="btn btn-green" style={{ fontSize: '1.2rem', padding: '16px 32px' }}>
            Explore Product List →
          </Link>
        </div>
      </section>
    </div>
  );
}
