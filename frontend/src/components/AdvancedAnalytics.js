import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Calendar, 
  Clock, 
  Activity,
  Heart,
  Zap,
  Eye,
  Lock,
  Crown
} from 'lucide-react';

const AdvancedAnalytics = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('mood');
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);

  const isPremium = user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'enterprise';
  const isEnterprise = user?.subscriptionTier === 'enterprise';

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedMetric]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    
    // Mock data - replace with actual API calls
    const mockData = {
      behaviorTrends: [
        { date: '2024-01-01', mood: 7, energy: 6, stress: 4, sleep: 7.5 },
        { date: '2024-01-02', mood: 8, energy: 7, stress: 3, sleep: 8.0 },
        { date: '2024-01-03', mood: 6, energy: 5, stress: 6, sleep: 6.5 },
        { date: '2024-01-04', mood: 9, energy: 8, stress: 2, sleep: 8.5 },
        { date: '2024-01-05', mood: 7, energy: 7, stress: 4, sleep: 7.0 },
        { date: '2024-01-06', mood: 8, energy: 6, stress: 3, sleep: 7.5 },
        { date: '2024-01-07', mood: 9, energy: 9, stress: 2, sleep: 9.0 }
      ],
      categoryBreakdown: [
        { name: 'Work', value: 35, color: '#3b82f6' },
        { name: 'Exercise', value: 20, color: '#10b981' },
        { name: 'Social', value: 15, color: '#8b5cf6' },
        { name: 'Sleep', value: 12, color: '#6366f1' },
        { name: 'Entertainment', value: 10, color: '#ec4899' },
        { name: 'Other', value: 8, color: '#f59e0b' }
      ],
      correlations: [
        { factor: 'Exercise', mood: 0.85, energy: 0.92, stress: -0.67 },
        { factor: 'Sleep Quality', mood: 0.78, energy: 0.81, stress: -0.72 },
        { factor: 'Social Time', mood: 0.65, energy: 0.45, stress: -0.38 },
        { factor: 'Work Hours', mood: -0.34, energy: -0.28, stress: 0.76 },
        { factor: 'Screen Time', mood: -0.42, energy: -0.35, stress: 0.51 }
      ],
      personalityInsights: {
        traits: [
          { trait: 'Conscientiousness', score: 85, percentile: 92 },
          { trait: 'Openness', score: 78, percentile: 84 },
          { trait: 'Extraversion', score: 65, percentile: 71 },
          { trait: 'Agreeableness', score: 82, percentile: 89 },
          { trait: 'Neuroticism', score: 32, percentile: 25 }
        ]
      },
      predictiveAccuracy: [
        { model: 'Mood Prediction', accuracy: 87, confidence: 0.92 },
        { model: 'Sleep Quality', accuracy: 82, confidence: 0.89 },
        { model: 'Energy Levels', accuracy: 79, confidence: 0.85 },
        { model: 'Stress Levels', accuracy: 84, confidence: 0.91 },
        { model: 'Activity Choice', accuracy: 76, confidence: 0.82 }
      ]
    };

    setAnalyticsData(mockData);
    setLoading(false);
  };

  const PaywallOverlay = ({ feature }) => (
    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-lg">
      <div className="text-center p-6">
        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
        <p className="text-gray-600 mb-4">{feature} is available for Premium subscribers</p>
        <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
          Upgrade to Premium
        </button>
      </div>
    </div>
  );

  const EnterpriseOverlay = ({ feature }) => (
    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-lg">
      <div className="text-center p-6">
        <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise Feature</h3>
        <p className="text-gray-600 mb-4">{feature} is available for Enterprise subscribers</p>
        <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all">
          Upgrade to Enterprise
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Brain className="w-8 h-8 mr-3 text-blue-600" />
              Advanced Analytics
            </h1>
            <p className="text-gray-600 mt-2">Deep insights into your behavior patterns</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            {user?.subscriptionTier && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isEnterprise ? 'bg-yellow-100 text-yellow-800' :
                isPremium ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
              </div>
            )}
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Prediction Accuracy', value: '87%', icon: Target, color: 'blue' },
            { label: 'Behavior Patterns', value: '23', icon: Activity, color: 'green' },
            { label: 'Data Points', value: '1,247', icon: TrendingUp, color: 'purple' },
            { label: 'Insights Generated', value: '156', icon: Eye, color: 'orange' }
          ].map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className={`text-3xl font-bold text-${metric.color}-600`}>{metric.value}</p>
                </div>
                <div className={`bg-${metric.color}-100 p-3 rounded-full`}>
                  <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Behavior Trends Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Behavior Trends</h2>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="mood">Mood</option>
                <option value="energy">Energy</option>
                <option value="stress">Stress</option>
                <option value="sleep">Sleep</option>
              </select>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.behaviorTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Categories</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.categoryBreakdown?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Premium Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Correlation Analysis - Premium Feature */}
          <div className="bg-white rounded-xl shadow-lg p-6 relative">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Correlation Analysis
            </h2>
            
            {isPremium ? (
              <div className="space-y-4">
                {analyticsData.correlations?.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.factor}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${item.mood > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.mood > 0 ? '+' : ''}{(item.mood * 100).toFixed(0)}%
                        </div>
                        <div className="text-gray-500">Mood</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${item.energy > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.energy > 0 ? '+' : ''}{(item.energy * 100).toFixed(0)}%
                        </div>
                        <div className="text-gray-500">Energy</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${item.stress < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.stress > 0 ? '+' : ''}{(item.stress * 100).toFixed(0)}%
                        </div>
                        <div className="text-gray-500">Stress</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <PaywallOverlay feature="Correlation Analysis" />
            )}
          </div>

          {/* Personality Insights - Enterprise Feature */}
          <div className="bg-white rounded-xl shadow-lg p-6 relative">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Personality Insights
            </h2>
            
            {isEnterprise ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analyticsData.personalityInsights?.traits}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="trait" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <EnterpriseOverlay feature="Personality Insights" />
            )}
          </div>
        </div>

        {/* Predictive Model Performance - Premium Feature */}
        <div className="bg-white rounded-xl shadow-lg p-6 relative">
          <h2 className="text-xl font-bold text-gray-900 mb-6">AI Model Performance</h2>
          
          {isPremium ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.predictiveAccuracy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <PaywallOverlay feature="AI Model Performance Analytics" />
          )}
        </div>

        {/* Subscription Upgrade CTA */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white text-center mt-8">
            <h2 className="text-2xl font-bold mb-4">Unlock Advanced Analytics</h2>
            <p className="text-lg mb-6">
              Get deeper insights with correlation analysis, predictive modeling, and personalized recommendations
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Upgrade to Premium - $29/month
              </button>
              <button className="bg-yellow-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                Try Enterprise - $99/month
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
