import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, TrendingUp, DollarSign, Shield, Users, Zap } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Predict Human Behavior with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Turn your daily activities into valuable insights. Get AI-powered predictions 
            about your future decisions and earn money by contributing to the behavioral data marketplace.
          </p>
          <div className="space-x-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-8 py-3">
                  Get Started Free
                </Link>
                <Link to="/pricing" className="btn-secondary text-lg px-8 py-3">
                  View Pricing
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Log Your Behavior</h3>
              <p className="text-gray-600">
                Record your daily activities, purchases, sleep patterns, and more. 
                Connect wearable devices for automatic tracking.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get AI Predictions</h3>
              <p className="text-gray-600">
                Our advanced AI analyzes your patterns to predict future decisions 
                and behaviors with high accuracy.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Earn Money</h3>
              <p className="text-gray-600">
                Companies purchase aggregated insights from your data. 
                You earn a share of every transaction involving your behavioral patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose BehaviorMarket?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card">
              <Shield className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
              <p className="text-gray-600">
                Your data is anonymized and encrypted. You control what you share 
                and can delete your data anytime.
              </p>
            </div>
            <div className="card">
              <Users className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
              <p className="text-gray-600">
                Join thousands of users contributing to behavioral science 
                while earning passive income.
              </p>
            </div>
            <div className="card">
              <Zap className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-Time Insights</h3>
              <p className="text-gray-600">
                Get instant predictions and track your behavioral patterns 
                with live analytics and trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">1M+</div>
              <div className="text-gray-600">Behavior Logs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
              <div className="text-gray-600">Prediction Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">$50K+</div>
              <div className="text-gray-600">User Earnings</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Earning from Your Data?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the behavioral data revolution. Start logging your activities today 
            and see what AI can predict about your future.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-md text-lg transition-colors duration-200">
              Get Started Free
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
