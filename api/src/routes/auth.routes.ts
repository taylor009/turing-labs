import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';

const router: Router = Router();

// Simple profile route for Supabase authenticated users
router.get('/profile', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

export default router;