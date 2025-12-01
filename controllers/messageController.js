const Thread = require('../models/Thread');
const mongoose = require('mongoose');

module.exports = {
  // THREADS
  createThread: async (req, res) => {
    try {
      const board = req.params.board;
      const { text, delete_password } = req.body;

      const thread = new Thread({
        board,
        text,
        delete_password
      });

      await thread.save();

      // Comportamiento oficial FCC: redirect
      return res.redirect(`/b/${board}/`);
    } catch (err) {
      return res.status(500).send('error creating thread');
    }
  },

  getThreads: async (req, res) => {
    try {
      const board = req.params.board;

      // Últimos 10 threads, con solo 3 replies más recientes
      let threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();

      threads = threads.map(t => {
        const { delete_password, reported, replies, ...rest } = t;

        const sortedReplies = (replies || [])
          .sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
          .slice(0, 3)
          .map(r => {
            const { delete_password, reported, ...rr } = r;
            return rr;
          });

        return { ...rest, replies: sortedReplies };
      });

      return res.json(threads);
    } catch (err) {
      return res.status(500).send('error getting threads');
    }
  },

  deleteThread: async (req, res) => {
    try {
      const { thread_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);

      if (!thread || thread.delete_password !== delete_password)
        return res.send('incorrect password');

      await Thread.deleteOne({ _id: thread_id });
      return res.send('success');
    } catch (err) {
      return res.status(500).send('error deleting thread');
    }
  },

  reportThread: async (req, res) => {
    try {
      const { thread_id } = req.body;

      await Thread.findByIdAndUpdate(thread_id, {
        $set: { reported: true }
      });

      return res.send('reported');
    } catch (err) {
      return res.status(500).send('error reporting thread');
    }
  },

  // REPLIES
  createReply: async (req, res) => {
    try {
      const board = req.params.board;
      const { thread_id, text, delete_password } = req.body;

      const reply = {
        text,
        delete_password,
        created_on: new Date()
      };

      const thread = await Thread.findByIdAndUpdate(
        thread_id,
        {
          $push: { replies: reply },
          $set: { bumped_on: new Date() }
        },
        { new: true }
      );

      if (!thread) return res.status(404).send('thread not found');

      // Comportamiento estándar FCC
      return res.redirect(`/b/${board}/${thread_id}`);
    } catch (err) {
      return res.status(500).send('error creating reply');
    }
  },

  getReplies: async (req, res) => {
    try {
      const thread_id = req.query.thread_id;
      const thread = await Thread.findById(thread_id).lean();

      if (!thread) return res.status(404).send('thread not found');

      const { delete_password, reported, replies, ...rest } = thread;

      const safeReplies = (replies || []).map(r => {
        const { delete_password, reported, ...rr } = r;
        return rr;
      });

      return res.json({ ...rest, replies: safeReplies });
    } catch (err) {
      return res.status(500).send('error getting replies');
    }
  },

  deleteReply: async (req, res) => {
    try {
      const { thread_id, reply_id, delete_password } = req.body;

      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('incorrect password');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.send('incorrect password');

      if (reply.delete_password !== delete_password)
        return res.send('incorrect password');

      reply.text = '[deleted]';
      await thread.save();

      return res.send('success');
    } catch (err) {
      return res.status(500).send('error deleting reply');
    }
  },

  reportReply: async (req, res) => {
    try {
      const { thread_id, reply_id } = req.body;

      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.status(404).send('reply not found');

      reply.reported = true;
      await thread.save();

      return res.send('reported');
    } catch (err) {
      return res.status(500).send('error reporting reply');
    }
  }
};
