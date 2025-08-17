import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Activity, 
  Brain, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/users/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentBehaviors = dashboardData?.recentBehaviors || [];
  const recentPredictions = dashboardData?.recentPredictions || [];
  const transactions = dashboardData?.transactions || [];

  // Mock chart data for demonstration
  const chartData = [
    { name: 'Mon', behaviors: 4, predictions: 2 },
    { name: 'Tue', behaviors: 6, predictions: 3 },
    { name: 'Wed', behaviors: 8, predictions: 4 },
    { name: 'Thu', behaviors: 5, predictions: 2 },
    { name: 'Fri', behaviors: 7, predictions: 5 },
    { name: 'Sat', behaviors: 3, predictions: 1 },
    { name: 'Sun', behaviors: 2, predictions: 1 }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-blue-100">
          Track your behavior patterns and discover insights about your future decisions.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Behaviors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBehaviors || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Predictions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPredictions || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(stats.totalEarnings || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Subscription</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {stats.subscriptionTier || 'Free'}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="behaviors" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Behaviors"
            />
            <Line 
              type="monotone" 
              dataKey="predictions" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Predictions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Behaviors */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Behaviors</h3>
            <Link to="/behaviors" className="btn-primary text-sm">
              <Plus className="h-4 w-4 mr-1" />
              Add New
            </Link>
          </div>
          
          {recentBehaviors.length > 0 ? (
            <div className="space-y-3">
              {recentBehaviors.slice(0, 5).map((behavior) => (
                <div key={behavior.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{behavior.description}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {behavior.category} • {new Date(behavior.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  {behavior.value && (
                    <span className="text-sm font-medium text-green-600">
                      ${parseFloat(behavior.value).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No behaviors logged yet</p>
              <Link to="/behaviors" className="text-blue-600 hover:text-blue-700 text-sm">
                Start logging your activities
              </Link>
            </div>
          )}
        </div>

        {/* Recent Predictions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Predictions</h3>
            <Link to="/predictions" className="btn-primary text-sm">
              <Target className="h-4 w-4 mr-1" />
              Generate
            </Link>
          </div>
          
          {recentPredictions.length > 0 ? (
            <div className="space-y-3">
              {recentPredictions.slice(0, 5).map((prediction) => (
                <div key={prediction.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 capitalize">
                      {prediction.predictionType.replace('_', ' ')}
                    </p>
                    <span className="badge badge-info">
                      {Math.round(prediction.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Target: {new Date(prediction.targetDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No predictions generated yet</p>
              <Link to="/predictions" className="text-blue-600 hover:text-blue-700 text-sm">
                Get your first AI prediction
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to="/behaviors" 
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Activity className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">Log Behavior</span>
          </Link>
          
          <Link 
            to="/predictions" 
            className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Brain className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">Get Prediction</span>
          </Link>
          
          <Link 
            to="/marketplace" 
            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">Marketplace</span>
          </Link>
          
          <Link 
            to="/pricing" 
            className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Award className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-700">Upgrade</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
