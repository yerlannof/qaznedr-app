# Database Migration Instructions

## Steps to Apply the Database Schema to Supabase

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Open your project (uajyafmysdebrrfwwvpc)

2. **Navigate to SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click on "New query"

3. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" button

4. **Verify Tables Created**
   - Go to "Table Editor" in the sidebar
   - You should see all the new tables:
     - users
     - kazakhstan_deposits
     - auctions
     - bids
     - companies
     - services
     - investments
     - price_history
     - favorites
     - views
     - documents
     - contact_requests
     - notifications

5. **Enable Row Level Security (RLS)**
   After creating tables, run the RLS policies script:
   - Open `supabase/migrations/002_row_level_security.sql`
   - Copy and run it in the SQL editor

## Important Notes

- The migration creates all necessary tables, indexes, and triggers
- UUID generation is handled automatically
- Updated_at timestamps are managed by triggers
- All foreign key relationships are properly set up

## Next Steps

After the migration is complete:

1. Test the connection from the application
2. Migrate existing data from SQLite
3. Update API endpoints to use Supabase client
4. Set up real-time subscriptions
