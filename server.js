require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const path = require('path');

const app = express();

// ======================================================================
// 1. SEGURIDAD MÍNIMA (La solución más fiable para Tests 2, 3, 4)
// ======================================================================

// Deshabilitamos X-Powered-By
app.disable('x-powered-by');

// CORS para el test runner de FCC
app.use(cors({ origin: '*' }));

// Headers de seguridad manuales (Tests 2, 3, 4)
app.use((req, res, next) => {
  // Test 2: Only allow your site to be loaded in an iFrame on your own pages.
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Test 3: Do not allow DNS prefetching.
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  // Test 4: Only allow your site to send the referrer for your own pages.
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ======================================================================
// 2. BODY PARSER (Crucial para todos los tests POST/DELETE/PUT)
// ======================================================================

// La configuración más compatible para todos los tests de formulario de FCC
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json()); // Necesario para JSON, aunque el test runner use form data

// ======================================================================
// 3. ARCHIVOS ESTÁTICOS Y VISTAS
// ======================================================================

app.use('/public', express.static(path.join(process.cwd(), 'public')));

app.get('/', function (req, res) {
  res.sendFile(path.join(process.cwd(), 'views', 'index.html'));
});

// ======================================================================
// 4. RUTAS API
// ======================================================================

app.use('/api', apiRoutes);

// 404 handler 
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// ... (Conexión a MongoDB y listen)

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