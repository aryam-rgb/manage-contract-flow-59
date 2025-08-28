-- First, add the new enum values separately
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'reviewer';
COMMIT;

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'approval';
COMMIT;