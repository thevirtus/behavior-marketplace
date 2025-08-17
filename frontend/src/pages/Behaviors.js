import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  Clock,
  Filter
} from 'lucide-react';

const BEHAVIOR_CATEGORIES = [
  'purchase',
  'app_usage',
  'sleep',
  'exercise',
  'food',
  'social',
  'work',
  'entertainment',
  'health',
  'travel'
];

const Behaviors = () => {
  const { user } = useAuth();
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBehavior, setEditingBehavior] = useState(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    category: 'purchase',
    subcategory: '',
    description: '',
    value: '',
    quantity: '',
    duration: '',
    timestamp: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchBehaviors();
  }, [filter]);

  const fetchBehaviors = async () => {
    try {
      const params = filter !== 'all' ? { category: filter } : {};
      const response = await axios.get('/api/behaviors', { params });
      setBehaviors(response.data.behaviors);
    } catch (error) {
      toast.error('Failed to fetch behaviors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const behaviorData = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        duration: formData.duration ? parseInt(formData.duration) : null
      };

      if (editingBehavior) {
        await axios.put(`/api/behaviors/${editingBehavior.id}`, behaviorData);
        toast.success('Behavior updated successfully');
      } else {
        await axios.post('/api/behaviors', behaviorData);
        toast.success('Behavior logged successfully');
      }

      resetForm();
      fetchBehaviors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save behavior');
    }
  };

  const handleEdit = (behavior) => {
    setEditingBehavior(behavior);
    setFormData({
      category: behavior.category,
      subcategory: behavior.subcategory || '',
      description: behavior.description,
      value: behavior.value || '',
      quantity: behavior.quantity || '',
      duration: behavior.duration || '',
      timestamp: new Date(behavior.timestamp).toISOString().slice(0, 16)
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this behavior?')) return;

    try {
      await axios.delete(`/api/behaviors/${id}`);
      toast.success('Behavior deleted successfully');
      fetchBehaviors();
    } catch (error) {
      toast.error('Failed to delete behavior');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'purchase',
      subcategory: '',
      description: '',
      value: '',
      quantity: '',
      duration: '',
      timestamp: new Date().toISOString().slice(0, 16)
    });
    setEditingBehavior(null);
    setShowAddForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
        <span className="ml-2">Loading behaviors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Behavior Logs</h1>
          <p className="text-gray-600">Track your daily activities and patterns</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Behavior
        </button>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-input w-auto"
          >
            <option value="all">All Categories</option>
            {BEHAVIOR_CATEGORIES.map(category => (
              <option key={category} value={category} className="capitalize">
                {category.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingBehavior ? 'Edit Behavior' : 'Log New Behavior'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  {BEHAVIOR_CATEGORIES.map(category => (
                    <option key={category} value={category} className="capitalize">
                      {category.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Subcategory (Optional)</label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Coffee, Running, Netflix"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                rows="3"
                placeholder="Describe what you did..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Value ($)</label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  className="form-input"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Date & Time</label>
              <input
                type="datetime-local"
                name="timestamp"
                value={formData.timestamp}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                {editingBehavior ? 'Update Behavior' : 'Log Behavior'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Behaviors List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Your Behaviors</h3>
        
        {behaviors.length > 0 ? (
          <div className="space-y-4">
            {behaviors.map((behavior) => (
              <div key={behavior.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="badge badge-info capitalize">
                        {behavior.category.replace('_', ' ')}
                      </span>
                      {behavior.subcategory && (
                        <span className="text-sm text-gray-500">
                          {behavior.subcategory}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-900 font-medium mb-2">
                      {behavior.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(behavior.timestamp).toLocaleString()}
                      </div>
                      
                      {behavior.value && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${parseFloat(behavior.value).toFixed(2)}
                        </div>
                      )}
                      
                      {behavior.duration && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {behavior.duration}m
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(behavior)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(behavior.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No behaviors logged yet</h3>
            <p className="mb-4">Start tracking your daily activities to get AI predictions</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Log Your First Behavior
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Behaviors;
