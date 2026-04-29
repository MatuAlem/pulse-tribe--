// ===== models/Post.js =====
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
    media:   [{ type: String }],   // image/video URLs
    likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text:      { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
