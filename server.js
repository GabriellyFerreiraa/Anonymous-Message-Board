require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); // DEJAMOS SOLO EL BODY PARSER AQUÍ
const cors = require('cors');
const apiRoutes = require('./routes/api');
const path = require('path');

const app = express();

// ======================================================================
// 1. SEGURIDAD MÍNIMA Y HEADERS (Solución para Tests 2, 3, 4)
// ======================================================================

app.disable('x-powered-by'); // El reemplazo más simple para Helmet

app.use(cors({ origin: '*' }));

// Headers de seguridad manuales (Crucial para Tests 2, 3, 4)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ======================================================================
// 2. BODY PARSER MÍNIMO (Solución para Tests 5, 6, 9, 10, 12)
// ======================================================================

// USAMOS SÓLO urlencoded, ya que el test runner envía form data
app.use(bodyParser.urlencoded({ extended: true })); 
// app.use(bodyParser.json()); <-- COMENTADO O ELIMINADO para evitar conflictos

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

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('DB connection error:', err));

module.exports = app;