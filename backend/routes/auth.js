const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// In production, use a real database (MongoDB/PostgreSQL)
// This is an in-memory store for demonstration
const users = [];

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields required.' });
    }
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) return res.status(409).json({ error: 'User already exists.' });
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Export users array so other routes can access it
router.users = users;
module.exports = router;