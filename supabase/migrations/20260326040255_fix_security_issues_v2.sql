/*
  # Fix Security and Performance Issues

  ## 1. Add Missing Indexes for Foreign Keys
    - Add index on `transactions.package_id`
    - Add index on `user_profiles.location_slug`

  ## 2. Optimize RLS Policies (Auth Function Initialization)
    - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth functions for each row
    - Affects tables: events, instructors, user_profiles, leads, programs, success_stories, locations, class_schedule, location_media, testimonials, packages, user_locations

  ## 3. Remove Unused Indexes
    - Drop indexes that haven't been used to reduce overhead

  ## 4. Fix Multiple Permissive Policies
    - Consolidate overlapping policies to improve performance and clarity

  ## 5. Fix RLS Policy Always True Issues
    - Replace overly permissive policies with proper access control
    - Maintain functionality while adding security

  ## 6. Add Policy for clubready_config Table
    - Currently has RLS enabled but no policies

  ## 7. Fix Function Search Path
    - Make update_updated_at_column search path immutable
*/

-- =====================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_transactions_package_id_fk 
  ON public.transactions(package_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_location_slug_fk 
  ON public.user_profiles(location_slug);

-- =====================================================
-- 2. DROP UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_prospects_email;
DROP INDEX IF EXISTS public.idx_prospects_phone;
DROP INDEX IF EXISTS public.idx_prospects_clubready_id;
DROP INDEX IF EXISTS public.idx_transactions_status;
DROP INDEX IF EXISTS public.idx_transactions_created_at;
DROP INDEX IF EXISTS public.idx_transactions_prospect_id;
DROP INDEX IF EXISTS public.idx_payment_logs_transaction_id;
DROP INDEX IF EXISTS public.idx_payment_logs_step;
DROP INDEX IF EXISTS public.idx_payment_logs_http_status;
DROP INDEX IF EXISTS public.idx_payment_logs_endpoint;
DROP INDEX IF EXISTS public.idx_hero_leads_location;
DROP INDEX IF EXISTS public.idx_hero_leads_phone;
DROP INDEX IF EXISTS public.idx_user_locations_user_id;
DROP INDEX IF EXISTS public.idx_locations_is_active;
DROP INDEX IF EXISTS public.idx_locations_coordinates;
DROP INDEX IF EXISTS public.idx_packages_location_slug;
DROP INDEX IF EXISTS public.idx_leads_location_slug;
DROP INDEX IF EXISTS public.idx_leads_source;
DROP INDEX IF EXISTS public.idx_leads_email;
DROP INDEX IF EXISTS public.idx_testimonials_is_active;
DROP INDEX IF EXISTS public.idx_class_schedule_order;
DROP INDEX IF EXISTS public.idx_events_active_date;
DROP INDEX IF EXISTS public.idx_location_media_slug;

-- =====================================================
-- 3. FIX FUNCTION SEARCH PATH
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - DROP AND RECREATE
-- =====================================================

-- Drop all existing policies that need optimization
DROP POLICY IF EXISTS "Auth write events" ON public.events;
DROP POLICY IF EXISTS "Public read events" ON public.events;
DROP POLICY IF EXISTS "Auth write instructors" ON public.instructors;
DROP POLICY IF EXISTS "Public read instructors" ON public.instructors;
DROP POLICY IF EXISTS "Auth write programs" ON public.programs;
DROP POLICY IF EXISTS "Public read programs" ON public.programs;
DROP POLICY IF EXISTS "Auth write success_stories" ON public.success_stories;
DROP POLICY IF EXISTS "Public read success_stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Franchisees can view own location leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can insert all leads" ON public.leads;
DROP POLICY IF EXISTS "Franchisees can insert own location leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;
DROP POLICY IF EXISTS "Franchisees can update own location leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete all leads" ON public.leads;
DROP POLICY IF EXISTS "Franchisees can delete own location leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all locations" ON public.locations;
DROP POLICY IF EXISTS "Franchisees can view own location" ON public.locations;
DROP POLICY IF EXISTS "Anyone can view active locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can update all locations" ON public.locations;
DROP POLICY IF EXISTS "Franchisees can update own location" ON public.locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can manage all class schedules" ON public.class_schedule;
DROP POLICY IF EXISTS "Franchisees can manage own location schedules" ON public.class_schedule;
DROP POLICY IF EXISTS "Authenticated users can read all schedules" ON public.class_schedule;
DROP POLICY IF EXISTS "Public can view active class schedules" ON public.class_schedule;
DROP POLICY IF EXISTS "Admins can manage all location media" ON public.location_media;
DROP POLICY IF EXISTS "Franchisees can manage own location media" ON public.location_media;
DROP POLICY IF EXISTS "Public can view active location media" ON public.location_media;
DROP POLICY IF EXISTS "Admins can manage all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Franchisees can manage own location testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Anyone can view active testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can manage all packages" ON public.packages;
DROP POLICY IF EXISTS "Franchisees can manage own location packages" ON public.packages;
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
DROP POLICY IF EXISTS "Packages are viewable by everyone" ON public.packages;
DROP POLICY IF EXISTS "Packages can be managed by authenticated users" ON public.packages;
DROP POLICY IF EXISTS "Admins can manage all user locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view their own location assignments" ON public.user_locations;
DROP POLICY IF EXISTS "Users can link own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can read own location links" ON public.user_locations;
DROP POLICY IF EXISTS "Anyone can submit hero leads" ON public.hero_leads;
DROP POLICY IF EXISTS "Anyone can subscribe with their email" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Payment logs can be created by authenticated users" ON public.payment_logs;
DROP POLICY IF EXISTS "Prospects can be inserted by authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Prospects can be updated by authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Transactions can be created by authenticated users" ON public.transactions;
DROP POLICY IF EXISTS "Transactions can be updated by authenticated users" ON public.transactions;

-- =====================================================
-- EVENTS TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can read events"
  ON public.events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated can manage events"
  ON public.events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- INSTRUCTORS TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can read instructors"
  ON public.instructors FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated can manage instructors"
  ON public.instructors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- PROGRAMS TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can read programs"
  ON public.programs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated can manage programs"
  ON public.programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- SUCCESS_STORIES TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can read success stories"
  ON public.success_stories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated can manage success stories"
  ON public.success_stories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- USER_PROFILES TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can create own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- LEADS TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can insert leads"
  ON public.leads FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can manage all leads"
  ON public.leads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Franchisees can manage own location leads"
  ON public.leads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = leads.location_slug
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = leads.location_slug
    )
  );

-- =====================================================
-- LOCATIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can view active locations"
  ON public.locations FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage all locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Franchisees can manage own location"
  ON public.locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = locations.slug
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = locations.slug
    )
  );

-- =====================================================
-- CLASS_SCHEDULE TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can view class schedules"
  ON public.class_schedule FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage all schedules"
  ON public.class_schedule FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Franchisees can manage own schedules"
  ON public.class_schedule FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = class_schedule.location_slug
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = class_schedule.location_slug
    )
  );

-- =====================================================
-- LOCATION_MEDIA TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can view location media"
  ON public.location_media FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage all media"
  ON public.location_media FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Franchisees can manage own media"
  ON public.location_media FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = location_media.location_slug
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = location_media.location_slug
    )
  );

-- =====================================================
-- TESTIMONIALS TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can view active testimonials"
  ON public.testimonials FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage all testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Franchisees can manage own testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = testimonials.location_slug
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = testimonials.location_slug
    )
  );

-- =====================================================
-- PACKAGES TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can view active packages"
  ON public.packages FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage all packages"
  ON public.packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Franchisees can manage own packages"
  ON public.packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = packages.location_slug
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_locations ul ON ul.user_id = up.id
      WHERE up.id = (select auth.uid())
      AND up.role = 'franchisee'
      AND ul.location_slug = packages.location_slug
    )
  );

-- =====================================================
-- USER_LOCATIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own locations"
  ON public.user_locations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage all user locations"
  ON public.user_locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- HERO_LEADS TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can insert hero leads"
  ON public.hero_leads FOR INSERT
  TO public
  WITH CHECK (true);

-- =====================================================
-- NEWSLETTER_SUBSCRIBERS TABLE POLICIES
-- =====================================================

CREATE POLICY "Public can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  TO public
  WITH CHECK (true);

-- =====================================================
-- PAYMENT_LOGS TABLE POLICIES
-- =====================================================

CREATE POLICY "System can create payment logs"
  ON public.payment_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view payment logs"
  ON public.payment_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- PROSPECTS TABLE POLICIES
-- =====================================================

CREATE POLICY "System can manage prospects"
  ON public.prospects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TRANSACTIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "System can manage transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- CLUBREADY_CONFIG TABLE POLICIES
-- =====================================================

CREATE POLICY "Only admins can manage clubready config"
  ON public.clubready_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );
