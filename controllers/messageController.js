const Thread = require('../models/Thread');
const mongoose = require('mongoose');

module.exports = {
  // THREADS
  createThread: async (req, res) => {
    try {
      const board = req.params.board;
      const { text, delete_password } = req.body;

      if (!text || !delete_password) {
        return res.status(400).send('Missing required fields: text and delete_password');
      }

      // CORRECCIÓN: Forzar new Date() y usar status 302 explícito para Test 5
      const now = new Date(); 
      const thread = new Thread({
        board,
        text,
        delete_password,
        created_on: now,
        bumped_on: now,
      });

      await thread.save();

      // Comportamiento oficial FCC: redirect con status 302
      return res.status(302).redirect(`/b/${board}/`);
    } catch (err) {
      if (err instanceof mongoose.Error.CastError) {
        return res.status(400).send('Invalid input ID');
      }
      return res.status(500).send('Error creating thread');
    }
  },

  getThreads: async (req, res) => {
    try {
      const board = req.params.board;

      let threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();

      threads = threads.map(t => {
        const { delete_password, reported, replies, ...rest } = t;

        const sortedReplies = (replies || [])
          .sort((a, b) => new Date(b.created_on) - new Date(a.created_on)) 
          .slice(0, 3) 
          .reverse() 
          .map(r => {
            const { delete_password, reported, ...rr } = r;
            return rr;
          });

        const replycount = replies.length;

        return { ...rest, replies: sortedReplies, replycount };
      });

      return res.json(threads);
    } catch (err) {
      return res.status(500).send('Error getting threads');
    }
  },

  deleteThread: async (req, res) => {
    try {
      const { thread_id, delete_password } = req.body;
      
      const result = await Thread.deleteOne({ 
        _id: thread_id,
        delete_password: delete_password 
      });

      if (result.deletedCount === 0) {
        return res.send('incorrect password');
      }

      return res.send('success');
    } catch (err) {
      if (err instanceof mongoose.Error.CastError) {
        return res.send('incorrect password');
      }
      return res.status(500).send('Error deleting thread');
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
      return res.status(500).send('Error reporting thread');
    }
  },

  // REPLIES
  createReply: async (req, res) => {
    try {
      const board = req.params.board;
      const { thread_id, text, delete_password } = req.body;

      if (!thread_id || !text || !delete_password) {
        return res.status(400).send('Missing required fields');
      }

      // CORRECCIÓN: Forzar new Date() y usar status 302 explícito para Test 6
      const now = new Date(); 
      const reply = {
        text,
        delete_password,
        created_on: now
      };

      const thread = await Thread.findByIdAndUpdate(
        thread_id,
        {
          $push: { replies: reply },
          $set: { bumped_on: now } 
        },
        { new: true }
      );

      if (!thread) return res.status(404).send('thread not found');

      // Comportamiento estándar FCC: redirect con status 302
      return res.status(302).redirect(`/b/${board}/${thread_id}`);
    } catch (err) {
      return res.status(500).send('Error creating reply');
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
      return res.status(500).send('Error getting replies');
    }
  },

  deleteReply: async (req, res) => {
    try {
      const { thread_id, reply_id, delete_password } = req.body;

      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('incorrect password'); 

      const reply = thread.replies.id(reply_id);
      
      if (!reply || reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }

      reply.text = '[deleted]';
      await thread.save();

      return res.send('success');
    } catch (err) {
      if (err instanceof mongoose.Error.CastError) {
        return res.send('incorrect password');
      }
      return res.status(500).send('Error deleting reply');
    }
  },

  reportReply: async (req, res) => {
    try {
      const { thread_id, reply_id } = req.body;

      const updateResult = await Thread.updateOne(
        { _id: thread_id, 'replies._id': reply_id },
        { $set: { 'replies.$.reported': true } }
      );

      if (updateResult.modifiedCount === 0) {
        return res.send('thread or reply not found'); 
      }

      return res.send('reported');
    } catch (err) {
      return res.status(500).send('Error reporting reply');
    }
  }
};