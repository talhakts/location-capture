'use client';

import React from 'react';
import { LocationRecord } from '@/lib/types';
import {
  Image as ImageIcon,
  Clock,
  Film,
  Download,
  AlertCircle,
  MapPin,
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalProjects: number;
    totalSavedReferences: number;
    referencesToReview: number;
    manuallyDownloaded: number;
    importedLocally: number;
    totalShotPlans: number;
  };
  recentLocations: LocationRecord[];
  onSelectLocation: (loc: LocationRecord) => void;
}

export function DashboardStats({
  stats,
  recentLocations,
  onSelectLocation,
}: DashboardStatsProps) {
  return (
    <div className="space-y-4">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-[#E2DBD0] shadow-xs">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-medium">
            <span>Kayıtlı Referanslar</span>
            <ImageIcon className="w-4 h-4 text-[#1B2A41]" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-[#1B2A41] font-display">
              {stats.totalSavedReferences}
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#E2DBD0] shadow-xs">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-medium">
            <span>Lisansı İncelenecekler</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-[#1B2A41] font-display">
              {stats.referencesToReview}
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#E2DBD0] shadow-xs">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-medium">
            <span>İndirilen Dosyalar</span>
            <Download className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-[#1B2A41] font-display">
              {stats.manuallyDownloaded + stats.importedLocally}
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#E2DBD0] shadow-xs">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-medium">
            <span>Planlanan Çekimler</span>
            <Film className="w-4 h-4 text-[#FD9E76]" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-[#1B2A41] font-display">
              {stats.totalShotPlans}
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#E2DBD0] shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-medium">
            <span>Toplam Hedef Süre</span>
            <Clock className="w-4 h-4 text-[#1B2A41]" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-[#1B2A41] font-display">
              {stats.totalShotPlans * 8}sn
            </span>
            <span className="ml-1.5 text-xs text-[#71717A]">
              (~{((stats.totalShotPlans * 8) / 60).toFixed(1)} dk)
            </span>
          </div>
        </div>
      </div>

      {/* Son Araştırılan Konumlar Çubuğu */}
      {recentLocations.length > 0 && (
        <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E2DBD0] flex items-center flex-wrap gap-2 text-xs">
          <span className="text-[#71717A] font-semibold flex items-center mr-1">
            <MapPin className="w-3.5 h-3.5 mr-1 text-[#1B2A41]" />
            Son Araştırılan Yerler:
          </span>
          {recentLocations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => onSelectLocation(loc)}
              className="px-2.5 py-1 rounded bg-white hover:bg-[#FD9E76]/15 hover:border-[#FD9E76] border border-[#E2DBD0] text-[#1B2A41] font-medium transition-all shadow-2xs"
            >
              {loc.resolvedName.split('—')[0].trim()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
