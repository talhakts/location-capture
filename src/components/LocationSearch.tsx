'use client';

import React, { useState } from 'react';
import { ResolvedLocationCandidate, LocationRecord } from '@/lib/types';
import {
  Search,
  MapPin,
  ExternalLink,
  Navigation,
  Crosshair,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { GoogleMapsAdapter } from '@/lib/providers/google-maps-adapter';

interface LocationSearchProps {
  onSearchMedia: (params: {
    latitude: number;
    longitude: number;
    locationName: string;
    postcode?: string;
    radiusKm: number;
    queryText?: string;
  }) => void;
  isLoading: boolean;
  activeLocation: LocationRecord | null;
  candidates: ResolvedLocationCandidate[];
  onSelectCandidate: (candidate: ResolvedLocationCandidate) => void;
  onCandidatesFound?: (candidates: ResolvedLocationCandidate[]) => void;
  errorMessage: string | null;
}

export function LocationSearch({
  onSearchMedia,
  isLoading,
  activeLocation,
  candidates,
  onSelectCandidate,
  onCandidatesFound,
  errorMessage,
}: LocationSearchProps) {
  const [searchInput, setSearchInput] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [keywordFilter, setKeywordFilter] = useState('');
  const [targetDuration, setTargetDuration] = useState(8);
  const [isResolving, setIsResolving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const resolveLocationQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsResolving(true);
    setLocalError(null);

    try {
      const res = await fetch(`/api/locations/resolve?q=${encodeURIComponent(queryText.trim())}`);
      const data = await res.json();

      if (data.success && data.candidates && data.candidates.length > 0) {
        onCandidatesFound?.(data.candidates);
        onSelectCandidate(data.candidates[0]);
      } else {
        onCandidatesFound?.([]);
        setLocalError(
          data.message ||
            `"${queryText}" için Birleşik Krallık konumu bulunamadı. Lütfen kasaba (Blackpool), posta kodu (FY1) veya açık cadde adını (Grosvenor Street, Blackpool) deneyin.`
        );
      }
    } catch (err: any) {
      setLocalError(err.message || 'Konum çözümleme bağlantısı kurulamadı.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resolveLocationQuery(searchInput);
  };

  const handleExecuteMediaSearch = () => {
    if (!activeLocation) return;
    onSearchMedia({
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude,
      locationName: activeLocation.resolvedName,
      postcode: activeLocation.postcode,
      radiusKm,
      queryText: keywordFilter.trim() || undefined,
    });
  };

  const activeError = localError || errorMessage;

  return (
    <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-sm overflow-hidden">
      {/* Arama Giriş Çubuğu */}
      <div className="p-5 border-b border-[#E2DBD0] bg-gradient-to-r from-white to-[#FAF7F2]">
        <form onSubmit={handleResolveSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71717A]">
                <Search className="w-5 h-5 text-[#1B2A41]" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder="Birleşik Krallık posta kodu (örn: FY1, LA4), cadde (Grosvenor Street in Blackpool), kasaba (Morecambe)..."
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-[#E2DBD0] focus:border-[#FD9E76] focus:ring-2 focus:ring-[#FD9E76]/20 text-sm text-[#1B2A41] placeholder:text-[#71717A]/60 bg-white shadow-2xs font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || isResolving || !searchInput.trim()}
              className="px-5 py-2.5 rounded-lg bg-[#1B2A41] text-white hover:bg-[#243856] text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center space-x-2 shadow-sm"
            >
              <Compass className={`w-4 h-4 text-[#FD9E76] ${isResolving ? 'animate-spin' : ''}`} />
              <span>{isResolving ? 'Konum Bulunuyor...' : 'Konumu Bul'}</span>
            </button>
          </div>

          {/* Hızlı Örnekler */}
          <div className="flex items-center space-x-2 text-xs text-[#71717A] flex-wrap gap-y-1">
            <span className="font-medium">Hızlı Konum Örnekleri:</span>
            {[
              'Grosvenor Street in Blackpool',
              'LA4 (Morecambe)',
              'HU19 (Withernsea)',
              'Easington, County Durham',
              'Robin Hood\'s Bay',
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const q = tag.includes(' (') ? tag.split(' (')[0] : tag;
                  setSearchInput(q);
                  resolveLocationQuery(q);
                }}
                className="px-2 py-0.5 rounded bg-[#FAF7F2] hover:bg-[#FD9E76]/20 border border-[#E2DBD0] text-[#1B2A41] font-medium transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </form>

        {activeError && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
            <span className="font-bold">Bilgi:</span>
            <span>{activeError}</span>
          </div>
        )}
      </div>

      {/* Birden Fazla Eşleşme Varsa Netleştirme Seçeneği */}
      {candidates.length > 1 && (
        <div className="px-5 py-3 bg-amber-50/50 border-b border-amber-200/60">
          <div className="text-xs font-semibold text-[#1B2A41] mb-2 flex items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
            Birden Fazla Konum Bulundu — Tam Bölgeyi Seçin:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {candidates.map((cand, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectCandidate(cand)}
                className={`text-left p-2.5 rounded border text-xs transition-all ${
                  activeLocation?.latitude === cand.latitude &&
                  activeLocation?.longitude === cand.longitude
                    ? 'bg-[#1B2A41] text-white border-[#1B2A41] shadow-xs'
                    : 'bg-white hover:bg-[#FD9E76]/10 border-[#E2DBD0] text-[#1B2A41]'
                }`}
              >
                <div className="font-semibold">{cand.resolvedName}</div>
                <div className="text-[11px] opacity-75 mt-0.5">
                  {cand.county ? `${cand.county} • ` : ''}
                  {cand.resolutionPrecision}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Çözümlenen Aktif Konum & Arama Filtreleri */}
      {activeLocation && (
        <div className="p-5 bg-white space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg bg-[#FAF7F2] border border-[#E2DBD0]">
            {/* Konum Bilgileri */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1B2A41] text-[#FD9E76]">
                  ONAYLANDI
                </span>
                <h3 className="font-bold text-base text-[#1B2A41] font-display">
                  {activeLocation.resolvedName}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#71717A]">
                <span className="flex items-center">
                  <Crosshair className="w-3.5 h-3.5 mr-1 text-[#1B2A41]" />
                  {activeLocation.latitude.toFixed(5)}, {activeLocation.longitude.toFixed(5)}
                </span>
                <span>•</span>
                <span>Hassasiyet: {activeLocation.resolutionPrecision}</span>
                {activeLocation.county && (
                  <>
                    <span>•</span>
                    <span>Bölge/İlçe: {activeLocation.county}</span>
                  </>
                )}
                <span>•</span>
                <span className="text-[11px] text-[#71717A]/80">
                  {activeLocation.resolutionProvider} üzerinden
                </span>
              </div>
            </div>

            {/* Harici Harita ve Sokak İnceleme Butonları */}
            <div className="flex items-center space-x-2 shrink-0">
              <a
                href={GoogleMapsAdapter.getMapsUrl(
                  activeLocation.latitude,
                  activeLocation.longitude
                )}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded bg-white hover:bg-[#FAF7F2] border border-[#E2DBD0] text-xs font-semibold text-[#1B2A41] flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Haritalar</span>
                <ExternalLink className="w-3 h-3 text-[#71717A]" />
              </a>

              <a
                href={GoogleMapsAdapter.getStreetViewUrl(
                  activeLocation.latitude,
                  activeLocation.longitude
                )}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded bg-white hover:bg-[#FAF7F2] border border-[#E2DBD0] text-xs font-semibold text-[#1B2A41] flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-600" />
                <span>Street View İncele</span>
                <ExternalLink className="w-3 h-3 text-[#71717A]" />
              </a>
            </div>
          </div>

          {/* Filtreler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Arama Yarıçapı
              </label>
              <select
                aria-label="Arama Yarıçapı"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-medium bg-white rounded border border-[#E2DBD0] focus:border-[#FD9E76] focus:ring-1 focus:ring-[#FD9E76]"
              >
                <option value={1}>1 km (Yakın sokak &amp; mahalle)</option>
                <option value={2}>2 km (Kasaba sınırı)</option>
                <option value={5}>5 km (Kasaba &amp; kırsal çevre)</option>
                <option value={10}>10 km (Bölgesel alan)</option>
                <option value={20}>20 km (Maksimum Geograph yarıçapı)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Kelime Filtresi (İsteğe Bağlı)
              </label>
              <input
                type="text"
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                placeholder="Örn: terraced, street, church, colliery..."
                className="w-full px-3 py-2 text-xs font-medium bg-white rounded border border-[#E2DBD0] focus:border-[#FD9E76] focus:ring-1 focus:ring-[#FD9E76]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Hedef Sahne Süresi
              </label>
              <select
                aria-label="Hedef Sahne Süresi"
                value={targetDuration}
                onChange={(e) => setTargetDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-medium bg-white rounded border border-[#E2DBD0] focus:border-[#FD9E76] focus:ring-1 focus:ring-[#FD9E76]"
              >
                <option value={8}>8 Saniye (Britain Off Map belgesel temposu)</option>
                <option value={6}>6 Saniye (Dinamik kurgu kesiti)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleExecuteMediaSearch}
                disabled={isLoading}
                className="w-full py-2 px-4 rounded bg-[#FD9E76] hover:bg-[#fa8756] text-[#1B2A41] text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2"
              >
                <Compass className="w-4 h-4 text-[#1B2A41]" />
                <span>{isLoading ? 'Fotoğraflar Aranıyor...' : 'Fotoğrafları Keşfet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
