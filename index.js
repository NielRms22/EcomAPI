const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Data models
let users = [];
let products = [];
let orders = [];

// User registration
app.post('/api/users/register', (req, res) => {
  const { email, password } = req.body;

  // Check if the user already exists
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }

  // Create a new user
  const newUser = {
    id: uuidv4(),
    email,
    password,
    isAdmin: false
  };

  users.push(newUser);

  res.status(201).json(newUser);
});

// User authentication/verification
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;

  // Check if the user exists
  const user = users.find(user => user.email === email && user.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json(user);
});

// Set user as admin
app.put('/api/users/:userId/setAdmin', (req, res) => {
  const { userId } = req.params;

  // Find the user
  const user = users.find(user => user.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Set user as admin
  user.isAdmin = true;

  res.json(user);
});

// Create product (Admin only)
app.post('/api/products', (req, res) => {
  const { name, description, price } = req.body;

  // Create a new product
  const newProduct = {
    id: uuidv4(),
    name,
    description,
    price,
    isActive: true,
    createdOn: new Date()
  };

  products.push(newProduct);

  res.status(201).json(newProduct);
});

// Retrieve all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Retrieve all active products
app.get('/api/products/active', (req, res) => {
  const activeProducts = products.filter(product => product.isActive);

  res.json(activeProducts);
});

// Retrieve single product
app.get('/api/products/:productId', (req, res) => {
  const { productId } = req.params;

  // Find the product
  const product = products.find(product => product.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(product);
});

// Update product information (Admin only)
app.put('/api/products/:productId', (req, res) => {
  const { productId } = req.params;
  const { name, description, price } = req.body;

  // Find the product
  const product = products.find(product => product.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Update product information
  product.name = name;
  product.description = description;
  product.price = price;

  res.json(product);
});

// Archive product (Admin only)
app.delete('/api/products/:productId', (req, res) => {
  const { productId } = req.params;

  // Find the product
  const product = products.find(product => product.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Archive product (soft delete)
  product.isActive = false;

  res.json({ message: 'Product archived successfully' });
});

// Retrieve authenticated user's orders (Non-admin only)
app.get('/api/users/:userId/orders', (req, res) => {
  const { userId } = req.params;

  // Check if the user exists
  const user = users.find(user => user.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Retrieve the user's orders
  const userOrders = orders.filter(order => order.userId === userId);

  res.json(userOrders);
});

// Retrieve all orders (Admin only)
app.get('/api/orders', (req, res) => {
  // Check if the user is an admin
  const isAdmin = req.headers.isAdmin === 'true';
  if (!isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(orders);
});

// Create order (Non-admin only)
app.post('/api/orders', (req, res) => {
  const { userId, products: orderedProducts } = req.body;

  // Check if the user exists
  const user = users.find(user => user.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Calculate total amount
  const totalAmount = orderedProducts.reduce((total, product) => {
    const { productId, quantity } = product;
    const productPrice = products.find(p => p.id === productId)?.price || 0;
    return total + productPrice * quantity;
  }, 0);

  // Create a new order
  const newOrder = {
    id: uuidv4(),
    userId,
    products: orderedProducts,
    totalAmount,
    purchasedOn: new Date()
  };

  orders.push(newOrder);

  res.status(201).json(newOrder);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});