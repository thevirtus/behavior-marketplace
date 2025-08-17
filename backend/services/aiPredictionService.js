const tf = require('@tensorflow/tfjs-node');
const { BehaviorLog, Prediction, User } = require('../models');
const { Op } = require('sequelize');

class AIPredictionService {
  constructor() {
    this.models = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize TensorFlow.js models
      await this.loadModels();
      this.isInitialized = true;
      console.log('AI Prediction Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Prediction Service:', error);
      throw error;
    }
  }

  async loadModels() {
    // Create and compile different prediction models
    this.models.set('sleep_prediction', this.createSleepPredictionModel());
    this.models.set('mood_prediction', this.createMoodPredictionModel());
    this.models.set('spending_prediction', this.createSpendingPredictionModel());
    this.models.set('activity_prediction', this.createActivityPredictionModel());
    this.models.set('health_prediction', this.createHealthPredictionModel());
  }

  createSleepPredictionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'linear' }) // sleep_duration, sleep_quality, bedtime
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  createMoodPredictionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [12], units: 48, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 24, activation: 'relu' }),
        tf.layers.dense({ units: 12, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // mood rating 0-1
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  createSpendingPredictionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' }) // spending amount
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  createActivityPredictionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [15], units: 64, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 5, activation: 'softmax' }) // activity categories
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  createHealthPredictionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 128, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 4, activation: 'linear' }) // health metrics
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  async generatePredictions(userId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      // Get user's behavior history
      const behaviorHistory = await this.getUserBehaviorHistory(userId);
      
      if (behaviorHistory.length < 10) {
        throw new Error('Insufficient data for predictions. Need at least 10 behavior logs.');
      }

      const predictions = [];

      // Generate different types of predictions
      const sleepPrediction = await this.predictSleep(behaviorHistory);
      const moodPrediction = await this.predictMood(behaviorHistory);
      const spendingPrediction = await this.predictSpending(behaviorHistory);
      const activityPrediction = await this.predictNextActivity(behaviorHistory);
      const healthPrediction = await this.predictHealthMetrics(behaviorHistory);

      // Store predictions in database
      for (const prediction of [sleepPrediction, moodPrediction, spendingPrediction, activityPrediction, healthPrediction]) {
        const savedPrediction = await Prediction.create({
          userId,
          predictionType: prediction.type,
          title: prediction.title,
          description: prediction.description,
          predictedValue: prediction.value,
          confidenceScore: prediction.confidence,
          modelVersion: '1.0.0',
          inputFeatures: prediction.features,
          predictionDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        });
        predictions.push(savedPrediction);
      }

      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }

  async getUserBehaviorHistory(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await BehaviorLog.findAll({
      where: {
        userId,
        occurredAt: {
          [Op.gte]: startDate
        }
      },
      order: [['occurredAt', 'DESC']],
      limit: 1000
    });
  }

  async predictSleep(behaviorHistory) {
    const sleepLogs = behaviorHistory.filter(log => 
      log.title.toLowerCase().includes('sleep') || 
      log.description?.toLowerCase().includes('sleep')
    );

    // Extract features for sleep prediction
    const features = this.extractSleepFeatures(behaviorHistory);
    const inputTensor = tf.tensor2d([features]);
    
    const model = this.models.get('sleep_prediction');
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();
    
    inputTensor.dispose();
    prediction.dispose();

    const sleepDuration = Math.max(4, Math.min(12, result[0])); // 4-12 hours
    const sleepQuality = Math.max(1, Math.min(10, result[1])); // 1-10 scale
    const bedtime = Math.max(20, Math.min(26, result[2])); // 8PM-2AM (24h format)

    return {
      type: 'sleep_prediction',
      title: 'Tomorrow\'s Sleep Prediction',
      description: `Based on your recent patterns, we predict you'll sleep for ${sleepDuration.toFixed(1)} hours with a quality rating of ${sleepQuality.toFixed(1)}/10.`,
      value: {
        duration: sleepDuration,
        quality: sleepQuality,
        bedtime: bedtime,
        recommendations: this.generateSleepRecommendations(sleepDuration, sleepQuality)
      },
      confidence: this.calculateConfidence(sleepLogs.length, 30),
      features
    };
  }

  async predictMood(behaviorHistory) {
    const features = this.extractMoodFeatures(behaviorHistory);
    const inputTensor = tf.tensor2d([features]);
    
    const model = this.models.get('mood_prediction');
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();
    
    inputTensor.dispose();
    prediction.dispose();

    const moodScore = result[0] * 10; // Convert to 1-10 scale
    const moodCategory = this.getMoodCategory(moodScore);

    return {
      type: 'mood_prediction',
      title: 'Tomorrow\'s Mood Forecast',
      description: `We predict your mood tomorrow will be ${moodCategory.toLowerCase()} with a score of ${moodScore.toFixed(1)}/10.`,
      value: {
        score: moodScore,
        category: moodCategory,
        factors: this.identifyMoodFactors(behaviorHistory),
        tips: this.generateMoodTips(moodScore)
      },
      confidence: this.calculateConfidence(behaviorHistory.length, 50),
      features
    };
  }

  async predictSpending(behaviorHistory) {
    const spendingLogs = behaviorHistory.filter(log => 
      log.title.toLowerCase().includes('purchase') || 
      log.title.toLowerCase().includes('buy') ||
      log.value > 0
    );

    const features = this.extractSpendingFeatures(behaviorHistory);
    const inputTensor = tf.tensor2d([features]);
    
    const model = this.models.get('spending_prediction');
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();
    
    inputTensor.dispose();
    prediction.dispose();

    const predictedAmount = Math.max(0, result[0]);
    const spendingCategory = this.getSpendingCategory(predictedAmount);

    return {
      type: 'spending_prediction',
      title: 'Tomorrow\'s Spending Prediction',
      description: `Based on your patterns, we predict you'll spend approximately $${predictedAmount.toFixed(2)} tomorrow.`,
      value: {
        amount: predictedAmount,
        category: spendingCategory,
        breakdown: this.predictSpendingBreakdown(behaviorHistory),
        savingTips: this.generateSavingTips(predictedAmount)
      },
      confidence: this.calculateConfidence(spendingLogs.length, 20),
      features
    };
  }

  async predictNextActivity(behaviorHistory) {
    const features = this.extractActivityFeatures(behaviorHistory);
    const inputTensor = tf.tensor2d([features]);
    
    const model = this.models.get('activity_prediction');
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();
    
    inputTensor.dispose();
    prediction.dispose();

    const activities = ['Work', 'Exercise', 'Social', 'Entertainment', 'Rest'];
    const maxIndex = result.indexOf(Math.max(...result));
    const predictedActivity = activities[maxIndex];
    const confidence = result[maxIndex];

    return {
      type: 'activity_prediction',
      title: 'Next Activity Prediction',
      description: `Your most likely next activity is ${predictedActivity.toLowerCase()}.`,
      value: {
        activity: predictedActivity,
        probability: confidence,
        alternatives: activities.map((act, idx) => ({
          activity: act,
          probability: result[idx]
        })).sort((a, b) => b.probability - a.probability),
        suggestions: this.generateActivitySuggestions(predictedActivity)
      },
      confidence: confidence,
      features
    };
  }

  async predictHealthMetrics(behaviorHistory) {
    const features = this.extractHealthFeatures(behaviorHistory);
    const inputTensor = tf.tensor2d([features]);
    
    const model = this.models.get('health_prediction');
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();
    
    inputTensor.dispose();
    prediction.dispose();

    return {
      type: 'health_prediction',
      title: 'Health Metrics Forecast',
      description: 'Predicted health indicators based on your behavior patterns.',
      value: {
        energyLevel: Math.max(1, Math.min(10, result[0])),
        stressLevel: Math.max(1, Math.min(10, result[1])),
        wellnessScore: Math.max(1, Math.min(10, result[2])),
        riskFactors: this.identifyHealthRisks(behaviorHistory),
        recommendations: this.generateHealthRecommendations(result)
      },
      confidence: this.calculateConfidence(behaviorHistory.length, 40),
      features
    };
  }

  // Feature extraction methods
  extractSleepFeatures(behaviorHistory) {
    const recent = behaviorHistory.slice(0, 7);
    return [
      this.getAverageValue(recent, 'mood_rating') || 5,
      this.getAverageValue(recent, 'energy_level') || 5,
      this.getAverageValue(recent, 'stress_level') || 5,
      this.getActivityCount(recent, 'exercise') / 7,
      this.getActivityCount(recent, 'work') / 7,
      this.getAverageValue(recent, 'value') || 0,
      this.getDayOfWeek(),
      this.getTimeOfDay(),
      this.getWeatherScore(recent),
      this.getSocialScore(recent)
    ];
  }

  extractMoodFeatures(behaviorHistory) {
    const recent = behaviorHistory.slice(0, 14);
    return [
      this.getAverageValue(recent, 'mood_rating') || 5,
      this.getAverageValue(recent, 'energy_level') || 5,
      this.getAverageValue(recent, 'stress_level') || 5,
      this.getActivityCount(recent, 'exercise') / 14,
      this.getActivityCount(recent, 'social') / 14,
      this.getActivityCount(recent, 'work') / 14,
      this.getSleepQuality(recent),
      this.getWeatherScore(recent),
      this.getSocialScore(recent),
      this.getDayOfWeek(),
      this.getTimeOfDay(),
      this.getSeasonScore()
    ];
  }

  extractSpendingFeatures(behaviorHistory) {
    const recent = behaviorHistory.slice(0, 7);
    return [
      this.getAverageValue(recent, 'value') || 0,
      this.getSpendingTrend(behaviorHistory),
      this.getDayOfWeek(),
      this.getTimeOfDay(),
      this.getAverageValue(recent, 'mood_rating') || 5,
      this.getActivityCount(recent, 'social') / 7,
      this.getPaydayProximity(),
      this.getSeasonScore()
    ];
  }

  extractActivityFeatures(behaviorHistory) {
    const recent = behaviorHistory.slice(0, 3);
    return [
      this.getLastActivity(behaviorHistory),
      this.getTimeOfDay(),
      this.getDayOfWeek(),
      this.getAverageValue(recent, 'energy_level') || 5,
      this.getAverageValue(recent, 'mood_rating') || 5,
      this.getAverageValue(recent, 'stress_level') || 5,
      this.getWeatherScore(recent),
      this.getActivityPattern(behaviorHistory, 'work'),
      this.getActivityPattern(behaviorHistory, 'exercise'),
      this.getActivityPattern(behaviorHistory, 'social'),
      this.getActivityPattern(behaviorHistory, 'entertainment'),
      this.getLocationScore(recent),
      this.getSocialScore(recent),
      this.getSeasonScore(),
      this.getHolidayScore()
    ];
  }

  extractHealthFeatures(behaviorHistory) {
    const recent = behaviorHistory.slice(0, 30);
    return [
      this.getAverageValue(recent, 'mood_rating') || 5,
      this.getAverageValue(recent, 'energy_level') || 5,
      this.getAverageValue(recent, 'stress_level') || 5,
      this.getActivityCount(recent, 'exercise') / 30,
      this.getActivityCount(recent, 'sleep') / 30,
      this.getSleepQuality(recent),
      this.getNutritionScore(recent),
      this.getHydrationScore(recent),
      this.getSocialScore(recent),
      this.getWorkStressScore(recent),
      this.getScreenTimeScore(recent),
      this.getOutdoorTimeScore(recent),
      this.getMeditationScore(recent),
      this.getAlcoholScore(recent),
      this.getCaffeineScore(recent),
      this.getWeatherScore(recent),
      this.getSeasonScore(),
      this.getAgeScore(),
      this.getGenderScore(),
      this.getLocationScore(recent)
    ];
  }

  // Helper methods for feature extraction
  getAverageValue(logs, field) {
    const values = logs.filter(log => log[field] != null).map(log => log[field]);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  }

  getActivityCount(logs, activity) {
    return logs.filter(log => 
      log.title.toLowerCase().includes(activity) || 
      log.description?.toLowerCase().includes(activity)
    ).length;
  }

  getDayOfWeek() {
    return new Date().getDay() / 6; // Normalize to 0-1
  }

  getTimeOfDay() {
    return new Date().getHours() / 23; // Normalize to 0-1
  }

  calculateConfidence(dataPoints, optimalPoints) {
    return Math.min(1, dataPoints / optimalPoints);
  }

  // Additional helper methods
  getMoodCategory(score) {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  }

  getSpendingCategory(amount) {
    if (amount >= 100) return 'High';
    if (amount >= 50) return 'Medium';
    if (amount >= 10) return 'Low';
    return 'Minimal';
  }

  generateSleepRecommendations(duration, quality) {
    const recommendations = [];
    if (duration < 7) recommendations.push('Try to get more sleep for better health');
    if (quality < 6) recommendations.push('Consider improving sleep environment');
    if (duration > 9) recommendations.push('You might be oversleeping');
    return recommendations;
  }

  generateMoodTips(score) {
    if (score < 5) {
      return ['Take a short walk', 'Practice deep breathing', 'Connect with a friend'];
    }
    return ['Keep up the positive momentum', 'Share your good mood with others'];
  }

  generateSavingTips(amount) {
    if (amount > 50) {
      return ['Consider if this purchase is necessary', 'Look for discounts or alternatives'];
    }
    return ['Great job managing your spending!'];
  }

  generateActivitySuggestions(activity) {
    const suggestions = {
      'Work': ['Take regular breaks', 'Stay hydrated', 'Practice good posture'],
      'Exercise': ['Warm up properly', 'Stay hydrated', 'Listen to your body'],
      'Social': ['Be present in conversations', 'Try new activities together'],
      'Entertainment': ['Balance screen time', 'Try creative activities'],
      'Rest': ['Create a calm environment', 'Practice mindfulness']
    };
    return suggestions[activity] || ['Enjoy your activity!'];
  }

  generateHealthRecommendations(metrics) {
    const recommendations = [];
    if (metrics[0] < 5) recommendations.push('Focus on energy-boosting activities');
    if (metrics[1] > 7) recommendations.push('Consider stress management techniques');
    if (metrics[2] < 6) recommendations.push('Prioritize self-care activities');
    return recommendations;
  }

  // Placeholder methods for additional features
  getWeatherScore(logs) { return 0.5; }
  getSocialScore(logs) { return 0.5; }
  getSleepQuality(logs) { return 0.5; }
  getSpendingTrend(logs) { return 0.5; }
  getPaydayProximity() { return 0.5; }
  getSeasonScore() { return 0.5; }
  getLastActivity(logs) { return 0.5; }
  getActivityPattern(logs, activity) { return 0.5; }
  getLocationScore(logs) { return 0.5; }
  getHolidayScore() { return 0.5; }
  getNutritionScore(logs) { return 0.5; }
  getHydrationScore(logs) { return 0.5; }
  getWorkStressScore(logs) { return 0.5; }
  getScreenTimeScore(logs) { return 0.5; }
  getOutdoorTimeScore(logs) { return 0.5; }
  getMeditationScore(logs) { return 0.5; }
  getAlcoholScore(logs) { return 0.5; }
  getCaffeineScore(logs) { return 0.5; }
  getAgeScore() { return 0.5; }
  getGenderScore() { return 0.5; }
  identifyMoodFactors(logs) { return ['Recent activities', 'Sleep quality', 'Social interactions']; }
  predictSpendingBreakdown(logs) { return { food: 0.4, entertainment: 0.3, shopping: 0.3 }; }
  identifyHealthRisks(logs) { return []; }
}

module.exports = new AIPredictionService();
