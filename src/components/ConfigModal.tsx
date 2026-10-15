'use client';

import React from 'react';
import {
  X,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasGeographKey: boolean;
  useDemoData: boolean;
  onToggleDemoData: () => void;
}

export function ConfigModal({
  isOpen,
  onClose,
  hasGeographKey,
  useDemoData,
  onToggleDemoData,
}: ConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-[#1B2A41] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-[#FD9E76]" />
            <h3 className="font-bold text-base font-display">Kaynak Yapılandırması ve API Anahtarları</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#E2DBD0] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-[#1B2A41]">
          {/* Durum Bildirimi */}
          <div
            className={`p-4 rounded-lg border flex items-start space-x-3 ${
              hasGeographKey
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {hasGeographKey ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div>
              <h4 className="font-bold text-sm">
                {hasGeographKey
                  ? 'Geograph.org.uk API Anahtarı Tanımlandı'
                  : 'Geograph.org.uk API Anahtarı Tanımlı Değil'}
              </h4>
              <p className="mt-1 leading-relaxed">
                {hasGeographKey
                  ? 'Sunucu ortamınızda GEOGRAPH_API_KEY başarıyla algılandı. Arama yaparken Cloudflare bot engeline takılmamak için tarayıcınız doğrudan Geograph akışına bağlanır.'
                  : 'Canlı fotoğraf keşfi için ücretsiz Geograph anahtarınızı .env.local dosyasına ekleyebilirsiniz.'}
              </p>
            </div>
          </div>

          {/* Kurulum Rehberi */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#1B2A41]">
              Anahtar Nasıl Yapılandırılır?
            </h4>
            <ol className="list-decimal pl-5 space-y-2 text-[#71717A] leading-relaxed">
              <li>
                Geograph resmi kayıt sayfasından ücretsiz anahtar alın:{' '}
                <a
                  href="https://www.geograph.org.uk/get-api-key.php"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1B2A41] font-semibold underline inline-flex items-center"
                >
                  geograph.org.uk/get-api-key.php <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>
                Dosyanız:{' '}
                <code className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E2DBD0] text-[#1B2A41] font-mono">
                  location-capture/.env.local
                </code>
                <pre className="bg-[#1B2A41] text-[#FD9E76] p-2.5 rounded mt-1 font-mono text-[11px] select-all">
                  GEOGRAPH_API_KEY=50d6956376
                </pre>
              </li>
            </ol>
          </div>

          {/* Demo Modu Butonu */}
          <div className="p-4 rounded-lg bg-[#FAF7F2] border border-[#E2DBD0] flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#FD9E76]" />
                <span className="font-bold text-xs text-[#1B2A41]">
                  Demo Modu (Çevrimdışı Değerlendirme)
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] mt-0.5 max-w-sm">
                İnternet veya API sorgusu olmadan Morecambe, Easington ve Withernsea gibi gerçek UK konumlarının fotoğraflarıyla çalışmayı sağlar.
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleDemoData}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                useDemoData
                  ? 'bg-[#FD9E76] text-[#1B2A41] shadow-xs'
                  : 'bg-white border border-[#E2DBD0] text-[#1B2A41] hover:bg-[#FAF7F2]'
              }`}
            >
              {useDemoData ? 'DEMO AKTİF' : 'Demo Modunu Aç'}
            </button>
          </div>

          {/* Lisans ve Telif Hakkı Hatırlatması */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[#71717A] text-[11px] leading-relaxed flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-[#1B2A41] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1B2A41]">Prodüksiyon ve Telif Uyumu:</strong> Geograph fotoğrafları CC BY-SA 2.0 lisanslıdır. Videonuzun açıklama kısmında fotoğrafçıya atıf yapın. Google Earth Studio görüntüleri ise YouTube ticari para kazanma lisansı içermez; bu nedenle çekim rotası tasarlamak için kullanılmalıdır.
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#FAF7F2]">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-[#1B2A41] text-white text-xs font-semibold hover:bg-[#243856] transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
