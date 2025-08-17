import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  DollarSign,
  Download,
  Filter,
  Eye,
  ShoppingCart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [filters, setFilters] = useState({
    demographic: '',
    category: '',
    timeframe: '30_days'
  });

  useEffect(() => {
    fetchCompanyData();
  }, [filters]);

  const fetchCompanyData = async () => {
    try {
      const [insightsRes, transactionsRes] = await Promise.all([
        axios.get('/api/marketplace/insights', { params: filters }),
        axios.get('/api/marketplace/transactions')
      ]);

      setInsights(insightsRes.data);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      toast.error('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (insightType, amount) => {
    setPurchasing(true);
    try {
      await axios.post('/api/marketplace/purchase', {
        insightType,
        filters,
        amount
      });
      toast.success('Insights purchased successfully!');
      fetchCompanyData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
        <span className="ml-2">Loading company dashboard...</span>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Company Dashboard</h1>
        <p className="text-purple-100">
          Access behavioral insights and analytics for your business decisions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalSpent.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Purchases</p>
              <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Points</p>
              <p className="text-2xl font-bold text-gray-900">
                {insights?.insights?.totalDataPoints || 0}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">
                {insights?.insights?.predictionStats?.length > 0 
                  ? Math.round(insights.insights.predictionStats.reduce((sum, stat) => 
                      sum + parseFloat(stat.avgAccuracy), 0) / insights.insights.predictionStats.length * 100)
                  : 0}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Filter Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Demographic</label>
            <select
              name="demographic"
              value={filters.demographic}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Demographics</option>
              <option value="age_18_25">18-25 years</option>
              <option value="age_26_35">26-35 years</option>
              <option value="age_36_45">36-45 years</option>
              <option value="age_46_plus">46+ years</option>
            </select>
          </div>

          <div>
            <label className="form-label">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Categories</option>
              <option value="purchase">Purchase</option>
              <option value="app_usage">App Usage</option>
              <option value="exercise">Exercise</option>
              <option value="food">Food</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>

          <div>
            <label className="form-label">Timeframe</label>
            <select
              name="timeframe"
              value={filters.timeframe}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="7_days">Last 7 Days</option>
              <option value="30_days">Last 30 Days</option>
              <option value="90_days">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      {insights && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Behavior Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Behavior Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.insights.behaviorStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, 'Count']} />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction Accuracy */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Prediction Accuracy by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={insights.insights.predictionStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="avgAccuracy"
                  label={({ predictionType, avgAccuracy }) => 
                    `${predictionType.replace('_', ' ')}: ${Math.round(avgAccuracy * 100)}%`
                  }
                >
                  {insights.insights.predictionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${Math.round(value * 100)}%`, 'Accuracy']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Purchase Options */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Purchase Insights</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-2">Basic Report</h4>
            <p className="text-gray-600 mb-4">
              Aggregated behavior patterns and basic predictions for your selected filters
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1">
              <li>• Behavior distribution charts</li>
              <li>• Basic prediction accuracy</li>
              <li>• User demographics overview</li>
              <li>• CSV data export</li>
            </ul>
            <div className="text-2xl font-bold text-green-600 mb-4">
              ${insights?.pricing?.estimatedPrice || 99}
            </div>
            <button
              onClick={() => handlePurchase('basic_report', insights?.pricing?.estimatedPrice || 99)}
              disabled={purchasing}
              className="btn-primary w-full"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Report
            </button>
          </div>

          <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold">Advanced Analytics</h4>
              <span className="badge badge-info">Popular</span>
            </div>
            <p className="text-gray-600 mb-4">
              Detailed insights with advanced analytics and custom recommendations
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1">
              <li>• Everything in Basic Report</li>
              <li>• Advanced prediction models</li>
              <li>• Demographic deep-dive</li>
              <li>• Trend analysis</li>
              <li>• Custom recommendations</li>
            </ul>
            <div className="text-2xl font-bold text-green-600 mb-4">
              ${Math.round((insights?.pricing?.estimatedPrice || 99) * 2.5)}
            </div>
            <button
              onClick={() => handlePurchase('advanced_analytics', Math.round((insights?.pricing?.estimatedPrice || 99) * 2.5))}
              disabled={purchasing}
              className="btn-primary w-full"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Analytics
            </button>
          </div>

          <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
            <h4 className="text-lg font-semibold mb-2">Enterprise Package</h4>
            <p className="text-gray-600 mb-4">
              Complete solution with API access and custom integrations
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1">
              <li>• Everything in Advanced Analytics</li>
              <li>• API access</li>
              <li>• Real-time data feeds</li>
              <li>• Custom dashboard</li>
              <li>• Dedicated support</li>
            </ul>
            <div className="text-2xl font-bold text-green-600 mb-4">
              ${Math.round((insights?.pricing?.estimatedPrice || 99) * 5)}
            </div>
            <button
              onClick={() => handlePurchase('enterprise_package', Math.round((insights?.pricing?.estimatedPrice || 99) * 5))}
              disabled={purchasing}
              className="btn-primary w-full"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
        
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Report Type</th>
                  <th>Filters</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                    <td className="capitalize">
                      {transaction.metadata?.insightType?.replace('_', ' ') || 'Data Purchase'}
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">
                        {transaction.metadata?.filters?.category || 'All categories'}
                      </span>
                    </td>
                    <td className="font-medium">
                      ${parseFloat(transaction.amount).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${
                        transaction.status === 'completed' ? 'badge-success' :
                        transaction.status === 'pending' ? 'badge-warning' :
                        'badge-error'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-green-600 hover:text-green-800">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No purchases yet</h3>
            <p className="mb-4">Purchase your first behavioral insights report to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;
