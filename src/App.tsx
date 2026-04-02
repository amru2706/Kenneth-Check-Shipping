/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Package, Search, Truck, MapPin, Calendar, Clock, AlertCircle, CheckCircle2, PackageSearch, Image as ImageIcon, X, History, Share2, Printer, Copy, Check } from 'lucide-react';
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

  const saveRecentSearch = (searchAwb: string, searchCourier: string) => {
    const newSearch = { awb: searchAwb, courier: searchCourier, timestamp: Date.now() };
    const filtered = recentSearches.filter(s => s.awb !== searchAwb);
    const updated = [newSearch, ...filtered].slice(0, 5);
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
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 detik timeout

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
    if (s.includes('delivered') || s.includes('selesai')) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (s.includes('process') || s.includes('transit') || s.includes('on process')) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (s.includes('problem') || s.includes('failed') || s.includes('return')) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900">
      {/* Header - Hidden on Print */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-sm">
              <PackageSearch className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">CekResi Pro</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section - Hidden on Print */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-8 print:hidden relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="text-center mb-10 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Lacak Paket Anda</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              Pantau status pengiriman paket dari berbagai ekspedisi di Indonesia secara real-time dan akurat.
            </p>
          </div>

          <form onSubmit={(e) => handleTrack(e)} className="max-w-3xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <label htmlFor="awb" className="sr-only">Nomor Resi</label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="awb"
                  value={awb}
                  onChange={(e) => setAwb(e.target.value)}
                  placeholder="Masukkan nomor resi..."
                  className="block w-full pl-12 pr-4 py-4 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base shadow-sm bg-white"
                  required
                />
              </div>
              
              <div className="md:w-56 relative">
                <label htmlFor="courier" className="sr-only">Kurir</label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Truck className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  id="courier"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="block w-full pl-12 pr-10 py-4 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white text-base shadow-sm font-medium text-slate-700"
                >
                  {COURIERS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="max-w-3xl mx-auto mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-500">
                <History className="w-4 h-4" />
                <span>Pencarian Terakhir</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, idx) => (
                  <button
                    key={`${search.awb}-${idx}`}
                    onClick={() => handleTrack(undefined, search.awb, search.courier)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-colors border border-slate-200/60"
                  >
                    <span className="uppercase text-xs font-bold text-blue-600 mr-2 bg-blue-100 px-1.5 py-0.5 rounded">
                      {search.courier}
                    </span>
                    {search.awb}
                  </button>
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
                className="mt-6 max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
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
              {/* Summary Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900">Informasi Pengiriman</h3>
                      <div className="flex gap-2 print:hidden">
                        <button onClick={handleShare} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Bagikan">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={handlePrint} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Cetak">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nomor Resi</p>
                        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                          <p className="font-mono font-bold text-slate-900 text-lg">{trackingData.summary.awb}</p>
                          <button 
                            onClick={handleCopyAwb}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors print:hidden"
                            title="Salin Resi"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kurir</p>
                          <p className="font-bold text-slate-900">{getCourierName(trackingData.summary.courier)}</p>
                        </div>
                        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Layanan</p>
                          <p className="font-bold text-slate-900">{trackingData.summary.service}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status Saat Ini</p>
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

                      {isPodUrlValid && (
                        <div className="pt-2 print:hidden">
                          <button
                            onClick={() => setShowPodModal(true)}
                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-slate-200 shadow-sm text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                          >
                            <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                            Lihat Bukti Pengiriman
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-white">
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="mt-1">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pengirim</p>
                          <p className="font-bold text-slate-900 text-base">{trackingData.detail.shipper}</p>
                          <p className="text-sm text-slate-600 mt-0.5">{trackingData.detail.origin}</p>
                        </div>
                      </div>

                      <div className="relative ml-5 border-l-2 border-dashed border-slate-200 h-8 my-2"></div>

                      <div className="flex gap-4">
                        <div className="mt-1">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Penerima</p>
                          <p className="font-bold text-slate-900 text-base">{trackingData.detail.receiver}</p>
                          <p className="text-sm text-slate-600 mt-0.5">{trackingData.detail.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10">
                  <h3 className="text-xl font-bold text-slate-900 mb-8">Riwayat Perjalanan</h3>
                  
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute top-5 bottom-5 left-[1.35rem] w-0.5 bg-slate-200"></div>

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
                                "w-11 h-11 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm",
                                isDelivered ? "bg-emerald-500 text-white" : 
                                isFirst ? "bg-blue-600 text-white" : 
                                "bg-slate-100 text-slate-400 border-slate-50"
                              )}>
                                {isDelivered ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : isFirst ? (
                                  <Truck className="w-5 h-5" />
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                )}
                              </div>
                            </div>

                            <div className={cn(
                              "flex-1 pt-2 pb-6 border-b border-slate-100 last:border-0 last:pb-0",
                              isFirst ? "opacity-100" : "opacity-80"
                            )}>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                <p className={cn(
                                  "text-base",
                                  isFirst ? "font-bold text-slate-900" : "font-medium text-slate-700"
                                )}>
                                  {item.desc}
                                </p>
                                <div className="flex items-center text-sm font-medium text-slate-500 shrink-0 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                                </div>
                              </div>
                              
                              {item.location && (
                                <div className="inline-flex items-center text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                                  <MapPin className="w-4 h-4 mr-2 text-slate-400" />
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
              className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Bukti Pengiriman (POD)
                </h3>
                <button
                  onClick={() => setShowPodModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-auto flex items-center justify-center bg-slate-50/50 min-h-[300px]">
                <img
                  src={podUrl}
                  alt="Bukti Pengiriman"
                  className="max-w-full h-auto rounded-xl shadow-sm border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<div class="text-center"><p class="text-slate-500 font-medium mb-2">Gambar tidak dapat dimuat</p><p class="text-sm text-slate-400">Tautan gambar mungkin telah kadaluarsa atau diblokir oleh server.</p></div>');
                  }}
                />
              </div>
              <div className="px-6 py-5 border-t border-slate-100 bg-white flex justify-end gap-3">
                <a
                  href={podUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  Buka di Tab Baru
                </a>
                <button
                  onClick={() => setShowPodModal(false)}
                  className="inline-flex items-center px-5 py-2.5 border border-slate-200 shadow-sm text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
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

