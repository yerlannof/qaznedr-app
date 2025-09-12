-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kazakhstan_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can create a user profile" ON public.users
  FOR INSERT WITH CHECK (true);

-- Kazakhstan deposits policies
CREATE POLICY "Anyone can view active deposits" ON public.kazakhstan_deposits
  FOR SELECT USING (status = 'ACTIVE' OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own deposits" ON public.kazakhstan_deposits
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own deposits" ON public.kazakhstan_deposits
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own deposits" ON public.kazakhstan_deposits
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Auctions policies
CREATE POLICY "Anyone can view active auctions" ON public.auctions
  FOR SELECT USING (status IN ('ACTIVE', 'ENDED') OR 
    EXISTS (SELECT 1 FROM public.kazakhstan_deposits d 
            WHERE d.id = deposit_id AND d.user_id::text = auth.uid()::text));

CREATE POLICY "Deposit owners can create auctions" ON public.auctions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.kazakhstan_deposits d 
            WHERE d.id = deposit_id AND d.user_id::text = auth.uid()::text)
  );

CREATE POLICY "Deposit owners can update their auctions" ON public.auctions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.kazakhstan_deposits d 
            WHERE d.id = deposit_id AND d.user_id::text = auth.uid()::text)
  );

-- Bids policies
CREATE POLICY "Anyone can view bids on active auctions" ON public.bids
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.auctions a 
            WHERE a.id = auction_id AND a.status = 'ACTIVE')
  );

CREATE POLICY "Authenticated users can place bids" ON public.bids
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text AND
    EXISTS (SELECT 1 FROM public.auctions a 
            WHERE a.id = auction_id AND a.status = 'ACTIVE')
  );

-- Companies policies
CREATE POLICY "Anyone can view verified companies" ON public.companies
  FOR SELECT USING (verified = true OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own company" ON public.companies
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own company" ON public.companies
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own company" ON public.companies
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Services policies
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Company owners can create services" ON public.services
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c 
            WHERE c.id = company_id AND c.user_id::text = auth.uid()::text)
  );

CREATE POLICY "Company owners can update services" ON public.services
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.companies c 
            WHERE c.id = company_id AND c.user_id::text = auth.uid()::text)
  );

CREATE POLICY "Company owners can delete services" ON public.services
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.companies c 
            WHERE c.id = company_id AND c.user_id::text = auth.uid()::text)
  );

-- Investments policies
CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own investments" ON public.investments
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own investments" ON public.investments
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Price history policies
CREATE POLICY "Anyone can view price history" ON public.price_history
  FOR SELECT USING (true);

CREATE POLICY "System can insert price history" ON public.price_history
  FOR INSERT WITH CHECK (true);

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can remove favorites" ON public.favorites
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Views policies
CREATE POLICY "Anyone can view view statistics" ON public.views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert views" ON public.views
  FOR INSERT WITH CHECK (true);

-- Documents policies
CREATE POLICY "Anyone can view public documents" ON public.documents
  FOR SELECT USING (true);

CREATE POLICY "Deposit owners can upload documents" ON public.documents
  FOR INSERT WITH CHECK (
    uploaded_by::text = auth.uid()::text AND
    EXISTS (SELECT 1 FROM public.kazakhstan_deposits d 
            WHERE d.id = deposit_id AND d.user_id::text = auth.uid()::text)
  );

CREATE POLICY "Document owners can delete documents" ON public.documents
  FOR DELETE USING (uploaded_by::text = auth.uid()::text);

-- Contact requests policies
CREATE POLICY "Users can view their sent requests" ON public.contact_requests
  FOR SELECT USING (from_user_id::text = auth.uid()::text);

CREATE POLICY "Users can view their received requests" ON public.contact_requests
  FOR SELECT USING (to_user_id::text = auth.uid()::text);

CREATE POLICY "Users can create contact requests" ON public.contact_requests
  FOR INSERT WITH CHECK (from_user_id::text = auth.uid()::text);

CREATE POLICY "Recipients can update contact requests" ON public.contact_requests
  FOR UPDATE USING (to_user_id::text = auth.uid()::text);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (user_id::text = auth.uid()::text);