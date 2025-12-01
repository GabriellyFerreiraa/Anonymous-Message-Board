const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReplySchema = new Schema({
  text: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  delete_password: { type: String, required: true },
  reported: { type: Boolean, default: false }
}, { _id: true });

const ThreadSchema = new Schema({
  board: { type: String, required: true, index: true },
  text: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  delete_password: { type: String, required: true },
  replies: { type: [ReplySchema], default: [] }
});

module.exports = mongoose.model('Thread', ThreadSchema);
