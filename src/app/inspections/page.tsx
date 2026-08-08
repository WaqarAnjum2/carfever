"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  Car,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Wrench,
  Award,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { submitInspectionBooking } from "@/lib/server-actions";
import { useCarOptions } from "@/lib/hooks/use-car-options";

export default function InspectionsPage() {
  const { makeNames } = useCarOptions();
  const makesList = makeNames;
  const [bookingStarted, setBookingStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    regNumber: "",
    address: "",
    plan: "standard",
    date: "",
    timeSlot: "morning",
    name: "",
    phone: "",
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectPlan = (planKey: string) => {
    setFormData(prev => ({ ...prev, plan: planKey }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmitBooking = async () => {
    setSubmitting(true);
    try {
      const result = await submitInspectionBooking({
        make: formData.make,
        model: formData.model,
        year: formData.year,
        registrationNumber: formData.regNumber,
        address: formData.address,
        plan: formData.plan as 'basic' | 'standard' | 'premium',
        date: formData.date,
        timeSlot: formData.timeSlot,
        customerName: formData.name,
        customerPhone: formData.phone,
      });

      if (result.success) {
        setBookingId(result.inspectionId || null);
        nextStep();
      } else {
        showToast(result.error || "Failed to submit booking", "error");
      }
    } catch (error) {
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const isStep1Valid = formData.make && formData.model && formData.year && formData.regNumber && formData.address;
  const isStep3Valid = formData.date && formData.timeSlot && formData.name && formData.phone;

  const plans = [
    {
      key: "basic",
      title: "Basic Inspection",
      price: "PKR 3,500",
      points: "75+ Points Check",
      features: [
        "Engine oil & fluid levels check",
        "Basic paint & body panel check",
        "Suspension & tire wear check",
        "Road test check"
      ],
      accentColor: "gray"
    },
    {
      key: "standard",
      title: "Standard Inspection",
      price: "PKR 5,500",
      points: "150+ Points Check",
      features: [
        "Complete engine & transmission diagnostics",
        "Paint thickness testing (accident check)",
        "Interior electrical & climate control check",
        "Detailed undercarriage inspection",
        "Comprehensive digital report"
      ],
      accentColor: "blue"
    },
    {
      key: "premium",
      title: "Premium Inspection",
      price: "PKR 8,500",
      points: "220+ Points Check",
      features: [
        "Everything in Standard Plan",
        "Computer OBD-II fault scan report",
        "Hybrid battery health diagnostic",
        "Engine compression check",
        "Official road-worthiness certificate",
        "Priority 4-hour report delivery"
      ],
      accentColor: "orange"
    }
  ];

  // Shared input classes
  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] focus:border-[#0055FE] transition-all";
  const selectClass = "w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0055FE] focus:border-[#0055FE] transition-all cursor-pointer min-h-[44px]";
  const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 lg:pt-24 pb-20 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {!bookingStarted ? (
            /* INSPECTIONS LANDING PAGE */
            <div className="flex flex-col items-center justify-center text-center mt-12 mb-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#0055FE]/10 blur-xl rounded-full scale-125" />
                <ShieldCheck className="relative w-20 h-20 text-[#0055FE] opacity-90" />
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Car Fever <span className="text-[#0055FE]">Inspections</span>
              </h1>
              <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
                Book Pakistan&apos;s most reliable 200+ point doorstep vehicle check. Our certified mechanics inspect body paint, engine, chassis, and electronics to ensure you never buy a lemon.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto text-left mb-16">
                {[
                  { title: "Engine & Gearbox Check", desc: "Compression, mountings, leakage, oil condition and transmission shifts checks." },
                  { title: "Paint & Chassis History", desc: "Digital magnetic paint gauge check to identify hidden accidents and repainted panels." },
                  { title: "Suspension & Steering", desc: "Shock absorbers, bushings, tie rods, and steering rack play test." },
                  { title: "Electrical Systems", desc: "Starter motor, alternator health, sensors, dashboard lights, and battery test." },
                  { title: "Computer OBD Scanner", desc: "Advanced OBD-II scan to detect hidden ECU trouble codes and mileage tampering." },
                  { title: "Comprehensive Road Test", desc: "Real-world test drive checking braking response, wheel alignment, and engine power." }
                ].map((item) => (
                  <div key={item.title} className="flex flex-col gap-2 bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#0055FE]/30 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-[#00B67A] shrink-0" />
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed pl-7">{item.desc}</p>
                  </div>
                ))}
              </div>

              <Button 
                size="lg" 
                onClick={() => setBookingStarted(true)}
                className="bg-[#0055FE] hover:bg-blue-700 text-white px-12 h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all duration-300"
              >
                Book an Inspection
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          ) : (
            /* BOOKING FLOW CONTENT */
            <div className="max-w-4xl mx-auto">
              
              {/* Form Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Vehicle Inspection</h1>
                <p className="text-gray-500 text-sm">Schedule a professional check at your doorstep.</p>
              </div>

              {/* Progress Steps */}
              {step <= 3 && (
                <div className="mb-10 bg-white border border-gray-200 rounded-2xl p-4 sm:px-8 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      step >= 1 ? "bg-[#0055FE] text-white" : "bg-gray-100 text-gray-400"
                    }`}>1</div>
                    <span className={`text-xs sm:text-sm font-semibold hidden xs:inline ${
                      step === 1 ? "text-gray-900" : "text-gray-400"
                    }`}>Vehicle</span>
                  </div>
                  <div className="h-px bg-gray-200 flex-1 mx-4" />
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      step >= 2 ? "bg-[#0055FE] text-white" : "bg-gray-100 text-gray-400"
                    }`}>2</div>
                    <span className={`text-xs sm:text-sm font-semibold hidden xs:inline ${
                      step === 2 ? "text-gray-900" : "text-gray-400"
                    }`}>Plan</span>
                  </div>
                  <div className="h-px bg-gray-200 flex-1 mx-4" />
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      step >= 3 ? "bg-[#0055FE] text-white" : "bg-gray-100 text-gray-400"
                    }`}>3</div>
                    <span className={`text-xs sm:text-sm font-semibold hidden xs:inline ${
                      step === 3 ? "text-gray-900" : "text-gray-400"
                    }`}>Schedule</span>
                  </div>
                </div>
              )}

              {/* Form Panel */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-sm">

                {/* STEP 1: Vehicle & Address details */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Car className="w-5 h-5 text-[#0055FE]" /> Vehicle & Inspection Location
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Car Brand / Make</label>
                        <select name="make" value={formData.make} onChange={handleInputChange} className={selectClass}>
                          <option value="" disabled>Select Make</option>
                          {makesList.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Model</label>
                        <input type="text" name="model" placeholder="e.g. Corolla, Civic" value={formData.model} onChange={handleInputChange} className={inputClass} />
                      </div>

                      <div>
                        <label className={labelClass}>Model Year</label>
                        <select name="year" value={formData.year} onChange={handleInputChange} className={selectClass}>
                          <option value="" disabled>Select Year</option>
                          {Array.from({ length: 15 }).map((_, i) => {
                            const yr = 2025 - i;
                            return <option key={yr} value={yr}>{yr}</option>;
                          })}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Registration Number</label>
                        <input type="text" name="regNumber" placeholder="e.g. LE-1234 or Karachi-987" value={formData.regNumber} onChange={handleInputChange} className={inputClass} />
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <label className={labelClass}>Inspection Address</label>
                        <textarea 
                          name="address" 
                          rows={3}
                          placeholder="Provide the exact address where the car is parked for inspection..." 
                          value={formData.address}
                          onChange={handleInputChange}
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-gray-100">
                      <Button 
                        variant="outline"
                        onClick={() => setBookingStarted(false)}
                        className="border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 w-full sm:w-auto h-12"
                      >
                        Cancel
                      </Button>
                      <Button 
                        disabled={!isStep1Valid}
                        onClick={nextStep}
                        className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 transition-colors w-full sm:w-auto"
                      >
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Select plan */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#0055FE]" /> Select Inspection Plan
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {plans.map((p) => {
                        const isSelected = formData.plan === p.key;
                        const borderColor = isSelected
                          ? p.accentColor === "orange" ? "border-[#FF6B00] shadow-md shadow-orange-100"
                          : p.accentColor === "blue" ? "border-[#0055FE] shadow-md shadow-blue-100"
                          : "border-gray-400 shadow-md"
                          : "border-gray-200 hover:border-gray-300";

                        const checkColor = isSelected
                          ? p.accentColor === "orange" ? "bg-[#FF6B00] border-[#FF6B00] text-white"
                          : p.accentColor === "blue" ? "bg-[#0055FE] border-[#0055FE] text-white"
                          : "bg-gray-700 border-gray-700 text-white"
                          : "border-gray-300";

                        const featureColor = p.accentColor === "orange" ? "text-[#FF6B00]" 
                          : p.accentColor === "blue" ? "text-[#0055FE]" 
                          : "text-[#00B67A]";
                        
                        return (
                          <div 
                            key={p.key}
                            onClick={() => selectPlan(p.key)}
                            className={`rounded-2xl p-6 border cursor-pointer flex flex-col justify-between transition-all duration-300 active:scale-[0.98] bg-white ${borderColor} ${isSelected ? "scale-[1.01]" : ""}`}
                          >
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-gray-900 text-base">{p.title}</h3>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${checkColor}`}>
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                                </div>
                              </div>
                              <p className="text-xl font-extrabold text-gray-900 mb-1">{p.price}</p>
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-4">{p.points}</span>
                              
                              <ul className="space-y-2 mb-6">
                                {p.features.map((feat, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-normal">
                                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${featureColor}`} />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-gray-100">
                      <Button 
                        variant="outline"
                        onClick={prevStep}
                        className="border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 w-full sm:w-auto h-12"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button 
                        onClick={nextStep}
                        className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 transition-colors w-full sm:w-auto"
                      >
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Schedule & Contact details */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#0055FE]" /> Inspection Schedule
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Select Date</label>
                        <input 
                          type="date" 
                          name="date" 
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.date}
                          onChange={handleInputChange}
                          className={`${inputClass} min-h-[44px] cursor-pointer`}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Preferred Time Slot</label>
                        <select name="timeSlot" value={formData.timeSlot} onChange={handleInputChange} className={selectClass}>
                          <option value="morning">Morning (10:00 AM - 01:00 PM)</option>
                          <option value="afternoon">Afternoon (01:00 PM - 04:00 PM)</option>
                          <option value="evening">Evening (04:00 PM - 07:00 PM)</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Your Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="text" name="name" placeholder="e.g. Muhammad Bilal" value={formData.name} onChange={handleInputChange} className={`${inputClass} pl-11 min-h-[44px]`} />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="tel" name="phone" placeholder="e.g. 03211234567" value={formData.phone} onChange={handleInputChange} className={`${inputClass} pl-11 min-h-[44px]`} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-gray-100">
                      <Button 
                        variant="outline"
                        onClick={prevStep}
                        className="border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 w-full sm:w-auto h-12"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button
                        disabled={!isStep3Valid || submitting}
                        onClick={handleSubmitBooking}
                        className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 transition-colors w-full sm:w-auto"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</span>
                        ) : (
                          <span className="flex items-center gap-2">Confirm Booking <CheckCircle2 className="w-4 h-4" /></span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Success Confirmed screen */}
                {step === 4 && (
                  <div className="text-center py-10 space-y-6 animate-in fade-in duration-300">
                    <div className="w-20 h-20 bg-[#00B67A]/10 border border-[#00B67A]/30 text-[#00B67A] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <ShieldCheck className="w-12 h-12" />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Inspection Booked!</h2>
                    
                    <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                      Thank you <span className="text-gray-900 font-bold">{formData.name}</span>! Your inspection booking for <span className="text-gray-900 font-bold">{formData.year} {formData.make} {formData.model}</span> is confirmed.
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3.5">
                      <div className="flex justify-between border-b border-gray-100 pb-2.5">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Booking ID</span>
                        <span className="text-[#0055FE] font-bold text-sm font-mono">
                          {bookingId ? `CF-${bookingId.slice(0, 8).toUpperCase()}` : 'PROCESSING...'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2.5">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Selected Plan</span>
                        <span className="text-gray-900 font-semibold text-sm capitalize">{formData.plan} Plan</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2.5">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Date & Time</span>
                        <span className="text-gray-900 font-semibold text-sm">{formData.date} ({formData.timeSlot})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Location</span>
                        <span className="text-gray-900 text-xs font-semibold max-w-[200px] text-right truncate">{formData.address}</span>
                      </div>
                    </div>

                    <div className="pt-4 text-xs text-gray-500 max-w-md mx-auto">
                      Our inspector will call you at <strong className="text-gray-700">{formData.phone}</strong> before arriving at the location.
                    </div>

                    <div className="pt-6">
                      <Button 
                        onClick={() => {
                          setBookingStarted(false);
                          setStep(1);
                          setFormData({
                            make: "",
                            model: "",
                            year: "",
                            regNumber: "",
                            address: "",
                            plan: "standard",
                            date: "",
                            timeSlot: "morning",
                            name: "",
                            phone: "",
                          });
                        }}
                        className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold px-8 h-12"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* Toast */}
          {toastMessage && (
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-4 ${
              toastType === "success"
                ? "bg-[#00B67A]/10 border-[#00B67A]/30 text-[#00B67A]"
                : "bg-red-50 border-red-200 text-red-600"
            }`}>
              {toastType === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {toastMessage}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
