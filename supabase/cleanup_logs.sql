-- Create a function to delete logs older than 20 days
CREATE OR REPLACE FUNCTION delete_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM logs
    WHERE created_at < NOW() - INTERVAL '20 days';
END;
$$ LANGUAGE plpgsql;

-- To fully automate this, you can use pg_cron if enabled in your Supabase project:
-- SELECT cron.schedule('delete-old-logs-daily', '0 0 * * *', 'SELECT delete_old_logs()');

-- If pg_cron is not enabled, you can run this manually or via an Edge Function/Webhook.
