import { useEffect, useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { apiFetch } from '../utils/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiFetch('/products');
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products', error);
      }
    };
    loadProducts();
  }, []);

  return (
    <div>
      <section className="products">
        {products.map(p => (
          <div className="card" key={p.id}>
            <img src={p.image} alt={p.name} onError={(e) => e.target.src='https://via.placeholder.com/400x300?text=No+Image'} />
            <div className="card-content">
              <h3>{p.name}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{p.description}</p>
              <div style={{ marginTop: 'auto' }}>
                <div className="price">₹{p.price}</div>
                <button className="btn btn-full" onClick={() => addToCart(p.id)}>Add to Cart</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
