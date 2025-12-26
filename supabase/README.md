# Supabase Database Setup

This directory contains database migrations, seed data, and edge functions for the Exam Master AI application.

## Directory Structure

```
supabase/
├── migrations/          # Database schema migrations
├── functions/          # Edge functions (serverless)
├── seed.sql           # Initial admin user creation
└── README.md          # This file
```

## First-Time Setup

### 1. Apply Migrations

Run migrations in order to set up the database schema:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard > SQL Editor
```

### 2. Create First Admin User

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Enter email: `admin@exammaster.com` (or your preferred email)
4. Set a secure password
5. Click "Create User"
6. Run this SQL in the SQL Editor to grant admin role:

```sql
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@exammaster.com');

UPDATE public.approval_status
SET status = 'approved'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@exammaster.com');
```

**Option B: Promote Existing User**

If you already have a registered user account, promote it to admin:

```sql
-- Replace with your email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.approval_status
SET status = 'approved'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

**Option C: Use Seed Script**

Edit `seed.sql` with your desired admin credentials and run it:

```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase/seed.sql
```

## Migrations Overview

### Initial Schema (`20251128154708_*.sql`)
- Creates core tables: profiles, user_roles, approval_status, exams, questions, mock_tests, etc.
- Sets up Row Level Security (RLS) policies
- Creates triggers for auto-creating profiles and updating timestamps
- Defines enums for roles, approval status, and test types

### Comprehensive Features (`20251129_add_missing_features.sql`)
Adds production-ready features:

**Test Configuration**
- Retake settings (allow_retake, retake_limit)
- Question/option shuffling
- Immediate results display toggle
- Test archiving (soft delete)

**Performance Tracking**
- Time taken in seconds
- Unanswered question count
- Correct/wrong answer counts
- Subject-wise performance breakdown

**Security & Auditing**
- Account deactivation with reasons
- Last login tracking
- Admin audit logs
- PDF access logs

**User Experience**
- Auto-save test answers (prevents data loss)
- Timer persistence (survives page refresh)
- Mark questions for review
- Notifications system

**File Management**
- PDF download tracking
- PDF descriptions and tags
- Exam icons/images

## Edge Functions

### `generate-questions`

AI-powered question generation using Gemini 2.5 Flash.

**Deploy:**
```bash
supabase functions deploy generate-questions
```

**Environment Variables:**
```bash
supabase secrets set LOVABLE_API_KEY=your_key_here
```

## Database Functions

### Security Functions
- `has_role(user_id, role)` - Check if user has specific role
- `has_active_attempt(user_id, test_id)` - Check for active test attempts
- `can_retake_test(user_id, test_id)` - Validate retake eligibility

### Analytics Functions
- `get_test_ranking(attempt_id)` - Get student ranking and test statistics
- `get_subject_performance(attempt_id)` - Subject-wise performance breakdown

### Utility Functions
- `increment_pdf_download(pdf_id)` - Track PDF downloads
- `update_updated_at_column()` - Auto-update timestamps

## Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# First Admin (for reference only)
FIRST_ADMIN_EMAIL=admin@exammaster.com
FIRST_ADMIN_PASSWORD=your-secure-password

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI Question Generator
LOVABLE_API_KEY=your-lovable-api-key
```

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

**Students can:**
- View their own profile, roles, and approval status
- View active exams and published tests
- Insert and view their own test attempts and answers
- Auto-save and view their own answer drafts
- View PDFs (if approved)

**Admins can:**
- View and manage all data
- Create/edit/delete exams, questions, and tests
- Approve/reject student registrations
- View analytics and audit logs

## Backup & Restore

```bash
# Backup database
supabase db dump -f backup.sql

# Restore from backup
psql -h db.your-project.supabase.co -U postgres -d postgres -f backup.sql
```

## Troubleshooting

### Migration Fails
- Check SQL syntax errors in migration files
- Ensure migrations run in chronological order
- Verify no duplicate column/table names

### RLS Policy Issues
- Test policies using different user accounts
- Check `auth.uid()` returns correct user ID
- Verify `has_role()` function works correctly

### Function Errors
- Check function search_path is set to `public`
- Ensure SECURITY DEFINER is set for admin functions
- Test functions via SQL Editor before deployment

## Support

For issues or questions:
1. Check Supabase Dashboard logs
2. Review RLS policies in Table Editor
3. Test SQL queries in SQL Editor
4. Check Edge Function logs in Functions tab
