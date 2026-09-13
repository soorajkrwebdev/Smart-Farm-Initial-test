import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workerService } from '../../services/workerService';
import { WorkerApplication } from '../../types';
import { formatINR, formatDate } from '../../lib/utils';
import { ClipboardList, CheckCircle2, Clock, XCircle, MapPin, Calendar, Phone } from 'lucide-react';

export const WorkerApplications: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user) {
        const apps = await workerService.getApplications({ workerId: user.id });
        setApplications(apps);
      }
      setIsLoading(false);
    }
    load();
  }, [user]);

  const getStatusBadge = (status: WorkerApplication['status']) => {
    switch (status) {
      case 'accepted':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Hired by Farmer</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Not Selected</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Applied (Under Review)</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-950">My Job Applications</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Track responses from farmers for your agricultural work and climbing applications.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200 text-gray-500 space-y-2 max-w-md mx-auto">
          <ClipboardList className="w-10 h-10 mx-auto text-gray-400" />
          <p className="font-bold text-gray-800">No applications submitted yet.</p>
          <p className="text-xs">Browse the jobs board to apply for nearby farm harvesting gigs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-gray-900">{app.job?.title || 'Farm Harvest Job'}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Farmer: <strong>{app.job?.farmer_name || 'Verified Farmer'}</strong> • Applied on {formatDate(app.created_at)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-amber-950">
                    {formatINR(app.proposed_wage || app.job?.daily_wage || 850)}
                  </span>
                  <span className="text-[10px] text-gray-400 block">/day</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{app.job?.village_town}, {app.job?.district}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Starts: {app.job?.start_date ? formatDate(app.job.start_date) : 'Flexible'} ({app.job?.duration_days || 1} Days)</span>
                </div>
              </div>

              {app.status === 'accepted' && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-semibold">
                    Contact farmer to coordinate morning reporting time:
                  </span>
                  <a
                    href="tel:+919845012345"
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Farmer</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
