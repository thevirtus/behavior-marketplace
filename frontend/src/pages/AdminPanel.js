import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminPanel = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, transactionsRes, revenueRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/users?limit=10'),
        axios.get('/api/admin/transactions?limit=10'),
        axios.get('/api/admin/analytics/revenue')
      ]);

      setDashboardStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setTransactions(transactionsRes.data.transactions);
      setRevenueAnalytics(revenueRes.data.analytics);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      if (action === 'deactivate') {
        await axios.put(`/api/admin/users/${userId}/deactivate`);
        toast.success('User deactivated successfully');
      }
      fetchAdminData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleSubscriptionUpdate = async (userId, tier) => {
    try {
      await axios.put(`/api/admin/users/${userId}/subscription`, { tier });
      toast.success('Subscription updated successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
        <span className="ml-2">Loading admin panel...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-300">
          System administration and analytics dashboard
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats?.totalUsers || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Companies</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats?.totalCompanies || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(dashboardStats?.monthlyRevenue || 0).toFixed(0)}
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
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats?.activeSubscriptions || 0}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">System Health</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="font-medium">Database</span>
                      </div>
                      <span className="text-green-600">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="font-medium">API Services</span>
                      </div>
                      <span className="text-green-600">Operational</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="font-medium">Payment Processing</span>
                      </div>
                      <span className="text-green-600">Active</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium">New user registration</p>
                        <p className="text-sm text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium">Premium subscription purchased</p>
                        <p className="text-sm text-gray-500">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Activity className="h-5 w-5 text-purple-600 mr-3" />
                      <div>
                        <p className="font-medium">Company insights purchased</p>
                        <p className="text-sm text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">User Management</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Subscription</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="capitalize">{user.role}</td>
                        <td>
                          <select
                            value={user.subscriptionTier}
                            onChange={(e) => handleSubscriptionUpdate(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${
                            user.isActive ? 'badge-success' : 'badge-error'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUserAction(user.id, 'deactivate')}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                        <td>
                          {transaction.user ? (
                            <div>
                              <p className="font-medium">
                                {transaction.user.firstName} {transaction.user.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{transaction.user.email}</p>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="capitalize">{transaction.type.replace('_', ' ')}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && revenueAnalytics && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Revenue Analytics</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueAnalytics.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Revenue by Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueAnalytics.revenueByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Bar dataKey="total" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
