import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  ShoppingCart,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Marketplace = () => {
  const { user, isCompany, isPremium } = useAuth();
  const [insights, setInsights] = useState(null);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [filters, setFilters] = useState({
    demographic: '',
    category: '',
    timeframe: '30_days'
  });

  useEffect(() => {
    fetchMarketplaceData();
  }, [filters]);

  const fetchMarketplaceData = async () => {
    try {
      const [statsRes, transactionsRes] = await Promise.all([
        axios.get('/api/marketplace/stats'),
        axios.get('/api/marketplace/transactions')
      ]);

      setStats(statsRes.data.stats);
      setTransactions(transactionsRes.data.transactions);

      // Fetch insights if user is a company
      if (isCompany) {
        const insightsRes = await axios.get('/api/marketplace/insights', {
          params: filters
        });
        setInsights(insightsRes.data);
      }
    } catch (error) {
      toast.error('Failed to fetch marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseInsights = async (insightType, amount) => {
    if (!isCompany) {
      toast.error('Only companies can purchase insights');
      return;
    }

    setPurchasing(true);
    try {
      await axios.post('/api/marketplace/purchase', {
        insightType,
        filters,
        amount
      });
      toast.success('Insights purchased successfully!');
      fetchMarketplaceData();
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
        <span className="ml-2">Loading marketplace...</span>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Behavioral Data Marketplace</h1>
          <p className="text-gray-600">
            {isCompany ? 'Purchase aggregated behavioral insights' : 'Earn from your behavioral data'}
          </p>
        </div>
        {!isCompany && (
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ${parseFloat(user?.totalEarnings || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Earnings</div>
          </div>
        )}
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Points</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalBehaviors || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Predictions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalPredictions || 0}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Market Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(stats?.totalVolume || 0).toFixed(0)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Company Insights Section */}
      {isCompany && (
        <>
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

          {/* Insights Dashboard */}
          {insights && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Behavior Stats Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Behavior Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={insights.insights.behaviorStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Prediction Accuracy */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Prediction Accuracy</h3>
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
                        `${predictionType}: ${Math.round(avgAccuracy * 100)}%`
                      }
                    >
                      {insights.insights.predictionStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Purchase Options */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Available Insights</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Basic Insights</h4>
                <p className="text-gray-600 text-sm mb-3">
                  Aggregated behavior patterns and trends
                </p>
                <div className="text-2xl font-bold text-green-600 mb-3">$99</div>
                <button
                  onClick={() => handlePurchaseInsights('basic', 99)}
                  disabled={purchasing}
                  className="btn-primary w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Advanced Analytics</h4>
                <p className="text-gray-600 text-sm mb-3">
                  Detailed predictions and demographic breakdowns
                </p>
                <div className="text-2xl font-bold text-green-600 mb-3">$299</div>
                <button
                  onClick={() => handlePurchaseInsights('advanced', 299)}
                  disabled={purchasing}
                  className="btn-primary w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Custom Report</h4>
                <p className="text-gray-600 text-sm mb-3">
                  Tailored insights for your specific needs
                </p>
                <div className="text-2xl font-bold text-green-600 mb-3">$999</div>
                <button
                  onClick={() => handlePurchaseInsights('custom', 999)}
                  disabled={purchasing}
                  className="btn-primary w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction History */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">
          {isCompany ? 'Purchase History' : 'Earnings History'}
        </h3>
        
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                    <td className="capitalize">
                      {transaction.type.replace('_', ' ')}
                    </td>
                    <td>{transaction.description}</td>
                    <td className={transaction.type === 'user_earning' ? 'text-green-600' : 'text-blue-600'}>
                      {transaction.type === 'user_earning' ? '+' : '-'}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
            <p>
              {isCompany 
                ? 'Purchase insights to see your transaction history'
                : 'Start logging behaviors to earn from your data'
              }
            </p>
          </div>
        )}
      </div>

      {/* Upgrade CTA for non-premium users */}
      {!isPremium && !isCompany && (
        <div className="card bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Maximize Your Earnings</h3>
              <p className="text-green-100">
                Premium users earn 50% more from their behavioral data contributions
              </p>
            </div>
            <button className="bg-white text-green-600 hover:bg-gray-100 font-medium py-2 px-6 rounded-md transition-colors">
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
