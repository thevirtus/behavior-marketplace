const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Notification, BehaviorLog, Prediction } = require('../models');
const aiPredictionService = require('./aiPredictionService');

class RealtimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.activeRooms = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startPeriodicTasks();
    
    console.log('Realtime Service initialized');
  }

  setupMiddleware() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.firstName} connected`);
      
      // Store connected user
      this.connectedUsers.set(socket.userId, {
        socket,
        user: socket.user,
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      // Send welcome message with live stats
      this.sendWelcomeMessage(socket);

      // Handle behavior logging events
      socket.on('log_behavior', async (data) => {
        await this.handleBehaviorLog(socket, data);
      });

      // Handle prediction requests
      socket.on('request_prediction', async (data) => {
        await this.handlePredictionRequest(socket, data);
      });

      // Handle live chat
      socket.on('join_chat_room', (roomId) => {
        this.handleJoinChatRoom(socket, roomId);
      });

      socket.on('send_message', (data) => {
        this.handleChatMessage(socket, data);
      });

      // Handle challenge participation
      socket.on('join_challenge', async (challengeId) => {
        await this.handleJoinChallenge(socket, challengeId);
      });

      // Handle live leaderboard updates
      socket.on('subscribe_leaderboard', (type) => {
        socket.join(`leaderboard_${type}`);
        this.sendLeaderboardUpdate(socket, type);
      });

      // Handle live marketplace updates
      socket.on('subscribe_marketplace', () => {
        socket.join('marketplace_updates');
        this.sendMarketplaceUpdates(socket);
      });

      // Handle activity tracking
      socket.on('activity_ping', () => {
        this.updateUserActivity(socket.userId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.firstName} disconnected`);
        this.connectedUsers.delete(socket.userId);
      });
    });
  }

  async sendWelcomeMessage(socket) {
    const user = socket.user;
    const stats = await this.getUserLiveStats(user.id);
    
    socket.emit('welcome', {
      message: `Welcome back, ${user.firstName}! 🎉`,
      stats,
      onlineUsers: this.connectedUsers.size,
      todaysPredictions: await this.getTodaysPredictions(user.id),
      achievements: await this.getRecentAchievements(user.id),
      challenges: await this.getActiveChallenges(user.id)
    });
  }

  async handleBehaviorLog(socket, data) {
    try {
      // Create the behavior log
      const behaviorLog = await BehaviorLog.create({
        userId: socket.userId,
        ...data,
        occurredAt: new Date()
      });

      // Send confirmation to user
      socket.emit('behavior_logged', {
        success: true,
        log: behaviorLog,
        xpGained: this.calculateXPGain(data),
        message: 'Behavior logged successfully! 📊'
      });

      // Check for achievements
      const newAchievements = await this.checkAchievements(socket.userId, behaviorLog);
      if (newAchievements.length > 0) {
        socket.emit('achievements_unlocked', newAchievements);
        this.broadcastAchievement(socket.user, newAchievements[0]);
      }

      // Trigger live prediction update
      this.triggerPredictionUpdate(socket.userId);

      // Update leaderboards
      this.updateLeaderboards(socket.userId, data);

      // Send to connected friends/followers
      this.notifyConnections(socket.userId, 'behavior_update', {
        user: socket.user.firstName,
        activity: data.title,
        timestamp: new Date()
      });

    } catch (error) {
      socket.emit('behavior_log_error', {
        success: false,
        message: 'Failed to log behavior',
        error: error.message
      });
    }
  }

  async handlePredictionRequest(socket, data) {
    try {
      socket.emit('prediction_generating', {
        message: 'AI is analyzing your patterns... 🤖',
        estimatedTime: '10-15 seconds'
      });

      const predictions = await aiPredictionService.generatePredictions(socket.userId);
      
      socket.emit('predictions_ready', {
        predictions,
        message: 'Fresh predictions are ready! 🔮',
        confidence: this.getAverageConfidence(predictions)
      });

      // Update user's gamification stats
      await this.updateUserXP(socket.userId, 25, 'Generated predictions');

    } catch (error) {
      socket.emit('prediction_error', {
        message: 'Unable to generate predictions',
        error: error.message,
        suggestion: 'Try logging more behaviors for better predictions'
      });
    }
  }

  handleJoinChatRoom(socket, roomId) {
    socket.join(`chat_${roomId}`);
    
    // Send recent messages
    this.sendRecentMessages(socket, roomId);
    
    // Notify room about new user
    socket.to(`chat_${roomId}`).emit('user_joined', {
      user: socket.user.firstName,
      timestamp: new Date()
    });
  }

  handleChatMessage(socket, data) {
    const message = {
      id: Date.now(),
      user: socket.user.firstName,
      userId: socket.userId,
      message: data.message,
      timestamp: new Date(),
      avatar: socket.user.avatarUrl
    };

    // Broadcast to room
    this.io.to(`chat_${data.roomId}`).emit('new_message', message);
    
    // Store message (implement message storage)
    this.storeMessage(data.roomId, message);
  }

  async handleJoinChallenge(socket, challengeId) {
    try {
      // Join challenge logic here
      const challenge = await this.joinUserToChallenge(socket.userId, challengeId);
      
      socket.emit('challenge_joined', {
        challenge,
        message: 'Challenge accepted! 💪',
        participants: challenge.currentParticipants
      });

      // Notify challenge room
      socket.join(`challenge_${challengeId}`);
      socket.to(`challenge_${challengeId}`).emit('new_participant', {
        user: socket.user.firstName,
        totalParticipants: challenge.currentParticipants
      });

    } catch (error) {
      socket.emit('challenge_join_error', {
        message: 'Failed to join challenge',
        error: error.message
      });
    }
  }

  // Live update methods
  async triggerPredictionUpdate(userId) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection) {
      // Send live prediction updates
      setTimeout(async () => {
        const quickPrediction = await this.generateQuickPrediction(userId);
        userConnection.socket.emit('live_prediction', quickPrediction);
      }, 2000);
    }
  }

  async updateLeaderboards(userId, behaviorData) {
    // Update various leaderboards
    const leaderboardUpdates = await this.calculateLeaderboardPositions(userId);
    
    // Broadcast to leaderboard subscribers
    Object.keys(leaderboardUpdates).forEach(type => {
      this.io.to(`leaderboard_${type}`).emit('leaderboard_update', {
        type,
        data: leaderboardUpdates[type]
      });
    });
  }

  broadcastAchievement(user, achievement) {
    // Broadcast achievement to all connected users
    this.io.emit('global_achievement', {
      user: user.firstName,
      achievement: achievement.name,
      description: achievement.description,
      timestamp: new Date()
    });
  }

  async notifyConnections(userId, eventType, data) {
    // Get user's connections and notify them
    const connections = await this.getUserConnections(userId);
    
    connections.forEach(connectionId => {
      const connection = this.connectedUsers.get(connectionId);
      if (connection) {
        connection.socket.emit('friend_activity', {
          type: eventType,
          data
        });
      }
    });
  }

  // Periodic tasks
  startPeriodicTasks() {
    // Send live stats every 30 seconds
    setInterval(() => {
      this.broadcastLiveStats();
    }, 30000);

    // Check for new achievements every minute
    setInterval(() => {
      this.checkAllUsersAchievements();
    }, 60000);

    // Update marketplace insights every 5 minutes
    setInterval(() => {
      this.updateMarketplaceInsights();
    }, 300000);

    // Send motivational notifications
    setInterval(() => {
      this.sendMotivationalNotifications();
    }, 1800000); // 30 minutes
  }

  async broadcastLiveStats() {
    const globalStats = await this.getGlobalStats();
    this.io.emit('global_stats_update', globalStats);
  }

  async sendMotivationalNotifications() {
    for (const [userId, connection] of this.connectedUsers) {
      const motivation = await this.generateMotivationalMessage(userId);
      if (motivation) {
        connection.socket.emit('motivation', motivation);
      }
    }
  }

  // Helper methods
  calculateXPGain(behaviorData) {
    let xp = 10; // Base XP
    if (behaviorData.moodRating) xp += 5;
    if (behaviorData.energyLevel) xp += 5;
    if (behaviorData.description && behaviorData.description.length > 20) xp += 10;
    return xp;
  }

  async getUserLiveStats(userId) {
    // Calculate live user statistics
    return {
      todayLogs: await this.getTodayBehaviorCount(userId),
      weekStreak: await this.getWeekStreak(userId),
      totalXP: await this.getUserXP(userId),
      level: await this.getUserLevel(userId),
      earnings: await this.getUserEarnings(userId),
      rank: await this.getUserRank(userId)
    };
  }

  async getGlobalStats() {
    return {
      totalUsers: this.connectedUsers.size,
      todayBehaviors: await this.getTodayGlobalBehaviors(),
      activeChallenges: await this.getActiveChallengesCount(),
      totalEarnings: await this.getTotalPlatformEarnings(),
      topPerformer: await this.getTopPerformer()
    };
  }

  updateUserActivity(userId) {
    const connection = this.connectedUsers.get(userId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  // Notification system
  async createNotification(userId, title, message, type, data = {}) {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data
    });

    // Send real-time notification if user is connected
    const connection = this.connectedUsers.get(userId);
    if (connection) {
      connection.socket.emit('notification', notification);
    }

    return notification;
  }

  // Placeholder methods (implement based on your business logic)
  async checkAchievements(userId, behaviorLog) { return []; }
  async joinUserToChallenge(userId, challengeId) { return {}; }
  async generateQuickPrediction(userId) { return {}; }
  async calculateLeaderboardPositions(userId) { return {}; }
  async getUserConnections(userId) { return []; }
  async getTodaysPredictions(userId) { return []; }
  async getRecentAchievements(userId) { return []; }
  async getActiveChallenges(userId) { return []; }
  async sendRecentMessages(socket, roomId) {}
  async storeMessage(roomId, message) {}
  async updateUserXP(userId, xp, reason) {}
  async generateMotivationalMessage(userId) { return null; }
  async getTodayBehaviorCount(userId) { return 0; }
  async getWeekStreak(userId) { return 0; }
  async getUserXP(userId) { return 0; }
  async getUserLevel(userId) { return 1; }
  async getUserEarnings(userId) { return 0; }
  async getUserRank(userId) { return 0; }
  async getTodayGlobalBehaviors() { return 0; }
  async getActiveChallengesCount() { return 0; }
  async getTotalPlatformEarnings() { return 0; }
  async getTopPerformer() { return null; }
  getAverageConfidence(predictions) { return 0.8; }
  sendLeaderboardUpdate(socket, type) {}
  sendMarketplaceUpdates(socket) {}
  updateMarketplaceInsights() {}
  checkAllUsersAchievements() {}
}

module.exports = new RealtimeService();
