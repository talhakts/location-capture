'use client';

import React from 'react';
import { Project } from '@/lib/types';
import {
  X,
  Download,
  FileCode,
  Table,
  FileText,
  Film,
  CheckCircle2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  referenceCount: number;
  shotCount: number;
}

export function ExportModal({
  isOpen,
  onClose,
  project,
  referenceCount,
  shotCount,
}: ExportModalProps) {
  if (!isOpen || !project) return null;

  const downloadExport = (format: 'json' | 'csv' | 'attribution' | 'shotlist') => {
    const url = `/api/projects/${project.id}/export?format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-[#1B2A41] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-[#FD9E76]" />
            <h3 className="font-bold text-base font-display">Prodüksiyon Kayıtlarını Dışa Aktar</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#E2DBD0] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <span className="text-xs text-[#71717A] uppercase tracking-wider font-semibold">
              Proje Özeti
            </span>
            <h4 className="text-base font-bold text-[#1B2A41] font-display">
              {project.title}
            </h4>
            <p className="text-xs text-[#71717A] mt-1">
              {referenceCount} referans görsel • {shotCount} planlanan çekim ({shotCount * 8}sn toplam)
            </p>
          </div>

          <div className="space-y-3">
            {/* Atıf Raporu */}
            <div className="p-3.5 rounded-lg border border-[#E2DBD0] hover:border-[#FD9E76] transition-colors flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-[#FD9E76] mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-[#1B2A41]">
                    Atıf ve Lisans Raporu (Markdown)
                  </h5>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    YouTube video açıklamasına yapıştırmak için hazır CC BY-SA 2.0 yasal kredileri.
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadExport('attribution')}
                className="px-3 py-1.5 rounded bg-[#FAF7F2] hover:bg-[#FD9E76]/20 border border-[#E2DBD0] text-xs font-semibold text-[#1B2A41] shrink-0"
              >
                İndir (.md)
              </button>
            </div>

            {/* Çekim Listesi */}
            <div className="p-3.5 rounded-lg border border-[#E2DBD0] hover:border-[#FD9E76] transition-colors flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <Film className="w-5 h-5 text-[#1B2A41] mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-[#1B2A41]">
                    Zamanlanmış Çekim / Sahne Listesi (Markdown)
                  </h5>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Kamera açıları, hareketler ve seslendirme cümleleriyle sıralı çekim tablosu.
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadExport('shotlist')}
                className="px-3 py-1.5 rounded bg-[#FAF7F2] hover:bg-[#FD9E76]/20 border border-[#E2DBD0] text-xs font-semibold text-[#1B2A41] shrink-0"
              >
                İndir (.md)
              </button>
            </div>

            {/* CSV Referans Tablosu */}
            <div className="p-3.5 rounded-lg border border-[#E2DBD0] hover:border-[#FD9E76] transition-colors flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <Table className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-[#1B2A41]">
                    Referanslar Tablosu (CSV)
                  </h5>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Excel veya e-tablolarda açılabilen koordinat, fotoğrafçı ve link listesi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadExport('csv')}
                className="px-3 py-1.5 rounded bg-[#FAF7F2] hover:bg-[#FD9E76]/20 border border-[#E2DBD0] text-xs font-semibold text-[#1B2A41] shrink-0"
              >
                İndir (.csv)
              </button>
            </div>

            {/* Tam Proje JSON */}
            <div className="p-3.5 rounded-lg border border-[#E2DBD0] hover:border-[#FD9E76] transition-colors flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <FileCode className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-[#1B2A41]">
                    Tam Proje Arşivi (JSON)
                  </h5>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Tüm verilerin, sahnelerin ve notların makine tarafından okunabilen yedeği.
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadExport('json')}
                className="px-3 py-1.5 rounded bg-[#FAF7F2] hover:bg-[#FD9E76]/20 border border-[#E2DBD0] text-xs font-semibold text-[#1B2A41] shrink-0"
              >
                İndir (.json)
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#FAF7F2] flex items-center justify-between text-[11px] text-[#71717A]">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dışa aktarılan tüm dosyalar CC BY-SA 2.0 şartlarına uygundur</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-[#1B2A41] text-white text-xs font-semibold"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
