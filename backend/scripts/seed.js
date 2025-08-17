const { User, Company, BehaviorLog, Prediction, Transaction, Subscription } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Create demo users
    const demoUsers = await Promise.all([
      User.create({
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        subscriptionTier: 'premium',
        isActive: true,
        demographics: {
          age: 28,
          gender: 'other',
          location: 'San Francisco, CA'
        }
      }),
      User.create({
        firstName: 'Company',
        lastName: 'Admin',
        email: 'company@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'company',
        subscriptionTier: 'enterprise',
        isActive: true
      }),
      User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'admin',
        subscriptionTier: 'enterprise',
        isActive: true
      })
    ]);

    console.log('Created demo users');

    // Create demo company
    const demoCompany = await Company.create({
      name: 'Demo Analytics Corp',
      email: 'company@example.com',
      industry: 'Technology',
      size: '100-500',
      subscriptionTier: 'enterprise',
      totalSpent: 5000.00,
      apiKey: 'demo_api_key_12345'
    });

    console.log('Created demo company');

    // Create demo behavior logs
    const behaviorCategories = ['fitness', 'sleep', 'nutrition', 'productivity', 'social'];
    const behaviorLogs = [];

    for (let i = 0; i < 50; i++) {
      const category = behaviorCategories[Math.floor(Math.random() * behaviorCategories.length)];
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      
      behaviorLogs.push({
        userId: demoUsers[0].id,
        category,
        subcategory: category === 'fitness' ? 'exercise' : 
                    category === 'sleep' ? 'duration' :
                    category === 'nutrition' ? 'meal' :
                    category === 'productivity' ? 'work' : 'interaction',
        description: `Demo ${category} activity`,
        value: Math.random() * 100,
        quantity: Math.floor(Math.random() * 10) + 1,
        duration: Math.floor(Math.random() * 120) + 10,
        timestamp: createdAt,
        source: 'manual',
        confidence: 0.8 + Math.random() * 0.2,
        createdAt,
        updatedAt: createdAt
      });
    }

    await BehaviorLog.bulkCreate(behaviorLogs);
    console.log('Created demo behavior logs');

    // Create demo predictions
    const predictionTypes = ['purchase_likelihood', 'app_usage', 'sleep_quality', 'exercise_frequency'];
    const predictions = [];

    for (let i = 0; i < 20; i++) {
      const type = predictionTypes[Math.floor(Math.random() * predictionTypes.length)];
      const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      predictions.push({
        userId: demoUsers[0].id,
        predictionType: type,
        category: behaviorCategories[Math.floor(Math.random() * behaviorCategories.length)],
        prediction: {
          value: Math.random() * 100,
          probability: Math.random(),
          factors: ['historical_data', 'user_patterns', 'seasonal_trends']
        },
        confidence: 0.7 + Math.random() * 0.3,
        timeframe: '7_days',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        accuracy: Math.random() > 0.3 ? Math.random() * 0.4 + 0.6 : null,
        isVerified: Math.random() > 0.5,
        createdAt,
        updatedAt: createdAt
      });
    }

    await Prediction.bulkCreate(predictions);
    console.log('Created demo predictions');

    // Create demo transactions
    const transactionTypes = ['subscription_payment', 'marketplace_purchase', 'data_sale'];
    const transactions = [];

    for (let i = 0; i < 15; i++) {
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      transactions.push({
        userId: type === 'data_sale' ? demoUsers[0].id : demoUsers[1].id,
        companyId: type === 'marketplace_purchase' ? demoCompany.id : null,
        type,
        amount: type === 'subscription_payment' ? 29.99 :
               type === 'marketplace_purchase' ? Math.random() * 500 + 100 :
               Math.random() * 50 + 10,
        currency: 'USD',
        status: Math.random() > 0.1 ? 'completed' : 'pending',
        stripePaymentIntentId: `pi_demo_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          description: `Demo ${type.replace('_', ' ')}`
        },
        createdAt,
        updatedAt: createdAt
      });
    }

    await Transaction.bulkCreate(transactions);
    console.log('Created demo transactions');

    // Create demo subscriptions
    await Promise.all([
      Subscription.create({
        userId: demoUsers[0].id,
        tier: 'premium',
        status: 'active',
        stripeSubscriptionId: 'sub_demo_premium',
        stripeCustomerId: 'cus_demo_user',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        billingInterval: 'monthly',
        features: {
          predictions_per_month: 100,
          advanced_analytics: true,
          data_export: true
        }
      }),
      Subscription.create({
        userId: demoUsers[1].id,
        tier: 'enterprise',
        status: 'active',
        stripeSubscriptionId: 'sub_demo_enterprise',
        stripeCustomerId: 'cus_demo_company',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        billingInterval: 'monthly',
        features: {
          predictions_per_month: -1,
          advanced_analytics: true,
          data_export: true,
          marketplace_access: true,
          custom_reports: true
        }
      })
    ]);

    console.log('Created demo subscriptions');
    console.log('Database seeding completed successfully!');
    console.log('\nDemo Accounts:');
    console.log('User: demo@example.com / password123');
    console.log('Company: company@example.com / password123');
    console.log('Admin: admin@example.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
