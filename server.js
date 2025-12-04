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

// Desactivamos Helmet para dejar solo los headers específicos requeridos por FCC.
// Esto simplifica la configuración y previene conflictos.
app.use(helmet.hidePoweredBy()); 

// CORS: Permitir peticiones desde freeCodeCamp para los tests
app.use(cors({ origin: '*' }));

// Asegurar headers manualmente y de forma estricta (Tests 2, 3, 4)
app.use((req, res, next) => {
  // Test 2: X-Frame-Options (frameguard)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Test 3: X-DNS-Prefetch-Control (dnsPrefetchControl)
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  // Test 4: Referrer-Policy (referrerPolicy)
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ======================================================================
// 2. BODY PARSER (Crucial para Tests 5 y 6)
// ======================================================================

// CORRECCIÓN FINAL: Cambiamos a extended: true para mayor compatibilidad
// con el envío de formularios del test runner de FCC.
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());


// ======================================================================
// 3. ARCHIVOS ESTÁTICOS Y VISTAS
// ======================================================================

// Servir archivos estáticos (CSS/JS) desde la carpeta 'public'
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Routing: Ruta principal (/) para devolver index.html
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