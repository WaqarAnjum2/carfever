'use server';

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession, type SessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { CarListingSchema, InquirySchema, InspectionBookingSchema } from './validation';
import { rateLimit } from './rate-limit';
import { headers } from 'next/headers';

export async function getCurrentUserProfileAction(): Promise<SessionUser | null> {
  return await getSession();
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface FetchCarsFilters {
  make?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  year?: number | null;
  fuelType?: string | string[] | null;
  transmission?: string | null;
  bodyType?: string | null;
  mileageMin?: number | null;
  mileageMax?: number | null;
  isFeatured?: boolean | null;
  search?: string | null;
  sortBy?: 'price-asc' | 'price-desc' | 'year-desc' | 'newest';
  page?: number;
  limit?: number;
}

export interface FetchCarsResult {
  cars: ApprovedCar[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApprovedCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  body_type: string | null;
  color: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  engine: string | null;
  engine_capacity: string | null;
  city: string | null;
  images: string[];
  description: string | null;
  features: string[];
  slug: string | null;
  condition: string | null;
  seller_name: string | null;
  seller_phone: string | null;
  is_featured: boolean;
  is_inspected?: boolean | null;
  inspection_rating?: number | null;
  inspection_notes?: string | null;
  inspected_at?: string | null;
  inspector_id?: string | null;
  inspector_name?: string | null;
  inspector_email?: string | null;
  inspector_phone?: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    return h.get('x-forwarded-for')?.split(',')[0]?.trim()
      || h.get('x-real-ip')
      || 'unknown';
  } catch {
    return 'unknown';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH APPROVED CARS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchApprovedCars(
  filters: FetchCarsFilters = {}
): Promise<FetchCarsResult> {
  const {
    make,
    minPrice,
    maxPrice,
    year,
    fuelType,
    transmission,
    bodyType,
    mileageMin,
    mileageMax,
    isFeatured,
    search,
    sortBy = 'newest',
    page = 1,
    limit = 6,
  } = filters;

  try {
    const supabase = createServiceRoleClient();

    const applyFiltersAndSort = (q: any) => {
      let query = q;
      if (make) {
        query = query.ilike('brand', `%${make}%`);
      }
      if (minPrice != null) query = query.gte('price', minPrice);
      if (maxPrice != null) query = query.lte('price', maxPrice);
      if (year) query = query.eq('year', year);
      if (fuelType) {
        if (Array.isArray(fuelType) && fuelType.length > 0) {
          const variants = fuelType.flatMap((f: string) => [
            f,
            f.toLowerCase(),
            f.toUpperCase(),
            f.charAt(0).toUpperCase() + f.slice(1).toLowerCase(),
          ]);
          query = query.in('fuel_type', Array.from(new Set(variants)));
        } else if (typeof fuelType === 'string') {
          query = query.ilike('fuel_type', `%${fuelType}%`);
        }
      }
      if (transmission) query = query.ilike('transmission', `%${transmission}%`);
      if (bodyType) query = query.ilike('body_type', `%${bodyType}%`);
      if (mileageMin != null) query = query.gte('mileage', mileageMin);
      if (mileageMax != null) query = query.lte('mileage', mileageMax);
      if (isFeatured === true) query = query.eq('is_featured', true);
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`
        );
      }

      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'year-desc':
          query = query.order('year', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      return query;
    };

    const baseFields = '*';

    let initialQuery = supabase.from('cars').select(baseFields, { count: 'exact' }).eq('status', 'approved');
    initialQuery = applyFiltersAndSort(initialQuery);

    const offset = (page - 1) * limit;
    initialQuery = initialQuery.range(offset, offset + limit - 1);

    let { data, error, count } = await initialQuery;

    // Fallback: If no approved cars found, query all cars regardless of status
    if (!data || data.length === 0) {
      let fallbackQuery = supabase.from('cars').select(baseFields, { count: 'exact' });
      fallbackQuery = applyFiltersAndSort(fallbackQuery);
      fallbackQuery = fallbackQuery.range(offset, offset + limit - 1);
      const res = await fallbackQuery;
      if (res.data && res.data.length > 0) {
        data = res.data;
        count = res.count;
        error = null;
      }
    }

    if (error) {
      console.error('fetchApprovedCars error:', error.message);
      return { cars: [], total: 0, page, totalPages: 0 };
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const mappedCars = (data ?? []).map((row: any) => ({
      ...row,
      make: row.make || row.brand || '',
    }));

    return {
      cars: mappedCars as ApprovedCar[],
      total,
      page,
      totalPages,
    };
  } catch (err) {
    console.error('fetchApprovedCars exception:', err);
    return { cars: [], total: 0, page, totalPages: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT CAR LISTING
// ─────────────────────────────────────────────────────────────────────────────

export async function submitCarListing(formData: {
  make: string;
  model: string;
  year: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  engineCapacity: string;
  bodyType?: string;
  exteriorColor?: string;
  interiorColor?: string;
  city: string;
  price: string;
  sellerName: string;
  sellerPhone: string;
  description: string;
  images?: string[];
}) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('car-listing', ip);
  if (!allowed) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }

  try {
    const parsed = CarListingSchema.parse(formData);
    const supabase = createServiceRoleClient();

    // Get the currently logged-in user to tag the listing with seller_id
    const session = await getSession();
    const sellerId = session?.id || null;
    const sellerAuthId = session?.auth_user_id || null;

    const numPrice = parseFloat(parsed.price);
    const priceGBP = Math.round(numPrice); // Price already in GBP
    const title = `${parsed.year} ${parsed.make} ${parsed.model}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-6);

    const imageUrls = (parsed.images || []).filter((u: any) => typeof u === 'string' && u.trim().length > 0);

    const insertPayload: any = {
      title,
      slug,
      make: parsed.make,
      brand: parsed.make,
      model: parsed.model,
      year: parseInt(parsed.year),
      price: priceGBP,
      currency: 'GBP',
      mileage: parsed.mileage ? parseInt(parsed.mileage) : null,
      engine: parsed.engineCapacity ? `${parsed.engineCapacity}` : null,
      engine_capacity: parsed.engineCapacity ? `${parsed.engineCapacity}` : null,
      transmission: parsed.transmission.charAt(0).toUpperCase() + parsed.transmission.slice(1),
      fuel_type: parsed.fuelType.charAt(0).toUpperCase() + parsed.fuelType.slice(1),
      body_type: parsed.bodyType || 'Sedan',
      exterior_color: parsed.exteriorColor || null,
      interior_color: parsed.interiorColor || null,
      color: parsed.exteriorColor || null,
      city: parsed.city,
      description: parsed.description || `${title} for sale.`,
      images: imageUrls,
      image_url: imageUrls[0],
      features: parsed.features || [],
      status: 'approved',
      seller_name: parsed.sellerName || null,
      seller_phone: parsed.sellerPhone || null,
      seller_id: sellerId,
      user_id: sellerAuthId,
    };

    let { data, error } = await supabase
      .from('cars')
      .insert(insertPayload)
      .select('id')
      .single();

    let retries = 0;
    while (error && retries < 10) {
      retries++;
      console.warn(`Insert error (attempt ${retries}):`, error.message);

      const match =
        error.message.match(/Could not find the '([^']+)' column/i) ||
        error.message.match(/column "(.*?)"/i) ||
        error.message.match(/column '(.*?)'/i);

      if (match && match[1] && match[1] in insertPayload) {
        console.warn(`Stripping missing column '${match[1]}' and retrying...`);
        delete insertPayload[match[1]];
      } else if (error.message.includes('brand')) {
        delete insertPayload.brand;
      } else if (error.message.includes('make')) {
        delete insertPayload.make;
      } else if (error.message.includes('user_id')) {
        delete insertPayload.user_id;
      } else if (error.message.includes('seller_id')) {
        delete insertPayload.seller_id;
      } else {
        break;
      }

      const retry = await supabase.from('cars').insert(insertPayload).select('id').single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Final submitCarListing DB error:', error.message);
      throw new Error(error.message);
    }

    revalidatePath('/admin/cars');
    revalidatePath('/seller/cars');
    revalidatePath('/buy-car');

    return { success: true, carId: data?.id || '' };
  } catch (err: any) {
    console.error('submitCarListing error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit car listing',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT INQUIRY
// ─────────────────────────────────────────────────────────────────────────────

export async function submitInquiry(formData: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  carId?: string;
}) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('inquiry', ip);
  if (!allowed) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }

  try {
    const parsed = InquirySchema.parse(formData);
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        subject: parsed.subject,
        message: parsed.message,
        car_id: parsed.carId || null,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/admin/inquiries');

    return { success: true, inquiryId: data.id };
  } catch (err) {
    console.error('submitInquiry error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit inquiry',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT INSPECTION BOOKING
// ─────────────────────────────────────────────────────────────────────────────

export async function submitInspectionBooking(formData: {
  make: string;
  model: string;
  year: string;
  registrationNumber: string;
  address: string;
  plan: 'basic' | 'standard' | 'premium';
  date: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('inspection', ip);
  if (!allowed) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }

  const planPrices = { basic: 3500, standard: 5500, premium: 8500 };

  try {
    const parsed = InspectionBookingSchema.parse(formData);
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        make: parsed.make,
        model: parsed.model,
        year: parseInt(parsed.year),
        registration_number: parsed.registrationNumber,
        address: parsed.address,
        plan: parsed.plan,
        plan_price: planPrices[parsed.plan],
        scheduled_date: parsed.date,
        time_slot: parsed.timeSlot,
        customer_name: parsed.customerName,
        customer_phone: parsed.customerPhone,
        customer_email: parsed.customerEmail || null,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/admin/inspections');

    return { success: true, inspectionId: data.id };
  } catch (err) {
    console.error('submitInspectionBooking error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit inspection booking',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH SINGLE CAR BY ID & INCREMENT VIEWS
// ─────────────────────────────────────────────────────────────────────────────

export async function getCarById(id: string): Promise<ApprovedCar | null> {
  try {
    const supabase = createServiceRoleClient();

    let { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();

    if (!data) {
      const fallback = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
      if (error) console.error('getCarById error:', error.message);
      return null;
    }

    const carData = data as any;
    carData.make = carData.make || carData.brand || '';
    return carData as ApprovedCar;
  } catch (err) {
    console.error('getCarById exception:', err);
    return null;
  }
}

export async function incrementCarViews(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.rpc('increment_car_views', { car_id: id });
  } catch (err) {
    console.error('incrementCarViews error:', err);
  }
}

export async function getCarDetailsPageDataAction(id: string): Promise<{
  car: ApprovedCar | null;
  user: any;
  similarCars: ApprovedCar[];
}> {
  try {
    const supabase = createServiceRoleClient();

    // Fetch car by ID
    let { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();

    if (!data) {
      const fallback = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      data = fallback.data;
    }

    if (!data) {
      const user = await getCurrentUserProfileAction();
      return { car: null, user, similarCars: [] };
    }

    const carData = data as any;
    carData.make = carData.make || carData.brand || '';
    const car = carData as ApprovedCar;

    // Increment views in background safely
    try {
      await supabase.rpc('increment_car_views', { car_id: id });
    } catch {
      // ignore view increment error
    }

    // Fetch user profile and similar cars in parallel
    const makeVal = (car as any).brand || car.make || '';
    const [user, similarRes] = await Promise.all([
      getCurrentUserProfileAction(),
      makeVal
        ? supabase
            .from('cars')
            .select('*')
            .eq('status', 'approved')
            .neq('id', id)
            .ilike('brand', makeVal)
            .limit(5)
        : supabase
            .from('cars')
            .select('*')
            .eq('status', 'approved')
            .neq('id', id)
            .limit(5)
    ]);

    const similarCars = (similarRes.data || []).map((c: any) => ({
      ...c,
      make: c.make || c.brand || '',
    })) as ApprovedCar[];

    return { car, user, similarCars };
  } catch (err) {
    console.error('getCarDetailsPageDataAction exception:', err);
    return { car: null, user: null, similarCars: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC NEW USER
// ─────────────────────────────────────────────────────────────────────────────

export async function syncUserToDatabase(user: {
  name: string;
  email: string;
  role: 'buyer' | 'seller';
}) {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('users')
      .insert({
        name: user.name,
        email: user.email,
        role: user.role,
        status: 'active',
      });

    if (error) throw error;
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err) {
    console.error('syncUserToDatabase error:', err);
    return { success: false };
  }
}
