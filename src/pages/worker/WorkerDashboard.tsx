import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workerService } from '../../services/workerService';
import { WorkerJob, WorkerApplication } from '../../types';
import { formatINR, formatDate } from '../../lib/utils';
import { Briefcase, ClipboardList, DollarSign, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

export const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [nearbyJobs, setNearbyJobs] = useState<WorkerJob[]>([]);
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    async function load() {
      if (user) {
        const [jobs, apps] = await Promise.all([
          workerService.getJobs({ district: user.district || 'Dakshina Kannada', status: 'open' }),
          workerService.getApplications({ workerId: user.id }),
        ]);
        setNearbyJobs(jobs.slice(0, 3));
        setApplications(apps);
      }
    }
    load();
  }, [user]);

  const acceptedApps = applications.filter((a) => a.status === 'accepted');
  const estimatedEarnings = acceptedApps.reduce((sum, a) => sum + (a.proposed_wage || 850) * (a.job?.duration_days || 1), 0);

  return (
    <div className="space-y-8">
      {/* Worker Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Accepted Work Days</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-gray-900">{acceptedApps.length}</p>
          <span className="text-[11px] text-emerald-700 font-bold block pt-1">
            Confirmed harvest assignments
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Active Applications</span>
            <ClipboardList className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl font-black text-gray-900">{applications.length}</p>
          <Link to="/worker/applications" className="text-[11px] text-blue-700 font-bold hover:underline block pt-1">
            View application statuses &rarr;
          </Link>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Estimated Earnings</span>
            <DollarSign className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-amber-950">{formatINR(estimatedEarnings)}</p>
          <span className="text-[11px] text-gray-400 block pt-1">From accepted assignments</span>
        </div>
      </div>

      {/* Availability Status Card */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Your Farm Work Availability
          </h3>
          <p className="text-xs text-gray-500">Farmers in {user?.district || 'Karnataka'} will see you in worker searches</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAvailable(!isAvailable)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            isAvailable
              ? 'bg-emerald-700 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {isAvailable ? '✓ Marked Available' : 'Marked Busy'}
        </button>
      </div>

      {/* Nearby Jobs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Harvest & Farm Jobs Near You</h2>
          <Link to="/worker/jobs" className="text-xs font-bold text-amber-800 hover:underline">
            View All Jobs &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nearbyJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {job.work_type}
                </span>
                <h4 className="font-bold text-gray-900 text-sm mt-1">{job.title}</h4>
                <p className="text-xs text-gray-500">{job.village_town}, {job.district}</p>
                <div className="mt-2 text-xs font-black text-amber-950">
                  {formatINR(job.daily_wage)}/day • {job.duration_days} Days
                </div>
              </div>

              <Link
                to="/worker/jobs"
                className="w-full py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold text-center block transition-colors"
              >
                View & Apply
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
