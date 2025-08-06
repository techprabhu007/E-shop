import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeScreen from './screens/HomeScreen';
import ProductScreen from './screens/ProductScreen'; // You will need to create this file
import './App.css';

function App() {
  return (
    <Router>
      <Header />
      <main className="container py-3">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          {/* Example route for a single product page */}
          <Route path="/product/:id" element={<ProductScreen />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
