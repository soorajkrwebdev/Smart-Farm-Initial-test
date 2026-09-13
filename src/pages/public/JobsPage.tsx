import React, { useState, useEffect } from 'react';
import { workerService } from '../../services/workerService';
import { WorkerJob } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatINR, formatDate } from '../../lib/utils';
import { Briefcase, MapPin, Calendar, Clock, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<WorkerJob[]>([]);
  const { user } = useAuth();
  const [appliedJobId, setAppliedJobId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await workerService.getJobs({ status: 'open' });
      setJobs(data);
    }
    load();
  }, []);

  const handleApply = async (job: WorkerJob) => {
    if (!user) {
      alert('Please sign in as a worker to apply for jobs.');
      return;
    }
    try {
      await workerService.createApplication({
        job_id: job.id,
        worker_id: user.id,
        worker: user as any,
        status: 'applied',
        proposed_wage: job.daily_wage,
        notes: `Application from ${user.name} for ${job.title}`,
      });
      setAppliedJobId(job.id);
    } catch (e) {
      console.error('Failed to submit application:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Agricultural Jobs Board
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Browse verified farm requirements for arecanut climbing, pepper processing, weeding, and tractor work.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {job.work_type}
                  </span>
                  <h3 className="font-bold text-gray-900 text-base mt-1 leading-snug">{job.title}</h3>
                  <p className="text-xs text-gray-500 font-medium">Farm: {job.farmer_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-900">{formatINR(job.daily_wage)}</span>
                  <span className="text-[10px] text-gray-400 block">/day</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                {job.description}
              </p>

              <div className="p-3 bg-gray-50 rounded-2xl space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{job.village_town}, {job.district}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Starts: {formatDate(job.start_date)} ({job.duration_days} days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Needed: <strong>{job.workers_needed} workers</strong> ({job.workers_hired} hired)</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Required Skills:
                </span>
                <div className="flex flex-wrap gap-1">
                  {job.skills_required.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleApply(job)}
                disabled={appliedJobId === job.id}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  appliedJobId === job.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-800 hover:bg-amber-900 text-white shadow-xs'
                }`}
              >
                {appliedJobId === job.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Application Submitted!</span>
                  </>
                ) : (
                  <>
                    <span>Apply for this Job</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
