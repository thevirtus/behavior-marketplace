import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Calendar,
  Zap,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const PREDICTION_TYPES = [
  { value: 'purchase_likelihood', label: 'Purchase Likelihood' },
  { value: 'app_usage_duration', label: 'App Usage Duration' },
  { value: 'sleep_quality', label: 'Sleep Quality' },
  { value: 'exercise_frequency', label: 'Exercise Frequency' },
  { value: 'decision_pattern', label: 'Decision Pattern' },
  { value: 'behavior_change', label: 'Behavior Change' }
];

const TIMEFRAMES = [
  { value: '1_day', label: '1 Day' },
  { value: '3_days', label: '3 Days' },
  { value: '1_week', label: '1 Week' },
  { value: '1_month', label: '1 Month' }
];

const Predictions = () => {
  const { user, isPremium, isEnterprise } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [formData, setFormData] = useState({
    predictionType: 'purchase_likelihood',
    category: 'purchase',
    timeframe: '1_day'
  });

  useEffect(() => {
    fetchPredictions();
    fetchAccuracy();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await axios.get('/api/predictions');
      setPredictions(response.data.predictions);
    } catch (error) {
      toast.error('Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccuracy = async () => {
    try {
      const response = await axios.get('/api/predictions/accuracy');
      setAccuracy(response.data);
    } catch (error) {
      console.error('Failed to fetch accuracy:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      await axios.post('/api/predictions/generate', formData);
      toast.success('Prediction generated successfully!');
      setShowGenerateForm(false);
      fetchPredictions();
    } catch (error) {
      if (error.response?.data?.upgradeRequired) {
        toast.error('Upgrade your subscription to generate more predictions');
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate prediction');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrediction = (prediction) => {
    const pred = prediction.prediction;
    
    switch (prediction.predictionType) {
      case 'purchase_likelihood':
        return `${Math.round(pred.likelihood * 100)}% chance of purchasing ${pred.category}`;
      case 'app_usage_duration':
        return `Predicted ${pred.predictedDuration} minutes of ${pred.category} usage`;
      case 'sleep_quality':
        return `Sleep quality score: ${pred.predictedQuality}/10`;
      case 'exercise_frequency':
        return `${pred.weeklyFrequency} exercise sessions this week`;
      case 'decision_pattern':
        return `Pattern: ${pred.pattern} for ${pred.category}`;
      case 'behavior_change':
        return `${Math.round(pred.changeScore * 100)}% change likelihood in ${pred.category}`;
      default:
        return 'Prediction generated';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
        <span className="ml-2">Loading predictions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Predictions</h1>
          <p className="text-gray-600">Get insights about your future behavior patterns</p>
        </div>
        <button
          onClick={() => setShowGenerateForm(true)}
          className="btn-primary"
          disabled={generating}
        >
          <Brain className="h-4 w-4 mr-2" />
          Generate Prediction
        </button>
      </div>

      {/* Accuracy Stats */}
      {accuracy && accuracy.totalVerified > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Prediction Accuracy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(accuracy.overallAccuracy * 100)}%
              </div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {accuracy.totalVerified}
              </div>
              <div className="text-sm text-gray-600">Verified Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(accuracy.accuracyByType).length}
              </div>
              <div className="text-sm text-gray-600">Prediction Types</div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Form */}
      {showGenerateForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Generate New Prediction</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Prediction Type</label>
                <select
                  name="predictionType"
                  value={formData.predictionType}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  {PREDICTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., coffee, exercise, sleep"
                  required
                />
              </div>

              <div>
                <label className="form-label">Timeframe</label>
                <select
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  {TIMEFRAMES.map(timeframe => (
                    <option key={timeframe.value} value={timeframe.value}>
                      {timeframe.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={generating}
                className="btn-primary"
              >
                {generating ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Prediction
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subscription Limits */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Subscription Status: {user?.subscriptionTier?.toUpperCase() || 'FREE'}
            </h3>
            <p className="text-gray-600">
              {user?.subscriptionTier === 'free' && 'You have 5 predictions per month'}
              {user?.subscriptionTier === 'premium' && 'You have 50 predictions per month + advanced analytics'}
              {user?.subscriptionTier === 'enterprise' && 'Unlimited predictions + full analytics suite'}
            </p>
          </div>
          {!isPremium && (
            <button className="btn-primary">
              <Lock className="h-4 w-4 mr-2" />
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Predictions List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Your Predictions</h3>
        
        {predictions.length > 0 ? (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div key={prediction.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="badge badge-info capitalize">
                        {prediction.predictionType.replace('_', ' ')}
                      </span>
                      <span className={`badge ${getConfidenceColor(prediction.confidence)}`}>
                        {Math.round(prediction.confidence * 100)}% confidence
                      </span>
                      {prediction.isVerified && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    
                    <p className="text-gray-900 font-medium mb-2">
                      {formatPrediction(prediction)}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Target: {new Date(prediction.targetDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        {prediction.timeframe.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      Generated {new Date(prediction.createdAt).toLocaleDateString()}
                    </div>
                    {prediction.accuracy && (
                      <div className="text-sm font-medium text-green-600">
                        {Math.round(prediction.accuracy * 100)}% accurate
                      </div>
                    )}
                  </div>
                </div>

                {/* Premium Features */}
                {isPremium && prediction.prediction.recommendations && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      AI Recommendations:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {prediction.prediction.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No predictions yet</h3>
            <p className="mb-4">Generate your first AI prediction to see insights about your future behavior</p>
            <button
              onClick={() => setShowGenerateForm(true)}
              className="btn-primary"
            >
              Generate Your First Prediction
            </button>
          </div>
        )}
      </div>

      {/* Upgrade CTA for Free Users */}
      {!isPremium && (
        <div className="card bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Unlock Advanced Predictions</h3>
              <p className="text-purple-100">
                Get unlimited predictions, advanced analytics, and personalized recommendations
              </p>
            </div>
            <button className="bg-white text-purple-600 hover:bg-gray-100 font-medium py-2 px-6 rounded-md transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
