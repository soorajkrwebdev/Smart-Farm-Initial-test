import { WorkerJob, WorkerApplication, WorkerProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { repository } from './storageService';
import { authService } from './authService';

async function addNotification(notif: {
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'market_price' | 'weather' | 'worker' | 'job' | 'system' | 'ai';
  link?: string;
}) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('notifications').insert({ ...notif, is_read: false });
    } catch (e) { /* ignore */ }
  } else {
    repository.addNotification({ ...notif, is_read: false });
  }
}

export const workerService = {
  async getJobs(params?: { farmerId?: string; district?: string; status?: string }): Promise<WorkerJob[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('worker_jobs').select('*');
      if (params?.farmerId) query = query.eq('farmer_id', params.farmerId);
      if (params?.district) query = query.eq('district', params.district);
      if (params?.status) query = query.eq('status', params.status);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.error('getJobs error:', error.message);
        return [];
      }
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
      const { data, error } = await supabase.from('worker_jobs').select('*').eq('id', id).maybeSingle();
      if (error || !data) return undefined;
      return data as WorkerJob;
    }
    return repository.getJobs().find((j) => j.id === id);
  },

  async saveJob(job: Partial<WorkerJob>): Promise<WorkerJob> {
    if (!job.farmer_id) {
      throw new Error('Authentication required. Please sign in as a farmer before posting a job.');
    }

    let farmer_name = job.farmer_name;
    let farmer_phone = job.farmer_phone;
    if ((!farmer_name || !farmer_phone) && isSupabaseConfigured && supabase) {
      const fp = await authService.getFarmerProfile(job.farmer_id);
      farmer_name = farmer_name || fp?.name || '';
      farmer_phone = farmer_phone || fp?.phone || '';
    }

    const fullJob: WorkerJob = {
      id: job.id || `job-${Date.now()}`,
      farmer_id: job.farmer_id,
      farmer_name: farmer_name || '',
      farmer_phone: farmer_phone || '',
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
      const { data, error } = await supabase
        .from('worker_jobs')
        .upsert(fullJob)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message || 'Failed to save job');
      if (!data) throw new Error('Job save returned no data');
      return data as WorkerJob;
    }

    return repository.saveJob(fullJob);
  },

  async getApplications(params?: { workerId?: string; jobId?: string }): Promise<WorkerApplication[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('worker_applications').select(`
          *,
          job:worker_jobs(*),
          worker:workers(*),
          worker_profile:profiles!worker_applications_worker_id_fkey(name, phone, district)
        `);
      if (params?.workerId) query = query.eq('worker_id', params.workerId);
      if (params?.jobId) query = query.eq('job_id', params.jobId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.error('getApplications error:', error.message);
        return [];
      }
      return ((data || []) as any[]).map((row) => {
        const wp = Array.isArray(row.worker_profile) ? row.worker_profile[0] : row.worker_profile;
        const w = Array.isArray(row.worker) ? row.worker[0] : row.worker;
        return {
          id: row.id,
          job_id: row.job_id,
          job: Array.isArray(row.job) ? row.job[0] : row.job,
          worker_id: row.worker_id,
          worker: wp ? { ...wp, ...w, id: wp.id } : undefined,
          status: row.status,
          proposed_wage: row.proposed_wage,
          notes: row.notes,
          created_at: row.created_at,
          updated_at: row.updated_at,
        } as WorkerApplication;
      });
    }

    let apps = repository.getApplications();
    if (params?.workerId) apps = apps.filter((a) => a.worker_id === params.workerId);
    if (params?.jobId) apps = apps.filter((a) => a.job_id === params.jobId);
    const jobs = repository.getJobs();
    return apps.map((a) => ({
      ...a,
      job: jobs.find((j) => j.id === a.job_id),
    }));
  },

  async createApplication(app: Omit<WorkerApplication, 'id' | 'created_at' | 'updated_at'>): Promise<WorkerApplication> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('worker_applications')
        .insert(app)
        .select()
        .maybeSingle();
      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already applied to this job.');
        }
        throw new Error(error.message || 'Failed to submit application');
      }
      if (!data) throw new Error('Application save returned no data');

      try {
        await supabase.rpc('increment_job_applicant_count', { job_id_param: app.job_id });
      } catch {
        const sb = supabase;
        await supabase.from('worker_jobs').select('applicant_count').eq('id', app.job_id).maybeSingle().then(async (res) => {
          if (res?.data) {
            const cur = Number(res.data.applicant_count) || 0;
            await sb?.from('worker_jobs').update({ applicant_count: cur + 1 }).eq('id', app.job_id);
          }
        });
      }

      const job = await this.getJobById(app.job_id);
      if (job) {
        await addNotification({
          user_id: job.farmer_id,
          title: 'Worker Applied to Job',
          message: `A worker applied to "${job.title}".`,
          type: 'worker',
          link: '/farmer/jobs',
        });
      }

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
        .maybeSingle();
      if (error) throw new Error(error.message || 'Failed to update application');
      if (!data) return undefined;

      if (status === 'accepted') {
        try {
          await supabase.rpc('increment_job_workers_hired', { job_id_param: data.job_id });
        } catch {
          const sb = supabase;
          await supabase.from('worker_jobs').select('workers_hired').eq('id', data.job_id).maybeSingle().then(async (res) => {
            if (res?.data) {
              const cur = Number(res.data.workers_hired) || 0;
              await sb?.from('worker_jobs').update({ workers_hired: cur + 1 }).eq('id', data.job_id);
            }
          });
        }
      }

      await addNotification({
        user_id: data.worker_id,
        title: `Job Application ${status.toUpperCase()}`,
        message: `Your application has been marked as ${status}.`,
        type: 'job',
        link: '/worker/applications',
      });

      return data as WorkerApplication;
    }
    return repository.updateApplicationStatus(appId, status);
  },

  async getWorkers(params?: { skill?: string; district?: string }): Promise<WorkerProfile[]> {
    const workers = await authService.getWorkers(params?.district ? { district: params.district } : undefined);
    if (params?.skill) {
      return workers.filter((w) => (w.skills || []).some((s: string) => s.toLowerCase().includes(params!.skill!.toLowerCase())));
    }
    return workers;
  },
};
