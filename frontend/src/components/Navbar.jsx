import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);
  const { totalCount, setIsCartOpen } = useContext(CartContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <header>
      <Link to="/" className="logo">TestCart Pro</Link>
      <nav>
        <Link to="/">Home</Link>
        {user ? (
          <>
            {user.role === 'admin' && <Link to="/admin" className="active">Admin</Link>}
            <Link to="/orders">My Orders</Link>
            <a onClick={handleLogout}>Logout ({user.name})</a>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
          </>
        )}
      </nav>
      <div className="cart-icon" onClick={() => setIsCartOpen(true)}>
        🛒
        {(totalCount > 0) && <span className="cart-badge">{totalCount}</span>}
      </div>
    </header>
  );
}
