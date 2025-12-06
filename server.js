require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const path = require('path');
const helmet = require('helmet'); // <-- Añadir Helmet

const app = express();

// ======================================================================
// 1. SEGURIDAD MÍNIMA Y HEADERS (Tests 2, 3, 4)
// ======================================================================

app.use(cors({ origin: '*' }));
app.disable('x-powered-by');

// Usamos Helmet para asegurar que los headers de seguridad pasen
app.use(helmet({
  // Test 2: X-Frame-Options: SAMEORIGIN
  frameguard: {
    action: 'sameorigin'
  },
  // Test 3: X-DNS-Prefetch-Control: off
  dnsPrefetchControl: {
    allow: false
  },
  // Test 4: Referrer-Policy: same-origin
  referrerPolicy: {
    policy: 'same-origin'
  },
  // Deshabilitar otros headers de Helmet que no son necesarios
  contentSecurityPolicy: false,
  hsts: false,
  noSniff: false,
  xssFilter: false,
}));
// Nota: Puedes eliminar los headers manuales que tenías, ya que Helmet los maneja.

// ======================================================================
// 2. BODY PARSER (Tests POST/DELETE/PUT)
// ======================================================================

// Solo necesitamos urlencoded para los formularios de freeCodeCamp
app.use(bodyParser.urlencoded({ extended: true })); 
// Si bodyParser.json() no es estrictamente necesario, a veces interfiere.
// Lo mantendremos por compatibilidad, pero si falla, esta línea sería la siguiente a comentar.
app.use(bodyParser.json()); 

// ======================================================================
// 3. RUTAS y LISTEN
// ======================================================================

app.use('/public', express.static(path.join(process.cwd(), 'public')));

app.get('/', function (req, res) {
  res.sendFile(path.join(process.cwd(), 'views', 'index.html'));
});

app.use('/api', apiRoutes);

app.use(function(req, res, next) {
  res.status(404).type('text').send('Not Found');
});

const PORT = process.env.PORT || 3000;
const dbURI = process.env.DB; 

mongoose.connect(dbURI)
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('DB connection error:', err));

module.exports = app;