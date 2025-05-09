const express = require('express');
const axios = require('axios');
const db = require('./db');
const app = express();
const PORT = 3000;

const API_KEY = '1FRRZCZO76MJAQZZ';
const BASE_URL = 'https://www.alphavantage.co/query';

app.use(express.json());

// Fetch stock price from API
async function getStockPrice(symbol) {
    try {
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: symbol,
                apikey: API_KEY
            }
        });

        const stockData = response.data["Global Quote"];
        return stockData && stockData['05. price'] ? parseFloat(stockData['05. price']) : null;
    } catch (error) {
        console.error("Error fetching stock data:", error);
        return null;
    }
}

// Fetch stock price
app.get('/stocks/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const price = await getStockPrice(symbol);

    if (price !== null) {
        res.json({ symbol, price });
    } else {
        res.status(404).json({ error: "Stock data not found" });
    }
});

// Buy stocks
app.post('/buy', async (req, res) => {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0) {
        return res.status(400).json({ error: "Invalid symbol or quantity" });
    }

    const stockSymbol = symbol.toUpperCase();
    const price = await getStockPrice(stockSymbol);

    if (price === null) {
        return res.status(404).json({ error: "Stock not found" });
    }

    try {
        const [balanceResult] = await db.query("SELECT amount FROM balance WHERE id = 1");
        const balance = balanceResult[0].amount;

        const totalCost = price * quantity;
        if (totalCost > balance) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        await db.query("UPDATE balance SET amount = amount - ?", [totalCost]);

        const [existingStock] = await db.query("SELECT * FROM portfolio WHERE symbol = ?", [stockSymbol]);

        if (existingStock.length > 0) {
            const newQuantity = existingStock[0].quantity + quantity;
            const newAvgPrice = ((existingStock[0].quantity * existingStock[0].avg_price) + totalCost) / newQuantity;
            await db.query("UPDATE portfolio SET quantity = ?, avg_price = ? WHERE symbol = ?", [newQuantity, newAvgPrice, stockSymbol]);
        } else {
            await db.query("INSERT INTO portfolio (symbol, quantity, avg_price) VALUES (?, ?, ?)", [stockSymbol, quantity, price]);
        }

        res.json({ message: `Bought ${quantity} shares of ${stockSymbol} at $${price.toFixed(2)} each` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

// Sell stocks
app.post('/sell', async (req, res) => {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0) {
        return res.status(400).json({ error: "Invalid symbol or quantity" });
    }

    const stockSymbol = symbol.toUpperCase();
    const price = await getStockPrice(stockSymbol);

    if (price === null) {
        return res.status(404).json({ error: "Stock not found" });
    }

    try {
        const [existingStock] = await db.query("SELECT * FROM portfolio WHERE symbol = ?", [stockSymbol]);

        if (existingStock.length === 0 || existingStock[0].quantity < quantity) {
            return res.status(400).json({ error: "Not enough stocks to sell" });
        }

        const totalSale = price * quantity;
        await db.query("UPDATE balance SET amount = amount + ?", [totalSale]);

        if (existingStock[0].quantity === quantity) {
            await db.query("DELETE FROM portfolio WHERE symbol = ?", [stockSymbol]);
        } else {
            await db.query("UPDATE portfolio SET quantity = ? WHERE symbol = ?", [existingStock[0].quantity - quantity, stockSymbol]);
        }

        res.json({ message: `Sold ${quantity} shares of ${stockSymbol} at $${price.toFixed(2)} each` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

// Get portfolio
app.get('/portfolio', async (req, res) => {
    try {
        const [stocks] = await db.query("SELECT * FROM portfolio");
        const [balance] = await db.query("SELECT amount FROM balance WHERE id = 1");
        res.json({ balance: balance[0].amount, stocks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

app.listen(PORT, () => {
    console.log(`Stock API server is running on http://localhost:${PORT}`);
});
