import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workerService } from '../../services/workerService';
import { WorkerJob, WorkerApplication } from '../../types';
import { WORKER_SKILL_OPTIONS } from '../../lib/constants';
import { formatINR, formatDate } from '../../lib/utils';
import { 
  Briefcase, 
  PlusCircle, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MapPin, 
  Clock,
  Phone
} from 'lucide-react';

export const FarmerJobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<WorkerJob[]>([]);
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  // New Job Form State
  const [title, setTitle] = useState('');
  const [workType, setWorkType] = useState('Harvesting');
  const [description, setDescription] = useState('');
  const [workersNeeded, setWorkersNeeded] = useState('4');
  const [dailyWage, setDailyWage] = useState('850');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [durationDays, setDurationDays] = useState('3');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Arecanut Tree Climbing']);

  const loadData = async () => {
    if (user) {
      const j = await workerService.getJobs({ farmerId: user.id });
      setJobs(j);
      const apps = await workerService.getApplications();
      setApplications(apps);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await workerService.saveJob({
      farmer_id: user.id,
      farmer_name: user.name,
      farmer_phone: user.phone,
      title,
      work_type: workType,
      description,
      village_town: user.village_town || 'Sullia',
      district: user.district || 'Dakshina Kannada',
      state: user.state || 'Karnataka',
      start_date: startDate,
      duration_days: Number(durationDays),
      workers_needed: Number(workersNeeded),
      daily_wage: Number(dailyWage),
      skills_required: selectedSkills,
      status: 'open',
    });

    setShowNewJobModal(false);
    loadData();
  };

  const handleApplicationStatus = async (appId: string, status: WorkerApplication['status']) => {
    await workerService.updateApplicationStatus(appId, status);
    loadData();
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-950">Farm Labour & Jobs Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Post seasonal harvesting and plantation requirements and review skilled applicant responses.
          </p>
        </div>

        <button
          onClick={() => setShowNewJobModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Post Farm Job</span>
        </button>
      </div>

      {/* Active Posted Jobs */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Your Posted Jobs</h2>
        {jobs.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-gray-200 text-xs text-gray-500">
            No active jobs posted. Post your requirements for arecanut climbing, pepper picking, or tractor work.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const jobApps = applications.filter((a) => a.job_id === job.id);
              return (
                <div key={job.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {job.work_type}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base mt-1">{job.title}</h3>
                      <p className="text-xs text-gray-500">{job.village_town}, {job.district}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-amber-950">{formatINR(job.daily_wage)}</span>
                      <span className="text-[10px] text-gray-400 block">/day</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2">{job.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Duration:</span>
                      <span className="font-semibold text-gray-800">{job.duration_days} Days (Starts {formatDate(job.start_date)})</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Slots:</span>
                      <span className="font-semibold text-emerald-800">
                        {job.workers_hired} / {job.workers_needed} Hired
                      </span>
                    </div>
                  </div>

                  {/* Applicants List */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <h4 className="text-xs font-bold text-gray-800">
                      Applicants ({jobApps.length})
                    </h4>
                    {jobApps.length === 0 ? (
                      <p className="text-[11px] text-gray-400">Waiting for workers to apply...</p>
                    ) : (
                      <div className="space-y-2">
                        {jobApps.map((app) => (
                          <div
                            key={app.id}
                            className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                                <span>{app.worker?.name || 'Worker'}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  app.status === 'accepted' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500">
                                Wage: <strong>₹{app.proposed_wage || job.daily_wage}/day</strong> • {app.worker?.experience_years || 5} yrs exp
                              </p>
                              {app.notes && <p className="text-[10px] text-gray-600 italic">"{app.notes}"</p>}
                            </div>

                            <div className="flex items-center gap-1">
                              {app.status === 'applied' && (
                                <>
                                  <button
                                    onClick={() => handleApplicationStatus(app.id, 'accepted')}
                                    className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs"
                                    title="Accept Worker"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleApplicationStatus(app.id, 'rejected')}
                                    className="p-1.5 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <a
                                href="tel:+919740198765"
                                className="p-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100"
                                title="Call Worker"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900">Post Agricultural Job Requirement</h3>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arecanut Harvesting & Bunch Lowering"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Work Type *</label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    <option value="Harvesting">Harvesting</option>
                    <option value="Spraying">Spraying</option>
                    <option value="Weeding & Maintenance">Weeding & Maintenance</option>
                    <option value="Machine Operation">Machine Operation</option>
                    <option value="General Labour">General Labour</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Daily Wage (₹/day) *</label>
                  <input
                    type="number"
                    required
                    value={dailyWage}
                    onChange={(e) => setDailyWage(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Workers Needed</label>
                  <input
                    type="number"
                    min="1"
                    value={workersNeeded}
                    onChange={(e) => setWorkersNeeded(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Required Skills</label>
                <div className="flex flex-wrap gap-1">
                  {WORKER_SKILL_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSkill(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                        selectedSkills.includes(s)
                          ? 'bg-amber-800 text-white border-amber-800'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      {selectedSkills.includes(s) ? `✓ ${s}` : `+ ${s}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Work Description & Facilities Provided</label>
                <textarea
                  rows={3}
                  placeholder="Mention meal arrangements, safety equipment, palm height, acreage..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="px-4 py-2 text-gray-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Publish Farm Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
