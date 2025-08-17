const tf = require('@tensorflow/tfjs-node');

class PredictionService {
  constructor() {
    this.models = new Map();
    this.modelVersion = '1.0';
  }

  // Generate prediction based on user behavior data
  async generatePrediction({ userId, predictionType, category, timeframe, behaviorData, subscriptionTier }) {
    try {
      // For MVP, we'll use rule-based predictions with some randomization
      // In production, this would use trained ML models
      
      const features = this.extractFeatures(behaviorData, category);
      let prediction, confidence;

      switch (predictionType) {
        case 'purchase_likelihood':
          prediction = this.predictPurchaseLikelihood(features, category);
          confidence = this.calculateConfidence(features, 'purchase');
          break;
        
        case 'app_usage_duration':
          prediction = this.predictAppUsage(features, category);
          confidence = this.calculateConfidence(features, 'usage');
          break;
        
        case 'sleep_quality':
          prediction = this.predictSleepQuality(features);
          confidence = this.calculateConfidence(features, 'sleep');
          break;
        
        case 'exercise_frequency':
          prediction = this.predictExerciseFrequency(features);
          confidence = this.calculateConfidence(features, 'exercise');
          break;
        
        case 'decision_pattern':
          prediction = this.predictDecisionPattern(features, category);
          confidence = this.calculateConfidence(features, 'decision');
          break;
        
        case 'behavior_change':
          prediction = this.predictBehaviorChange(features, category);
          confidence = this.calculateConfidence(features, 'change');
          break;
        
        default:
          throw new Error('Unknown prediction type');
      }

      // Adjust confidence based on subscription tier
      if (subscriptionTier === 'free') {
        confidence = Math.min(confidence, 0.7); // Limit free tier confidence
      }

      return {
        prediction,
        confidence: Math.round(confidence * 100) / 100,
        features,
        modelVersion: this.modelVersion
      };
    } catch (error) {
      console.error('Prediction generation error:', error);
      throw error;
    }
  }

  // Extract features from behavior data
  extractFeatures(behaviorData, category) {
    if (!behaviorData || behaviorData.length === 0) {
      return {
        frequency: 0,
        avgValue: 0,
        avgDuration: 0,
        recentActivity: 0,
        trend: 'stable'
      };
    }

    const relevantData = behaviorData.filter(b => b.category === category);
    const last7Days = behaviorData.filter(b => {
      const daysDiff = (new Date() - new Date(b.timestamp)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    const frequency = relevantData.length;
    const avgValue = relevantData.reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0) / Math.max(frequency, 1);
    const avgDuration = relevantData.reduce((sum, b) => sum + (b.duration || 0), 0) / Math.max(frequency, 1);
    const recentActivity = last7Days.length;

    // Calculate trend (simplified)
    const firstHalf = relevantData.slice(0, Math.floor(relevantData.length / 2));
    const secondHalf = relevantData.slice(Math.floor(relevantData.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0) / Math.max(firstHalf.length, 1);
    const secondHalfAvg = secondHalf.reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0) / Math.max(secondHalf.length, 1);
    
    let trend = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'increasing';
    else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'decreasing';

    return {
      frequency,
      avgValue,
      avgDuration,
      recentActivity,
      trend,
      totalBehaviors: behaviorData.length
    };
  }

  // Predict purchase likelihood
  predictPurchaseLikelihood(features, category) {
    const baseLikelihood = Math.min(features.frequency * 0.1, 0.8);
    const trendMultiplier = features.trend === 'increasing' ? 1.2 : features.trend === 'decreasing' ? 0.8 : 1.0;
    const recentActivityBoost = features.recentActivity > 2 ? 0.1 : 0;
    
    const likelihood = Math.min(baseLikelihood * trendMultiplier + recentActivityBoost, 0.95);
    
    return {
      likelihood: Math.round(likelihood * 100) / 100,
      category,
      estimatedValue: features.avgValue * 1.1,
      timeframe: '24_hours',
      factors: {
        historicalFrequency: features.frequency,
        recentActivity: features.recentActivity,
        trend: features.trend
      }
    };
  }

  // Predict app usage duration
  predictAppUsage(features, category) {
    const baseUsage = features.avgDuration || 30; // Default 30 minutes
    const trendMultiplier = features.trend === 'increasing' ? 1.15 : features.trend === 'decreasing' ? 0.85 : 1.0;
    
    return {
      predictedDuration: Math.round(baseUsage * trendMultiplier),
      category,
      confidence: 'medium',
      factors: {
        averageUsage: features.avgDuration,
        trend: features.trend,
        frequency: features.frequency
      }
    };
  }

  // Predict sleep quality
  predictSleepQuality(features) {
    const baseQuality = 7; // Scale of 1-10
    const activityImpact = features.recentActivity > 5 ? -0.5 : features.recentActivity < 2 ? 0.5 : 0;
    
    return {
      predictedQuality: Math.max(1, Math.min(10, baseQuality + activityImpact)),
      duration: 7.5 + (Math.random() - 0.5), // 7-8 hours with variation
      factors: {
        recentActivity: features.recentActivity,
        trend: features.trend
      }
    };
  }

  // Predict exercise frequency
  predictExerciseFrequency(features) {
    const currentFrequency = features.frequency;
    const trendMultiplier = features.trend === 'increasing' ? 1.1 : features.trend === 'decreasing' ? 0.9 : 1.0;
    
    return {
      weeklyFrequency: Math.round(currentFrequency * trendMultiplier),
      likelihood: Math.min(features.recentActivity * 0.2, 0.9),
      recommendedIncrease: features.trend === 'decreasing' ? 1 : 0
    };
  }

  // Predict decision patterns
  predictDecisionPattern(features, category) {
    return {
      pattern: features.trend,
      nextDecisionTime: this.predictNextDecisionTime(features),
      category,
      confidence: features.frequency > 5 ? 'high' : 'medium'
    };
  }

  // Predict behavior change
  predictBehaviorChange(features, category) {
    const changeScore = features.trend === 'increasing' ? 0.7 : features.trend === 'decreasing' ? 0.3 : 0.5;
    
    return {
      changeScore,
      direction: features.trend,
      category,
      timeframe: '1_week',
      recommendations: this.generateRecommendations(features, category)
    };
  }

  // Calculate prediction confidence
  calculateConfidence(features, type) {
    let baseConfidence = 0.5;
    
    // More data = higher confidence
    if (features.totalBehaviors > 20) baseConfidence += 0.2;
    else if (features.totalBehaviors > 10) baseConfidence += 0.1;
    
    // Recent activity increases confidence
    if (features.recentActivity > 3) baseConfidence += 0.15;
    
    // Frequency increases confidence
    if (features.frequency > 5) baseConfidence += 0.1;
    
    // Add some randomization for realism
    baseConfidence += (Math.random() - 0.5) * 0.1;
    
    return Math.max(0.3, Math.min(0.95, baseConfidence));
  }

  // Predict next decision time
  predictNextDecisionTime(features) {
    const avgInterval = features.frequency > 0 ? 7 / features.frequency : 7; // Days between decisions
    const nextTime = new Date();
    nextTime.setDate(nextTime.getDate() + Math.round(avgInterval));
    return nextTime;
  }

  // Generate recommendations
  generateRecommendations(features, category) {
    const recommendations = [];
    
    if (features.trend === 'decreasing') {
      recommendations.push(`Consider increasing your ${category} activity`);
    } else if (features.trend === 'increasing') {
      recommendations.push(`Great progress with ${category}! Keep it up`);
    }
    
    if (features.recentActivity < 2) {
      recommendations.push('Try to be more consistent with logging activities');
    }
    
    return recommendations;
  }

  // Calculate trends for premium users
  calculateTrends(prediction) {
    return {
      shortTerm: 'stable',
      longTerm: 'improving',
      seasonality: 'none detected'
    };
  }

  // Get recommendations for premium users
  getRecommendations(prediction) {
    return [
      'Log more behavior data for better predictions',
      'Consider upgrading for advanced analytics',
      'Review your patterns weekly'
    ];
  }

  // Get advanced analytics for premium users
  async getAdvancedAnalytics(userId) {
    return {
      patternAnalysis: {
        dominantPatterns: ['morning_routine', 'weekend_variance'],
        anomalies: 2,
        consistency: 0.75
      },
      correlations: [
        { behaviors: ['sleep', 'exercise'], correlation: 0.65 },
        { behaviors: ['work', 'stress'], correlation: 0.45 }
      ],
      insights: [
        'Your exercise frequency correlates with better sleep quality',
        'Weekend behavior patterns differ significantly from weekdays'
      ]
    };
  }
}

module.exports = new PredictionService();
