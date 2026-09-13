import React, { useState } from 'react';
import { useLocation } from '../../context/LocationContext';
import { KARNATAKA_LOCATIONS } from '../../lib/constants';
import { MapPin, Navigation, X, Check } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { district, town, setLocation, detectCurrentLocation, isLocating } = useLocation();
  const [selectedDistrict, setSelectedDistrict] = useState(district);
  const [selectedTown, setSelectedTown] = useState(town);

  if (!isOpen) return null;

  const currentLoc = KARNATAKA_LOCATIONS.find((l) => l.district === selectedDistrict);

  const handleDistrictChange = (dName: string) => {
    setSelectedDistrict(dName);
    const found = KARNATAKA_LOCATIONS.find((l) => l.district === dName);
    if (found && found.towns.length > 0) {
      setSelectedTown(found.towns[0]);
    }
  };

  const handleSave = () => {
    setLocation(selectedDistrict, selectedTown);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Select Your Location</h3>
              <p className="text-xs text-gray-500">Find nearby farmers, mandi rates & weather</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <button
            onClick={() => {
              detectCurrentLocation();
              onClose();
            }}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors text-sm font-medium touch-target"
          >
            <Navigation className={`w-4 h-4 text-emerald-700 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Detecting Location...' : 'Use My Current Location'}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-gray-200"></div>
            <span className="shrink mx-3 text-xs text-gray-400 uppercase font-medium">Or choose manually</span>
            <div className="grow border-t border-gray-200"></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">District (Karnataka)</label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50"
            >
              {KARNATAKA_LOCATIONS.map((loc) => (
                <option key={loc.district} value={loc.district}>
                  {loc.district}
                </option>
              ))}
            </select>
          </div>

          {currentLoc && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Taluk / Village / Town</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {currentLoc.towns.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTown(t)}
                    className={`py-2 px-3 text-xs rounded-lg border text-left flex items-center justify-between transition-all ${
                      selectedTown === t
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span>{t}</span>
                    {selectedTown === t && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-sm transition-colors"
          >
            Apply Location
          </button>
        </div>
      </div>
    </div>
  );
};
