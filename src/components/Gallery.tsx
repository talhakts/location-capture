'use client';

import React, { useState } from 'react';
import { SearchResultItem } from '@/lib/providers/types';
import {
  ExternalLink,
  Plus,
  Check,
  MapPin,
  Camera,
  Copy,
  AlertTriangle,
  Sparkles,
  Info,
  Download,
} from 'lucide-react';
import { GoogleMapsAdapter } from '@/lib/providers/google-maps-adapter';

interface GalleryProps {
  photographs: SearchResultItem[];
  inspectionTools: SearchResultItem[];
  savedExternalIds: Set<string>;
  onAddReference: (item: SearchResultItem) => void;
  usedDemoData?: boolean;
}

export function Gallery({
  photographs,
  inspectionTools,
  savedExternalIds,
  onAddReference,
  usedDemoData,
}: GalleryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyAttribution = (item: SearchResultItem) => {
    navigator.clipboard.writeText(item.attributionText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (photographs.length === 0 && inspectionTools.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2DBD0] p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#1B2A41] flex items-center justify-center mx-auto mb-3">
          <Camera className="w-6 h-6 text-[#1B2A41]" />
        </div>
        <h3 className="text-base font-bold text-[#1B2A41] font-display">
          Henüz Arama Yapılmadı
        </h3>
        <p className="text-xs text-[#71717A] max-w-md mx-auto mt-1">
          Yukarıdaki arama çubuğuna Birleşik Krallık posta kodu (örn: LA4, HU19, SR8) veya yer adı girerek
          gerçek fotoğrafları ve sokak teftiş linklerini keşfedebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hızlı Kullanım Rehberi Şeridi */}
      <div className="bg-white border-2 border-[#FD9E76]/50 p-4 rounded-xl shadow-xs text-xs text-[#1B2A41]">
        <div className="flex items-center space-x-2 font-bold text-sm mb-2 text-[#1B2A41]">
          <Info className="w-4 h-4 text-[#FD9E76]" />
          <span>Fotoğrafları Nasıl Kullanır ve Kaydedersiniz?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[#71717A]">
          <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E2DBD0]">
            <strong className="text-[#1B2A41] block mb-0.5">1. Projeye Kaydet:</strong>
            Beğendiğiniz fotoğrafın altındaki <strong>&ldquo;+ Projeye Kaydet&rdquo;</strong> butonuna basın. Fotoğraf üstteki <em>&ldquo;Proje Referansları&rdquo;</em> listenize kaydedilir.
          </div>
          <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E2DBD0]">
            <strong className="text-[#1B2A41] block mb-0.5">2. Bilgisayara İndir:</strong>
            <strong>&ldquo;Orijinal Sayfa &amp; İndir&rdquo;</strong> butonuna basarak Geograph sayfasını açın. Fotoğrafa sağ tıklayıp <em>&ldquo;Resmi farklı kaydet&rdquo;</em> diyerek en yüksek kalitede indirin.
          </div>
          <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E2DBD0]">
            <strong className="text-[#1B2A41] block mb-0.5">3. Çekim Planına Bağla:</strong>
            <em>&ldquo;Çekim / Plan Planlayıcı&rdquo;</em> sekmesine geçerek bu fotoğraf için 8 saniyelik sahne süresini, kamera hareketini ve seslendirme cümlenizi planlayın.
          </div>
        </div>
      </div>

      {/* Demo Modu Bilgilendirmesi */}
      {usedDemoData && (
        <div className="bg-[#FAF7F2] border border-[#FD9E76]/40 p-3.5 rounded-lg flex items-center justify-between text-xs text-[#1B2A41]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#FD9E76] shrink-0" />
            <span>
              <strong className="font-semibold">DEMO VERİ MODU:</strong> Geograph arşivinden seçilmiş gerçek CC BY-SA 2.0 lisanslı UK fotoğrafları gösterilmektedir.
            </span>
          </div>
        </div>
      )}

      {/* Fotoğraf Referansları Izgarası */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-[#1B2A41]" />
            <h3 className="font-bold text-sm text-[#1B2A41] uppercase tracking-wider font-display">
              Fotoğraf Referansları ({photographs.length})
            </h3>
          </div>
          <span className="text-xs text-[#71717A]">
            Geograph Britain &amp; Ireland • CC BY-SA 2.0 Lisanslı
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photographs.map((item) => {
            const isSaved = savedExternalIds.has(item.externalAssetId);

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-[#E2DBD0] hover:border-[#FD9E76] transition-all shadow-xs overflow-hidden flex flex-col group"
              >
                {/* Fotoğraf Önizlemesi */}
                <div className="relative aspect-4/3 bg-[#FAF7F2] overflow-hidden border-b border-[#E2DBD0]">
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#71717A] p-4 text-center">
                      <Camera className="w-8 h-8 text-[#E2DBD0] mb-2" />
                      <span className="text-xs">Fotoğraf önizlemesi Geograph üzerinde mevcut</span>
                    </div>
                  )}

                  {/* Mesafe Rozeti */}
                  {item.distanceMeters !== undefined && (
                    <div className="absolute top-2 left-2 bg-[#1B2A41]/85 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-xs flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-[#FD9E76]" />
                      <span>{item.distanceMeters < 1000 ? `${item.distanceMeters}m uzakta` : `${(item.distanceMeters / 1000).toFixed(1)}km uzakta`}</span>
                    </div>
                  )}

                  {/* Lisans Rozeti */}
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs text-[#1B2A41] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#E2DBD0] shadow-xs">
                    CC BY-SA 2.0
                  </div>
                </div>

                {/* Kart İçeriği */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#1B2A41] line-clamp-1 font-display">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#71717A] mt-1 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="mt-2 text-[11px] text-[#71717A] flex items-center justify-between">
                      <span>Fotoğrafçı: <strong>{item.creator}</strong></span>
                      <span className="text-[10px] text-[#71717A]/75">ID: {item.externalAssetId}</span>
                    </div>
                  </div>

                  {/* Eylemler Çubuğu */}
                  <div className="pt-2 border-t border-[#FAF7F2] space-y-2">
                    {/* Ana Butonlar: Projeye Kaydet ve Orijinalini İndir */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onAddReference(item)}
                        disabled={isSaved}
                        className={`py-2 px-3 rounded text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-[#1B2A41] hover:bg-[#243856] text-white shadow-2xs'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Projede Kayıtlı</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-[#FD9E76] shrink-0" />
                            <span>Projeye Kaydet</span>
                          </>
                        )}
                      </button>

                      <a
                        href={item.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Orijinal Geograph sayfasını açıp yüksek çözünürlükte indirin"
                        className="py-2 px-3 rounded text-xs font-bold bg-[#FAF7F2] hover:bg-[#FD9E76]/20 border border-[#E2DBD0] text-[#1B2A41] flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#FD9E76] shrink-0" />
                        <span>Orijinal &amp; İndir</span>
                        <ExternalLink className="w-3 h-3 text-[#71717A]" />
                      </a>
                    </div>

                    {/* İkincil Araçlar: Atıf Kopyala & Street View */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <button
                        onClick={() => handleCopyAttribution(item)}
                        className="text-[#1B2A41] hover:text-[#FD9E76] font-medium flex items-center space-x-1"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Atıf Kopyalandı!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>YouTube Atfını Kopyala</span>
                          </>
                        )}
                      </button>

                      {item.latitude && item.longitude && (
                        <a
                          href={GoogleMapsAdapter.getStreetViewUrl(item.latitude, item.longitude)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:underline flex items-center space-x-1 font-medium"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Street View</span>
                        </a>
                      )}
                    </div>

                    <div className="text-[10px] text-[#71717A] bg-[#FAF7F2] px-2 py-1 rounded flex items-center space-x-1">
                      <Info className="w-3 h-3 text-[#FD9E76] shrink-0" />
                      <span className="truncate">CC BY-SA 2.0: Fotoğrafçıya videoda kredi veriniz</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Harici Konum Teftiş & Rota Araçları */}
      {inspectionTools.length > 0 && (
        <div className="pt-4 border-t border-[#E2DBD0]">
          <div className="flex items-center space-x-2 mb-3">
            <MapPin className="w-4 h-4 text-[#1B2A41]" />
            <h3 className="font-bold text-sm text-[#1B2A41] uppercase tracking-wider font-display">
              Konum İnceleme &amp; Çekim Rota Araçları
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspectionTools.map((tool) => (
              <div
                key={tool.id}
                className="bg-white rounded-lg border border-[#E2DBD0] p-4 flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FAF7F2] text-[#1B2A41] border border-[#E2DBD0]">
                      {tool.providerId === 'google_maps' ? 'Sadece Sokak Teftişi' : 'Çekim Rotası Planlama'}
                    </span>
                    {tool.commercialUseStatus === 'not_approved' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Ticari Yayın İçin Uygun Değil</span>
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-[#1B2A41] mt-2 font-display">
                    {tool.title}
                  </h4>
                  <p className="text-xs text-[#71717A] mt-1">{tool.description}</p>
                </div>

                <div className="pt-3 border-t border-[#FAF7F2] flex items-center justify-between">
                  <span className="text-[11px] text-[#71717A]">
                    {tool.adaptationRestrictions || 'Harici tarayıcı bağlantısı'}
                  </span>
                  <a
                    href={tool.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded bg-[#1B2A41] hover:bg-[#243856] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <span>Harici Aracı Aç</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#FD9E76]" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
