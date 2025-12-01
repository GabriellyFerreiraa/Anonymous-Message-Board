require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

const app = express();

// Body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Helmet según requisitos de FCC
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

// Asegurar headers manualmente
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// API routes
app.use('/api', apiRoutes);

// Public HTML
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// DB: usar DB_TEST solo en ambiente de test
const dbURI =
  process.env.NODE_ENV === 'test'
    ? process.env.DB_TEST || process.env.DB
    : process.env.DB;

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  })
  .catch(err => console.error('DB connection error:', err));

module.exports = app;
