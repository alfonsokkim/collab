import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet, cacheDelete } from '../lib/cache';

const SOCIAL_PREFIXES: Record<string, string[]> = {
  instagram: ['https://www.instagram.com/', 'https://instagram.com/', 'instagram.com/'],
  facebook:  ['https://www.facebook.com/', 'https://facebook.com/', 'facebook.com/'],
  linkedin:  ['https://www.linkedin.com/in/', 'https://linkedin.com/in/', 'linkedin.com/in/',
               'https://www.linkedin.com/company/', 'https://linkedin.com/company/', 'linkedin.com/company/'],
  discord:   ['https://discord.gg/', 'https://discord.com/invite/', 'discord.gg/', 'discord.com/invite/'],
};

function stripSocialPrefix(field: keyof typeof SOCIAL_PREFIXES, value?: string): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  for (const prefix of SOCIAL_PREFIXES[field]) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return trimmed.slice(prefix.length).replace(/\/$/, '');
    }
  }
  return trimmed;
}

function normaliseSocials(profile: SocietyProfile): SocietyProfile {
  return {
    ...profile,
    instagram:  stripSocialPrefix('instagram', profile.instagram),
    facebook:   stripSocialPrefix('facebook',  profile.facebook),
    linkedin:   stripSocialPrefix('linkedin',  profile.linkedin),
    discordUrl: stripSocialPrefix('discord',   profile.discordUrl),
  };
}

export const UNIVERSITIES = [
  { id: 'UNSW', label: 'UNSW Sydney' },
  { id: 'USYD', label: 'University of Sydney' },
  { id: 'UTS',  label: 'UTS' },
  { id: 'MQ',   label: 'Macquarie University' },
  { id: 'WSU',  label: 'Western Sydney University' },
] as const;

export type UniversityId = typeof UNIVERSITIES[number]['id'];

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
  university?: string;
  createdAt?: string;
}

// Upload logo image blob to storage
export async function uploadLogoImage(blob: Blob, userId: string): Promise<string | null> {
  try {
    const fileName = `${userId}-logo-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('listing-banners')
      .upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });

    if (error) { console.error('Supabase upload error:', error); return null; }

    const { data: urlData } = supabase.storage.from('listing-banners').getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading logo image:', error);
    return null;
  }
}

// Get society profile by user ID
export async function getSocietyProfile(userId: string): Promise<SocietyProfile | null> {
  const cached = cacheGet<SocietyProfile>(`society:${userId}`);
  if (cached) return cached;

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

    const profile: SocietyProfile = {
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
      university: data.university,
      createdAt: data.created_at,
    };
    cacheSet(`society:${userId}`, profile);
    return profile;
  } catch (error) {
    console.error('Error in getSocietyProfile:', error);
    return null;
  }
}

// Create or update society profile
export async function saveSocietyProfile(userId: string, rawProfile: SocietyProfile, logoFile?: Blob): Promise<SocietyProfile | null> {
  const profile = normaliseSocials(rawProfile);
  try {
    let logoImageUrl = profile.logoImageUrl;
    if (logoFile) {
      logoImageUrl = (await uploadLogoImage(logoFile, userId)) || undefined;
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
          university: profile.university,
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

      cacheDelete(`society:${userId}`);
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
        university: data.university,
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
            university: profile.university,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating society profile:', error);
        throw error;
      }

      console.log('Create successful, returned data:', data);

      cacheDelete(`society:${userId}`);
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
        university: data.university,
        createdAt: data.created_at,
      };
    }
  } catch (error) {
    console.error('Error in saveSocietyProfile:', error);
    throw error;
  }
}
