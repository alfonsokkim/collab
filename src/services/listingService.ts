import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePrefix } from '../lib/cache';

export interface ListingInput {
  title: string;
  description: string;
  date: string;
  peopleNeeded: number;
  tags: string[];
  bannerImage?: string;
  images?: string[];
}

export interface Listing extends ListingInput {
  id: string;
  userId: string;
  bannerImageUrl?: string;
  imageUrls?: string[];
  societyName: string;
  societyType?: string;
  createdAt: string;
}

// Convert base64 to blob
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uintArray = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uintArray[i] = raw.charCodeAt(i);
  }

  return new Blob([uintArray], { type: contentType });
}

// Upload banner image to storage
export async function uploadBannerImage(base64Image: string, listingId: string): Promise<string | null> {
  try {
    const blob = base64ToBlob(base64Image);

    const fileName = `${listingId}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('listing-banners')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('listing-banners')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading banner image:', error);
    return null;
  }
}

// Upload multiple images to storage
export async function uploadImages(base64Images: string[], listingId: string): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < base64Images.length; i++) {
    const url = await uploadBannerImage(base64Images[i], `${listingId}-img-${i}`);
    if (url) {
      uploadedUrls.push(url);
    }
  }

  return uploadedUrls;
}

// Create a new listing
export async function createListing(listing: ListingInput, societyName: string): Promise<Listing | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Upload images if provided
    let bannerImageUrl: string | null = null;
    let imageUrls: string[] = [];
    const tempListingId = `temp-${Date.now()}`;

    if (listing.images && listing.images.length > 0) {
      imageUrls = await uploadImages(listing.images, tempListingId);
      if (imageUrls.length > 0) {
        bannerImageUrl = imageUrls[0];
      }
    } else if (listing.bannerImage) {
      // Fallback for backward compatibility with single banner image
      bannerImageUrl = await uploadBannerImage(listing.bannerImage, tempListingId);
      if (bannerImageUrl) {
        imageUrls = [bannerImageUrl];
      }
    }

    // Create listing in database
    const { data, error } = await supabase
      .from('listings')
      .insert([
        {
          user_id: userData.user.id,
          title: listing.title,
          description: listing.description,
          date: listing.date,
          people_needed: listing.peopleNeeded,
          tags: listing.tags,
          banner_image_url: bannerImageUrl,
          image_urls: imageUrls,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      throw error;
    }

    cacheDelete('listings:all');
    cacheDeletePrefix('listings:user:');

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      date: data.date,
      peopleNeeded: data.people_needed,
      tags: data.tags,
      bannerImageUrl: data.banner_image_url,
      imageUrls: data.image_urls || [],
      societyName,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error in createListing:', error);
    throw error;
  }
}

// Fetch all listings with society names
export async function fetchListings(): Promise<Listing[]> {
  const cached = cacheGet<Listing[]>('listings:all');
  if (cached) return cached;

  try {
    // First fetch listings with all data
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      throw listingsError;
    }

    if (!listings || listings.length === 0) {
      return [];
    }

    // Get unique user IDs from listings
    const userIds = [...new Set(listings.map((l: any) => l.user_id))];

    // Fetch society data for those users
    const { data: societies, error: societiesError } = await supabase
      .from('societies')
      .select('user_id, name, society_type')
      .in('user_id', userIds);

    if (societiesError) {
      console.error('Error fetching societies:', societiesError);
    }

    // Create maps of user_id to society data
    const societyNameMap = new Map((societies || []).map((s: any) => [s.user_id, s.name]));
    const societyTypeMap = new Map((societies || []).map((s: any) => [s.user_id, s.society_type]));

    // Combine listings with society data
    const result = listings.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      date: item.date,
      peopleNeeded: item.people_needed,
      tags: item.tags,
      bannerImageUrl: item.banner_image_url,
      imageUrls: item.image_urls || [],
      societyName: societyNameMap.get(item.user_id) || 'Unknown Society',
      societyType: societyTypeMap.get(item.user_id) || undefined,
      createdAt: item.created_at,
    }));
    cacheSet('listings:all', result);
    return result;
  } catch (error) {
    console.error('Error in fetchListings:', error);
    return [];
  }
}

// Fetch a single listing by ID with society name
export async function fetchListingById(listingId: string): Promise<Listing | null> {
  const cached = cacheGet<Listing>(`listing:${listingId}`);
  if (cached) return cached;

  try {
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (listingError) {
      console.error('Error fetching listing:', listingError);
      return null;
    }

    if (!listing) {
      return null;
    }

    // Fetch society data for this user
    const { data: society, error: societyError } = await supabase
      .from('societies')
      .select('name, society_type')
      .eq('user_id', listing.user_id)
      .single();

    if (societyError && societyError.code !== 'PGRST116') {
      console.error('Error fetching society:', societyError);
    }

    // Ensure imageUrls is an array
    let imageUrls = listing.image_urls || [];
    if (typeof imageUrls === 'string') {
      try {
        imageUrls = JSON.parse(imageUrls);
      } catch {
        imageUrls = [];
      }
    }
    if (!Array.isArray(imageUrls)) {
      imageUrls = [];
    }

    console.log('Fetched listing imageUrls:', imageUrls);

    const result: Listing = {
      id: listing.id,
      userId: listing.user_id,
      title: listing.title,
      description: listing.description,
      date: listing.date,
      peopleNeeded: listing.people_needed,
      tags: listing.tags,
      bannerImageUrl: listing.banner_image_url,
      imageUrls: imageUrls,
      societyName: society?.name || 'Unknown Society',
      societyType: society?.society_type || undefined,
      createdAt: listing.created_at,
    };
    cacheSet(`listing:${listingId}`, result);
    return result;
  } catch (error) {
    console.error('Error in fetchListingById:', error);
    return null;
  }
}

// Update a listing
export async function updateListing(listingId: string, updates: Partial<ListingInput> & { bannerImage?: string; images?: string[] }): Promise<Listing | null> {
  try {
    let imageUrls: string[] | undefined = undefined;
    let bannerImageUrl: string | undefined = undefined;

    // Upload new images if provided
    if (updates.images && updates.images.length > 0) {
      // Filter out existing URLs (they start with http) from newly uploaded base64 images
      const newImages = updates.images.filter(img => img.startsWith('data:'));
      if (newImages.length > 0) {
        const uploadedUrls = await uploadImages(newImages, listingId);
        // Combine with existing URLs
        const existingUrls = updates.images.filter(img => !img.startsWith('data:'));
        imageUrls = [...existingUrls, ...uploadedUrls];
        if (imageUrls.length > 0) {
          bannerImageUrl = imageUrls[0];
        }
      }
    } else if (updates.bannerImage && updates.bannerImage.startsWith('data:')) {
      // Fallback for backward compatibility with single banner image
      bannerImageUrl = (await uploadBannerImage(updates.bannerImage, listingId)) || undefined;
    }

    const updateData: any = {
      title: updates.title,
      description: updates.description,
      date: updates.date,
      people_needed: updates.peopleNeeded,
      tags: updates.tags,
      updated_at: new Date().toISOString(),
    };

    // Only update banner_image_url if a new image was provided
    if (bannerImageUrl !== undefined) {
      updateData.banner_image_url = bannerImageUrl;
    }

    // Only update image_urls if images were modified
    if (imageUrls !== undefined) {
      updateData.image_urls = imageUrls;
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing:', error);
      throw error;
    }

    // Fetch society data
    const { data: society } = await supabase
      .from('societies')
      .select('name')
      .eq('user_id', data.user_id)
      .single();

    cacheDelete(`listing:${listingId}`, 'listings:all');
    cacheDeletePrefix(`listings:user:`);

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      date: data.date,
      peopleNeeded: data.people_needed,
      tags: data.tags,
      bannerImageUrl: data.banner_image_url,
      imageUrls: data.image_urls || [],
      societyName: society?.name || 'Unknown Society',
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error in updateListing:', error);
    return null;
  }
}

// Fetch listings by user ID
export async function fetchListingsByUserId(userId: string): Promise<Listing[]> {
  const cached = cacheGet<Listing[]>(`listings:user:${userId}`);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching listings by user:', error);
      return [];
    }

    const { data: society } = await supabase
      .from('societies')
      .select('name')
      .eq('user_id', userId)
      .single();

    const result = (data || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      date: item.date,
      peopleNeeded: item.people_needed,
      tags: item.tags,
      bannerImageUrl: item.banner_image_url,
      imageUrls: item.image_urls || [],
      societyName: society?.name || 'Unknown Society',
      createdAt: item.created_at,
    }));
    cacheSet(`listings:user:${userId}`, result);
    return result;
  } catch (error) {
    console.error('Error in fetchListingsByUserId:', error);
    return [];
  }
}

// Delete a listing
export async function deleteListing(listingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }

    cacheDelete(`listing:${listingId}`, 'listings:all');
    cacheDeletePrefix('listings:user:');
    return true;
  } catch (error) {
    console.error('Error in deleteListing:', error);
    return false;
  }
}
