import express from 'express';
import { supabase, adminSupabase, isSupabaseConfigured } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/auth/verify-admin - Verify that user has a confirmed email and 'admin' role in Supabase
router.get('/verify-admin', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const isEmailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);

    if (!isEmailVerified) {
      return res.status(403).json({
        success: false,
        isEmailVerified: false,
        isAdmin: false,
        message: 'Email address has not been confirmed in Supabase. Please verify your email first.',
      });
    }

    let isAdmin = false;
    const client = adminSupabase || supabase;

    if (isSupabaseConfigured() && client) {
      try {
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile && profile.role === 'admin') {
          isAdmin = true;
        }
      } catch (err) {
        console.warn('Profile admin check warning:', err.message);
      }
    }

    if (!isAdmin && (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin')) {
      isAdmin = true;
    }

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        isEmailVerified: true,
        isAdmin: false,
        message: `Account "${user.email}" is verified, but not approved as an administrator in Supabase.`,
      });
    }

    return res.status(200).json({
      success: true,
      isEmailVerified: true,
      isAdmin: true,
      user: {
        id: user.id,
        email: user.email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Error verifying admin authorization:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify administrative authorization',
      error: error.message,
    });
  }
});

// GET /api/auth/me - Verify and return user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    if (isSupabaseConfigured() && supabase) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return res.status(200).json({
        success: true,
        user: {
          ...user,
          profile: profile || null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        profile: {
          full_name: user.user_metadata?.full_name || 'Dr. Amina Al-Mansoor',
          phone: '+1 (555) 749-3342',
          role: 'patient',
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile data',
      error: error.message,
    });
  }
});

export default router;
