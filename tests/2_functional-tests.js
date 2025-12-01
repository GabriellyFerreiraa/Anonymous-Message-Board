/*
 * 2_functional-tests.js
 * Tests funcionales para el proyecto Anonymous Message Board (freeCodeCamp)
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server'); // debe exportar app
chai.use(chaiHttp);

suite('Functional Tests', function() {
  let thread_id_1;
  let thread_id_2;
  let reply_id_1;
  let reply_id_2;
  const board = 'functional-tests-board';
  const threadPass = 'thread-pass';
  const threadPass2 = 'thread-pass-2';
  const replyPass = 'reply-pass';

  // 1 Crear un thread (POST /api/threads/{board})
  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/' + board)
      .type('form')
      .send({ text: 'Test thread 1', delete_password: threadPass })
      .end(function(err, res) {
        assert.equal(res.status, 200 || 302); // puede redirigir o devolver 200
        // buscaremos el thread con GET luego para obtener su id
        chai.request(server)
          .get('/api/threads/' + board)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            // encontrar thread creado por texto
            const found = res.body.find(t => t.text === 'Test thread 1');
            assert.exists(found, 'thread creado');
            thread_id_1 = found._id;
            done();
          });
      });
  });

  // 2 Ver los 10 threads más recientes (GET /api/threads/{board})
  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
    // crear otro thread para asegurarnos de que haya más de uno
    chai.request(server)
      .post('/api/threads/' + board)
      .type('form')
      .send({ text: 'Test thread 2', delete_password: threadPass2 })
      .end(function(err, res) {
        // ahora pedir la lista
        chai.request(server)
          .get('/api/threads/' + board)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            // cada thread no debe exponer delete_password ni reported
            if (res.body.length > 0) {
              const t = res.body[0];
              assert.notProperty(t, 'delete_password');
              assert.notProperty(t, 'reported');
              assert.property(t, 'replies');
              assert.isArray(t.replies);
            }
            // guardar el id del segundo thread para tests siguientes
            const found2 = res.body.find(t => t.text === 'Test thread 2');
            if (found2) thread_id_2 = found2._id;
            done();
          });
      });
  });

  // 3 Eliminar hilo con contraseña incorrecta (DELETE /api/threads/{board})
  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/' + board)
      .type('form')
      .send({ thread_id: thread_id_1, delete_password: 'wrong-pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 4 Eliminar hilo con contraseña correcta (DELETE /api/threads/{board})
  test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/' + board)
      .type('form')
      .send({ thread_id: thread_id_1, delete_password: threadPass })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 5 Reportar un thread (PUT /api/threads/{board})
  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    // usar thread_id_2 (si no existe, crear uno rápido)
    if (!thread_id_2) {
      // crear y luego reportar
      chai.request(server)
        .post('/api/threads/' + board)
        .type('form')
        .send({ text: 'Thread for reporting', delete_password: 'rp' })
        .end(function(err, res) {
          chai.request(server)
            .get('/api/threads/' + board)
            .end(function(err, res) {
              const found = res.body.find(t => t.text === 'Thread for reporting');
              thread_id_2 = found._id;
              // reportar
              chai.request(server)
                .put('/api/threads/' + board)
                .type('form')
                .send({ thread_id: thread_id_2 })
                .end(function(err, res) {
                  assert.equal(res.status, 200);
                  assert.equal(res.text, 'reported');
                  done();
                });
            });
        });
    } else {
      chai.request(server)
        .put('/api/threads/' + board)
        .type('form')
        .send({ thread_id: thread_id_2 })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    }
  });

  // 6 Crear una reply (POST /api/replies/{board})
  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/replies/' + board)
      .type('form')
      .send({ thread_id: thread_id_2, text: 'First reply', delete_password: replyPass })
      .end(function(err, res) {
        assert.equal(res.status, 200 || 302);
        // crear otra reply para tener 2
        chai.request(server)
          .post('/api/replies/' + board)
          .type('form')
          .send({ thread_id: thread_id_2, text: 'Second reply', delete_password: replyPass })
          .end(function(err, res) {
            // ahora sacar el thread
            chai.request(server)
              .get('/api/replies/' + board)
              .query({ thread_id: thread_id_2 })
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, '_id');
                assert.property(res.body, 'replies');
                assert.isArray(res.body.replies);
                // buscar reply id
                assert.isAtLeast(res.body.replies.length, 1);
                reply_id_1 = res.body.replies[0]._id;
                // si hay otra reply guardar otra id
                if (res.body.replies.length > 1) reply_id_2 = res.body.replies[1]._id;
                done();
              });
          });
      });
  });

  // 7 Ver un thread con todas las replies (GET /api/replies/{board}?thread_id=)
  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    chai.request(server)
      .get('/api/replies/' + board)
      .query({ thread_id: thread_id_2 })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, '_id');
        assert.property(res.body, 'replies');
        // replies no deben incluir delete_password ni reported
        if (res.body.replies.length > 0) {
          const r = res.body.replies[0];
          assert.notProperty(r, 'delete_password');
          assert.notProperty(r, 'reported');
        }
        done();
      });
  });

  // 8 Borrar reply con contraseña incorrecta (DELETE /api/replies/{board})
  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/' + board)
      .type('form')
      .send({ thread_id: thread_id_2, reply_id: reply_id_1, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 9 Borrar reply con contraseña correcta (DELETE /api/replies/{board})
  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/' + board)
      .type('form')
      .send({ thread_id: thread_id_2, reply_id: reply_id_1, delete_password: replyPass })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 10 Reportar reply (PUT /api/replies/{board})
  test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    // si reply_id_2 no existe, crear una nueva reply y usarla
    if (!reply_id_2) {
      chai.request(server)
        .post('/api/replies/' + board)
        .type('form')
        .send({ thread_id: thread_id_2, text: 'Another reply', delete_password: replyPass })
        .end(function(err, res) {
          chai.request(server)
            .get('/api/replies/' + board)
            .query({ thread_id: thread_id_2 })
            .end(function(err, res) {
              const arr = res.body.replies;
              reply_id_2 = arr[arr.length - 1]._id;
              chai.request(server)
                .put('/api/replies/' + board)
                .type('form')
                .send({ thread_id: thread_id_2, reply_id: reply_id_2 })
                .end(function(err, res) {
                  assert.equal(res.status, 200);
                  assert.equal(res.text, 'reported');
                  done();
                });
            });
        });
    } else {
      chai.request(server)
        .put('/api/replies/' + board)
        .type('form')
        .send({ thread_id: thread_id_2, reply_id: reply_id_2 })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    }
  });

}); // end suite
