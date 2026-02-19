-- Ensure the user role enum can store the default signup role.
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'user';

-- Verify allowed values
-- SELECT unnest(enum_range(NULL::user_role_enum)) AS allowed_roles;