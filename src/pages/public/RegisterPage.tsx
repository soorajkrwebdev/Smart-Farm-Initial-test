import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { KARNATAKA_LOCATIONS, WORKER_SKILL_OPTIONS } from '../../lib/constants';
import { ShoppingCart, Briefcase, Check, ArrowRight, Sprout } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('farmer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Location fields
  const [district, setDistrict] = useState('Dakshina Kannada');
  const [villageTown, setVillageTown] = useState('Sullia');

  // Farmer specific
  const [farmName, setFarmName] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState('5');
  const [primaryCrops, setPrimaryCrops] = useState<string[]>(['Black Pepper', 'Arecanut']);
  const [isOrganic, setIsOrganic] = useState(true);

  // Worker specific
  const [skills, setSkills] = useState<string[]>(['Arecanut Tree Climbing']);
  const [dailyWage, setDailyWage] = useState('800');
  const [experienceYears, setExperienceYears] = useState('5');

  // Consumer specific
  const [deliveryPref, setDeliveryPref] = useState<'pickup' | 'farmer_delivery' | 'both'>('both');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTowns = KARNATAKA_LOCATIONS.find((l) => l.district === district)?.towns || ['Sullia', 'Puttur'];

  const toggleCrop = (crop: string) => {
    setPrimaryCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const user = await register({
        name,
        email,
        phone,
        password,
        role,
        district,
        village_town: villageTown,
        state: 'Karnataka',
        ...(role === 'farmer' && {
          farm_name: farmName || `${name}'s Agro Estate`,
          farm_size_acres: Number(farmSizeAcres) || 5,
          primary_crops: primaryCrops,
          organic_certified: isOrganic,
        }),
        ...(role === 'worker' && {
          skills,
          daily_wage_rate: Number(dailyWage) || 800,
          experience_years: Number(experienceYears) || 5,
        }),
        ...(role === 'consumer' && {
          delivery_preference: deliveryPref,
          default_delivery_address: deliveryAddress,
        }),
      } as any);

      navigate(`/${user.role}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-[#F8FAF8]">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <img 
            src="/favicon2.svg" 
            alt="Farmlynq Logo"
            className="w-12 h-12 mx-auto mb-3 drop-shadow-md"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Your Farmlynq Account
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Join thousands of farmers, consumers, and skilled agricultural workers across Karnataka.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Role Selector Cards */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              Select Your Role on Farmlynq
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  role === 'farmer'
                    ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/30'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                    <Sprout className="w-4 h-4" />
                  </div>
                  {role === 'farmer' && <Check className="w-4 h-4 text-emerald-700" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Farmer</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Sell produce, check mandi rates, hire workers</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('consumer')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  role === 'consumer'
                    ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/30'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  {role === 'consumer' && <Check className="w-4 h-4 text-emerald-700" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Consumer</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Buy fresh produce directly from local farms</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('worker')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  role === 'worker'
                    ? 'border-amber-700 bg-amber-50/60 ring-2 ring-amber-600/30'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-800 text-white flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  {role === 'worker' && <Check className="w-4 h-4 text-amber-700" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Agri Worker</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Find nearby daily wage work & harvesting gigs</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Gowda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number (Ready for OTP)</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98450 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Create Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Location Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    const found = KARNATAKA_LOCATIONS.find((l) => l.district === e.target.value);
                    if (found) setVillageTown(found.towns[0]);
                  }}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {KARNATAKA_LOCATIONS.map((l) => (
                    <option key={l.district} value={l.district}>
                      {l.district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Village / Town / Taluk</label>
                <select
                  value={villageTown}
                  onChange={(e) => setVillageTown(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {availableTowns.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Farmer Fields */}
            {role === 'farmer' && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Farm Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Farm / Estate Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Shree Maruthi Organic Estate"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Farm Land Size (Acres)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 6.5"
                      value={farmSizeAcres}
                      onChange={(e) => setFarmSizeAcres(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Crops Grown</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Black Pepper', 'Arecanut', 'Coconut', 'Cardamom', 'Banana', 'Coffee', 'Vegetables'].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleCrop(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          primaryCrops.includes(c)
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {primaryCrops.includes(c) ? `✓ ${c}` : `+ ${c}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="organic-check"
                    checked={isOrganic}
                    onChange={(e) => setIsOrganic(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="organic-check" className="text-xs font-medium text-gray-800 cursor-pointer">
                    We practice organic / chemical-free zero-budget natural farming
                  </label>
                </div>
              </div>
            )}

            {/* Dynamic Worker Fields */}
            {role === 'worker' && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Agricultural Skills & Wage
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Daily Wage (₹/day)</label>
                    <input
                      type="number"
                      placeholder="e.g. 850"
                      value={dailyWage}
                      onChange={(e) => setDailyWage(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Years of Agricultural Experience</label>
                    <input
                      type="number"
                      placeholder="e.g. 8"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {WORKER_SKILL_OPTIONS.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSkill(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          skills.includes(s)
                            ? 'bg-amber-800 text-white border-amber-800'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {skills.includes(s) ? `✓ ${s}` : `+ ${s}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Consumer Fields */}
            {role === 'consumer' && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Delivery Preferences
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Delivery Method</label>
                  <select
                    value={deliveryPref}
                    onChange={(e) => setDeliveryPref(e.target.value as any)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="both">Both Farm Pickup & Direct Farmer Delivery</option>
                    <option value="farmer_delivery">Farmer Doorstep Delivery Only</option>
                    <option value="pickup">Farm Gate Pickup (Self Collection)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Default Delivery Address</label>
                  <input
                    type="text"
                    placeholder="Apartment, Street, Locality, City"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isSubmitting ? (
                <span>Registering profile...</span>
              ) : (
                <>
                  <span>Create Account as {role.toUpperCase()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-gray-600 pt-2 border-t border-gray-100">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-emerald-800 hover:underline">
              Sign In here &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
