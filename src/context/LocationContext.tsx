import React, { createContext, useContext, useState } from 'react';
import { KARNATAKA_LOCATIONS } from '../lib/constants';

interface LocationContextType {
  district: string;
  town: string;
  state: string;
  latitude: number;
  longitude: number;
  setLocation: (district: string, town?: string) => void;
  detectCurrentLocation: () => void;
  isLocating: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [district, setDistrict] = useState<string>('Dakshina Kannada');
  const [town, setTown] = useState<string>('Sullia');
  const [state] = useState<string>('Karnataka');
  const [latitude, setLatitude] = useState<number>(12.556);
  const [longitude, setLongitude] = useState<number>(75.388);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const setLocation = (newDistrict: string, newTown?: string) => {
    setDistrict(newDistrict);
    const loc = KARNATAKA_LOCATIONS.find((l) => l.district === newDistrict);
    if (loc) {
      setLatitude(loc.lat);
      setLongitude(loc.lon);
      setTown(newTown || loc.towns[0]);
    } else if (newTown) {
      setTown(newTown);
    }
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation access declined or unavailable:', err.message);
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <LocationContext.Provider
      value={{
        district,
        town,
        state,
        latitude,
        longitude,
        setLocation,
        detectCurrentLocation,
        isLocating,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
};
