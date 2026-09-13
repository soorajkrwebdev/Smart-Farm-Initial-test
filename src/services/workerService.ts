import { WorkerJob, WorkerApplication, WorkerProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { repository } from './storageService';

export const workerService = {
  async getJobs(params?: { farmerId?: string; district?: string; status?: string }): Promise<WorkerJob[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('worker_jobs').select('*');
      if (params?.farmerId) query = query.eq('farmer_id', params.farmerId);
      if (params?.district) query = query.eq('district', params.district);
      if (params?.status) query = query.eq('status', params.status);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as WorkerJob[];
    }

    let jobs = repository.getJobs();
    if (params?.farmerId) jobs = jobs.filter((j) => j.farmer_id === params.farmerId);
    if (params?.district) jobs = jobs.filter((j) => j.district === params.district);
    if (params?.status) jobs = jobs.filter((j) => j.status === params.status);
    return jobs;
  },

  async getJobById(id: string): Promise<WorkerJob | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('worker_jobs').select('*').eq('id', id).single();
      if (error) return undefined;
      return data as WorkerJob;
    }
    return repository.getJobs().find((j) => j.id === id);
  },

  async saveJob(job: Partial<WorkerJob>): Promise<WorkerJob> {
    if (!job.farmer_id) {
      throw new Error('Authentication required. Please sign in as a farmer before posting a job.');
    }
    if (!job.farmer_name) {
      throw new Error('Farmer profile name missing. Please complete your profile first.');
    }

    const fullJob: WorkerJob = {
      id: job.id || `job-${Date.now()}`,
      farmer_id: job.farmer_id,
      farmer_name: job.farmer_name,
      farmer_phone: job.farmer_phone || '',
      title: job.title || 'Agricultural Work Required',
      work_type: job.work_type || 'General Farm Labour',
      description: job.description || '',
      village_town: job.village_town || '',
      district: job.district || '',
      state: job.state || 'Karnataka',
      start_date: job.start_date || new Date().toISOString().slice(0, 10),
      start_time: job.start_time || '08:00 AM',
      duration_days: Number(job.duration_days) || 1,
      workers_needed: Number(job.workers_needed) || 1,
      workers_hired: job.workers_hired || 0,
      daily_wage: Number(job.daily_wage) || 0,
      skills_required: job.skills_required || [],
      status: job.status || 'open',
      applicant_count: job.applicant_count || 0,
      created_at: job.created_at || new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('worker_jobs').upsert(fullJob).select().single();
      if (error) throw error;
      return data as WorkerJob;
    }

    return repository.saveJob(fullJob);
  },

  async getApplications(params?: { workerId?: string; jobId?: string }): Promise<WorkerApplication[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('worker_applications').select('*, job:worker_jobs(*), worker:workers(*)');
      if (params?.workerId) query = query.eq('worker_id', params.workerId);
      if (params?.jobId) query = query.eq('job_id', params.jobId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as WorkerApplication[];
    }

    let apps = repository.getApplications();
    if (params?.workerId) apps = apps.filter((a) => a.worker_id === params.workerId);
    if (params?.jobId) apps = apps.filter((a) => a.job_id === params.jobId);
    // Populate job details
    const jobs = repository.getJobs();
    return apps.map((a) => ({
      ...a,
      job: jobs.find((j) => j.id === a.job_id),
    }));
  },

  async createApplication(app: Omit<WorkerApplication, 'id' | 'created_at' | 'updated_at'>): Promise<WorkerApplication> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('worker_applications').insert(app).select().single();
      if (error) throw error;
      return data as WorkerApplication;
    }
    return repository.createApplication(app);
  },

  async updateApplicationStatus(appId: string, status: WorkerApplication['status']): Promise<WorkerApplication | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('worker_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appId)
        .select()
        .single();
      if (error) throw error;
      return data as WorkerApplication;
    }
    return repository.updateApplicationStatus(appId, status);
  },

  async getWorkers(params?: { skill?: string; district?: string }): Promise<WorkerProfile[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('workers').select('*, profiles:profiles(*)');
      if (params?.district) query = query.eq('profiles.district', params.district);
      const { data, error } = await query;
      if (error) throw error;
      let workers = (data || []).map((row: any) => ({ ...(row.profiles || {}), ...row, id: row.id })) as WorkerProfile[];
      if (params?.skill) {
        workers = workers.filter((w) => (w.skills || []).some((s: string) => s.toLowerCase().includes(params!.skill!.toLowerCase())));
      }
      return workers;
    }

    const profiles = repository.getProfiles().filter((p) => p.role === 'worker') as WorkerProfile[];
    let filtered = profiles;
    if (params?.skill) {
      filtered = filtered.filter((w) => w.skills?.some((s) => s.toLowerCase().includes(params.skill!.toLowerCase())));
    }
    if (params?.district) {
      filtered = filtered.filter((w) => w.district === params.district);
    }
    return filtered;
  },
};
