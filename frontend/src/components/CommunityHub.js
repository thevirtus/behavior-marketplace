import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Heart, 
  Share2, 
  Award,
  Plus,
  Filter,
  Search,
  ThumbsUp,
  MessageSquare,
  Star,
  Trophy,
  Target,
  Zap
} from 'lucide-react';

const CommunityHub = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboards, setLeaderboards] = useState({});
  const [newPost, setNewPost] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    // Mock data - replace with actual API calls
    setPosts([
      {
        id: 1,
        user: { name: 'Sarah Chen', avatar: '👩‍💼', level: 15 },
        content: 'Just hit a 30-day logging streak! 🔥 The AI predictions are getting scary accurate. Anyone else notice their mood predictions improving?',
        type: 'achievement',
        likes: 24,
        comments: 8,
        timestamp: '2 hours ago',
        tags: ['streak', 'predictions', 'mood']
      },
      {
        id: 2,
        user: { name: 'Mike Rodriguez', avatar: '👨‍🎓', level: 22 },
        content: 'Pro tip: I\'ve been tracking my coffee intake vs productivity and found my sweet spot is 2 cups before 10am. The correlation analysis in this app is incredible! ☕📊',
        type: 'tip',
        likes: 31,
        comments: 12,
        timestamp: '4 hours ago',
        tags: ['productivity', 'coffee', 'analysis']
      },
      {
        id: 3,
        user: { name: 'Emma Thompson', avatar: '👩‍🔬', level: 18 },
        content: 'Question: Has anyone tried the new sleep prediction model? Mine said I\'d sleep 7.2 hours and I got exactly 7 hours 14 minutes. Mind blown! 🤯',
        type: 'question',
        likes: 19,
        comments: 15,
        timestamp: '6 hours ago',
        tags: ['sleep', 'predictions', 'accuracy']
      }
    ]);

    setChallenges([
      {
        id: 1,
        title: 'Mindful March Challenge',
        description: 'Track your meditation and mindfulness activities for 30 days',
        participants: 1247,
        reward: '$25 + 1000 XP',
        difficulty: 'Medium',
        timeLeft: '23 days',
        category: 'wellness'
      },
      {
        id: 2,
        title: 'Social Butterfly Sprint',
        description: 'Log 50 social interactions in one week',
        participants: 892,
        reward: '$15 + 750 XP',
        difficulty: 'Hard',
        timeLeft: '3 days',
        category: 'social'
      },
      {
        id: 3,
        title: 'Data Detective',
        description: 'Discover 3 new behavior patterns using AI insights',
        participants: 456,
        reward: '$10 + 500 XP',
        difficulty: 'Easy',
        timeLeft: '12 days',
        category: 'analysis'
      }
    ]);

    setLeaderboards({
      weekly: [
        { rank: 1, name: 'Alex Kim', xp: 2847, badge: '🏆' },
        { rank: 2, name: 'Jordan Smith', xp: 2691, badge: '🥈' },
        { rank: 3, name: 'Taylor Brown', xp: 2534, badge: '🥉' },
        { rank: 4, name: 'Casey Johnson', xp: 2387, badge: '⭐' },
        { rank: 5, name: 'Riley Davis', xp: 2201, badge: '⭐' }
      ],
      allTime: [
        { rank: 1, name: 'Morgan Lee', xp: 15847, badge: '👑' },
        { rank: 2, name: 'Avery Wilson', xp: 14291, badge: '💎' },
        { rank: 3, name: 'Quinn Taylor', xp: 13756, badge: '🌟' },
        { rank: 4, name: 'River Chen', xp: 12943, badge: '⚡' },
        { rank: 5, name: 'Sage Martinez', xp: 12087, badge: '🚀' }
      ]
    });
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const post = {
      id: Date.now(),
      user: { name: `${user.firstName} ${user.lastName}`, avatar: '👤', level: user.gamificationStats?.level || 1 },
      content: newPost,
      type: 'post',
      likes: 0,
      comments: 0,
      timestamp: 'Just now',
      tags: []
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.type === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Community Hub 🌟
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with fellow behavior trackers, share insights, and grow together
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-lg">
            {[
              { id: 'feed', label: 'Community Feed', icon: MessageCircle },
              { id: 'challenges', label: 'Challenges', icon: Target },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Community Feed */}
        {activeTab === 'feed' && (
          <div className="max-w-2xl mx-auto">
            {/* Create Post */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <form onSubmit={handlePostSubmit}>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Share your insights, ask questions, or celebrate achievements..."
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex space-x-2">
                        <span className="text-sm text-gray-500">💡 Tip</span>
                        <span className="text-sm text-gray-500">🎯 Achievement</span>
                        <span className="text-sm text-gray-500">❓ Question</span>
                      </div>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Posts</option>
                  <option value="tip">Tips</option>
                  <option value="question">Questions</option>
                  <option value="achievement">Achievements</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                {filteredPosts.length} posts
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-6">
              {filteredPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">{post.user.avatar}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Level {post.user.level}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{post.timestamp}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.type === 'achievement' ? 'bg-yellow-100 text-yellow-800' :
                      post.type === 'tip' ? 'bg-green-100 text-green-800' :
                      post.type === 'question' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {post.type === 'achievement' && '🏆 Achievement'}
                      {post.type === 'tip' && '💡 Tip'}
                      {post.type === 'question' && '❓ Question'}
                      {post.type === 'post' && '📝 Post'}
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map(tag => (
                        <span key={tag} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Heart className="w-5 h-5" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <MessageSquare className="w-5 h-5" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span>Share</span>
                      </button>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Challenges</h2>
              <p className="text-gray-600">Join challenges to earn rewards and compete with others</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map(challenge => (
                <div key={challenge.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {challenge.difficulty}
                    </div>
                    <div className="text-sm text-gray-500">{challenge.timeLeft} left</div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{challenge.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{challenge.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Participants</span>
                      <span className="font-semibold text-blue-600">{challenge.participants.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Reward</span>
                      <span className="font-semibold text-green-600">{challenge.reward}</span>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium">
                    Join Challenge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Leaderboards</h2>
              <p className="text-gray-600">See how you rank against other behavior trackers</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Weekly Leaderboard */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                    Weekly Leaders
                  </h3>
                  <span className="text-sm text-gray-500">This Week</span>
                </div>

                <div className="space-y-4">
                  {leaderboards.weekly.map((user, index) => (
                    <div key={user.rank} className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{user.name}</span>
                          <span className="text-lg">{user.badge}</span>
                        </div>
                        <div className="text-sm text-gray-500">{user.xp.toLocaleString()} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All-Time Leaderboard */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-purple-600" />
                    All-Time Legends
                  </h3>
                  <span className="text-sm text-gray-500">All Time</span>
                </div>

                <div className="space-y-4">
                  {leaderboards.allTime.map((user, index) => (
                    <div key={user.rank} className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-purple-100 text-purple-800' :
                        index === 1 ? 'bg-blue-100 text-blue-800' :
                        index === 2 ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{user.name}</span>
                          <span className="text-lg">{user.badge}</span>
                        </div>
                        <div className="text-sm text-gray-500">{user.xp.toLocaleString()} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHub;
