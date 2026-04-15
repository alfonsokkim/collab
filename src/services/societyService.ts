import { supabase } from '../lib/supabase';

export const SOCIETY_TYPES = [
  'Faculty',
  'Hobby',
  'Business',
  'Sports',
  'Cultural',
  'Tech',
  'Arts',
  'Community',
  'Professional',
  'Environment',
] as const;

export type SocietyType = typeof SOCIETY_TYPES[number];

export interface SocietyProfile {
  id?: string;
  userId?: string;
  name: string;
  description?: string;
  membersCount?: number;
  foundedYear?: number;
  societyType?: SocietyType | string;
  instagram?: string;
  discordUrl?: string;
  facebook?: string;
  linkedin?: string;
  logoImageUrl?: string;
  createdAt?: string;
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

// Upload logo image to storage
export async function uploadLogoImage(base64Image: string, userId: string): Promise<string | null> {
  try {
    console.log('Starting logo upload for user:', userId);
    const blob = base64ToBlob(base64Image);
    console.log('Blob created:', blob.size, 'bytes');

    const fileName = `${userId}-logo-${Date.now()}.jpg`;
    console.log('Uploading to:', fileName);

    const { data, error } = await supabase.storage
      .from('listing-banners')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    console.log('Upload successful, file path:', data.path);

    const { data: urlData } = supabase.storage
      .from('listing-banners')
      .getPublicUrl(data.path);

    console.log('Generated public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading logo image:', error);
    return null;
  }
}

// Get society profile by user ID
export async function getSocietyProfile(userId: string): Promise<SocietyProfile | null> {
  try {
    const { data, error } = await supabase
      .from('societies')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which is expected for new users
      console.error('Error fetching society profile:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      membersCount: data.members_count,
      foundedYear: data.founded_year,
      societyType: data.society_type,
      instagram: data.instagram,
      discordUrl: data.discord_url,
      facebook: data.facebook,
      linkedin: data.linkedin,
      logoImageUrl: data.logo_image_url,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error in getSocietyProfile:', error);
    return null;
  }
}

// Create or update society profile
export async function saveSocietyProfile(userId: string, profile: SocietyProfile): Promise<SocietyProfile | null> {
  try {
    // Upload logo if provided
    let logoImageUrl = profile.logoImageUrl;
    if (profile.logoImageUrl && profile.logoImageUrl.startsWith('data:')) {
      console.log('Logo image is base64, uploading...');
      logoImageUrl = (await uploadLogoImage(profile.logoImageUrl, userId)) || undefined;
      console.log('Upload result - logoImageUrl:', logoImageUrl);
    } else if (profile.logoImageUrl) {
      console.log('Logo image is already a URL, keeping:', logoImageUrl);
    }

    // Check if profile exists
    const existing = await getSocietyProfile(userId);

    if (existing) {
      // Update existing profile
      console.log('Updating existing profile with logoImageUrl:', logoImageUrl);
      const { data, error } = await supabase
        .from('societies')
        .update({
          name: profile.name,
          description: profile.description,
          members_count: profile.membersCount,
          founded_year: profile.foundedYear,
          society_type: profile.societyType,
          instagram: profile.instagram,
          discord_url: profile.discordUrl,
          facebook: profile.facebook,
          linkedin: profile.linkedin,
          logo_image_url: logoImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating society profile:', error);
        throw error;
      }

      console.log('Update successful, returned data:', data);

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        membersCount: data.members_count,
        foundedYear: data.founded_year,
        societyType: data.society_type,
        instagram: data.instagram,
        discordUrl: data.discord_url,
        facebook: data.facebook,
        linkedin: data.linkedin,
        logoImageUrl: data.logo_image_url,
        createdAt: data.created_at,
      };
    } else {
      // Create new profile
      console.log('Creating new profile with logoImageUrl:', logoImageUrl);
      const { data, error } = await supabase
        .from('societies')
        .insert([
          {
            user_id: userId,
            name: profile.name,
            description: profile.description,
            members_count: profile.membersCount || 0,
            founded_year: profile.foundedYear,
            society_type: profile.societyType,
            instagram: profile.instagram,
            discord_url: profile.discordUrl,
            facebook: profile.facebook,
            linkedin: profile.linkedin,
            logo_image_url: logoImageUrl,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating society profile:', error);
        throw error;
      }

      console.log('Create successful, returned data:', data);

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        membersCount: data.members_count,
        foundedYear: data.founded_year,
        societyType: data.society_type,
        instagram: data.instagram,
        discordUrl: data.discord_url,
        facebook: data.facebook,
        linkedin: data.linkedin,
        logoImageUrl: data.logo_image_url,
        createdAt: data.created_at,
      };
    }
  } catch (error) {
    console.error('Error in saveSocietyProfile:', error);
    throw error;
  }
}
