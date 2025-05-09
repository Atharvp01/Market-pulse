import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import './App.css';

const API_KEY = '9XWAETPN7DKX39XX';
const BASE_URL = 'https://www.alphavantage.co/query';

function Home() {
 const { user } = useUser();
  const [symbol, setSymbol] = useState('');
  const [stock, setStock] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const fetchStock = async () => {
    try {
      const res = await axios.get(BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: API_KEY,
        },
      });

      const quote = res.data['Global Quote'];
      if (!quote || !quote['05. price']) throw new Error();
      setStock({
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
      });
    } catch {
      setStock(null);
      alert('Stock not found');
    }
  };

  const addToCart = () => {
    if (!user) {
      alert('You must be signed in to add to cart.');
      return;
    }
    const key = `cart-${user.id}`;
    const cart = JSON.parse(localStorage.getItem(key)) || [];
    const exists = cart.find(item => item.symbol === symbol.toUpperCase());
    if (exists) {
      exists.quantity += quantity;
    } else {
      cart.push({ symbol: symbol.toUpperCase(), quantity });
    }
    localStorage.setItem(key, JSON.stringify(cart));
    alert('Added to cart');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="absolute top-4 right-4 p-8">
        <UserButton />
      </div>
      <div className="p-6 max-w-xl w-full bg-white shadow-xl rounded-xl">
        <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800">📈 Market Pulse</h1>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Enter symbol (e.g. AAPL)"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className="border border-gray-300 p-2 flex-1 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button onClick={fetchStock} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer">Search</button>
        </div>

        {stock && (
          <div className="border border-gray-200 p-5 rounded-xl shadow-sm mb-4 bg-gray-50">
            <p className="text-xl font-bold text-gray-800">{stock.symbol} - ${stock.price.toFixed(2)}</p>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value))}
              className="border border-gray-300 p-2 rounded-lg mt-3 w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
              min="1"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={addToCart} className="bg-yellow-500 text-black px-5 py-2 rounded-lg hover:bg-yellow-400 transition cursor-pointer">Add to Cart</button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-6 mt-6">
          <Link to="/cart" className="text-blue-500 hover:underline font-medium">🛒 Cart</Link>
          <Link to="/portfolio" className="text-green-600 hover:underline font-medium">📂 Portfolio</Link>
        </div>
      </div>
    </div>
  );
}

function Cart() {
const { user } = useUser();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (!user) return;
    const saved = JSON.parse(localStorage.getItem(`cart-${user.id}`) || '[]');
    setCart(saved);
  }, [user]);

  const removeItem = (symbol) => {
    const updated = cart.filter(item => item.symbol !== symbol);
    setCart(updated);
    localStorage.setItem(`cart-${user.id}`, JSON.stringify(updated));
  };

  const buyAll = () => {
    const portfolioKey = `portfolio-${user.id}`;
    const cartKey = `cart-${user.id}`;
    const portfolio = JSON.parse(localStorage.getItem(portfolioKey) || '[]');
    const updatedPortfolio = [...portfolio, ...cart];
    localStorage.setItem(portfolioKey, JSON.stringify(updatedPortfolio));
    localStorage.setItem(cartKey, '[]');
    setCart([]);
    alert('All items bought and added to portfolio.');
  };

  const sellAll = () => {
    localStorage.setItem(`portfolio-${user.id}`, '[]');
    localStorage.setItem(`cart-${user.id}`, '[]');
    setCart([]);
    alert('All items sold (simulation).');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <UserButton />
      </div>
      <div className="p-6 max-w-xl w-full bg-white shadow-xl rounded-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">🛒 Your Cart</h1>
        {cart.length === 0 ? (
          <p className="text-center text-gray-500">No items in cart.</p>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.symbol} className="border border-gray-200 p-4 rounded-lg flex justify-between items-center mb-3 bg-gray-50">
                <div>
                  <p className="font-semibold text-lg">{item.symbol}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <button onClick={() => removeItem(item.symbol)} className="text-red-500 hover:underline cursor-pointer">Remove</button>
              </div>
            ))}
            <div className="flex gap-3 mt-6 justify-center">
              <button onClick={buyAll} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition cursor-pointer">Buy All</button>
              <button onClick={sellAll} className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition cursor-pointer">Sell All</button>
            </div>
          </>
        )}
        <Link to="/" className="text-blue-500 hover:underline block mt-6 text-center">← Back to Home</Link>
      </div>
    </div>
  );
}

function Portfolio() {
const { user } = useUser();
  const [portfolio, setPortfolio] = useState([]);
  const [totalWorth, setTotalWorth] = useState(0);

  useEffect(() => {
    if (!user) return;
    const saved = JSON.parse(localStorage.getItem(`portfolio-${user.id}`) || '[]');
    setPortfolio(saved);
    fetchPrices(saved);
  }, [user]);

  const fetchPrices = async (portfolioData) => {
    let total = 0;
    for (const stock of portfolioData) {
      try {
        const res = await axios.get(BASE_URL, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: stock.symbol,
            apikey: API_KEY,
          },
        });
        const price = parseFloat(res.data['Global Quote']?.['05. price'] || 0);
        total += price * stock.quantity;
      } catch {
        console.error(`Failed to fetch price for ${stock.symbol}`);
      }
    }
    setTotalWorth(total);
  };

  const sellStock = (symbol) => {
    const updated = portfolio.filter(item => item.symbol !== symbol);
    setPortfolio(updated);
    localStorage.setItem(`portfolio-${user.id}`, JSON.stringify(updated));
  };
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <UserButton />
      </div>
      <div className="p-6 max-w-xl w-full bg-white shadow-xl rounded-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">📂 Your Portfolio</h1>
        {portfolio.length === 0 ? (
          <p className="text-center text-gray-500">No stocks in portfolio.</p>
        ) : (
          <>
            {portfolio.map(item => (
              <div key={item.symbol} className="border border-gray-200 p-4 rounded-lg mb-3 bg-gray-50 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{item.symbol}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <button
                  onClick={() => sellStock(item.symbol)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition cursor-pointer"
                >
                  Sell
                </button>
              </div>
            ))}
            <div className="text-center mt-4">
              <p className="text-lg font-semibold text-gray-700">
                💰 Total Worth: ${totalWorth.toFixed(2)}
              </p>
            </div>
          </>
        )}
        <Link to="/" className="text-blue-500 hover:underline block mt-6 text-center">← Back to Home</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
      </Routes>
    </Router>
  );
}
