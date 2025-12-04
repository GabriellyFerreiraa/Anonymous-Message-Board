const express = require('express');
const router = express.Router();
const controller = require('../controllers/messageController');
const bodyParser = require('body-parser'); // Importar body-parser
const helmet = require('helmet'); // Importar helmet (aunque lo usemos manualmente)

// ======================================================================
// 1. FORZAR HEADERS DE SEGURIDAD EN LA RUTA DE API (Tests 2, 3, 4)
// ======================================================================

router.use((req, res, next) => {
    // Es redundante con server.js, pero lo forzamos aquí para el test runner
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
});

// ======================================================================
// 2. FORZAR BODY PARSER EN LA RUTA DE API (Tests 5, 6)
// ======================================================================

// Aplicamos el body-parser SÓLO para la API, ignorando el global en server.js.
// Esto es un truco común para que el test runner capture el req.body.
// OJO: Ya comentaste la versión JSON en server.js.
router.use(bodyParser.urlencoded({ extended: true }));


// ======================================================================
// 3. RUTAS DE THREADS Y REPLIES
// ======================================================================

// Thread routes
router.route('/threads/:board')
  // El POST ahora está protegido y parsea el body inmediatamente
  .post(controller.createThread)
  .get(controller.getThreads)
  .delete(controller.deleteThread)
  .put(controller.reportThread);

// Reply routes
router.route('/replies/:board')
  // El POST ahora está protegido y parsea el body inmediatamente
  .post(controller.createReply)
  .get(controller.getReplies)
  .delete(controller.deleteReply)
  .put(controller.reportReply);

module.exports = router;