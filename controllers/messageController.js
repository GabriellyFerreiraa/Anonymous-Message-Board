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

      // Corrección de compatibilidad: Forzar new Date() explícito
      const now = new Date(); 
      const thread = new Thread({
        board,
        text,
        delete_password,
        created_on: now,
        bumped_on: now,
      });

      await thread.save();

      // Corrección de compatibilidad: Usar redirección simple para el test runner (Test 5)
      return res.redirect(`/b/${board}/`);
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

      // 1. Obtener los 10 threads más recientes por bumped_on
      let threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean(); // Usar .lean() para modificar el objeto sin Mongoose overhead

      // 2. Filtrar campos sensibles y limitar replies a 3
      threads = threads.map(t => {
        // Desestructurar para excluir delete_password y reported del thread
        const { delete_password, reported, replies, ...rest } = t;

        // 3. Procesar replies: ordenar, limitar a 3, eliminar campos sensibles y REVERTIR
        const sortedReplies = (replies || [])
          // Ordenar por fecha de creación descendente (más recientes primero)
          .sort((a, b) => new Date(b.created_on) - new Date(a.created_on)) 
          .slice(0, 3) // Tomar solo los 3 más recientes
          // Invertir para mostrar en orden cronológico ascendente (fix común para tests de FCC)
          .reverse() 
          .map(r => {
            // Desestructurar para excluir delete_password y reported del reply
            const { delete_password, reported, ...rr } = r;
            return rr;
          });

        const replycount = replies.length;

        // Retornar el objeto del thread limpio con solo 3 replies
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
      
      // Búsqueda y eliminación atómica por ID y contraseña
      const result = await Thread.deleteOne({ 
        _id: thread_id,
        delete_password: delete_password 
      });

      if (result.deletedCount === 0) {
        // Si no se elimina nada, es porque la ID o la contraseña es incorrecta
        return res.send('incorrect password');
      }

      return res.send('success');
    } catch (err) {
      // Manejar error de ID no válida de Mongoose
      if (err instanceof mongoose.Error.CastError) {
        return res.send('incorrect password');
      }
      return res.status(500).send('Error deleting thread');
    }
  },

  reportThread: async (req, res) => {
    try {
      const { thread_id } = req.body;

      // El requerimiento es simplemente cambiar reported a true.
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

      // Corrección de compatibilidad: Forzar new Date()
      const now = new Date(); 
      const reply = {
        text,
        delete_password,
        created_on: now // Usar la fecha forzada
      };

      const thread = await Thread.findByIdAndUpdate(
        thread_id,
        {
          $push: { replies: reply },
          // Actualizar bumped_on con la fecha de la nueva respuesta
          $set: { bumped_on: now } // Usar la misma fecha forzada
        },
        { new: true }
      );

      if (!thread) return res.status(404).send('thread not found');

      // Corrección de compatibilidad: Usar redirección simple (Test 6)
      return res.redirect(`/b/${board}/${thread_id}`);
    } catch (err) {
      return res.status(500).send('Error creating reply');
    }
  },

  getReplies: async (req, res) => {
    try {
      const thread_id = req.query.thread_id;
      // .lean() para facilitar la manipulación de la respuesta
      const thread = await Thread.findById(thread_id).lean(); 

      if (!thread) return res.status(404).send('thread not found');

      // Excluir campos sensibles del thread
      const { delete_password, reported, replies, ...rest } = thread;

      // Filtrar campos sensibles de todos los replies
      const safeReplies = (replies || []).map(r => {
        const { delete_password, reported, ...rr } = r;
        return rr;
      });

      // Retornar el objeto completo del thread, incluyendo todos los replies limpios
      return res.json({ ...rest, replies: safeReplies });
    } catch (err) {
      return res.status(500).send('Error getting replies');
    }
  },

  deleteReply: async (req, res) => {
    try {
      const { thread_id, reply_id, delete_password } = req.body;

      // Buscar el thread por ID
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('incorrect password');

      // Usar Mongoose subdocument .id() para buscar la respuesta
      const reply = thread.replies.id(reply_id);
      
      // Si la respuesta no existe o la contraseña es incorrecta
      if (!reply || reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }

      // Reemplazar el texto y guardar
      reply.text = '[deleted]';
      await thread.save();

      return res.send('success');
    } catch (err) {
      // Manejar error de ID no válida de Mongoose
      if (err instanceof mongoose.Error.CastError) {
        return res.send('incorrect password');
      }
      return res.status(500).send('Error deleting reply');
    }
  },

  reportReply: async (req, res) => {
    try {
      const { thread_id, reply_id } = req.body;

      // Actualizar el subdocumento directamente en la DB
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