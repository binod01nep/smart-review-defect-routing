const express      = require('express');
const reviewController = require('./controller/review.controller');
const cookieParser = require('cookie-parser');
const adminRoutes  = require('./routes/admin.routes');
const jwt          = require('jsonwebtoken');
const path         = require('path');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.post('/review', reviewController.createReview);

function verifyAdmin(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied.' });
  try { jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: 'Invalid token.' }); }
}

app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.status(200).json({ token });
  }
  return res.status(401).json({ message: 'Invalid email or password.' });
});

app.use('/admin', verifyAdmin, adminRoutes);

module.exports = app;