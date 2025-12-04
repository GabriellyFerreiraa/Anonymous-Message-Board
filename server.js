require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const path = require('path');

const app = express();

// ======================================================================
// 1. SEGURIDAD (Helmet, Headers Manuales y CORS) - DEBE SER LO PRIMERO
// ======================================================================

// Configuramos Helmet para los requisitos de FCC (Tests 2, 3, 4)
app.use(helmet({
  // Test 2: Only allow your site to be loaded in an iFrame on your own pages.
  frameguard: { action: 'sameorigin' },
  // Test 3: Do not allow DNS prefetching.
  dnsPrefetchControl: { allow: false },
  // Test 4: Only allow your site to send the referrer for your own pages.
  referrerPolicy: { policy: 'same-origin' }
}));

// CORS: Permitir peticiones desde freeCodeCamp para los tests
app.use(cors({ origin: '*' }));

// Asegurar headers manualmente (Refuerzo para los tests de FCC)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ======================================================================
// 2. BODY PARSER (Crucial para Tests 5 y 6)
// ======================================================================

// Body parser debe estar aquí para que las rutas POST/DELETE/PUT puedan leer req.body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// ======================================================================
// 3. ARCHIVOS ESTÁTICOS Y VISTAS
// ======================================================================

// Servir archivos estáticos (CSS/JS) desde la carpeta 'public'
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Routing: Ruta principal (/) para devolver index.html
// Corregido: Busca el archivo en la ruta views/index.html (basado en tu estructura)
app.get('/', function (req, res) {
  res.sendFile(path.join(process.cwd(), 'views', 'index.html'));
});

// ======================================================================
// 4. RUTAS API
// ======================================================================

// API routes
app.use('/api', apiRoutes);

// 404 handler 
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const PORT = process.env.PORT || 3000;
const dbURI = process.env.DB; 

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('DB connection error:', err));

module.exports = app;