-- +goose Up
INSERT INTO users (id, email, username, password_hash, display_name, role, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'admin@yourpage.id',
    'admin',
    '$2a$12$h3JqXFW8LLayQ/IP46oyKOUPWV7aNdFSJZBnyb4QV7nzmYz4Y5wTW',
    'Admin YourPage',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- +goose Down
DELETE FROM users WHERE email = 'admin@yourpage.id';
