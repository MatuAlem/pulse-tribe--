// ===== routes/feed.js =====
const express = require('express');
const router  = express.Router();
const Post    = require('../models/Post');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// ── GET /api/feed ────────────────────────────────────
// Get all posts (paginated), newest first
router.get('/', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const posts = await Post.find()
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.json({ success: true, posts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/feed ───────────────────────────────────
// Create a new post
// Body: { content, media: [] }
router.post('/', async (req, res) => {
  try {
    const { content, media } = req.body;
    if (!content)
      return res.status(400).json({ success: false, message: 'Post content is required' });

    const post = await Post.create({ user: req.user._id, content, media });
    await post.populate('user', 'name avatar');

    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/feed/:id ─────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/feed/:id/like ──────────────────────────
// Toggle like on a post
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: 'Post not found' });

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ success: true, likes: post.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/feed/:id/comment ───────────────────────
// Add a comment
// Body: { text }
router.post('/:id/comment', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ success: false, message: 'Comment text is required' });

    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: 'Post not found' });

    post.comments.push({ user: req.user._id, text });
    await post.save();
    await post.populate('comments.user', 'name avatar');

    res.status(201).json({ success: true, comments: post.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/feed/:postId/comment/:commentId ──────
router.delete('/:postId/comment/:commentId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post)
      return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment)
      return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    comment.deleteOne();
    await post.save();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/feed/follow/:userId ────────────────────
// Follow / unfollow a user
router.post('/follow/:userId', async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString())
      return res.status(400).json({ success: false, message: "You can't follow yourself" });

    const target  = await User.findById(req.params.userId);
    const current = await User.findById(req.user._id);

    if (!target)
      return res.status(404).json({ success: false, message: 'User not found' });

    const isFollowing = current.following.includes(req.params.userId);

    if (isFollowing) {
      current.following = current.following.filter(id => id.toString() !== req.params.userId);
      target.followers  = target.followers.filter(id => id.toString() !== req.user._id.toString());
    } else {
      current.following.push(req.params.userId);
      target.followers.push(req.user._id);
    }

    await current.save();
    await target.save();

    res.json({ success: true, following: !isFollowing, followingCount: current.following.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
