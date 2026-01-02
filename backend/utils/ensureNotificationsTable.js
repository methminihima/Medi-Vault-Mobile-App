const { query } = require('../config/database');

async function ensureNotificationsTable() {
  // The project may already have a notifications table (older schema).
  // This function should be migration-safe and must NOT assume UUID user IDs.

  await query(
    `CREATE TABLE IF NOT EXISTS notifications (
      id text PRIMARY KEY,
      recipient_id text NULL,
      recipient_role text NULL,
      type text NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      metadata jsonb NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      is_read boolean NOT NULL DEFAULT false,
      read_at timestamptz NULL
    )`
  );

  // Ensure columns exist for both old and new code paths.
  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id text NULL');
  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_user_id text NULL');
  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_role text NULL');

  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text NULL');
  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title text NULL');
  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text NULL');
  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata jsonb NULL');

  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at timestamptz NULL DEFAULT now()');
  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read boolean NULL DEFAULT false');
  await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at timestamptz NULL');

  // Backfill required fields so NOT NULL constraints can safely be applied.
  await query("UPDATE notifications SET type = COALESCE(type, 'system') WHERE type IS NULL");
  await query("UPDATE notifications SET title = COALESCE(title, 'Notification') WHERE title IS NULL");
  await query("UPDATE notifications SET message = COALESCE(message, '') WHERE message IS NULL");
  await query('UPDATE notifications SET created_at = COALESCE(created_at, now()) WHERE created_at IS NULL');
  await query('UPDATE notifications SET is_read = COALESCE(is_read, false) WHERE is_read IS NULL');
  await query('UPDATE notifications SET read_at = COALESCE(read_at, CASE WHEN is_read THEN now() ELSE NULL END) WHERE read_at IS NULL AND is_read = true');

  // Apply NOT NULL where possible.
  await query('ALTER TABLE notifications ALTER COLUMN type SET NOT NULL');
  await query('ALTER TABLE notifications ALTER COLUMN title SET NOT NULL');
  await query('ALTER TABLE notifications ALTER COLUMN message SET NOT NULL');
  await query('ALTER TABLE notifications ALTER COLUMN created_at SET NOT NULL');
  await query('ALTER TABLE notifications ALTER COLUMN is_read SET NOT NULL');
  await query('ALTER TABLE notifications ALTER COLUMN is_read SET DEFAULT false');

  // Indexes (safe to repeat)
  await query('CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON notifications(recipient_role)');
  await query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)');
  await query('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');
}

module.exports = {
  ensureNotificationsTable,
};
