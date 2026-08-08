'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient, createServerClient } from './supabase/server';
import { verifyAdminSession } from './admin-actions';
import type { DbCarMake, DbCarCity, DbCarBodyType, DbCarFuelType, CarOptionsData } from './supabase/types';

export type TaxonomyCategory = 'makes' | 'cities' | 'bodyTypes' | 'fuelTypes';

const DEFAULT_UK_CITIES: DbCarCity[] = [
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
  { id: 'def-11', name: 'Newcastle', region: 'North East', display_order: 11, is_active: true, created_at: '', updated_at: '' },
  { id: 'def-12', name: 'Cardiff', region: 'Wales', display_order: 12, is_active: true, created_at: '', updated_at: '' },
];

const DEFAULT_MAKES: DbCarMake[] = [
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
];

const DEFAULT_BODY_TYPES: DbCarBodyType[] = [
  { id: 'b-1', name: 'SUV', icon: '🚙', display_order: 1, is_active: true, created_at: '', updated_at: '' },
  { id: 'b-2', name: 'Sedan', icon: '🚗', display_order: 2, is_active: true, created_at: '', updated_at: '' },
  { id: 'b-3', name: 'Hatchback', icon: '🚘', display_order: 3, is_active: true, created_at: '', updated_at: '' },
  { id: 'b-4', name: 'Convertible', icon: '🏎️', display_order: 4, is_active: true, created_at: '', updated_at: '' },
  { id: 'b-5', name: 'Coupe', icon: '🏎️', display_order: 5, is_active: true, created_at: '', updated_at: '' },
  { id: 'b-6', name: 'Estate', icon: '🚐', display_order: 6, is_active: true, created_at: '', updated_at: '' },
];

const DEFAULT_FUEL_TYPES: DbCarFuelType[] = [
  { id: 'f-1', name: 'Petrol', display_order: 1, is_active: true, created_at: '', updated_at: '' },
  { id: 'f-2', name: 'Diesel', display_order: 2, is_active: true, created_at: '', updated_at: '' },
  { id: 'f-3', name: 'Hybrid', display_order: 3, is_active: true, created_at: '', updated_at: '' },
  { id: 'f-4', name: 'Electric', display_order: 4, is_active: true, created_at: '', updated_at: '' },
  { id: 'f-5', name: 'Plug-in Hybrid', display_order: 5, is_active: true, created_at: '', updated_at: '' },
];

/**
 * Public action to get active car options (cities, makes, body types, fuel types).
 * Supports browser-level caching.
 */
export async function getCarOptions(): Promise<CarOptionsData> {
  try {
    const supabase = createServiceRoleClient();

    const [makesRes, citiesRes, bodyRes, fuelRes] = await Promise.all([
      supabase.from('car_makes').select('*').eq('is_active', true).order('display_order', { ascending: true }).order('name', { ascending: true }),
      supabase.from('car_cities').select('*').eq('is_active', true).order('display_order', { ascending: true }).order('name', { ascending: true }),
      supabase.from('car_body_types').select('*').eq('is_active', true).order('display_order', { ascending: true }).order('name', { ascending: true }),
      supabase.from('car_fuel_types').select('*').eq('is_active', true).order('display_order', { ascending: true }).order('name', { ascending: true }),
    ]);

    return {
      makes: makesRes.data && makesRes.data.length > 0 ? (makesRes.data as DbCarMake[]) : DEFAULT_MAKES,
      cities: citiesRes.data && citiesRes.data.length > 0 ? (citiesRes.data as DbCarCity[]) : DEFAULT_UK_CITIES,
      bodyTypes: bodyRes.data && bodyRes.data.length > 0 ? (bodyRes.data as DbCarBodyType[]) : DEFAULT_BODY_TYPES,
      fuelTypes: fuelRes.data && fuelRes.data.length > 0 ? (fuelRes.data as DbCarFuelType[]) : DEFAULT_FUEL_TYPES,
    };
  } catch (err) {
    console.error('[getCarOptions] Error fetching car options:', err);
    return {
      makes: DEFAULT_MAKES,
      cities: DEFAULT_UK_CITIES,
      bodyTypes: DEFAULT_BODY_TYPES,
      fuelTypes: DEFAULT_FUEL_TYPES,
    };
  }
}

/**
 * Admin action to fetch all options (including inactive ones)
 */
export async function getAllCarOptionsAdmin(): Promise<CarOptionsData> {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const [makesRes, citiesRes, bodyRes, fuelRes] = await Promise.all([
    supabase.from('car_makes').select('*').order('display_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('car_cities').select('*').order('display_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('car_body_types').select('*').order('display_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('car_fuel_types').select('*').order('display_order', { ascending: true }).order('name', { ascending: true }),
  ]);

  return {
    makes: (makesRes.data || []) as DbCarMake[],
    cities: (citiesRes.data || []) as DbCarCity[],
    bodyTypes: (bodyRes.data || []) as DbCarBodyType[],
    fuelTypes: (fuelRes.data || []) as DbCarFuelType[],
  };
}

/**
 * Admin action to create a new taxonomy option
 */
export async function createCarOption(
  category: TaxonomyCategory,
  input: { name: string; region?: string; logo_url?: string; icon?: string; display_order?: number; is_active?: boolean }
) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const tableName = getTableName(category);

  const cleanName = input.name.trim();
  if (!cleanName) throw new Error('Name is required');

  const payload: any = {
    name: cleanName,
    display_order: input.display_order ?? 0,
    is_active: input.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (category === 'cities' && input.region) payload.region = input.region.trim();
  if (category === 'makes' && input.logo_url) payload.logo_url = input.logo_url.trim();
  if (category === 'bodyTypes' && input.icon) payload.icon = input.icon.trim();

  const { data, error } = await (supabase as any).from(tableName).insert(payload).select().single();
  if (error) throw new Error(error.message);

  revalidatePath('/buy-car');
  revalidatePath('/admin/options');
  return { success: true, data };
}

/**
 * Admin action to update an option
 */
export async function updateCarOption(
  category: TaxonomyCategory,
  id: string,
  input: { name?: string; region?: string; logo_url?: string; icon?: string; display_order?: number; is_active?: boolean }
) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const tableName = getTableName(category);

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.display_order !== undefined) payload.display_order = input.display_order;
  if (input.is_active !== undefined) payload.is_active = input.is_active;
  if (category === 'cities' && input.region !== undefined) payload.region = input.region ? input.region.trim() : null;
  if (category === 'makes' && input.logo_url !== undefined) payload.logo_url = input.logo_url ? input.logo_url.trim() : null;
  if (category === 'bodyTypes' && input.icon !== undefined) payload.icon = input.icon ? input.icon.trim() : null;

  const { data, error } = await (supabase as any).from(tableName).update(payload).eq('id', id).select().single();
  if (error) throw new Error(error.message);

  revalidatePath('/buy-car');
  revalidatePath('/admin/options');
  return { success: true, data };
}

/**
 * Admin action to delete an option
 */
export async function deleteCarOption(category: TaxonomyCategory, id: string) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const tableName = getTableName(category);

  const { error } = await (supabase as any).from(tableName).delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/buy-car');
  revalidatePath('/admin/options');
  return { success: true };
}

function getTableName(category: TaxonomyCategory): string {
  switch (category) {
    case 'makes': return 'car_makes';
    case 'cities': return 'car_cities';
    case 'bodyTypes': return 'car_body_types';
    case 'fuelTypes': return 'car_fuel_types';
  }
}
