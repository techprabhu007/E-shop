import React from 'react';
import { Link } from 'react-router-dom';

const Product = ({ product }) => {
  return (
    <div className="card">
      <Link to={`/product/${product._id}`}>
        <img src={product.image} className="card-img-top" alt={product.name} />
      </Link>
      <div className="card-body">
        <Link to={`/product/${product._id}`}>
          <h5 className="card-title">{product.name}</h5>
        </Link>
        <h6 className="card-subtitle mb-2 text-muted">${product.price}</h6>
        <p className="card-text">{product.description.substring(0, 50)}...</p>
      </div>
    </div>
  );
};

export default Product;
