/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, Search, Truck, MapPin, Calendar, Clock, AlertCircle, CheckCircle2, PackageSearch, Image as ImageIcon, X } from 'lucide-react';
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

export default function App() {
  const [awb, setAwb] = useState('');
  const [courier, setCourier] = useState('sicepat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData['data'] | null>(null);
  const [showPodModal, setShowPodModal] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awb.trim()) return;

    setLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const response = await fetch(`/api/track?courier=${courier}&awb=${awb}`);
      const data: TrackingData = await response.json();

      if (response.ok && data.status === 200) {
        setTrackingData(data.data);
      } else {
        setError(data.message || 'Gagal melacak resi. Pastikan nomor resi dan kurir benar.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('delivered') || s.includes('selesai')) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (s.includes('process') || s.includes('transit') || s.includes('on process')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (s.includes('problem') || s.includes('failed') || s.includes('return')) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
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

  // Find POD URL if it exists
  const podUrl = trackingData?.summary?.pod || trackingData?.summary?.image || trackingData?.detail?.pod;
  const isPodUrlValid = podUrl && typeof podUrl === 'string' && podUrl.startsWith('http');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <PackageSearch className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">CekResi</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Lacak Paket Anda</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Pantau status pengiriman paket dari berbagai ekspedisi di Indonesia secara real-time.
            </p>
          </div>

          <form onSubmit={handleTrack} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <label htmlFor="awb" className="sr-only">Nomor Resi</label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="awb"
                  value={awb}
                  onChange={(e) => setAwb(e.target.value)}
                  placeholder="Masukkan nomor resi..."
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                  required
                />
              </div>
              
              <div className="sm:w-48 relative">
                <label htmlFor="courier" className="sr-only">Kurir</label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Truck className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="courier"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="block w-full pl-11 pr-8 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white text-base"
                >
                  {COURIERS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !awb.trim()}
                className="inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Search className="w-5 h-5 mr-2" />
                )}
                Lacak
              </button>
            </div>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Summary Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pengiriman</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Nomor Resi</p>
                        <p className="font-mono font-medium text-gray-900">{trackingData.summary.awb}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Kurir</p>
                          <p className="font-medium text-gray-900 uppercase">{trackingData.summary.courier}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Layanan</p>
                          <p className="font-medium text-gray-900">{trackingData.summary.service}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-2">Status Saat Ini</p>
                        <div className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border",
                          getStatusColor(trackingData.summary.status)
                        )}>
                          {trackingData.summary.status === 'DELIVERED' ? (
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          ) : (
                            <Truck className="w-4 h-4 mr-1.5" />
                          )}
                          {trackingData.summary.status}
                        </div>
                      </div>

                      {isPodUrlValid && (
                        <div className="pt-2">
                          <button
                            onClick={() => setShowPodModal(true)}
                            className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <ImageIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Lihat Bukti Pengiriman
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50/50">
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="mt-1">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Pengirim</p>
                          <p className="font-medium text-gray-900">{trackingData.detail.shipper}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{trackingData.detail.origin}</p>
                        </div>
                      </div>

                      <div className="relative ml-4 border-l-2 border-dashed border-gray-200 h-6 my-1"></div>

                      <div className="flex gap-3">
                        <div className="mt-1">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Penerima</p>
                          <p className="font-medium text-gray-900">{trackingData.detail.receiver}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{trackingData.detail.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Riwayat Perjalanan</h3>
                  
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute top-4 bottom-4 left-[1.1rem] w-0.5 bg-gray-200"></div>

                    <div className="space-y-8 relative">
                      {trackingData.history.map((item, index) => {
                        const isFirst = index === 0;
                        const isLast = index === trackingData.history.length - 1;
                        const isDelivered = isFirst && trackingData.summary.status === 'DELIVERED';

                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={index} 
                            className="flex gap-4 sm:gap-6 relative"
                          >
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm",
                                isDelivered ? "bg-emerald-500 text-white" : 
                                isFirst ? "bg-blue-500 text-white" : 
                                "bg-gray-200 text-gray-500"
                              )}>
                                {isDelivered ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : isFirst ? (
                                  <Truck className="w-4 h-4" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-current" />
                                )}
                              </div>
                            </div>

                            <div className={cn(
                              "flex-1 pt-1.5",
                              isFirst ? "opacity-100" : "opacity-70"
                            )}>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                <p className={cn(
                                  "text-base font-medium",
                                  isFirst ? "text-gray-900" : "text-gray-700"
                                )}>
                                  {item.desc}
                                </p>
                                <div className="flex items-center text-sm text-gray-500 shrink-0">
                                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                                </div>
                              </div>
                              
                              {item.location && (
                                <div className="flex items-center text-sm text-gray-600 mt-2 bg-gray-50 inline-flex px-2.5 py-1 rounded-md border border-gray-100">
                                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
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

      {/* POD Modal */}
      <AnimatePresence>
        {showPodModal && isPodUrlValid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPodModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Bukti Pengiriman (POD)
                </h3>
                <button
                  onClick={() => setShowPodModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-auto flex items-center justify-center bg-gray-50">
                <img
                  src={podUrl}
                  alt="Bukti Pengiriman"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<p class="text-gray-500 text-center py-8">Gambar tidak dapat dimuat atau telah kadaluarsa.</p>');
                  }}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <a
                  href={podUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Buka di Tab Baru
                </a>
                <button
                  onClick={() => setShowPodModal(false)}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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

