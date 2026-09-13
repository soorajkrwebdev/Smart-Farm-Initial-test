import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workerService } from '../../services/workerService';
import { WorkerProfile } from '../../types';
import { WORKER_SKILL_OPTIONS } from '../../lib/constants';
import { formatINR } from '../../lib/utils';
import { Briefcase, MapPin, Star, ShieldCheck, CheckCircle2, Phone } from 'lucide-react';

export const WorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const data = await workerService.getWorkers({
        skill: selectedSkill !== 'all' ? selectedSkill : undefined,
      });
      setWorkers(data);
    }
    load();
  }, [selectedSkill]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Agricultural Worker Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Hire skilled arecanut climbers, pepper harvesters, tractor drivers, and experienced farm labour across Karnataka.
          </p>
        </div>
        <Link
          to="/farmer/jobs"
          className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          + Post a Farm Job
        </Link>
      </div>

      {/* Skill Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedSkill('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedSkill === 'all'
              ? 'bg-amber-900 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Skills
        </button>
        {WORKER_SKILL_OPTIONS.map((sk) => (
          <button
            key={sk}
            type="button"
            onClick={() => setSelectedSkill(sk)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSkill === sk
                ? 'bg-amber-900 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {sk}
          </button>
        ))}
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={worker.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop'}
                    alt={worker.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-amber-300 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-gray-900 text-base">{worker.name}</h3>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{worker.village_town}, {worker.district}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    worker.availability_status === 'available'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {worker.availability_status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Skills & Expertise:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(worker.skills || []).map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] block">Daily Rate:</span>
                  <span className="font-extrabold text-gray-900 text-sm">{formatINR(worker.daily_wage_rate)}/day</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Experience:</span>
                  <span className="font-bold text-gray-800">{worker.experience_years} Years</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{worker.rating || 4.9}</span>
                <span className="text-[10px] text-gray-400">({worker.reviews_count || 12})</span>
              </div>

              <a
                href={`tel:${worker.phone}`}
                className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Worker</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
