# Supabase Setup Guide

## Create Listings Table

Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query):

```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  people_needed INTEGER NOT NULL,
  tags TEXT[] NOT NULL,
  banner_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view listings" ON listings
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" ON listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" ON listings
  FOR DELETE USING (auth.uid() = user_id);
```

## Create Societies Table

```sql
CREATE TABLE societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  members_count INTEGER DEFAULT 0,
  founded_year INTEGER,
  instagram TEXT,
  discord_url TEXT,
  facebook TEXT,
  linkedin TEXT,
  logo_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_societies_user_id ON societies(user_id);

-- Enable Row Level Security
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view societies" ON societies
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own society" ON societies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own society" ON societies
  FOR UPDATE USING (auth.uid() = user_id);
```

## Create Storage Bucket for Banner Images

1. Go to Supabase Dashboard > Storage
2. Click "Create a new bucket"
3. Name it: `listing-banners`
4. Make it **Public** (uncheck "Private bucket")
5. Click Create

Then run this SQL to set storage policies:

```sql
-- Allow public reads
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-banners');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-banners' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-banners' 
    AND auth.uid() = owner
  );
```
