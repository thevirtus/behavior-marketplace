# Deployment Guide

This guide covers deploying the Predictive Human Behavior Marketplace MVP to production.

## Quick Setup for Development

1. **Clone and install dependencies:**
```bash
cd behavior-marketplace
cd backend && npm install
cd ../frontend && npm install
```

2. **Set up environment variables:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your credentials
```

3. **Set up database and seed data:**
```bash
cd backend
npm run setup  # Runs migration and seeding
```

4. **Start development servers:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm start
```

## Production Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project" and import your GitHub repository

2. **Configure Build Settings:**
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
   ```

4. **Deploy:**
   - Click "Deploy" - Vercel will automatically build and deploy

### Backend Deployment (Render)

1. **Create Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service:**
   - Name: `behavior-marketplace-backend`
   - Environment: `Node`
   - Region: Choose closest to your users
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-super-secure-jwt-secret
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   PORT=10000
   ```

4. **Database Setup:**
   - Create PostgreSQL database on Render
   - Copy connection string to `DATABASE_URL`
   - Run migration: `npm run migrate` (via Render shell)
   - Seed demo data: `npm run seed` (optional)

### Alternative: Heroku Deployment

1. **Install Heroku CLI and login:**
```bash
heroku login
```

2. **Create Heroku apps:**
```bash
# Backend
heroku create behavior-marketplace-api
heroku addons:create heroku-postgresql:mini -a behavior-marketplace-api

# Frontend (optional - Vercel recommended)
heroku create behavior-marketplace-app
heroku buildpacks:set mars/create-react-app -a behavior-marketplace-app
```

3. **Configure environment variables:**
```bash
heroku config:set NODE_ENV=production -a behavior-marketplace-api
heroku config:set JWT_SECRET=your-jwt-secret -a behavior-marketplace-api
heroku config:set STRIPE_SECRET_KEY=sk_live_... -a behavior-marketplace-api
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_... -a behavior-marketplace-api
heroku config:set CORS_ORIGIN=https://your-frontend-url.herokuapp.com -a behavior-marketplace-api
```

4. **Deploy:**
```bash
# Backend
git subtree push --prefix=backend heroku main

# Frontend (if using Heroku)
heroku config:set REACT_APP_API_URL=https://behavior-marketplace-api.herokuapp.com/api -a behavior-marketplace-app
git subtree push --prefix=frontend heroku main
```

## Database Migration in Production

After deploying backend, run migrations:

**Render:**
```bash
# In Render shell
npm run migrate
npm run seed  # Optional: for demo data
```

**Heroku:**
```bash
heroku run npm run migrate -a behavior-marketplace-api
heroku run npm run seed -a behavior-marketplace-api  # Optional
```

## Stripe Configuration

1. **Webhook Endpoints:**
   - Add webhook endpoint: `https://your-backend-url/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

2. **Payment Methods:**
   - Enable desired payment methods in Stripe Dashboard
   - Configure tax settings if needed

## Environment Variables Reference

### Backend (.env)
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secure-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

## Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] User registration/login works
- [ ] Database connections successful
- [ ] API endpoints responding
- [ ] Stripe payments processing
- [ ] Webhook endpoints receiving events
- [ ] CORS configured properly
- [ ] SSL certificates active
- [ ] Environment variables set
- [ ] Demo accounts created (optional)

## Monitoring & Maintenance

1. **Health Checks:**
   - Backend: `GET /api/health`
   - Monitor response times and error rates

2. **Database Backups:**
   - Enable automatic backups on your database provider
   - Test restore procedures

3. **Logs:**
   - Monitor application logs for errors
   - Set up alerts for critical issues

4. **Updates:**
   - Regularly update dependencies
   - Monitor security advisories

## Demo Accounts (Post-Seeding)

After running the seed script, these demo accounts are available:

- **User Account:** `demo@example.com` / `password123`
- **Company Account:** `company@example.com` / `password123`  
- **Admin Account:** `admin@example.com` / `password123`

## Troubleshooting

**Common Issues:**

1. **CORS Errors:**
   - Verify `CORS_ORIGIN` matches frontend URL exactly
   - Check for trailing slashes

2. **Database Connection:**
   - Verify `DATABASE_URL` format
   - Ensure database server is accessible

3. **Stripe Webhooks:**
   - Verify webhook URL is accessible
   - Check webhook secret matches

4. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are listed in package.json

For additional support, check the application logs and error messages.
