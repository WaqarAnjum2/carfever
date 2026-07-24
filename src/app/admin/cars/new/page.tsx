'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { createCar, updateCar, uploadImage } from '@/lib/admin-actions';
import { convertMultipleToWebP } from '@/lib/image-utils';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EditCarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const isSeller = pathname.startsWith('/seller');
  const fallbackBackUrl = isSeller ? '/seller/cars' : '/admin/cars';
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    body_type: 'Sedan',
    exterior_color: '',
    interior_color: '',
    engine: '',
    horsepower: '',
    description: '',
    status: 'approved',
    city: '',
    currency: 'PKR',
  });

  useEffect(() => {
    if (id) {
      router.replace(isSeller ? `/seller/cars/${id}` : `/admin/cars/${id}`);
    }
  }, [id, isSeller, router]);

  async function fetchCar() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('cars').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title || '',
          make: (data as any).make || '',
          model: data.model || '',
          year: data.year || new Date().getFullYear(),
          price: data.price?.toString() || '',
          mileage: data.mileage?.toString() || '',
          transmission: data.transmission || 'Automatic',
          fuel_type: data.fuel_type || 'Petrol',
          body_type: (data as any).body_type || 'Sedan',
          exterior_color: (data as any).exterior_color || '',
          interior_color: (data as any).interior_color || '',
          engine: (data as any).engine || '',
          horsepower: (data as any).horsepower?.toString() || '',
          description: data.description || '',
          status: data.status || 'pending',
          city: data.city || '',
          currency: data.currency || 'PKR',
        });
        setImages((data.images as string[]) || []);
      }
    } catch (error) {
      toast.error('Failed to fetch car details');
      router.push(fallbackBackUrl);
    } finally {
      setFetching(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const rawFiles = Array.from(files);
      const webpFiles = await convertMultipleToWebP(rawFiles);
      for (let i = 0; i < webpFiles.length; i++) {
        const url = await uploadImage(webpFiles[i]);
        setImages(prev => [...prev, url]);
      }
      toast.success('Images converted to WebP and uploaded');
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const computedTitle = formData.title || `${formData.year} ${formData.make} ${formData.model}`;
      const slug = computedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-6);

      const dataToSave = {
        title: computedTitle,
        slug,
        make: formData.make,
        model: formData.model,
        year: parseInt(String(formData.year)) || new Date().getFullYear(),
        price: parseFloat(formData.price) || 0,
        currency: formData.currency || 'PKR',
        mileage: parseInt(formData.mileage) || null,
        transmission: formData.transmission,
        fuel_type: formData.fuel_type,
        body_type: formData.body_type,
        exterior_color: formData.exterior_color || null,
        interior_color: formData.interior_color || null,
        engine: formData.engine || null,
        horsepower: formData.horsepower ? parseInt(formData.horsepower) : null,
        description: formData.description || null,
        status: formData.status as 'pending' | 'approved' | 'rejected' | 'draft',
        city: formData.city || null,
        images,
        features: [],
      };

      if (id) {
        await updateCar(id, dataToSave);
        toast.success('Car updated successfully');
        router.push(isSeller ? `/seller/cars/${id}` : `/admin/cars/${id}`);
      } else {
        await createCar(dataToSave);
        toast.success('Car created successfully');
        router.push(fallbackBackUrl);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save car');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-white text-center py-20">Loading car details...</div>;
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/cars" prefetch={false}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {id ? 'Edit Car Listing' : 'Add New Car'}
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Enter specs, features, and upload high-res photos.</p>
          </div>
        </div>
        <Button type="submit" form="car-form" disabled={loading} className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-500/20 text-xs px-5 py-2.5">
          {loading ? 'Saving...' : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Car Listing
            </>
          )}
        </Button>
      </div>

      <form id="car-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold text-slate-700">Listing Title <span className="text-rose-500">*</span></Label>
              <Input id="title" name="title" required value={formData.title} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. 2024 Porsche 911 GT3" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price" className="text-xs font-bold text-slate-700">Price (PKR / USD) <span className="text-rose-500">*</span></Label>
              <Input id="price" name="price" type="number" required value={formData.price} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. 185000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="make" className="text-xs font-bold text-slate-700">Make / Brand <span className="text-rose-500">*</span></Label>
              <Input id="make" name="make" required value={formData.make} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. Porsche" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-xs font-bold text-slate-700">Model <span className="text-rose-500">*</span></Label>
              <Input id="model" name="model" required value={formData.model} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. 911 GT3" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-xs font-bold text-slate-700">Year <span className="text-rose-500">*</span></Label>
              <Input id="year" name="year" type="number" required value={formData.year} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. 2024" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage" className="text-xs font-bold text-slate-700">Mileage (KM) <span className="text-rose-500">*</span></Label>
              <Input id="mileage" name="mileage" type="number" required value={formData.mileage} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. 1500" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Specifications</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Transmission</Label>
              <Select value={formData.transmission || 'Automatic'} onValueChange={(val) => handleSelectChange('transmission', String(val))}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]">
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Semi-Automatic">Semi-Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Fuel Type</Label>
              <Select value={formData.fuel_type || 'Petrol'} onValueChange={(val) => handleSelectChange('fuel_type', String(val))}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Body Type</Label>
              <Select value={formData.body_type || 'Sedan'} onValueChange={(val) => handleSelectChange('body_type', String(val))}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]">
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="Coupe">Coupe</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Convertible">Convertible</SelectItem>
                  <SelectItem value="Wagon">Wagon</SelectItem>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="engine" className="text-xs font-bold text-slate-700">Engine</Label>
              <Input id="engine" name="engine" value={formData.engine} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. 4.0L Flat-6" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horsepower" className="text-xs font-bold text-slate-700">Horsepower</Label>
              <Input id="horsepower" name="horsepower" type="number" value={formData.horsepower} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. 502" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exterior_color" className="text-xs font-bold text-slate-700">Exterior Color</Label>
              <Input id="exterior_color" name="exterior_color" value={formData.exterior_color} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. GT Silver Metallic" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Vehicle Images</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                <img src={img} alt={`Car ${idx}`} className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <label className="aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-slate-600">
              {uploading ? (
                <span className="text-xs font-bold text-slate-500">Uploading...</span>
              ) : (
                <>
                  <Upload className="w-6 h-6 mb-1 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Upload Image</span>
                </>
              )}
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Description</h3>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold text-slate-700">Detailed Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              rows={6}
              value={formData.description} 
              onChange={handleChange} 
              className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium resize-y focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" 
              placeholder="Write a detailed description of the car..." 
            />
          </div>
        </div>
      </form>
    </div>
  );
}
