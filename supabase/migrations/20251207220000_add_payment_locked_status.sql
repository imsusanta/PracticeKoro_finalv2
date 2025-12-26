-- Add 'payment_locked' status to approval_status_type enum
ALTER TYPE approval_status_type ADD VALUE IF NOT EXISTS 'payment_locked';
