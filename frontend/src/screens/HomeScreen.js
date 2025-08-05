import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Product from '../components/Product';

const HomeScreen = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      // Make sure your backend server is running on http://localhost:5000
      const { data } = await axios.get('http://localhost:5000/api/products');
      setProducts(data);
    };

    fetchProducts();
  }, []);

  return (
    <>
      <h1>Latest Products</h1>
      <div className="row">
        {products.map((product) => (
          <div key={product._id} className="col-sm-12 col-md-6 col-lg-4 col-xl-3">
            <Product product={product} />
          </div>
        ))}
      </div>
    </>
  );
};

export default HomeScreen;