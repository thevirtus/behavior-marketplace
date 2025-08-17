# Predictive Human Behavior Marketplace MVP

A full-stack application that enables users to log behavior data, receive AI-powered predictions, and participate in a marketplace where companies can purchase aggregated behavioral insights.

## Tech Stack
- **Frontend**: React with React Router
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **AI/ML**: TensorFlow.js for predictions
- **Payments**: Stripe integration
- **Authentication**: JWT-based sessions

## Project Structure
```
behavior-marketplace/
├── frontend/          # React application
├── backend/           # Node.js/Express API
├── models/            # AI/ML prediction models
├── database/          # Database schema and migrations
└── README.md
```

## Features

### Core Functionality
- User authentication (signup/login/logout)
- Behavior data logging and management
- AI-powered behavior predictions
- Company dashboard for aggregated insights
- Marketplace for data transactions
- Subscription management with payment processing

### User Tiers
- **Free**: Basic predictions, limited features
- **Premium ($29/month)**: Advanced predictions, detailed analytics
- **Enterprise ($999-$9,999/month)**: Full marketplace access, custom reports

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. Clone and navigate to the project:
```bash
cd behavior-marketplace
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up PostgreSQL database:
```bash
# Create database
createdb behavior_marketplace

# Run migrations (from backend directory)
cd ../backend
npm run migrate
```

5. Configure environment variables:
```bash
# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with your database credentials and API keys
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

3. Access the application at `http://localhost:3000`

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get dashboard data

### Behavior Data Endpoints
- `GET /api/behaviors` - Get user behavior logs
- `POST /api/behaviors` - Create behavior log entry
- `PUT /api/behaviors/:id` - Update behavior log entry
- `DELETE /api/behaviors/:id` - Delete behavior log entry

### Predictions Endpoints
- `GET /api/predictions` - Get user predictions
- `POST /api/predictions/generate` - Generate new predictions

### Marketplace Endpoints
- `GET /api/marketplace/insights` - Get aggregated insights
- `POST /api/marketplace/purchase` - Purchase insights
- `GET /api/marketplace/transactions` - Get transaction history

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `build`

### Backend (Render/Heroku)
1. Create new web service
2. Connect repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/behavior_marketplace
JWT_SECRET=your-jwt-secret-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
