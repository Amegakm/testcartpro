import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <section className="section active">
        <div className="hero-container">
          <h1 className="hero-title">Welcome to TestCart Pro</h1>
          <p className="hero-desc">
            A modern, full-stack e-commerce demo platform redesigned with a responsive <strong>React (Vite)</strong> frontend, 
            driven by a robust <strong>Node.js, Express, & MySQL</strong> backend.
          </p>
          <div className="features-box">
            <h3 className="features-title">Project Features:</h3>
            <ul className="features-list">
              <li>🛒 <strong>State Management</strong>: Real-time Context API cart handling</li>
              <li>🔐 <strong>Authentication</strong>: Secure JWT login & Role-based access control</li>
              <li>👨‍💻 <strong>Admin Dashboard</strong>: Complete order management & status tracking system</li>
              <li>💳 <strong>Payments</strong>: Integrated Razorpay checkout flow with COD support</li>
            </ul>
          </div>
          <Link to="/products" className="btn btn-green hero-btn">
            Explore Product List →
          </Link>
        </div>
      </section>
    </div>
  );
}
