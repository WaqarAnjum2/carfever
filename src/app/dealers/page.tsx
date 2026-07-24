import { getApprovedDealers } from "@/lib/dealer-actions";
import Link from "next/link";
import { Search, MapPin, Star, Building2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Verified Car Dealers | CarFever",
  description: "Browse our network of verified luxury car dealers across Pakistan.",
};

export default async function DealersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; city?: string }>;
}) {
  const { search, city } = await searchParams;
  const dealers = await getApprovedDealers({ search, city });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8F9FA] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Verified <span className="text-[#0055FE]">Dealers</span>
            </h1>
            <p className="text-gray-500 max-w-2xl text-lg">
              Connect with the most trusted luxury car showrooms and authorized dealerships in Pakistan.
            </p>
          </div>
          <Link href="/register/seller" className="shrink-0">
            <button className="h-12 px-6 bg-[#0055FE] hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Become a Dealer
            </button>
          </Link>

        </div>

        {/* Search & Filter */}
        <form className="max-w-3xl mx-auto mb-16 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              name="search"
              defaultValue={search}
              placeholder="Search by dealership name..."
              className="pl-12 h-14 bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE] shadow-sm"
            />
          </div>
          <div className="relative sm:w-48">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              name="city"
              defaultValue={city}
              placeholder="City..."
              className="pl-12 h-14 bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE] shadow-sm"
            />
          </div>
          <button type="submit" className="h-14 px-8 bg-[#0055FE] text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            Search
          </button>
        </form>

        {/* Dealers Grid */}
        {dealers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No dealers found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dealers.map((dealer) => (
              <Link key={dealer.id} href={`/dealers/${dealer.id}`} className="block group">
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 transition-all duration-300 hover:border-[#0055FE]/50 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {dealer.logo_url ? (
                        <img src={dealer.logo_url} alt={dealer.company_name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-[#0055FE] transition-colors">
                          {dealer.company_name}
                        </h3>
                        {dealer.is_verified && (
                          <CheckCircle2 className="w-4 h-4 text-[#0055FE] shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{dealer.city || "Pakistan"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-600 font-medium">
                          <Star className="w-3.5 h-3.5 text-amber-500 mr-1 fill-amber-500" />
                          {dealer.rating_avg > 0 ? dealer.rating_avg.toFixed(1) : "New"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
    <Footer />
  </>
  );
}
