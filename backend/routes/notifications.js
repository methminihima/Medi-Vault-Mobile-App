const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const router = express.Router();

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

function requireAuth(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: 'Missing auth token' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    return decoded;
  } catch (e) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return null;
  }
}

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for current user (direct + role-based)
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const decoded = requireAuth(req, res);
    if (!decoded) return;

    const userId = decoded.id;
    const role = decoded.role;

    const result = await query(
      `SELECT id, recipient_id, recipient_user_id, recipient_role, type, title, message, metadata, created_at, read_at, is_read
       FROM notifications
       WHERE (recipient_id::text = $1 OR recipient_user_id::text = $1 OR recipient_role = $2)
       ORDER BY created_at DESC
       LIMIT 200`,
      [userId, role]
    );

    res.json({
      success: true,
      data: result.rows.map((n) => ({
        id: n.id,
        recipientId: n.recipient_id || n.recipient_user_id || null,
        recipientRole: n.recipient_role,
        type: n.type,
        title: n.title,
        message: n.message,
        metadata: n.metadata,
        createdAt: n.created_at,
        readAt: n.read_at,
        read: Boolean(n.is_read) || Boolean(n.read_at),
      })),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all notifications (for this user) as read
 * @access  Private
 */
router.post('/mark-all-read', async (req, res) => {
  try {
    const decoded = requireAuth(req, res);
    if (!decoded) return;

    const userId = decoded.id;
    const role = decoded.role;

    const result = await query(
      `UPDATE notifications
       SET is_read = true,
           read_at = COALESCE(read_at, now())
       WHERE (is_read = false OR read_at IS NULL)
         AND (recipient_id::text = $1 OR recipient_user_id::text = $1 OR recipient_role = $2)`,
      [userId, role]
    );

    res.json({ success: true, message: 'All notifications marked as read', data: { updated: result.rowCount } });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications', error: error.message });
  }
});

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.post('/:id/read', async (req, res) => {
  try {
    const decoded = requireAuth(req, res);
    if (!decoded) return;

    const userId = decoded.id;
    const role = decoded.role;
    const { id } = req.params;

    const result = await query(
      `UPDATE notifications
       SET is_read = true,
           read_at = COALESCE(read_at, now())
       WHERE id::text = $1 AND (recipient_id::text = $2 OR recipient_user_id::text = $2 OR recipient_role = $3)`,
      [id, userId, role]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification', error: error.message });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification (for current user)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const decoded = requireAuth(req, res);
    if (!decoded) return;

    const userId = decoded.id;
    const role = decoded.role;
    const { id } = req.params;

    const result = await query(
      `DELETE FROM notifications
       WHERE id::text = $1 AND (recipient_id::text = $2 OR recipient_user_id::text = $2 OR recipient_role = $3)`,
      [id, userId, role]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
  }
});

module.exports = router;
