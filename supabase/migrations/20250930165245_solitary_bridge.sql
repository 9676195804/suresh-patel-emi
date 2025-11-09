/*
  # Insert default admin user

  1. New Data
    - Insert default admin user with username 'admin' and password 'password'
    - This allows immediate login to the admin panel

  2. Security
    - In production, this should be changed to a secure password
    - Password is stored as plain text for demo purposes
*/

INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', 'password')
ON CONFLICT (username) DO NOTHING;