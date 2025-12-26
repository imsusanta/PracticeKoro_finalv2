-- Add 'deactivated' status to approval_status_type enum
ALTER TYPE approval_status_type ADD VALUE IF NOT EXISTS 'deactivated';

-- Add expires_at column to approval_status table for time-limited approvals
ALTER TABLE approval_status 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN approval_status.expires_at IS 'Optional expiration date for approved status. NULL means permanent approval.';