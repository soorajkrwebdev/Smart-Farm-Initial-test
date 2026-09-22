import { UserProfile, FarmerProfile, ConsumerProfile, WorkerProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { repository } from './storageService';

async function createRoleSpecificProfile(
  userId: string,
  profileData: Partial<UserProfile> & { password?: string }
): Promise<void> {
  if (!supabase) return;

  const role = profileData.role || 'consumer';

  if (role === 'farmer') {
    const { error } = await supabase.from('farmers').insert({
      id: userId,
      farm_name: (profileData as any).farm_name || `${profileData.name || 'Farmer'}'s Agro Estate`,
      farm_size_acres: Number((profileData as any).farm_size_acres) || 0,
      primary_crops: (profileData as any).primary_crops || [],
      organic_certified: Boolean((profileData as any).organic_certified),
      fpo_member: Boolean((profileData as any).fpo_member),
      fpo_name: (profileData as any).fpo_name || '',
      bio: (profileData as any).bio || '',
    });
    if (error) throw error;
  } else if (role === 'consumer') {
    const { error } = await supabase.from('consumers').insert({
      id: userId,
      delivery_preference: (profileData as any).delivery_preference || 'both',
      default_delivery_address: (profileData as any).default_delivery_address || '',
    });
    if (error) throw error;
  } else if (role === 'worker') {
    const { error } = await supabase.from('workers').insert({
      id: userId,
      skills: (profileData as any).skills || [],
      experience_years: Number((profileData as any).experience_years) || 0,
      daily_wage_rate: Number((profileData as any).daily_wage_rate) || 0,
      languages: (profileData as any).languages || ['Kannada'],
    });
    if (error) throw error;
  }
}

function mergeRoleData(profile: any, roleRow: any): UserProfile {
  if (!roleRow) return profile as UserProfile;
  const { id: _rid, created_at: _rca, ...rest } = roleRow || {};
  return { ...profile, ...rest } as UserProfile;
}

async function getHydratedProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (pError || !profile) {
    console.error('Failed to load profile:', pError?.message);
    return null;
  }

  const role = profile.role;
  let roleRow: any = null;

  try {
    if (role === 'farmer') {
      const { data } = await supabase.from('farmers').select('*').eq('id', userId).maybeSingle();
      roleRow = data;
    } else if (role === 'consumer') {
      const { data } = await supabase.from('consumers').select('*').eq('id', userId).maybeSingle();
      roleRow = data;
    } else if (role === 'worker') {
      const { data } = await supabase.from('workers').select('*').eq('id', userId).maybeSingle();
      roleRow = data;
    }
  } catch (rErr: any) {
    console.warn('Role row load failed:', rErr?.message);
  }

  return mergeRoleData(profile, roleRow);
}

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        return await getHydratedProfile(session.user.id);
      } catch (err) {
        console.error('getCurrentUser error:', err);
        return null;
      }
    }
    
    return repository.getActiveUser();
  },

  async getFarmerProfile(farmerId: string): Promise<FarmerProfile | undefined> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, farmers(*)')
          .eq('id', farmerId)
          .eq('role', 'farmer')
          .single();
        if (error || !data) return undefined;
        const { farmers, ...profile } = data as any;
        const farmer = Array.isArray(farmers) ? farmers[0] : farmers;
        return mergeRoleData(profile, farmer) as FarmerProfile;
      } catch (err) {
        return undefined;
      }
    }
    return repository.getProfileById(farmerId) as FarmerProfile | undefined;
  },

  async getWorkerProfile(workerId: string): Promise<WorkerProfile | undefined> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, workers(*)')
          .eq('id', workerId)
          .eq('role', 'worker')
          .single();
        if (error || !data) return undefined;
        const { workers, ...profile } = data as any;
        const worker = Array.isArray(workers) ? workers[0] : workers;
        return mergeRoleData(profile, worker) as WorkerProfile;
      } catch (err) {
        return undefined;
      }
    }
    return repository.getProfileById(workerId) as WorkerProfile | undefined;
  },

  async getConsumerProfile(consumerId: string): Promise<ConsumerProfile | undefined> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, consumers(*)')
          .eq('id', consumerId)
          .eq('role', 'consumer')
          .single();
        if (error || !data) return undefined;
        const { consumers, ...profile } = data as any;
        const consumer = Array.isArray(consumers) ? consumers[0] : consumers;
        return mergeRoleData(profile, consumer) as ConsumerProfile;
      } catch (err) {
        return undefined;
      }
    }
    return repository.getProfileById(consumerId) as ConsumerProfile | undefined;
  },

  async getFarmers(params?: { district?: string }): Promise<FarmerProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('profiles')
          .select('*, farmers(*)')
          .eq('role', 'farmer');
        if (params?.district) query = query.eq('district', params.district);
        const { data, error } = await query;
        if (error) return [];
        return ((data || []) as any[]).map((row) => {
          const { farmers, ...profile } = row;
          const farmer = Array.isArray(farmers) ? farmers[0] : farmers;
          return mergeRoleData(profile, farmer) as FarmerProfile;
        });
      } catch (err) {
        return [];
      }
    }
    return repository.getProfiles().filter((p) => p.role === 'farmer') as FarmerProfile[];
  },

  async getWorkers(params?: { district?: string }): Promise<WorkerProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('profiles')
          .select('*, workers(*)')
          .eq('role', 'worker');
        if (params?.district) query = query.eq('district', params.district);
        const { data, error } = await query;
        if (error) return [];
        return ((data || []) as any[]).map((row) => {
          const { workers, ...profile } = row;
          const worker = Array.isArray(workers) ? workers[0] : workers;
          return mergeRoleData(profile, worker) as WorkerProfile;
        });
      } catch (err) {
        return [];
      }
    }
    return repository.getProfiles().filter((p) => p.role === 'worker') as WorkerProfile[];
  },

  async login(email: string, _password: string): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password: _password 
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials') || error.status === 400) {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw new Error(error.message || 'Login failed');
      }
      
      if (!data.user) {
        throw new Error('Login failed: No user returned');
      }

      const profile = await getHydratedProfile(data.user.id);
      if (!profile) {
        throw new Error('User profile not found. Please contact support.');
      }
      
      return profile;
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
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: profileData.email,
          password: profileData.password,
          options: {
            data: {
              name: profileData.name,
              role: profileData.role,
            },
          },
        });
        
        if (authError) {
          if (authError.message.includes('already registered') || authError.status === 409) {
            throw new Error('This email is already registered. Please sign in instead.');
          }
          throw new Error(authError.message || 'Signup failed');
        }
        
        if (!authData.user) {
          throw new Error('User creation failed');
        }

        const fullProfile: UserProfile = {
          id: authData.user.id,
          name: profileData.name || 'Farmlynq User',
          email: profileData.email,
          phone: profileData.phone || '',
          role: profileData.role || 'consumer',
          avatar_url: profileData.avatar_url,
          state: profileData.state || 'Karnataka',
          district: profileData.district || 'Dakshina Kannada',
          village_town: profileData.village_town || 'Sullia',
          pincode: profileData.pincode,
          verification_status: 'unverified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(fullProfile);
        
        if (profileError) {
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        await createRoleSpecificProfile(authData.user.id, profileData);

        return await getHydratedProfile(authData.user.id) || fullProfile;
      } catch (err: any) {
        const message = err.message || 'Registration failed. Please try again.';
        throw new Error(message);
      }
    }

    const existing = repository.getProfiles().find((p) => p.email.toLowerCase() === (profileData.email || '').toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists. Please sign in.');
    }

    const fullProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      name: profileData.name || 'New Member',
      email: profileData.email || `user${Date.now()}@farmlynq.in`,
      phone: profileData.phone || '+91 98000 00000',
      role: profileData.role || 'consumer',
      avatar_url: profileData.avatar_url || null,
      state: profileData.state || 'Karnataka',
      district: profileData.district || 'Dakshina Kannada',
      village_town: profileData.village_town || 'Sullia',
      pincode: profileData.pincode || '574239',
      verification_status: 'unverified',
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
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    repository.setActiveUser(null);
  },
};
