'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Car,
  Tag,
  Fuel,
  RefreshCw,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getAllCarOptionsAdmin,
  createCarOption,
  updateCarOption,
  deleteCarOption,
  type TaxonomyCategory,
} from '@/lib/taxonomy-actions';
import type { DbCarMake, DbCarCity, DbCarBodyType, DbCarFuelType } from '@/lib/supabase/types';

export default function AdminOptionsPage() {
  const [activeTab, setActiveTab] = useState<TaxonomyCategory>('cities');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  // Data states
  const [cities, setCities] = useState<DbCarCity[]>([]);
  const [makes, setMakes] = useState<DbCarMake[]>([]);
  const [bodyTypes, setBodyTypes] = useState<DbCarBodyType[]>([]);
  const [fuelTypes, setFuelTypes] = useState<DbCarFuelType[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllCarOptionsAdmin();
      setCities(res.cities);
      setMakes(res.makes);
      setBodyTypes(res.bodyTypes);
      setFuelTypes(res.fuelTypes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load options data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditItem(null);
    setFormName('');
    setFormRegion('');
    setFormLogoUrl('');
    setFormIcon('');
    setFormDisplayOrder(getCurrentListLength() + 1);
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    setFormName(item.name);
    setFormRegion(item.region || '');
    setFormLogoUrl(item.logo_url || '');
    setFormIcon(item.icon || '');
    setFormDisplayOrder(item.display_order || 0);
    setFormIsActive(item.is_active);
    setModalOpen(true);
  };

  const getCurrentListLength = () => {
    switch (activeTab) {
      case 'cities': return cities.length;
      case 'makes': return makes.length;
      case 'bodyTypes': return bodyTypes.length;
      case 'fuelTypes': return fuelTypes.length;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Name is required');
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        await updateCarOption(activeTab, editItem.id, {
          name: formName.trim(),
          region: formRegion.trim() || undefined,
          logo_url: formLogoUrl.trim() || undefined,
          icon: formIcon.trim() || undefined,
          display_order: Number(formDisplayOrder),
          is_active: formIsActive,
        });
        showSuccess('Option updated successfully!');
      } else {
        await createCarOption(activeTab, {
          name: formName.trim(),
          region: formRegion.trim() || undefined,
          logo_url: formLogoUrl.trim() || undefined,
          icon: formIcon.trim() || undefined,
          display_order: Number(formDisplayOrder),
          is_active: formIsActive,
        });
        showSuccess('New option created successfully!');
      }
      setModalOpen(false);
      // Clear localStorage cache so front-end picks up new data instantly
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cf_car_options_cache_v1');
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save option');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: any) => {
    try {
      await updateCarOption(activeTab, item.id, {
        is_active: !item.is_active,
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cf_car_options_cache_v1');
      }
      showSuccess(`Status for "${item.name}" updated!`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCarOption(activeTab, item.id);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cf_car_options_cache_v1');
      }
      showSuccess(`"${item.name}" deleted successfully.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete option');
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Filtered List calculation
  const getFilteredItems = () => {
    let list: any[] = [];
    switch (activeTab) {
      case 'cities': list = cities; break;
      case 'makes': list = makes; break;
      case 'bodyTypes': list = bodyTypes; break;
      case 'fuelTypes': list = fuelTypes; break;
    }

    if (!search.trim()) return list;
    const query = search.toLowerCase().trim();
    return list.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      (item.region && item.region.toLowerCase().includes(query))
    );
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0055FE] uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" /> Taxonomy & Data Options
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Car Options & UK Cities Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage database options for UK Cities, Car Makes, Body Types, and Fuel Types. Changes sync instantly to search filters and listing pages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            disabled={loading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-3 rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          <Button
            onClick={openAddModal}
            className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'cities' ? 'UK City' : activeTab === 'makes' ? 'Car Make' : activeTab === 'bodyTypes' ? 'Body Type' : 'Fuel Type'}
          </Button>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* ── TAB BAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => { setActiveTab('cities'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cities'
                ? 'bg-[#0055FE] text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>UK Cities</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'cities' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {cities.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('makes'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'makes'
                ? 'bg-[#0055FE] text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Car Makes / Brands</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'makes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {makes.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('bodyTypes'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bodyTypes'
                ? 'bg-[#0055FE] text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Body Types</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'bodyTypes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {bodyTypes.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('fuelTypes'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'fuelTypes'
                ? 'bg-[#0055FE] text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Fuel className="w-4 h-4" />
            <span>Fuel Types</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'fuelTypes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {fuelTypes.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0055FE]"
          />
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#0055FE]" />
            Loading {activeTab} from database…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No items found in this section. Click &quot;Add New&quot; above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5"># Order</th>
                  <th className="px-5 py-3.5">Name</th>
                  {activeTab === 'cities' && <th className="px-5 py-3.5">Region</th>}
                  {activeTab === 'makes' && <th className="px-5 py-3.5">Logo URL</th>}
                  {activeTab === 'bodyTypes' && <th className="px-5 py-3.5">Icon</th>}
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-400 w-16">
                      {item.display_order || 0}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-900">
                      {item.name}
                    </td>
                    {activeTab === 'cities' && (
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {item.region || '—'}
                      </td>
                    )}
                    {activeTab === 'makes' && (
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                        {item.logo_url || '—'}
                      </td>
                    )}
                    {activeTab === 'bodyTypes' && (
                      <td className="px-5 py-3.5 text-slate-900 font-bold">
                        {item.icon || '🚗'}
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          item.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {item.is_active ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{item.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(item)}
                        className="h-8 px-2.5 text-slate-600 hover:text-[#0055FE] hover:bg-blue-50 font-bold text-xs rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item)}
                        className="h-8 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 fade-in duration-200">
            <h2 className="text-lg font-black text-slate-900 mb-1">
              {editItem ? 'Edit Option' : 'Add New Option'}
            </h2>
            <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider font-bold">
              Category: {activeTab}
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={`e.g. ${activeTab === 'cities' ? 'Oxford' : activeTab === 'makes' ? 'Lucid' : 'Crossover'}`}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                />
              </div>

              {activeTab === 'cities' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Region (Optional)
                  </label>
                  <input
                    type="text"
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    placeholder="e.g. South East / Scotland"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                  />
                </div>
              )}

              {activeTab === 'makes' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Logo Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formLogoUrl}
                    onChange={(e) => setFormLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                  />
                </div>
              )}

              {activeTab === 'bodyTypes' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Icon Emoji / Symbol
                  </label>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="e.g. 🚙"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Active Status
                  </label>
                  <select
                    value={formIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormIsActive(e.target.value === 'active')}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-slate-200 text-slate-600 font-bold text-xs h-9 px-4 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-md shadow-blue-500/20"
                >
                  {saving ? 'Saving…' : editItem ? 'Update Option' : 'Create Option'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
