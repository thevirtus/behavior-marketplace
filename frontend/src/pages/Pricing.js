import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Check, Zap, Crown, Building } from 'lucide-react';

const Pricing = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleSubscribe = async (tier) => {
    if (!isAuthenticated) {
      toast.error('Please login to subscribe');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/subscriptions/checkout', { tier });
      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      icon: Zap,
      price: 0,
      description: 'Perfect for getting started with behavioral predictions',
      features: [
        '5 AI predictions per month',
        'Basic behavior logging',
        'Simple analytics dashboard',
        'Community support',
        'Data export (CSV)',
        'Basic marketplace access'
      ],
      limitations: [
        'Limited prediction accuracy',
        'No advanced analytics',
        'Standard earning rates'
      ],
      buttonText: 'Current Plan',
      buttonClass: 'btn-secondary',
      popular: false
    },
    {
      name: 'Premium',
      icon: Crown,
      price: 29,
      description: 'Advanced predictions and analytics for serious users',
      features: [
        '50 AI predictions per month',
        'Advanced behavior tracking',
        'Detailed analytics & insights',
        'Priority support',
        'Advanced data export',
        'Full marketplace access',
        'Prediction accuracy tracking',
        'Custom recommendations',
        '50% higher earning rates'
      ],
      limitations: [],
      buttonText: 'Upgrade to Premium',
      buttonClass: 'btn-primary',
      popular: true
    },
    {
      name: 'Enterprise',
      icon: Building,
      price: 999,
      description: 'Complete solution for companies and power users',
      features: [
        'Unlimited AI predictions',
        'Advanced behavior analytics',
        'Custom prediction models',
        'Dedicated support',
        'API access',
        'White-label options',
        'Advanced marketplace tools',
        'Custom integrations',
        'Maximum earning rates',
        'Priority data processing',
        'Custom reports & dashboards'
      ],
      limitations: [],
      buttonText: 'Contact Sales',
      buttonClass: 'btn-primary',
      popular: false
    }
  ];

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Unlock the power of AI-driven behavioral predictions and start earning from your data
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const yearlyPrice = Math.round(plan.price * 12 * 0.8);
          const displayPrice = billingCycle === 'yearly' ? yearlyPrice : plan.price;
          const isCurrentPlan = user?.subscriptionTier === plan.name.toLowerCase();

          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.popular
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`inline-flex p-3 rounded-full mb-4 ${
                  plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    plan.popular ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 mt-2">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${displayPrice}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Save ${(plan.price * 12) - yearlyPrice} per year
                  </p>
                )}
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan.name.toLowerCase())}
                disabled={loading || isCurrentPlan || plan.name === 'Free'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isCurrentPlan
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.buttonClass
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Processing...
                  </div>
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : (
                  plan.buttonText
                )}
              </button>

              {plan.limitations.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Limitations:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index}>• {limitation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">How do I earn money from my data?</h3>
            <p className="text-gray-600">
              When companies purchase aggregated insights that include your behavioral data, 
              you automatically earn a share of the revenue. The more data you contribute, 
              the more you can earn.
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Is my personal data safe?</h3>
            <p className="text-gray-600">
              Yes, your personal data is completely anonymized before being included in any 
              insights sold to companies. We never share identifiable information.
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Can I cancel my subscription anytime?</h3>
            <p className="text-gray-600">
              Absolutely. You can cancel your subscription at any time from your account settings. 
              You'll continue to have access to premium features until the end of your billing period.
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-2">How accurate are the AI predictions?</h3>
            <p className="text-gray-600">
              Our AI models achieve 70-85% accuracy on average, depending on the prediction type 
              and amount of data available. Premium users get access to more sophisticated models 
              with higher accuracy rates.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of users who are already earning money from their behavioral data 
          while getting valuable insights about their future decisions.
        </p>
        {!isAuthenticated && (
          <div className="space-x-4">
            <button className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-medium py-3 px-8 rounded-lg transition-colors">
              View Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
