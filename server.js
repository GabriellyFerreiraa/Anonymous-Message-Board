require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const path = require('path'); // <--- AÑADIDO: Módulo para manejar rutas

const app = express();

// Security Security features (Helmet)
// Configuramos Helmet de forma unificada para los requisitos de FCC
app.use(helmet({
  frameguard: { action: 'sameorigin' },
  dnsPrefetchControl: { allow: false },
  referrerPolicy: { policy: 'same-origin' }
}));

// CORS: Permitir peticiones desde freeCodeCamp para los tests
app.use(cors({ origin: '*' }));

// Body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 1. Servir archivos estáticos (CSS/JS) desde la carpeta 'public'
// Usamos path.join(process.cwd(), 'public') para construir una ruta absoluta y segura
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Asegurar headers manualmente (refuerzo para los tests de FCC)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// 2. Routing: Ruta principal (/) para devolver el index.html
// CORREGIDO: Buscamos index.html DENTRO de la carpeta 'public'
app.get('/', function (req, res) {
  // Nota: Debes asegurar que existe el archivo public/index.html
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

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