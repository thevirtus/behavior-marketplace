import React, { useState } from 'react';
import { X, Crown, Star, Zap, Check, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaywallModal = ({ isOpen, onClose, feature, requiredTier = 'premium' }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(requiredTier);

  const plans = {
    premium: {
      name: 'Premium',
      price: 29,
      period: 'month',
      icon: Star,
      color: 'purple',
      features: [
        'Unlimited behavior logs',
        'Advanced AI predictions',
        'Correlation analysis',
        'Export your data',
        'Priority support',
        'Custom themes',
        'Advanced analytics',
        'Join unlimited challenges'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 99,
      period: 'month',
      icon: Crown,
      color: 'yellow',
      features: [
        'Everything in Premium',
        'Personality insights',
        'Predictive modeling',
        'API access',
        'White-label options',
        'Custom integrations',
        'Dedicated support',
        'Advanced security',
        'Team collaboration'
      ]
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const stripe = await stripePromise;
      
      // Create checkout session
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planType: selectedPlan,
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: window.location.href
        })
      });

      const session = await response.json();
      
      if (session.error) {
        throw new Error(session.error);
      }

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.sessionId
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentPlan = plans[selectedPlan];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 bg-${currentPlan.color}-100 rounded-full mb-4`}>
              <Lock className={`w-8 h-8 text-${currentPlan.color}-600`} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Upgrade Required
            </h2>
            <p className="text-gray-600">
              <span className="font-semibold">{feature}</span> is available for {requiredTier} subscribers
            </p>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(plans).map(([key, plan]) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === key;
              const isAvailable = key === 'premium' || requiredTier === 'enterprise';
              
              if (!isAvailable) return null;

              return (
                <div
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? `border-${plan.color}-500 bg-${plan.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {key === 'enterprise' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 bg-${plan.color}-100 rounded-full mb-3`}>
                      <Icon className={`w-6 h-6 text-${plan.color}-600`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Plan Features */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <currentPlan.icon className={`w-5 h-5 mr-2 text-${currentPlan.color}-600`} />
              {currentPlan.name} Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className={`flex-1 px-6 py-3 bg-gradient-to-r from-${currentPlan.color}-600 to-${currentPlan.color}-700 text-white rounded-lg hover:from-${currentPlan.color}-700 hover:to-${currentPlan.color}-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Upgrade to {currentPlan.name}</span>
                </>
              )}
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>Secure payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>30-day money back</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
