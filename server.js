require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cors = require('cors'); // <--- IMPORTANTE: Importar cors
const apiRoutes = require('./routes/api');

const app = express();

// Security Security features (Helmet)
app.use(helmet({
  frameguard: { action: 'sameorigin' },
  dnsPrefetchControl: { allow: false },
  referrerPolicy: { policy: 'same-origin' }
}));

// CORS: Permitir peticiones desde freeCodeCamp para los tests
app.use(cors({ origin: '*' })); // <--- IMPORTANTE: Permitir origen cruzado

// Body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Public HTML
app.use('/public', express.static(process.cwd() + '/public'));

// Asegurar headers manualmente (Esto estaba bien, lo dejamos como refuerzo)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// Routing
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// API routes
app.use('/api', apiRoutes);

// 404 handler (Opcional pero recomendado)
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const PORT = process.env.PORT || 3000;
const dbURI = process.env.DB; // En Render usa la variable de entorno DB directamente

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('DB connection error:', err));

module.exports = app;