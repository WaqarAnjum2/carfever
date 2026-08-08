'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCarOptions } from '@/lib/taxonomy-actions';
import type { DbCarMake, DbCarCity, DbCarBodyType, DbCarFuelType, CarOptionsData } from '@/lib/supabase/types';

const CACHE_KEY = 'cf_car_options_cache_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour TTL

interface CachedPayload {
  data: CarOptionsData;
  timestamp: number;
}

const DEFAULT_OPTIONS: CarOptionsData = {
  makes: [
    { id: 'm-1', name: 'BMW', logo_url: null, display_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-2', name: 'Mercedes-Benz', logo_url: null, display_order: 2, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-3', name: 'Audi', logo_url: null, display_order: 3, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-4', name: 'Ford', logo_url: null, display_order: 4, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-5', name: 'Volkswagen', logo_url: null, display_order: 5, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-6', name: 'Toyota', logo_url: null, display_order: 6, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-7', name: 'Honda', logo_url: null, display_order: 7, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-8', name: 'Nissan', logo_url: null, display_order: 8, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-9', name: 'Land Rover', logo_url: null, display_order: 9, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-10', name: 'Porsche', logo_url: null, display_order: 10, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-11', name: 'Vauxhall', logo_url: null, display_order: 11, is_active: true, created_at: '', updated_at: '' },
    { id: 'm-12', name: 'Tesla', logo_url: null, display_order: 12, is_active: true, created_at: '', updated_at: '' },
  ],
  cities: [
    { id: 'def-1', name: 'London', region: 'Greater London', display_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: 'def-2', name: 'Manchester', region: 'North West', display_order: 2, is_active: true, created_at: '', updated_at: '' },
    { id: 'def-3', name: 'Birmingham', region: 'West Midlands', display_order: 3, is_active: true, created_at: '', updated_at: '' },
    { id: 'def-4', name: 'Leeds', region: 'Yorkshire', display_order: 4, is_active: true, created_at: '', updated_at: '' },
    { id: 'def-5', name: 'Glasgow', region: 'Scotland', display_order: 5, is_active: true, created_at: '', updated_at: '' },
    { id: 'def-6', name: 'Edinburgh', region: 'Scotland', display_order: 6, is_active: true, created_at: '', updated_at: '' },
    { id: 'def-7', name: 'Bristol', region: 'South West', display_order: 7, is_active: true, created_at: '', updated_at: '' },
    { id: 'def-8', name: 'Liverpool', region: 'North West', display_order: 8, is_active: true, created_at: '', updated_at: '' },
    { id: 'def-9', name: 'Sheffield', region: 'Yorkshire', display_order: 9, is_active: true, created_at: '', updated_at: '' },
    { id: 'def-10', name: 'Belfast', region: 'Northern Ireland', display_order: 10, is_active: true, created_at: '', updated_at: '' },
  ],
  bodyTypes: [
    { id: 'b-1', name: 'SUV', icon: '🚙', display_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: 'b-2', name: 'Sedan', icon: '🚗', display_order: 2, is_active: true, created_at: '', updated_at: '' },
    { id: 'b-3', name: 'Hatchback', icon: '🚘', display_order: 3, is_active: true, created_at: '', updated_at: '' },
    { id: 'b-4', name: 'Convertible', icon: '🏎️', display_order: 4, is_active: true, created_at: '', updated_at: '' },
    { id: 'b-5', name: 'Coupe', icon: '🏎️', display_order: 5, is_active: true, created_at: '', updated_at: '' },
    { id: 'b-6', name: 'Estate', icon: '🚐', display_order: 6, is_active: true, created_at: '', updated_at: '' },
  ],
  fuelTypes: [
    { id: 'f-1', name: 'Petrol', display_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: 'f-2', name: 'Diesel', display_order: 2, is_active: true, created_at: '', updated_at: '' },
    { id: 'f-3', name: 'Hybrid', display_order: 3, is_active: true, created_at: '', updated_at: '' },
    { id: 'f-4', name: 'Electric', display_order: 4, is_active: true, created_at: '', updated_at: '' },
    { id: 'f-5', name: 'Plug-in Hybrid', display_order: 5, is_active: true, created_at: '', updated_at: '' },
  ],
};

export function useCarOptions() {
  const [options, setOptions] = useState<CarOptionsData>(DEFAULT_OPTIONS);
  const [loading, setLoading] = useState(true);

  const fetchFreshOptions = useCallback(async () => {
    setLoading(true);
    try {
      const freshData = await getCarOptions();
      setOptions(freshData);
      if (typeof window !== 'undefined') {
        const payload: CachedPayload = {
          data: freshData,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      }
    } catch (err) {
      console.error('[useCarOptions] Failed to fetch options from server:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached: CachedPayload = JSON.parse(cachedRaw);
        const isFresh = Date.now() - cached.timestamp < CACHE_TTL_MS;
        if (cached.data) {
          setOptions(cached.data);
          setLoading(false);
        }
        if (!isFresh) {
          // Revalidate in background if expired
          fetchFreshOptions();
        }
      } else {
        fetchFreshOptions();
      }
    } catch {
      fetchFreshOptions();
    }
  }, [fetchFreshOptions]);

  const refreshOptions = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    return fetchFreshOptions();
  }, [fetchFreshOptions]);

  return {
    options,
    loading,
    refreshOptions,
    makes: options.makes,
    cities: options.cities,
    bodyTypes: options.bodyTypes,
    fuelTypes: options.fuelTypes,
    makeNames: options.makes.map((m) => m.name),
    cityNames: options.cities.map((c) => c.name),
    bodyTypeNames: options.bodyTypes.map((b) => b.name),
    fuelTypeNames: options.fuelTypes.map((f) => f.name),
  };
}
