import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePaywall = () => {
  const { user } = useAuth();
  const [paywallModal, setPaywallModal] = useState({
    isOpen: false,
    feature: '',
    requiredTier: 'premium'
  });

  const checkFeatureAccess = (feature, requiredTier = 'premium') => {
    const userTier = user?.subscriptionTier || 'free';
    const tierHierarchy = ['free', 'premium', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    if (userTierIndex < requiredTierIndex) {
      setPaywallModal({
        isOpen: true,
        feature,
        requiredTier
      });
      return false;
    }
    return true;
  };

  const closePaywall = () => {
    setPaywallModal({
      isOpen: false,
      feature: '',
      requiredTier: 'premium'
    });
  };

  const requirePremium = (feature) => {
    return checkFeatureAccess(feature, 'premium');
  };

  const requireEnterprise = (feature) => {
    return checkFeatureAccess(feature, 'enterprise');
  };

  return {
    paywallModal,
    checkFeatureAccess,
    closePaywall,
    requirePremium,
    requireEnterprise
  };
};
