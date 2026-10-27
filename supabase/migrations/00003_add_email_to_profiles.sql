-- Add email to profiles so team lists can show it without service-role access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
