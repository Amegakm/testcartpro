import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);
  const { totalCount, setIsCartOpen } = useContext(CartContext);
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    setIsSettingsOpen(false);
    navigate('/login');
  };

  const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
    setIsSettingsOpen(false);
  };

  return (
    <header>
      <Link to="/" className="logo">TestCart Pro</Link>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/products">Product List</Link>
        {user ? (
          <>
            <Link to="/orders">My Orders</Link>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
          </>
        )}
      </nav>
      
      <div className="header-actions">
        <div className="cart-icon" onClick={() => setIsCartOpen(true)}>
          🛒
          {(totalCount > 0) && <span className="cart-badge">{totalCount}</span>}
        </div>
        
        {user && (
          <div className="settings-container">
            <span className="settings-icon" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>⚙️</span>
            {isSettingsOpen && (
              <div className="settings-dropdown">
                {user.role === 'admin' && (
                  <button onClick={() => { setIsSettingsOpen(false); navigate('/admin'); }}>
                    Admin Panel
                  </button>
                )}
                <button onClick={toggleTheme}>Toggle Theme</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
