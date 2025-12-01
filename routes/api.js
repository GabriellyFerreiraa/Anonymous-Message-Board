const express = require('express');
const router = express.Router();
const controller = require('../controllers/messageController');

// Thread routes
router.route('/threads/:board')
  .post(controller.createThread)
  .get(controller.getThreads)
  .delete(controller.deleteThread)
  .put(controller.reportThread);

// Reply routes
router.route('/replies/:board')
  .post(controller.createReply)
  .get(controller.getReplies)
  .delete(controller.deleteReply)
  .put(controller.reportReply);

module.exports = router;
