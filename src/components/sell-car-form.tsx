"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Car,
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  X,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import { submitCarListing } from "@/lib/server-actions";
import { uploadImage } from "@/lib/admin-actions";
import { convertMultipleToWebP } from "@/lib/image-utils";

const POPULAR_BRANDS = [
  "Ford",
  "Vauxhall",
  "Volkswagen",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Toyota",
  "Honda",
  "Nissan",
  "Hyundai",
  "Kia",
  "SEAT",
  "Peugeot",
  "Renault",
  "Skoda",
  "Land Rover",
  "Jaguar",
  "MINI",
  "Volvo",
  "Tesla",
  "MG",
  "Fiat",
  "Mazda",
  "Mitsubishi",
  "Subaru",
  "Porsche",
  "Lexus",
  "Other (Type Custom)",
];

const BRAND_MODELS: Record<string, string[]> = {
  Ford: ["Fiesta", "Focus", "Puma", "Kuga", "EcoSport", "Mustang", "Ranger", "Transit", "Galaxy", "Other"],
  Vauxhall: ["Corsa", "Astra", "Mokka", "Crossland", "Grandland", "Insignia", "Zafira", "Other"],
  Volkswagen: ["Golf", "Polo", "Tiguan", "Passat", "T-Roc", "ID.3", "ID.4", "Touareg", "Transporter", "Other"],
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "iX", "Other"],
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "EQC", "Other"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "Q2", "Q3", "Q5", "Q7", "e-tron", "Other"],
  Toyota: ["Yaris", "Corolla", "Camry", "RAV4", "C-HR", "Prius", "Land Cruiser", "Hilux", "Other"],
  Honda: ["Jazz", "Civic", "CR-V", "HR-V", "ZR-V", "Accord", "Other"],
  Nissan: ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Navara", "Other"],
  Hyundai: ["i10", "i20", "i30", "Tucson", "Santa Fe", "IONIQ 5", "Kona", "Other"],
  Kia: ["Picanto", "Rio", "Ceed", "Sportage", "Niro", "Sorento", "EV6", "Other"],
  SEAT: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Other"],
  Peugeot: ["208", "308", "2008", "3008", "5008", "e-208", "Other"],
  Renault: ["Clio", "Megane", "Captur", "Kadjar", "Zoe", "Arkana", "Other"],
  Skoda: ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Other"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar", "Other"],
  Jaguar: ["E-Pace", "F-Pace", "I-Pace", "XE", "XF", "F-Type", "Other"],
  MINI: ["Hatch", "Convertible", "Clubman", "Countryman", "Paceman", "Other"],
  Volvo: ["S60", "S90", "V40", "V60", "V90", "XC40", "XC60", "XC90", "Other"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X", "Other"],
  MG: ["MG3", "MG5", "MG ZS", "MG ZS EV", "MG HS", "MG4", "Other"],
  Fiat: ["500", "Panda", "Tipo", "500X", "Other"],
  Mazda: ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-5", "CX-60", "Other"],
  Mitsubishi: ["Colt", "Eclipse Cross", "Outlander", "L200", "Other"],
  Subaru: ["Impreza", "Forester", "Outback", "XV", "WRX", "Other"],
  Porsche: ["Cayenne", "Macan", "Panamera", "911", "Taycan", "Other"],
  Lexus: ["IS", "ES", "NX", "RX", "UX", "Other"],
};


const UK_CITIES = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Glasgow",
  "Sheffield",
  "Bradford",
  "Edinburgh",
  "Liverpool",
  "Bristol",
  "Cardiff",
  "Coventry",
  "Nottingham",
  "Leicester",
  "Newcastle upon Tyne",
  "Belfast",
  "Sunderland",
  "Brighton",
  "Hull",
  "Wolverhampton",
  "Plymouth",
  "Derby",
  "Southampton",
  "Stoke-on-Trent",
  "Salford",
  "Aberdeen",
  "Westminster",
  "Portsmouth",
  "York",
  "Oxford",
  "Cambridge",
  "Reading",
  "Luton",
  "Preston",
  "Blackpool",
  "Bolton",
  "Stockport",
  "Middlesbrough",
  "Swansea",
  "Peterborough",
  "Milton Keynes",
  "Northampton",
  "Warrington",
  "Exeter",
  "Bath",
  "Gloucester",
  "Cheltenham",
  "Ipswich",
  "Norwich",
  "Dundee",
  "Other City",
];


const EXTERIOR_COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Pearl White", hex: "#F5F5F0" },
  { name: "Black", hex: "#111111" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gunmetal Grey", hex: "#4A4A4A" },
  { name: "Red", hex: "#D32F2F" },
  { name: "Navy Blue", hex: "#1A237E" },
  { name: "Electric Blue", hex: "#0288D1" },
  { name: "Emerald Green", hex: "#2E7D32" },
  { name: "Bronze / Gold", hex: "#D4AF37" },
  { name: "Burgundy / Wine", hex: "#800020" },
  { name: "Orange", hex: "#EF6C00" },
  { name: "Yellow", hex: "#FBC02D" },
  { name: "Purple", hex: "#6A1B9A" },
  { name: "Brown / Tan", hex: "#5D4037" },
  { name: "Other Color", hex: "#888888" },
];

const INTERIOR_COLORS = [
  { name: "Black", hex: "#1A1A1A" },
  { name: "Beige / Cream", hex: "#F5F5DC" },
  { name: "Grey", hex: "#607D8B" },
  { name: "Red / Leather", hex: "#B71C1C" },
  { name: "Tan", hex: "#8B4513" },
  { name: "Brown", hex: "#5D4037" },
  { name: "White", hex: "#F8F9FA" },
  { name: "Cognac / Amber", hex: "#9F4D00" },
  { name: "Other Color", hex: "#888888" },
];

const CAR_FEATURES = [
  "Sunroof / Moonroof",
  "Navigation / Touchscreen",
  "Leather Seats",
  "ABS Brakes",
  "Airbags",
  "Cruise Control",
  "Alloy Rims",
  "Reverse Camera",
  "Push Start Button",
  "Climate Control",
  "Keyless Entry",
  "Power Windows",
];

export function SellCarForm({
  isSellerPortal = false,
  onClose,
}: {
  isSellerPortal?: boolean;
  onClose?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const [formData, setFormData] = useState({
    make: "",
    customMake: "",
    model: "",
    customModel: "",
    year: "",
    mileage: "",
    fuelType: "petrol",
    transmission: "automatic",
    assembly: "Local",
    bodyType: "Sedan",
    engineCapacity: "",
    exteriorColor: "",
    customExteriorColor: "",
    interiorColor: "",
    customInteriorColor: "",
    city: "",
    customCity: "",
    price: "",
    sellerName: "",
    sellerPhone: "",
    description: "",
    features: [] as string[],
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDownNumber = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    let { name, value } = e.target;

    if (name === "mileage" || name === "engineCapacity" || name === "price") {
      value = value.replace(/[^0-9.]/g, "");
      if (value !== "" && parseFloat(value) < 0) {
        value = "0";
      }
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "make" && value !== "Other (Type Custom)") {
        updated.customMake = "";
        updated.model = "";
        updated.customModel = "";
      }
      if (name === "model" && value !== "Other") {
        updated.customModel = "";
      }
      if (name === "city" && value !== "Other City") {
        updated.customCity = "";
      }
      return updated;
    });
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => {
      const exists = prev.features.includes(feature);
      return {
        ...prev,
        features: exists
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature],
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const rawFiles = Array.from(e.target.files);
      const webpFiles = await convertMultipleToWebP(rawFiles);
      const newImages = webpFiles.map((file) => URL.createObjectURL(file));
      setUploadedImages((prev) => [...prev, ...newImages]);
      setUploadedFiles((prev) => [...prev, ...webpFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const rawFiles = Array.from(e.dataTransfer.files);
      const imageFiles = rawFiles.filter((file) => file.type.startsWith("image/"));
      const webpFiles = await convertMultipleToWebP(imageFiles);
      const newImages = webpFiles.map((file) => URL.createObjectURL(file));
      setUploadedImages((prev) => [...prev, ...newImages]);
      setUploadedFiles((prev) => [...prev, ...webpFiles]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const getEffectiveMake = () => {
    if (formData.make === "Other (Type Custom)") {
      return formData.customMake.trim();
    }
    return formData.make.trim();
  };

  const getEffectiveModel = () => {
    if (formData.model === "Other") {
      return formData.customModel.trim();
    }
    return formData.model.trim();
  };

  const getEffectiveCity = () => {
    if (formData.city === "Other City") {
      return formData.customCity.trim();
    }
    return formData.city.trim();
  };

  const handleSubmitListing = async () => {
    setIsSubmitting(true);
    try {
      const finalMake = getEffectiveMake();
      const finalModel = getEffectiveModel();
      const finalCity = getEffectiveCity();

      let imageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        showToast("Converting images to WebP & uploading to storage...");
        const webpFiles = await convertMultipleToWebP(uploadedFiles);
        for (const file of webpFiles) {
          try {
            const url = await uploadImage(file);
            if (url) imageUrls.push(url);
          } catch (uploadErr) {
            console.error("Individual image upload failed:", uploadErr);
          }
        }
      }

      const finalExtColor = formData.exteriorColor === "Other Color" ? formData.customExteriorColor.trim() : formData.exteriorColor;
      const finalIntColor = formData.interiorColor === "Other Color" ? formData.customInteriorColor.trim() : formData.interiorColor;

      const result = await submitCarListing({
        make: finalMake,
        model: finalModel,
        year: formData.year,
        mileage: formData.mileage,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        engineCapacity: formData.engineCapacity,
        bodyType: formData.bodyType,
        exteriorColor: finalExtColor,
        interiorColor: finalIntColor,
        city: finalCity,
        price: formData.price,
        sellerName: formData.sellerName,
        sellerPhone: formData.sellerPhone,
        description: formData.description + (formData.features.length > 0 ? `\nFeatures: ${formData.features.join(", ")}` : ""),
        images: imageUrls,
      });

      if (result.success) {
        showToast("Car listing posted successfully! Under inspection review.", "success");
        nextStep();
      } else {
        showToast(result.error || "Failed to submit car listing", "error");
      }
    } catch (error) {
      showToast("Network issue or server timeout. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMakeValid = formData.make === "Other (Type Custom)" ? Boolean(formData.customMake.trim()) : Boolean(formData.make);
  const isModelValid = formData.model === "Other" ? Boolean(formData.customModel.trim()) : Boolean(formData.model);
  const isStep1Valid = isMakeValid && isModelValid && formData.year && formData.mileage && formData.engineCapacity;

  const isCityValid = formData.city === "Other City" ? Boolean(formData.customCity.trim()) : Boolean(formData.city);
  const isStep2Valid = isCityValid && formData.price && formData.sellerName && formData.sellerPhone;

  const inputClass =
    "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm";
  const numberInputClass =
    "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const selectClass =
    "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer font-medium text-sm";
  const labelClass =
    "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between";

  const availableModels = formData.make && BRAND_MODELS[formData.make] ? BRAND_MODELS[formData.make] : ["Other"];

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Top Hero Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#0055FE] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Dealer Portal Car Listing Form</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">
          Post a New Vehicle <span className="text-[#0055FE]">Listing</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
          Fill in your vehicle specifications, price, photos, and features.
        </p>
      </div>

      {/* Stepper Bar */}
      {step <= 3 && (
        <div className="mb-8 bg-white border border-slate-200/80 rounded-3xl p-4 sm:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all ${
                step >= 1 ? "bg-[#0055FE] text-white shadow-md shadow-blue-500/20" : "bg-slate-100 text-slate-400"
              }`}
            >
              1
            </div>
            <div className="hidden xs:block">
              <span className="text-xs font-bold block text-slate-900">Vehicle Specs</span>
              <span className="text-[10px] text-slate-400">Make, Model, Engine</span>
            </div>
          </div>

          <div className="h-px bg-slate-200 flex-1 mx-4 sm:mx-8" />

          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all ${
                step >= 2 ? "bg-[#0055FE] text-white shadow-md shadow-blue-500/20" : "bg-slate-100 text-slate-400"
              }`}
            >
              2
            </div>
            <div className="hidden xs:block">
              <span className="text-xs font-bold block text-slate-900">Price & Contact</span>
              <span className="text-[10px] text-slate-400">Location, Price, Notes</span>
            </div>
          </div>

          <div className="h-px bg-slate-200 flex-1 mx-4 sm:mx-8" />

          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all ${
                step >= 3 ? "bg-[#0055FE] text-white shadow-md shadow-blue-500/20" : "bg-slate-100 text-slate-400"
              }`}
            >
              3
            </div>
            <div className="hidden xs:block">
              <span className="text-xs font-bold block text-slate-900">Photos & Features</span>
              <span className="text-[10px] text-slate-400">Upload & Verify</span>
            </div>
          </div>
        </div>
      )}

      {/* Form Card Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
        
        {/* STEP 1: VEHICLE SPECIFICATIONS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0055FE] flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Vehicle Specifications</h2>
                  <p className="text-xs text-slate-500">Choose dropdown items or type custom brands/models</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Make / Brand */}
              <div>
                <label className={labelClass}>
                  <span>Make / Brand</span>
                  <span className="text-[10px] text-[#0055FE] font-bold">Dropdown or Custom</span>
                </label>
                <select
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="" disabled>-- Select Brand --</option>
                  {POPULAR_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>

                {formData.make === "Other (Type Custom)" && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                      type="text"
                      name="customMake"
                      placeholder="Type custom brand name (e.g. Proton, DFSK, Porsche)"
                      value={formData.customMake}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* Model */}
              <div>
                <label className={labelClass}>
                  <span>Car Model</span>
                  <span className="text-[10px] text-[#0055FE] font-bold">Select or Custom</span>
                </label>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className={selectClass}
                  disabled={!formData.make}
                >
                  <option value="" disabled>-- Select Model --</option>
                  {availableModels.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                  {!availableModels.includes("Other") && <option value="Other">Other (Type Custom)</option>}
                </select>

                {formData.model === "Other" && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                      type="text"
                      name="customModel"
                      placeholder="Type custom model name (e.g. Saga, Glory 580, Taycan)"
                      value={formData.customModel}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* Registration Year */}
              <div>
                <label className={labelClass}>
                  <span>Registration Year</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="" disabled>-- Select Year --</option>
                  {Array.from({ length: 30 }).map((_, i) => {
                    const yr = 2026 - i;
                    return (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Mileage */}
              <div>
                <label className={labelClass}>
                  <span>Mileage (Kilometers)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="mileage"
                    min="0"
                    placeholder="e.g. 35000"
                    value={formData.mileage}
                    onKeyDown={handleKeyDownNumber}
                    onChange={handleInputChange}
                    className={numberInputClass}
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                    KM
                  </span>
                </div>
              </div>

              {/* Engine Capacity */}
              <div>
                <label className={labelClass}>
                  <span>Engine Capacity (CC)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="engineCapacity"
                    min="0"
                    placeholder="e.g. 1300 or 1800"
                    value={formData.engineCapacity}
                    onKeyDown={handleKeyDownNumber}
                    onChange={handleInputChange}
                    className={numberInputClass}
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                    CC
                  </span>
                </div>
              </div>

              {/* Body Type */}
              <div>
                <label className={labelClass}>
                  <span>Body Type</span>
                </label>
                <select
                  name="bodyType"
                  value={formData.bodyType}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="SUV">SUV / Crossover</option>
                  <option value="Pickup">Pickup Truck</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Van">Van / MPV</option>
                </select>
              </div>

              {/* Exterior Color */}
              <div>
                <label className={labelClass}>
                  <span>Exterior Color</span>
                  <span className="text-[10px] text-[#0055FE] font-bold">Preset or Custom</span>
                </label>
                <select
                  name="exteriorColor"
                  value={formData.exteriorColor}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="">-- Select Exterior Color --</option>
                  {EXTERIOR_COLORS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {EXTERIOR_COLORS.slice(0, 10).map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      onClick={() => setFormData(prev => ({ ...prev, exteriorColor: c.name }))}
                      className={`w-6 h-6 rounded-full border shadow-xs transition-transform hover:scale-110 cursor-pointer ${
                        formData.exteriorColor === c.name ? "ring-2 ring-[#0055FE] ring-offset-1 scale-110 border-blue-500" : "border-slate-300 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                {formData.exteriorColor === "Other Color" && (
                  <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                      type="color"
                      value={formData.customExteriorColor.startsWith("#") ? formData.customExteriorColor : "#3b82f6"}
                      onChange={(e) => setFormData(prev => ({ ...prev, customExteriorColor: e.target.value }))}
                      className="w-10 h-10 p-0.5 rounded-xl border border-slate-200 cursor-pointer bg-white"
                      title="Pick custom color"
                    />
                    <input
                      type="text"
                      name="customExteriorColor"
                      placeholder="Type custom color (e.g. Nardo Grey, Midnight Blue)"
                      value={formData.customExteriorColor}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* Interior Color */}
              <div>
                <label className={labelClass}>
                  <span>Interior Color</span>
                  <span className="text-[10px] text-[#0055FE] font-bold">Preset or Custom</span>
                </label>
                <select
                  name="interiorColor"
                  value={formData.interiorColor}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="">-- Select Interior Color --</option>
                  {INTERIOR_COLORS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {INTERIOR_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      onClick={() => setFormData(prev => ({ ...prev, interiorColor: c.name }))}
                      className={`w-6 h-6 rounded-full border shadow-xs transition-transform hover:scale-110 cursor-pointer ${
                        formData.interiorColor === c.name ? "ring-2 ring-[#0055FE] ring-offset-1 scale-110 border-blue-500" : "border-slate-300 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                {formData.interiorColor === "Other Color" && (
                  <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                      type="color"
                      value={formData.customInteriorColor.startsWith("#") ? formData.customInteriorColor : "#8b4513"}
                      onChange={(e) => setFormData(prev => ({ ...prev, customInteriorColor: e.target.value }))}
                      className="w-10 h-10 p-0.5 rounded-xl border border-slate-200 cursor-pointer bg-white"
                      title="Pick custom color"
                    />
                    <input
                      type="text"
                      name="customInteriorColor"
                      placeholder="Type custom interior color (e.g. Cognac Leather, Beige)"
                      value={formData.customInteriorColor}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* Fuel Type Pills */}
              <div>
                <label className={labelClass}>
                  <span>Fuel Type</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "petrol", label: "⛽ Petrol" },
                    { id: "diesel", label: "🛢️ Diesel" },
                    { id: "hybrid", label: "🔋 Hybrid" },
                    { id: "electric", label: "⚡ Electric" },
                  ].map((fuel) => (
                    <button
                      key={fuel.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, fuelType: fuel.id }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formData.fuelType === fuel.id
                          ? "bg-blue-50 border-[#0055FE] text-[#0055FE] shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {fuel.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmission Pills */}
              <div>
                <label className={labelClass}>
                  <span>Transmission</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "automatic", label: "⚙️ Automatic" },
                    { id: "manual", label: "🕹️ Manual" },
                  ].map((trans) => (
                    <button
                      key={trans.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, transmission: trans.id }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formData.transmission === trans.id
                          ? "bg-blue-50 border-[#0055FE] text-[#0055FE] shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {trans.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Next Button */}
            <div className="flex justify-end pt-6 border-t border-slate-100">
              <Button
                disabled={!isStep1Valid}
                onClick={nextStep}
                className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer w-full sm:w-auto"
              >
                <span>Continue to Pricing & Contact</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PRICING & LOCATION */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0055FE] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Pricing & Dealer Contact</h2>
                  <p className="text-xs text-slate-500">Specify your asking price and contact info</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* City */}
              <div>
                <label className={labelClass}>
                  <span>City Location</span>
                  <span className="text-[10px] text-[#0055FE] font-bold">Select or Type Custom</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="" disabled>-- Select UK City --</option>
                  {UK_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Always show custom city input — pre-filled if dropdown selected, editable for custom */}
                <div className="mt-3 animate-in fade-in duration-200">
                  <input
                    type="text"
                    name="customCity"
                    placeholder="Or type your city name (e.g. Slough, Watford, Swindon…)"
                    value={formData.city === "Other City" ? formData.customCity : (formData.city && formData.city !== "Other City" ? "" : formData.customCity)}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, customCity: e.target.value, city: "Other City" }));
                    }}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className={labelClass}>
                  <span>Asking Price (GBP)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-sm font-extrabold text-slate-500 pointer-events-none">
                    £
                  </div>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="any"
                    placeholder="e.g. 12500"
                    value={formData.price}
                    onKeyDown={handleKeyDownNumber}
                    onChange={handleInputChange}
                    className={`${numberInputClass} pl-10`}
                  />
                </div>
                {formData.price && !isNaN(parseFloat(formData.price)) && (
                  <p className="text-xs font-semibold text-[#0055FE] mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Listing Price: £{parseFloat(formData.price).toLocaleString("en-GB")}
                  </p>
                )}
              </div>

              {/* Dealer Name */}
              <div>
                <label className={labelClass}>
                  <span>Dealer's Name</span>
                </label>
                <input
                  type="text"
                  name="sellerName"
                  placeholder="e.g. Apex Performance Motors"
                  value={formData.sellerName}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>

              {/* Dealer Phone */}
              <div>
                <label className={labelClass}>
                  <span>Dealer's Mobile Phone</span>
                </label>
                <input
                  type="tel"
                  name="sellerPhone"
                  placeholder="e.g. 07911 123456"
                  value={formData.sellerPhone}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>


              {/* Description */}
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  <span>Vehicle Remarks / Description</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Mention car maintenance history, inspection score, engine condition, tyre condition, and reason for selling..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`${inputClass} resize-none`}
                />
              </div>

            </div>

            {/* Back / Next Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={prevStep}
                className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-12 rounded-2xl cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Specs
              </Button>

              <Button
                disabled={!isStep2Valid}
                onClick={nextStep}
                className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Continue to Photos & Features</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTOS & FEATURES */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0055FE] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Vehicle Photos & Key Features</h2>
                  <p className="text-xs text-slate-500">Upload clear images and check key vehicle features</p>
                </div>
              </div>
            </div>

            {/* Features Checklist */}
            <div>
              <label className={labelClass}>
                <span>Vehicle Features Checklist</span>
                <span className="text-[10px] text-slate-400">{formData.features.length} selected</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CAR_FEATURES.map((feature) => {
                  const selected = formData.features.includes(feature);
                  return (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`p-3 rounded-2xl text-xs font-bold text-left border transition-all flex items-center justify-between cursor-pointer ${
                        selected
                          ? "bg-blue-50 border-[#0055FE] text-[#0055FE] shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span>{feature}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-[#0055FE]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo Upload Zone */}
            <div>
              <label className={labelClass}>
                <span>Upload High Quality Photos</span>
              </label>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className="border-2 border-dashed border-slate-200 hover:border-[#0055FE]/40 rounded-3xl p-8 flex flex-col items-center justify-center transition-all bg-slate-50 cursor-pointer group"
              >
                <UploadCloud className="w-12 h-12 text-slate-300 group-hover:text-[#0055FE] transition-colors mb-3" />
                <p className="text-sm font-bold text-slate-800 mb-1">Drag and drop car photos here</p>
                <p className="text-xs text-slate-400 mb-4">Supported formats: JPG, PNG, WEBP (Max 5MB per file)</p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs"
                >
                  Browse Devices
                </Button>
              </div>
            </div>

            {/* Upload Previews */}
            {uploadedImages.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Uploaded Photos ({uploadedImages.length})
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {uploadedImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-28 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 group shadow-xs"
                    >
                      <img src={img} className="w-full h-full object-cover" alt="Upload preview" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedImages((prev) => prev.filter((_, idx) => idx !== i));
                          setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i));
                        }}
                        className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-rose-50 border border-slate-200 rounded-full text-slate-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Listings with 3 or more photos receive 4x higher buyer responses.
              </span>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
                className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-12 rounded-2xl cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contact
              </Button>

              <Button
                disabled={uploadedImages.length === 0 || isSubmitting}
                onClick={handleSubmitListing}
                className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting Listing…
                  </span>
                ) : (
                  <>
                    <span>Submit Car Listing</span>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS SCREEN */}
        {step === 4 && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-2 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Car Listing Posted Successfully!
            </h2>

            <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Congratulations <strong className="text-slate-900">{formData.sellerName}</strong>, your{" "}
              <strong className="text-slate-900">{formData.year} {getEffectiveMake()} {getEffectiveModel()}</strong> has been submitted. Your listing is currently <strong className="text-[#0055FE]">under verification</strong> and will be shown to customers upon admin approval.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 max-w-md mx-auto text-left space-y-3.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Next Verification Steps
              </h3>
              <div className="flex gap-3 text-xs text-slate-600">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0055FE] font-bold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <span>
                  Our team will contact <strong className="text-slate-900">{formData.sellerPhone}</strong> for vehicle inspection confirmation.
                </span>
              </div>
              <div className="flex gap-3 text-xs text-slate-600">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0055FE] font-bold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <span>
                  Your listing is under verification and will be published on the marketplace once approved by the admin.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center pt-4">
              {onClose ? (
                <Button
                  onClick={onClose}
                  className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer min-w-[140px]"
                >
                  Close
                </Button>
              ) : (
                <Link href={isSellerPortal ? "/seller/cars" : "/seller/dashboard"}>
                  <Button className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer min-w-[140px]">
                    Close
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold animate-in slide-in-from-bottom-4 ${
            toastType === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          {toastMessage}
        </div>
      )}

    </div>
  );
}
