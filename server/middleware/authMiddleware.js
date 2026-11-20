import { supabase, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Middleware to verify Supabase JWT token from client
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization required. Please sign in to dispensary.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing.',
      });
    }

    // Verify token with Supabase Auth
    if (isSupabaseConfigured() && supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired session. Please sign in again.',
          error: error?.message,
        });
      }

      req.user = user;
      req.token = token;
      return next();
    }

    return res.status(503).json({
      success: false,
      message: 'Supabase authentication service unavailable.',
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error',
      error: error.message,
    });
  }
};
