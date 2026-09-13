import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { repository } from './storageService';

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      return profile as UserProfile;
    }
    return repository.getActiveUser();
  },

  async login(email: string, _password: string): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: _password });
      if (error) throw error;
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (pError) throw pError;
      return profile as UserProfile;
    }

    const profiles = repository.getProfiles();
    const matched = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      throw new Error('No account found with this email. Please register first.');
    }
    repository.setActiveUser(matched);
    return matched;
  },

  async register(profileData: Partial<UserProfile> & { password?: string }): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase && profileData.email && profileData.password) {
      const { data, error } = await supabase.auth.signUp({
        email: profileData.email,
        password: profileData.password,
        options: {
          data: {
            name: profileData.name,
            role: profileData.role,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('User creation failed');

      const fullProfile: UserProfile = {
        id: data.user.id,
        name: profileData.name || 'Smart Farmer',
        email: profileData.email,
        phone: profileData.phone || '',
        role: profileData.role || 'consumer',
        state: profileData.state || 'Karnataka',
        district: profileData.district || 'Dakshina Kannada',
        village_town: profileData.village_town || 'Sullia',
        pincode: profileData.pincode,
        verification_status: 'phone_verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: pError } = await supabase.from('profiles').insert(fullProfile);
      if (pError) throw pError;
      return fullProfile;
    }

    const existing = repository.getProfiles().find((p) => p.email.toLowerCase() === (profileData.email || '').toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists. Please sign in.');
    }

    const fullProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      name: profileData.name || 'New Member',
      email: profileData.email || `user${Date.now()}@smartfarm.in`,
      phone: profileData.phone || '+91 98000 00000',
      role: profileData.role || 'consumer',
      avatar_url: profileData.avatar_url || null,
      state: profileData.state || 'Karnataka',
      district: profileData.district || 'Dakshina Kannada',
      village_town: profileData.village_town || 'Sullia',
      pincode: profileData.pincode || '574239',
      verification_status: 'phone_verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(profileData.role === 'farmer' && {
        farm_name: (profileData as any).farm_name || `${profileData.name || 'Member'}'s Agro Estate`,
        farm_size_acres: Number((profileData as any).farm_size_acres) || 0,
        primary_crops: (profileData as any).primary_crops || [],
        organic_certified: Boolean((profileData as any).organic_certified),
        fpo_member: Boolean((profileData as any).fpo_member),
        fpo_name: (profileData as any).fpo_name || '',
        bio: (profileData as any).bio || '',
        rating: 5.0,
        reviews_count: 0,
      }),
      ...(profileData.role === 'worker' && {
        skills: (profileData as any).skills || [],
        experience_years: Number((profileData as any).experience_years) || 0,
        daily_wage_rate: Number((profileData as any).daily_wage_rate) || 0,
        availability_status: 'available',
        languages: ['Kannada'],
        rating: 5.0,
        reviews_count: 0,
      }),
      ...(profileData.role === 'consumer' && {
        delivery_preference: (profileData as any).delivery_preference || 'both',
        default_delivery_address: (profileData as any).default_delivery_address || '',
      }),
    } as UserProfile;

    repository.saveProfile(fullProfile);
    repository.setActiveUser(fullProfile);
    return fullProfile;
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    repository.setActiveUser(null);
  },
};
