const { User, Achievement, UserAchievement, Challenge, UserChallenge, BehaviorLog } = require('../models');
const { Op } = require('sequelize');
const realtimeService = require('./realtimeService');

class GamificationService {
  constructor() {
    this.levelThresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 50000];
    this.streakMultipliers = { 7: 1.2, 14: 1.5, 30: 2.0, 60: 2.5, 100: 3.0 };
  }

  async updateUserXP(userId, xpGain, reason) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const currentStats = user.gamificationStats || { level: 1, xp: 0, badges: [], streak: 0 };
      const oldLevel = currentStats.level;
      
      // Add XP with streak multiplier
      const streakMultiplier = this.getStreakMultiplier(currentStats.streak);
      const finalXP = Math.round(xpGain * streakMultiplier);
      currentStats.xp += finalXP;

      // Calculate new level
      const newLevel = this.calculateLevel(currentStats.xp);
      const leveledUp = newLevel > oldLevel;
      currentStats.level = newLevel;

      // Update user
      await user.update({ gamificationStats: currentStats });

      // Check for level-up achievements
      if (leveledUp) {
        await this.checkLevelAchievements(userId, newLevel);
        
        // Send level-up notification
        if (realtimeService.connectedUsers.has(userId)) {
          const connection = realtimeService.connectedUsers.get(userId);
          connection.socket.emit('level_up', {
            oldLevel,
            newLevel,
            xpGained: finalXP,
            reason,
            rewards: await this.getLevelRewards(newLevel)
          });
        }
      }

      return { xpGained: finalXP, newLevel, leveledUp };
    } catch (error) {
      console.error('Error updating user XP:', error);
      throw error;
    }
  }

  async updateStreak(userId) {
    try {
      const user = await User.findByPk(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if user logged behavior today
      const todayLogs = await BehaviorLog.count({
        where: {
          userId,
          occurredAt: { [Op.gte]: today }
        }
      });

      // Check if user logged behavior yesterday
      const yesterdayLogs = await BehaviorLog.count({
        where: {
          userId,
          occurredAt: { 
            [Op.gte]: yesterday,
            [Op.lt]: today
          }
        }
      });

      const currentStats = user.gamificationStats || { level: 1, xp: 0, badges: [], streak: 0 };
      
      if (todayLogs > 0) {
        if (yesterdayLogs > 0 || currentStats.streak === 0) {
          // Continue or start streak
          currentStats.streak += 1;
          
          // Check for streak achievements
          await this.checkStreakAchievements(userId, currentStats.streak);
          
          // Streak milestone rewards
          if ([7, 14, 30, 60, 100].includes(currentStats.streak)) {
            await this.grantStreakReward(userId, currentStats.streak);
          }
        }
      } else if (yesterdayLogs === 0 && currentStats.streak > 0) {
        // Break streak
        currentStats.streak = 0;
      }

      await user.update({ gamificationStats: currentStats });
      return currentStats.streak;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  async checkAchievements(userId, behaviorLog) {
    const newAchievements = [];
    
    try {
      // Get all available achievements
      const achievements = await Achievement.findAll({ where: { isActive: true } });
      
      // Get user's current achievements
      const userAchievements = await UserAchievement.findAll({
        where: { userId },
        include: [Achievement]
      });
      
      const earnedAchievementIds = userAchievements.map(ua => ua.achievementId);

      for (const achievement of achievements) {
        if (earnedAchievementIds.includes(achievement.id)) continue;

        const earned = await this.checkSingleAchievement(userId, achievement, behaviorLog);
        if (earned) {
          await UserAchievement.create({
            userId,
            achievementId: achievement.id
          });
          
          // Award XP
          if (achievement.rewardXp > 0) {
            await this.updateUserXP(userId, achievement.rewardXp, `Achievement: ${achievement.name}`);
          }
          
          newAchievements.push(achievement);
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  async checkSingleAchievement(userId, achievement, behaviorLog) {
    const requirements = achievement.requirements;
    
    try {
      switch (achievement.category) {
        case 'Getting Started':
          return await this.checkGettingStartedAchievement(userId, requirements);
        case 'Exploration':
          return await this.checkExplorationAchievement(userId, requirements);
        case 'Consistency':
          return await this.checkConsistencyAchievement(userId, requirements);
        case 'Predictions':
          return await this.checkPredictionAchievement(userId, requirements);
        case 'Social':
          return await this.checkSocialAchievement(userId, requirements);
        case 'Earnings':
          return await this.checkEarningsAchievement(userId, requirements);
        case 'Challenges':
          return await this.checkChallengeAchievement(userId, requirements);
        case 'Contribution':
          return await this.checkContributionAchievement(userId, requirements);
        case 'Community':
          return await this.checkCommunityAchievement(userId, requirements);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking achievement ${achievement.name}:`, error);
      return false;
    }
  }

  async createDynamicChallenge(type, difficulty = 'medium') {
    const challengeTemplates = {
      daily_logger: {
        title: '7-Day Logging Challenge',
        description: 'Log at least one behavior every day for 7 consecutive days',
        requirements: { consecutive_days: 7, min_logs_per_day: 1 },
        reward_xp: 500,
        reward_money: 5.00,
        duration: 7
      },
      mood_tracker: {
        title: 'Mood Master Challenge',
        description: 'Track your mood rating for 14 days straight',
        requirements: { mood_logs: 14, consecutive_days: 14 },
        reward_xp: 750,
        reward_money: 10.00,
        duration: 14
      },
      social_butterfly: {
        title: 'Social Connection Challenge',
        description: 'Log 20 social interactions in one week',
        requirements: { social_logs: 20, category: 'social' },
        reward_xp: 400,
        reward_money: 7.50,
        duration: 7
      },
      health_warrior: {
        title: 'Health & Wellness Challenge',
        description: 'Log exercise, sleep, and nutrition for 10 days',
        requirements: { 
          exercise_logs: 10, 
          sleep_logs: 10, 
          nutrition_logs: 10,
          categories: ['exercise', 'sleep', 'nutrition']
        },
        reward_xp: 1000,
        reward_money: 15.00,
        duration: 10
      },
      prediction_seeker: {
        title: 'AI Prediction Challenge',
        description: 'Generate and rate 5 AI predictions',
        requirements: { predictions_generated: 5, predictions_rated: 5 },
        reward_xp: 300,
        reward_money: 5.00,
        duration: 14
      }
    };

    const template = challengeTemplates[type];
    if (!template) throw new Error('Invalid challenge type');

    // Adjust difficulty
    const difficultyMultipliers = {
      easy: { reward: 0.7, requirement: 0.7 },
      medium: { reward: 1.0, requirement: 1.0 },
      hard: { reward: 1.5, requirement: 1.3 },
      expert: { reward: 2.0, requirement: 1.8 }
    };

    const multiplier = difficultyMultipliers[difficulty];
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + template.duration);

    const challenge = await Challenge.create({
      title: `${difficulty.toUpperCase()} ${template.title}`,
      description: template.description,
      category: type,
      difficulty,
      requirements: this.adjustRequirements(template.requirements, multiplier.requirement),
      rewardXp: Math.round(template.reward_xp * multiplier.reward),
      rewardMoney: template.reward_money * multiplier.reward,
      startDate,
      endDate,
      maxParticipants: 100,
      isActive: true
    });

    return challenge;
  }

  async joinChallenge(userId, challengeId) {
    try {
      const challenge = await Challenge.findByPk(challengeId);
      if (!challenge) throw new Error('Challenge not found');
      if (!challenge.isActive) throw new Error('Challenge is not active');
      if (challenge.currentParticipants >= challenge.maxParticipants) {
        throw new Error('Challenge is full');
      }

      // Check if user already joined
      const existing = await UserChallenge.findOne({
        where: { userId, challengeId }
      });
      if (existing) throw new Error('Already joined this challenge');

      // Join challenge
      await UserChallenge.create({
        userId,
        challengeId,
        status: 'active',
        progress: {}
      });

      // Update participant count
      await challenge.increment('currentParticipants');

      return challenge;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  async updateChallengeProgress(userId, behaviorLog) {
    try {
      const activeChallenges = await UserChallenge.findAll({
        where: { 
          userId, 
          status: 'active' 
        },
        include: [Challenge]
      });

      for (const userChallenge of activeChallenges) {
        const challenge = userChallenge.Challenge;
        const progress = userChallenge.progress || {};
        
        // Update progress based on challenge requirements
        const updated = this.updateProgressForChallenge(progress, challenge.requirements, behaviorLog);
        
        if (updated) {
          await userChallenge.update({ progress });
          
          // Check if challenge is completed
          if (this.isChallengeCompleted(progress, challenge.requirements)) {
            await this.completeChallenge(userId, challenge.id);
          }
        }
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  }

  async completeChallenge(userId, challengeId) {
    try {
      const userChallenge = await UserChallenge.findOne({
        where: { userId, challengeId },
        include: [Challenge]
      });

      if (!userChallenge) return;

      const challenge = userChallenge.Challenge;
      
      // Mark as completed
      await userChallenge.update({ 
        status: 'completed',
        completedAt: new Date()
      });

      // Award rewards
      if (challenge.rewardXp > 0) {
        await this.updateUserXP(userId, challenge.rewardXp, `Challenge: ${challenge.title}`);
      }

      if (challenge.rewardMoney > 0) {
        await this.awardMoney(userId, challenge.rewardMoney, `Challenge reward: ${challenge.title}`);
      }

      // Send completion notification
      if (realtimeService.connectedUsers.has(userId)) {
        const connection = realtimeService.connectedUsers.get(userId);
        connection.socket.emit('challenge_completed', {
          challenge: challenge.title,
          xpReward: challenge.rewardXp,
          moneyReward: challenge.rewardMoney,
          message: `🎉 Challenge completed! You earned ${challenge.rewardXp} XP and $${challenge.rewardMoney}!`
        });
      }

      return true;
    } catch (error) {
      console.error('Error completing challenge:', error);
      return false;
    }
  }

  async getLeaderboard(type, limit = 10) {
    try {
      let orderBy;
      let include = [];

      switch (type) {
        case 'xp':
          orderBy = [['gamificationStats', 'DESC']];
          break;
        case 'streak':
          orderBy = [['gamificationStats', 'DESC']];
          break;
        case 'earnings':
          orderBy = [['totalEarnings', 'DESC']];
          break;
        case 'behaviors':
          // This would need a join with BehaviorLog
          include = [{ model: BehaviorLog, attributes: [] }];
          orderBy = [[{ model: BehaviorLog }, 'id', 'DESC']];
          break;
        default:
          orderBy = [['gamificationStats', 'DESC']];
      }

      const users = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'gamificationStats', 'totalEarnings'],
        where: { isActive: true },
        order: orderBy,
        limit,
        include
      });

      return users.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatarUrl
        },
        stats: this.getLeaderboardStats(user, type)
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Helper methods
  calculateLevel(xp) {
    for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
      if (xp >= this.levelThresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  getStreakMultiplier(streak) {
    for (const [threshold, multiplier] of Object.entries(this.streakMultipliers).reverse()) {
      if (streak >= parseInt(threshold)) {
        return multiplier;
      }
    }
    return 1.0;
  }

  async getLevelRewards(level) {
    const rewards = {
      5: { badge: 'Rising Star', feature: 'Custom themes' },
      10: { badge: 'Data Explorer', feature: 'Advanced analytics' },
      15: { badge: 'Behavior Master', feature: 'Priority predictions' },
      20: { badge: 'Community Leader', feature: 'Create challenges' },
      25: { badge: 'AI Whisperer', feature: 'Model training input' }
    };
    return rewards[level] || null;
  }

  async grantStreakReward(userId, streak) {
    const rewards = {
      7: { xp: 100, money: 2.00, badge: 'Week Warrior' },
      14: { xp: 250, money: 5.00, badge: 'Fortnight Fighter' },
      30: { xp: 500, money: 10.00, badge: 'Month Master' },
      60: { xp: 1000, money: 25.00, badge: 'Streak Legend' },
      100: { xp: 2000, money: 50.00, badge: 'Century Champion' }
    };

    const reward = rewards[streak];
    if (reward) {
      await this.updateUserXP(userId, reward.xp, `${streak}-day streak bonus`);
      await this.awardMoney(userId, reward.money, `${streak}-day streak reward`);
      
      // Add badge to user
      const user = await User.findByPk(userId);
      const stats = user.gamificationStats || { level: 1, xp: 0, badges: [], streak: 0 };
      if (!stats.badges.includes(reward.badge)) {
        stats.badges.push(reward.badge);
        await user.update({ gamificationStats: stats });
      }
    }
  }

  async awardMoney(userId, amount, reason) {
    const user = await User.findByPk(userId);
    await user.increment('totalEarnings', { by: amount });
    
    // Create transaction record
    // Implementation depends on your Transaction model
  }

  // Achievement checking methods
  async checkGettingStartedAchievement(userId, requirements) {
    if (requirements.behavior_logs) {
      const count = await BehaviorLog.count({ where: { userId } });
      return count >= requirements.behavior_logs;
    }
    return false;
  }

  async checkExplorationAchievement(userId, requirements) {
    if (requirements.unique_categories) {
      const categories = await BehaviorLog.findAll({
        where: { userId },
        attributes: ['categoryId'],
        group: ['categoryId']
      });
      return categories.length >= requirements.unique_categories;
    }
    return false;
  }

  async checkConsistencyAchievement(userId, requirements) {
    if (requirements.consecutive_days) {
      const user = await User.findByPk(userId);
      const streak = user.gamificationStats?.streak || 0;
      return streak >= requirements.consecutive_days;
    }
    return false;
  }

  // Placeholder methods for other achievement types
  async checkPredictionAchievement(userId, requirements) { return false; }
  async checkSocialAchievement(userId, requirements) { return false; }
  async checkEarningsAchievement(userId, requirements) { return false; }
  async checkChallengeAchievement(userId, requirements) { return false; }
  async checkContributionAchievement(userId, requirements) { return false; }
  async checkCommunityAchievement(userId, requirements) { return false; }
  async checkLevelAchievements(userId, level) {}
  async checkStreakAchievements(userId, streak) {}

  adjustRequirements(requirements, multiplier) {
    const adjusted = { ...requirements };
    Object.keys(adjusted).forEach(key => {
      if (typeof adjusted[key] === 'number') {
        adjusted[key] = Math.round(adjusted[key] * multiplier);
      }
    });
    return adjusted;
  }

  updateProgressForChallenge(progress, requirements, behaviorLog) {
    // Implementation depends on specific challenge requirements
    return false;
  }

  isChallengeCompleted(progress, requirements) {
    // Implementation depends on specific challenge requirements
    return false;
  }

  getLeaderboardStats(user, type) {
    const stats = user.gamificationStats || {};
    switch (type) {
      case 'xp': return { value: stats.xp || 0, label: 'XP' };
      case 'streak': return { value: stats.streak || 0, label: 'Day Streak' };
      case 'earnings': return { value: user.totalEarnings || 0, label: 'Earned' };
      default: return { value: 0, label: 'Points' };
    }
  }
}

module.exports = new GamificationService();
