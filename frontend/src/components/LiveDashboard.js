import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Zap, 
  Award, 
  Target,
  Bell,
  MessageCircle,
  Flame,
  Star,
  Trophy,
  Brain,
  Heart,
  DollarSign
} from 'lucide-react';

const LiveDashboard = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [liveStats, setLiveStats] = useState({});
  const [globalStats, setGlobalStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');

  useEffect(() => {
    if (!user || !token) return;

    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to live dashboard');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Welcome message with initial data
    newSocket.on('welcome', (data) => {
      setLiveStats(data.stats);
      setPredictions(data.todaysPredictions);
      setAchievements(data.achievements);
      setChallenges(data.challenges);
    });

    // Live updates
    newSocket.on('global_stats_update', setGlobalStats);
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    });

    newSocket.on('live_prediction', (prediction) => {
      setPredictions(prev => [prediction, ...prev.slice(0, 2)]);
    });

    newSocket.on('level_up', (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        title: '🎉 Level Up!',
        message: `You reached level ${data.newLevel}! +${data.xpGained} XP`,
        type: 'level_up',
        createdAt: new Date()
      }, ...prev.slice(0, 4)]);
    });

    newSocket.on('achievements_unlocked', (newAchievements) => {
      setAchievements(prev => [...newAchievements, ...prev]);
      newAchievements.forEach(achievement => {
        setNotifications(prev => [{
          id: Date.now() + Math.random(),
          title: '🏆 Achievement Unlocked!',
          message: achievement.name,
          type: 'achievement',
          createdAt: new Date()
        }, ...prev.slice(0, 4)]);
      });
    });

    newSocket.on('challenge_completed', (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        title: '🎯 Challenge Complete!',
        message: data.message,
        type: 'challenge',
        createdAt: new Date()
      }, ...prev.slice(0, 4)]);
    });

    newSocket.on('motivation', (message) => {
      setMotivationMessage(message);
    });

    newSocket.on('friend_activity', (activity) => {
      setNotifications(prev => [{
        id: Date.now(),
        title: '👥 Friend Activity',
        message: `${activity.data.user} ${activity.data.activity}`,
        type: 'social',
        createdAt: new Date()
      }, ...prev.slice(0, 4)]);
    });

    // Subscribe to leaderboard updates
    newSocket.emit('subscribe_leaderboard', 'xp');

    newSocket.on('leaderboard_update', (data) => {
      if (data.type === 'xp') {
        setLeaderboard(data.data);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, token]);

  const requestPrediction = () => {
    if (socket) {
      socket.emit('request_prediction', { type: 'comprehensive' });
    }
  };

  const joinChallenge = (challengeId) => {
    if (socket) {
      socket.emit('join_challenge', challengeId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Connection Status */}
      <div className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-sm font-medium ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Your live behavior dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={requestPrediction}
                className="btn-primary flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>Get AI Prediction</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Motivation Message */}
        {motivationMessage && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-8 shadow-lg">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6" />
              <p className="text-lg font-medium">{motivationMessage}</p>
            </div>
          </div>
        )}

        {/* Live Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Level</p>
                <p className="text-3xl font-bold text-blue-600">{liveStats.level || 1}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((liveStats.xp || 0) % 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{liveStats.xp || 0} XP</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Streak</p>
                <p className="text-3xl font-bold text-orange-600">{liveStats.weekStreak || 0}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Days in a row</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Logs</p>
                <p className="text-3xl font-bold text-green-600">{liveStats.todayLogs || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Behaviors logged</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-3xl font-bold text-purple-600">${liveStats.earnings || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Total earned</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Live Predictions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-600" />
                  Live AI Predictions
                </h2>
                <button
                  onClick={requestPrediction}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Generate New
                </button>
              </div>
              
              {predictions.length > 0 ? (
                <div className="space-y-4">
                  {predictions.slice(0, 3).map((prediction, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{prediction.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{prediction.description}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {Math.round(prediction.confidence * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">confidence</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No predictions yet. Log some behaviors to get started!</p>
                </div>
              )}
            </div>

            {/* Active Challenges */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                Active Challenges
              </h2>
              
              {challenges.length > 0 ? (
                <div className="space-y-4">
                  {challenges.map((challenge, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{challenge.description}</p>
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(challenge.progress || 0) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm font-medium text-green-600">
                            {challenge.rewardXp} XP
                          </div>
                          <div className="text-sm text-green-600">
                            ${challenge.rewardMoney}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active challenges. Join one to start earning rewards!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Live Notifications */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-yellow-600" />
                Live Updates
              </h2>
              
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {notification.type === 'level_up' && <Star className="w-4 h-4 text-blue-600" />}
                        {notification.type === 'achievement' && <Trophy className="w-4 h-4 text-yellow-600" />}
                        {notification.type === 'challenge' && <Target className="w-4 h-4 text-green-600" />}
                        {notification.type === 'social' && <Users className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-500">{notification.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No new updates</p>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                XP Leaderboard
              </h2>
              
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry.user.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.rank}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{entry.user.name}</p>
                        <p className="text-xs text-gray-500">{entry.stats.value} {entry.stats.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Leaderboard loading...</p>
                </div>
              )}
            </div>

            {/* Global Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Global Stats
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Online Users</span>
                  <span className="font-semibold text-green-600">{globalStats.totalUsers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Today's Behaviors</span>
                  <span className="font-semibold text-blue-600">{globalStats.todayBehaviors || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Challenges</span>
                  <span className="font-semibold text-purple-600">{globalStats.activeChallenges || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="font-semibold text-yellow-600">${globalStats.totalEarnings || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDashboard;
