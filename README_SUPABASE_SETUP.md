# Supabase Setup Instructions

## Database Connection

The current `.env` file has the Supabase anon key as the database password, which is incorrect. You need to get the actual database password from Supabase.

### Steps to get the correct database password:

1. Go to your Supabase Dashboard
2. Navigate to Settings → Database
3. Find the "Connection string" section
4. Copy the password from there (it will be different from the anon key)

### Update your .env file:

Replace the current DATABASE_URL and DIRECT_URL with:

```
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-DATABASE-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-DATABASE-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

Where:
- `[YOUR-PROJECT-REF]` = `njvpeanwvnchyrogfpcm`
- `[YOUR-DATABASE-PASSWORD]` = The actual database password from Supabase Dashboard (NOT the anon key)

### Current Status:

✅ Tables created in Supabase
✅ Prisma schema configured
✅ UI Supabase client configured
✅ Environment variables structure set up
❌ Need correct database password for Prisma connection

Once you update the database password, run:
```bash
cd api
npx prisma db pull  # To verify connection
npm run dev         # To start the API server
```