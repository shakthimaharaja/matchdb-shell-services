import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import { env } from './config/env';
import './config/passport'; // registers Google OAuth strategy (side-effect)
import authRoutes from './routes/auth.routes';
import paymentsRoutes from './routes/payments.routes';
import { errorHandler, notFound } from './middleware/error.middleware';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Passport (stateless — no session middleware needed)
app.use(passport.initialize());

// Stripe webhook must come BEFORE express.json() (needs raw body)
// It is self-contained in payments.routes with its own raw body parser
app.use('/api/payments', paymentsRoutes);

// JSON body parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'matchdb-shell-services', env: env.NODE_ENV });
});

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

export default app;
