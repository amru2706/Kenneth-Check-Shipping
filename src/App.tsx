import React, { useState, useEffect } from 'react';
import { Package, Search, Truck, MapPin, Calendar, Clock, AlertCircle, CheckCircle2, PackageSearch, Image as ImageIcon, X, History, Share2, Printer, Copy, Check, Sun, Moon, Bell, Phone, Mail, Globe, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

const COURIERS = [
  { id: 'sicepat', name: 'SiCepat Express' },
  { id: 'spx', name: 'Shopee Express (SPX)' },
  { id: 'jnt', name: 'J&T Express' },
  { id: 'jne', name: 'JNE' },
  { id: 'anteraja', name: 'AnterAja' },
  { id: 'ninja', name: 'Ninja Xpress' },
  { id: 'lion', name: 'Lion Parcel' },
  { id: 'idexpress', name: 'ID Express' },
  { id: 'pos', name: 'POS Indonesia' },
  { id: 'tiki', name: 'TIKI' },
];

const COURIER_CONTACTS: Record<string, { phone: string, email: string, website: string }> = {
  'sicepat': { phone: '021-5020-0050', email: 'customer.care@sicepat.com', website: 'https://www.sicepat.com' },
  'jnt': { phone: '021-8066-1888', email: 'jntcallcenter@jet.co.id', website: 'https://www.jet.co.id' },
  'jne': { phone: '(021) 2927 8888', email: 'customercare@jne.co.id', website: 'https://www.jne.co.id' },
  'anteraja': { phone: '(021) 5060 3333', email: 'cs@anteraja.id', website: 'https://anteraja.id' },
  'ninja': { phone: '+62 21 2926 4120', email: 'support_id@ninjavan.co', website: 'https://www.ninjavan.co/id-id' },
  'lion': { phone: '+62 21 8082 0072', email: 'customer.care@lionparcel.com', website: 'https://lionparcel.com' },
  'idexpress': { phone: '(021) 8081 1111', email: 'info@idexpress.com', website: 'https://idexpress.com' },
  'pos': { phone: '1500161', email: 'halopos@posindonesia.co.id', website: 'https://www.posindonesia.co.id' },
  'tiki': { phone: '1500125', email: 'csr@tiki.id', website: 'https://tiki.id' },
  'spx': { phone: '1500702', email: 'help@support.shopee.co.id', website: 'https://spx.co.id' }
};

interface TrackingHistory {
  date: string;
  desc: string;
  location: string;
}

interface TrackingData {
  status: number;
  message: string;
  data?: {
    summary: {
      awb: string;
      courier: string;
      service: string;
      status: string;
      date: string;
      desc: string;
      amount: string;
      weight: string;
      pod?: string;
      image?: string;
    };
    detail: {
      origin: string;
      destination: string;
      shipper: string;
      receiver: string;
      pod?: string;
    };
    history: TrackingHistory[];
  };
}

interface RecentSearch {
  awb: string;
  courier: string;
  timestamp: number;
  label?: string;
}

export default function App() {
  const [awb, setAwb] = useState('');
  const [courier, setCourier] = useState('sicepat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData['data'] | null>(null);
  const [showPodModal, setShowPodModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [copied, setCopied] = useState(false);
  const [editingLabelAwb, setEditingLabelAwb] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Notifikasi diaktifkan! Anda akan menerima pemberitahuan saat paket sampai.');
      } else {
        alert('Izin notifikasi ditolak. Anda dapat mengubahnya di pengaturan browser.');
      }
    } else {
      alert('Browser Anda tidak mendukung fitur notifikasi.');
    }
  };

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const saveRecentSearch = (searchAwb: string, searchCourier: string) => {
    const existing = recentSearches.find(s => s.awb === searchAwb);
    const newSearch: RecentSearch = { 
      awb: searchAwb, 
      courier: searchCourier, 
      timestamp: Date.now(),
      label: existing?.label 
    };
    const filtered = recentSearches.filter(s => s.awb !== searchAwb);
    const updated = [newSearch, ...filtered].slice(0, 10); // Simpan hingga 10 pencarian
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const updateSearchLabel = (searchAwb: string, label: string) => {
    const updated = recentSearches.map(s => s.awb === searchAwb ? { ...s, label } : s);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setEditingLabelAwb(null);
  };

  const removeSearch = (searchAwb: string) => {
    const updated = recentSearches.filter(s => s.awb !== searchAwb);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleTrack = async (e?: React.FormEvent, searchAwb?: string, searchCourier?: string) => {
    if (e) e.preventDefault();
    
    const targetAwb = searchAwb || awb;
    const targetCourier = searchCourier || courier;

    if (!targetAwb.trim()) return;

    setLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const apiKey = import.meta.env.VITE_BINDERBYTE_API_KEY;
      
      if (!apiKey) {
        setError('API Key tidak ditemukan. Pastikan Anda telah mengatur VITE_BINDERBYTE_API_KEY di environment variables.');
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response;
      try {
        response = await fetch(`https://api.binderbyte.com/v1/track?api_key=${apiKey}&courier=${targetCourier}&awb=${targetAwb}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error('TIMEOUT');
        }
        throw new Error('NETWORK_ERROR');
      }

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.status === 200) {
        if (data.data && data.data.summary) {
          setTrackingData(data.data);
          saveRecentSearch(targetAwb, targetCourier);
          if (searchAwb) {
            setAwb(targetAwb);
            setCourier(targetCourier);
          }
          
          // Notifikasi jika paket sudah sampai
          if (data.data.summary.status === 'DELIVERED') {
            showNotification('Paket Telah Sampai!', `Paket Anda dengan resi ${targetAwb} telah berhasil dikirim.`);
          }
        } else {
          setError('Data pelacakan tidak lengkap dari server BinderByte.');
        }
      } else {
        setError(data.message || 'Gagal melacak resi. Pastikan nomor resi dan kurir benar.');
      }
    } catch (err: any) {
      console.error('Tracking Error:', err);
      if (err.message === 'TIMEOUT') {
        setError('Koneksi terputus (Timeout). Server BinderByte terlalu lama merespon.');
      } else if (err.message === 'NETWORK_ERROR') {
        setError('Gagal terhubung ke server. Periksa koneksi internet Anda atau matikan AdBlock jika ada.');
      } else {
        setError('Terjadi kesalahan sistem saat memproses data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAwb = () => {
    if (trackingData?.summary?.awb) {
      navigator.clipboard.writeText(trackingData.summary.awb);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share && trackingData) {
      navigator.share({
        title: 'Status Pengiriman Paket',
        text: `Paket ${trackingData.summary.courier.toUpperCase()} (${trackingData.summary.awb}) - Status: ${trackingData.summary.status}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Fitur share tidak didukung di browser ini.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('delivered') || s.includes('selesai')) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    if (s.includes('process') || s.includes('transit') || s.includes('on process')) return 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    if (s.includes('problem') || s.includes('failed') || s.includes('return')) return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getCourierName = (id: string) => COURIERS.find(c => c.id === id)?.name || id.toUpperCase();

  const podUrl = trackingData?.summary?.pod || trackingData?.summary?.image || trackingData?.detail?.pod;
  const isPodUrlValid = podUrl && typeof podUrl === 'string' && podUrl.startsWith('http');
  
  const latestLocation = trackingData?.history[0]?.location || trackingData?.detail?.destination || trackingData?.detail?.origin || '';
  const mapQuery = encodeURIComponent(latestLocation ? `${latestLocation}, Indonesia` : 'Indonesia');
  const courierContact = trackingData ? COURIER_CONTACTS[trackingData.summary.courier.toLowerCase()] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100 transition-colors duration-300">
      {/* Header - Hidden on Print */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 print:hidden transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-sm">
              <PackageSearch className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CekResi Pro</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={requestNotificationPermission}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Aktifkan Notifikasi"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section - Hidden on Print */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-10 mb-8 print:hidden relative overflow-hidden transition-colors duration-300">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="text-center mb-10 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Lacak Paket Anda</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
              Pantau status pengiriman paket dari berbagai ekspedisi di Indonesia secara real-time dan akurat.
            </p>
          </div>

          <form onSubmit={(e) => handleTrack(e)} className="max-w-3xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <label htmlFor="awb" className="sr-only">Nomor Resi</label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  id="awb"
                  value={awb}
                  onChange={(e) => setAwb(e.target.value)}
                  placeholder="Masukkan nomor resi..."
                  className="block w-full pl-12 pr-4 py-4 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-base shadow-sm bg-white dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>
              
              <div className="md:w-56 relative">
                <label htmlFor="courier" className="sr-only">Kurir</label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Truck className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <select
                  id="courier"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="block w-full pl-12 pr-10 py-4 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all appearance-none bg-white dark:bg-slate-800 text-base shadow-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {COURIERS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !awb.trim()}
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Search className="w-5 h-5 mr-2" />
                )}
                Lacak Paket
              </button>
            </div>
          </form>

          {/* Advanced Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="max-w-3xl mx-auto mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <History className="w-4 h-4" />
                  <span>Riwayat Pencarian Lanjutan</span>
                </div>
                {recentSearches.length > 1 && (
                  <button 
                    onClick={() => { setRecentSearches([]); localStorage.removeItem('recentSearches'); }}
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition-colors"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentSearches.map((search, idx) => (
                  <div key={`${search.awb}-${idx}`} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                    <div className="flex justify-between items-start mb-2">
                      <button
                        onClick={() => handleTrack(undefined, search.awb, search.courier)}
                        className="text-left flex-1"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="uppercase text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                            {search.courier}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(search.timestamp).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{search.awb}</p>
                      </button>
                      <div className="flex gap-1 ml-2">
                        <button 
                          onClick={() => { setEditingLabelAwb(search.awb); setEditLabelValue(search.label || ''); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors"
                          title="Beri Nama/Label"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => removeSearch(search.awb)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                          title="Hapus Riwayat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    {editingLabelAwb === search.awb ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          value={editLabelValue}
                          onChange={(e) => setEditLabelValue(e.target.value)}
                          placeholder="Nama paket..."
                          className="flex-1 text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') updateSearchLabel(search.awb, editLabelValue); }}
                        />
                        <button 
                          onClick={() => updateSearchLabel(search.awb, editLabelValue)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Simpan
                        </button>
                      </div>
                    ) : (
                      search.label && (
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 truncate">
                          🏷️ {search.label}
                        </p>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 max-w-3xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {trackingData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Summary & Contact Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Informasi Pengiriman</h3>
                      <div className="flex gap-2 print:hidden">
                        <button onClick={handleShare} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:hover:text-blue-400 rounded-lg transition-colors" title="Bagikan">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={handlePrint} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:hover:text-blue-400 rounded-lg transition-colors" title="Cetak">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nomor Resi</p>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="font-mono font-bold text-slate-900 dark:text-white text-lg">{trackingData.summary.awb}</p>
                          <button 
                            onClick={handleCopyAwb}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:hover:text-blue-400 rounded-md transition-colors print:hidden"
                            title="Salin Resi"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Kurir</p>
                          <p className="font-bold text-slate-900 dark:text-white">{getCourierName(trackingData.summary.courier)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Layanan</p>
                          <p className="font-bold text-slate-900 dark:text-white">{trackingData.summary.service || 'Reguler / Standar'}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Status Saat Ini</p>
                        <div className={cn(
                          "inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border w-full",
                          getStatusColor(trackingData.summary.status)
                        )}>
                          {trackingData.summary.status === 'DELIVERED' ? (
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                          ) : (
                            <Truck className="w-5 h-5 mr-2" />
                          )}
                          {trackingData.summary.status}
                        </div>
                      </div>

                      {/* Estimasi Sampai */}
                      {trackingData.summary.status !== 'DELIVERED' && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Estimasi Sampai</p>
                          <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 px-3 py-2.5 rounded-xl">
                            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                            <div>
                              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">2 - 3 Hari Kerja</p>
                              <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70">Sejak tanggal pengiriman</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isPodUrlValid && (
                        <div className="pt-2 print:hidden">
                          <button
                            onClick={() => setShowPodModal(true)}
                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 transition-all"
                          >
                            <ImageIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                            Lihat Bukti Pengiriman
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-white dark:bg-slate-900">
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="mt-1">
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pengirim</p>
                          <p className="font-bold text-slate-900 dark:text-white text-base">{trackingData.detail.shipper}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{trackingData.detail.origin}</p>
                        </div>
                      </div>

                      <div className="relative ml-5 border-l-2 border-dashed border-slate-200 dark:border-slate-700 h-8 my-2"></div>

                      <div className="flex gap-4">
                        <div className="mt-1">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Penerima</p>
                          <p className="font-bold text-slate-900 dark:text-white text-base">{trackingData.detail.receiver}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{trackingData.detail.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Courier Contact Card */}
                {courierContact && (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 print:hidden">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Kontak {getCourierName(trackingData.summary.courier)}</h3>
                    <div className="space-y-3">
                      <a href={`tel:${courierContact.phone}`} className="flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/50">
                        <Phone className="w-4 h-4 text-slate-400 mr-3" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{courierContact.phone}</span>
                      </a>
                      <a href={`mailto:${courierContact.email}`} className="flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/50">
                        <Mail className="w-4 h-4 text-slate-400 mr-3" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{courierContact.email}</span>
                      </a>
                      <a href={courierContact.website} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/50">
                        <Globe className="w-4 h-4 text-slate-400 mr-3" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Kunjungi Website</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline & Map Card */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Map Integration */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden print:hidden h-64 relative">
                  <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Lokasi: {latestLocation || 'Indonesia'}</span>
                  </div>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0} 
                    referrerPolicy="no-referrer"
                    src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    className="grayscale-[20%] contrast-[110%] dark:invert dark:hue-rotate-180 dark:opacity-80"
                  ></iframe>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Riwayat Perjalanan</h3>
                  
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute top-5 bottom-5 left-[1.35rem] w-0.5 bg-slate-200 dark:bg-slate-700"></div>

                    <div className="space-y-8 relative">
                      {trackingData.history.map((item, index) => {
                        const isFirst = index === 0;
                        const isDelivered = isFirst && trackingData.summary.status === 'DELIVERED';

                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={index} 
                            className="flex gap-5 sm:gap-8 relative"
                          >
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-11 h-11 rounded-full flex items-center justify-center z-10 border-4 border-white dark:border-slate-900 shadow-sm",
                                isDelivered ? "bg-emerald-500 text-white" : 
                                isFirst ? "bg-blue-600 text-white" : 
                                "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-50 dark:border-slate-800"
                              )}>
                                {isDelivered ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : isFirst ? (
                                  <Truck className="w-5 h-5" />
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                )}
                              </div>
                            </div>

                            <div className={cn(
                              "flex-1 pt-2 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0",
                              isFirst ? "opacity-100" : "opacity-80"
                            )}>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                <p className={cn(
                                  "text-base",
                                  isFirst ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"
                                )}>
                                  {item.desc}
                                </p>
                                <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                  <Calendar className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                                </div>
                              </div>
                              
                              {item.location && (
                                <div className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
                                  <MapPin className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                                  {item.location}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* POD Modal - Hidden on Print */}
      <AnimatePresence>
        {showPodModal && isPodUrlValid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPodModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Bukti Pengiriman (POD)
                </h3>
                <button
                  onClick={() => setShowPodModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-auto flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 min-h-[300px]">
                <img
                  src={podUrl}
                  alt="Bukti Pengiriman"
                  className="max-w-full h-auto rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<div class="text-center"><p class="text-slate-500 dark:text-slate-400 font-medium mb-2">Gambar tidak dapat dimuat</p><p class="text-sm text-slate-400 dark:text-slate-500">Tautan gambar mungkin telah kadaluarsa atau diblokir oleh server.</p></div>');
                  }}
                />
              </div>
              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
                <a
                  href={podUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                >
                  Buka di Tab Baru
                </a>
                <button
                  onClick={() => setShowPodModal(false)}
                  className="inline-flex items-center px-5 py-2.5 border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
