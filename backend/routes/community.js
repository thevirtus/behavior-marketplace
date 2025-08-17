const express = require('express');
const router = express.Router();
const { User, CommunityPost, CommunityComment } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { addSubscriptionInfo } = require('../middleware/subscriptionMiddleware');

// Get community feed
router.get('/posts', requireAuth, addSubscriptionInfo, async (req, res) => {
  try {
    const { filter = 'all', limit = 20, offset = 0 } = req.query;
    
    let whereClause = {};
    if (filter !== 'all') {
      whereClause.type = filter;
    }

    const posts = await CommunityPost.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'gamificationStats']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      user: {
        name: `${post.User.firstName} ${post.User.lastName}`,
        avatar: post.User.avatarUrl || '👤',
        level: post.User.gamificationStats?.level || 1
      },
      content: post.content,
      type: post.type,
      likes: post.likesCount,
      comments: post.commentsCount,
      timestamp: formatTimestamp(post.createdAt),
      tags: post.tags || []
    }));

    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create new post
router.post('/posts', requireAuth, async (req, res) => {
  try {
    const { content, type = 'post', tags = [] } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = await CommunityPost.create({
      userId: req.user.id,
      content: content.trim(),
      type,
      tags
    });

    const user = await User.findByPk(req.user.id);
    
    const formattedPost = {
      id: post.id,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatarUrl || '👤',
        level: user.gamificationStats?.level || 1
      },
      content: post.content,
      type: post.type,
      likes: 0,
      comments: 0,
      timestamp: 'Just now',
      tags: post.tags || []
    };

    res.status(201).json({ post: formattedPost });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Like/unlike post
router.post('/posts/:id/like', requireAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Simple increment for now - in production, track individual likes
    await post.increment('likesCount');
    
    res.json({ success: true, likes: post.likesCount + 1 });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Get post comments
router.get('/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const comments = await CommunityComment.findAll({
      where: { postId: req.params.id },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      user: {
        name: `${comment.User.firstName} ${comment.User.lastName}`,
        avatar: comment.User.avatarUrl || '👤'
      },
      content: comment.content,
      likes: comment.likesCount,
      timestamp: formatTimestamp(comment.createdAt)
    }));

    res.json({ comments: formattedComments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to post
router.post('/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = await CommunityPost.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await CommunityComment.create({
      postId: req.params.id,
      userId: req.user.id,
      content: content.trim()
    });

    // Increment comment count
    await post.increment('commentsCount');

    const user = await User.findByPk(req.user.id);
    
    const formattedComment = {
      id: comment.id,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatarUrl || '👤'
      },
      content: comment.content,
      likes: 0,
      timestamp: 'Just now'
    };

    res.status(201).json({ comment: formattedComment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Helper function
function formatTimestamp(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

module.exports = router;
