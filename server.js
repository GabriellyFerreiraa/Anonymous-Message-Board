require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const path = require('path');

const app = express();

// ======================================================================
// 1. SEGURIDAD MÍNIMA Y HEADERS (Solución para Tests 2, 3, 4)
// ======================================================================

// Deshabilitamos X-Powered-By (Reemplazo simple para Helmet)
app.disable('x-powered-by');

// CORS para el test runner de FCC
app.use(cors({ origin: '*' }));

// Headers de seguridad manuales
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Test 2
  res.setHeader('X-DNS-Prefetch-Control', 'off'); // Test 3
  res.setHeader('Referrer-Policy', 'same-origin'); // Test 4
  next();
});

// ======================================================================
// 2. BODY PARSER (Crucial para todos los tests POST/DELETE/PUT)
// ======================================================================

// Configuración más compatible para form data (Tests 5, 6, 9, 10, 12)
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json()); 

// ======================================================================
// 3. RUTAS y LISTEN
// ======================================================================

// Servir archivos estáticos y la vista principal
app.use('/public', express.static(path.join(process.cwd(), 'public')));

app.get('/', function (req, res) {
  // Nota: Asumimos que tienes 'views/index.html' o 'public/index.html'
  // Si usas la estructura base de FCC, el archivo de la interfaz debe estar en /views.
  res.sendFile(path.join(process.cwd(), 'views', 'index.html'));
});

// Rutas de la API
app.use('/api', apiRoutes);

// Manejador 404
app.use(function(req, res, next) {
  res.status(404).type('text').send('Not Found');
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