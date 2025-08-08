-- Create the registered_users table
CREATE TABLE IF NOT EXISTS registered_users (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on chat_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_registered_users_chat_id ON registered_users(chat_id);

-- Create index on username for faster username lookups
CREATE INDEX IF NOT EXISTS idx_registered_users_username ON registered_users(username);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_registered_users_updated_at ON registered_users;
CREATE TRIGGER update_registered_users_updated_at
    BEFORE UPDATE ON registered_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for additional security
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you may want to restrict this based on your security needs)
CREATE POLICY "Allow all operations on registered_users" ON registered_users
    FOR ALL USING (true); 