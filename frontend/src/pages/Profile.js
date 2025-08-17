import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  DollarSign, 
  Settings,
  CreditCard,
  Shield,
  Bell
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    demographics: {
      age: '',
      gender: '',
      location: '',
      income: ''
    },
    preferences: {
      notifications: true,
      dataSharing: true,
      marketingEmails: false
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        demographics: {
          age: user.demographics?.age || '',
          gender: user.demographics?.gender || '',
          location: user.demographics?.location || '',
          income: user.demographics?.income || ''
        },
        preferences: {
          notifications: user.preferences?.notifications ?? true,
          dataSharing: user.preferences?.dataSharing ?? true,
          marketingEmails: user.preferences?.marketingEmails ?? false
        }
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put('/api/users/profile', formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Joined {new Date(user?.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                ${parseFloat(user?.totalEarnings || 0).toFixed(2)} earned
              </div>
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
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Demographics (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Age Range</label>
                    <select
                      name="demographics.age"
                      value={formData.demographics.age}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value="">Select age range</option>
                      <option value="18-25">18-25</option>
                      <option value="26-35">26-35</option>
                      <option value="36-45">36-45</option>
                      <option value="46-55">46-55</option>
                      <option value="56+">56+</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Gender</label>
                    <select
                      name="demographics.gender"
                      value={formData.demographics.gender}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="demographics.location"
                      value={formData.demographics.location}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className="form-label">Income Range</label>
                    <select
                      name="demographics.income"
                      value={formData.demographics.income}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value="">Select income range</option>
                      <option value="under-25k">Under $25,000</option>
                      <option value="25k-50k">$25,000 - $50,000</option>
                      <option value="50k-75k">$50,000 - $75,000</option>
                      <option value="75k-100k">$75,000 - $100,000</option>
                      <option value="over-100k">Over $100,000</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Profile'
                )}
              </button>
            </form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Push Notifications
                      </label>
                      <p className="text-sm text-gray-500">
                        Receive notifications about new predictions and earnings
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      name="preferences.notifications"
                      checked={formData.preferences.notifications}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Marketing Emails
                      </label>
                      <p className="text-sm text-gray-500">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      name="preferences.marketingEmails"
                      checked={formData.preferences.marketingEmails}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Data Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Data Sharing
                      </label>
                      <p className="text-sm text-gray-500">
                        Allow your anonymized data to be included in marketplace insights
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      name="preferences.dataSharing"
                      checked={formData.preferences.dataSharing}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Save Preferences'
                )}
              </button>
            </form>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Subscription</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {user?.subscriptionTier || 'Free'} Plan
                      </p>
                      <p className="text-sm text-gray-500">
                        {user?.subscriptionTier === 'free' 
                          ? 'No billing information required'
                          : 'Next billing date: ' + new Date().toLocaleDateString()
                        }
                      </p>
                    </div>
                    <button className="btn-primary">
                      {user?.subscriptionTier === 'free' ? 'Upgrade' : 'Manage'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${parseFloat(user?.totalEarnings || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">This Month</p>
                    <p className="text-2xl font-bold text-blue-700">$0.00</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-purple-700">$0.00</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Data Privacy</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Your data is protected</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          All personal data is encrypted and anonymized before being used in any insights.
                          We never share identifiable information with third parties.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Data Controls</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-gray-900">Download Your Data</div>
                    <div className="text-sm text-gray-500">Get a copy of all your data</div>
                  </button>
                  <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-gray-900">Data Usage Report</div>
                    <div className="text-sm text-gray-500">See how your data has been used</div>
                  </button>
                  <button className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50 text-red-600">
                    <div className="font-medium">Delete Account</div>
                    <div className="text-sm text-red-500">Permanently delete your account and all data</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
