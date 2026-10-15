'use client';

import React, { useState } from 'react';
import { ShotPlan, SourceReference, ShotType, CameraMovement } from '@/lib/types';
import {
  Film,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Clock,
  Video,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ShotPlannerProps {
  shots: ShotPlan[];
  references: SourceReference[];
  onAddShot: (shot: Omit<ShotPlan, 'id' | 'sequenceOrder'>) => void;
  onReorderShots: (orderedIds: string[]) => void;
  onDeleteShot: (shotId: string) => void;
  activeScriptExcerpt?: string;
}

const SHOT_TYPES: { label: string; value: ShotType }[] = [
  { label: 'Sokak Seviyesi Tanıtım (Street-level establishing)', value: 'Street-level establishing shot' },
  { label: 'Geniş Genel Çekim (Wide establishing shot)', value: 'Wide establishing shot' },
  { label: 'Sıra Sıra Teraslı Evler (Row of terraced houses)', value: 'Row of terraced houses' },
  { label: 'Yavaş İleri Yaklaşma (Slow forward approach)', value: 'Slow forward approach' },
  { label: 'Sokak veya Bina Açılışı (Street/building reveal)', value: 'Street or building reveal' },
  { label: 'Dükkan Vitrini / Yerel Yapı (Shopfront/landmark)', value: 'Shopfront or local landmark' },
  { label: 'Kıyı ve Sahil Genel Çekimi (Coastal establishing)', value: 'Coastal establishing shot' },
  { label: 'Tarihi Alan Genel Bakış (Historic site overview)', value: 'Historic site overview' },
  { label: 'Sabit Belgesel Çekimi (Static documentary shot)', value: 'Static documentary shot' },
  { label: 'Mimari Detay Çekimi (Detail shot)', value: 'Detail shot' },
];

const MOVEMENTS: { label: string; value: CameraMovement }[] = [
  { label: 'Yavaş İleri İtme / Dijital Zoom (Slow push-in)', value: 'Slow push-in' },
  { label: 'Sabit Çerçeve (Static framing)', value: 'Static framing' },
  { label: 'Yavaş Geri Çekilme (Slow pull-back)', value: 'Slow pull-back' },
  { label: 'Yumuşak Yatay Kaydırma (Gentle pan)', value: 'Gentle pan' },
  { label: 'Soldan Sağa Açılma (Left-to-right reveal)', value: 'Left-to-right reveal' },
  { label: 'Genişten Yakına Geçiş (Wide-to-close transition)', value: 'Wide-to-close transition' },
];

export function ShotPlanner({
  shots,
  references,
  onAddShot,
  onReorderShots,
  onDeleteShot,
  activeScriptExcerpt,
}: ShotPlannerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [duration, setDuration] = useState<number>(8);
  const [shotType, setShotType] = useState<ShotType>('Street-level establishing shot');
  const [visualObjective, setVisualObjective] = useState('');
  const [movement, setMovement] = useState<CameraMovement>('Slow push-in');
  const [scriptExcerpt, setScriptExcerpt] = useState(activeScriptExcerpt || '');
  const [startViewpoint, setStartViewpoint] = useState('');
  const [endViewpoint, setEndViewpoint] = useState('');
  const [productionNotes, setProductionNotes] = useState('');
  const [relatedReferenceId, setRelatedReferenceId] = useState('');

  const totalRuntimeSeconds = shots.reduce((acc, s) => acc + s.durationSeconds, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visualObjective.trim()) return;

    onAddShot({
      projectId: '',
      durationSeconds: duration,
      shotType,
      visualObjective,
      movement,
      scriptExcerpt: scriptExcerpt || undefined,
      startViewpoint: startViewpoint || undefined,
      endViewpoint: endViewpoint || undefined,
      productionNotes: productionNotes || undefined,
      relatedReferenceId: relatedReferenceId || undefined,
    });

    setVisualObjective('');
    setProductionNotes('');
    setIsAdding(false);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = shots.map((s) => s.id);
    const temp = ids[index - 1];
    ids[index - 1] = ids[index];
    ids[index] = temp;
    onReorderShots(ids);
  };

  const handleMoveDown = (index: number) => {
    if (index === shots.length - 1) return;
    const ids = shots.map((s) => s.id);
    const temp = ids[index + 1];
    ids[index + 1] = ids[index];
    ids[index] = temp;
    onReorderShots(ids);
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve Süre Özeti */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Film className="w-5 h-5 text-[#1B2A41]" />
            <h2 className="text-lg font-bold text-[#1B2A41] font-display">
              Prodüksiyon Çekim &amp; Sahne Planlayıcı
            </h2>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            Konum referanslarını ve seslendirme cümlelerini 6s / 8s zamanlanmış kurgu sahnelerine dönüştürün.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E2DBD0] text-xs font-semibold text-[#1B2A41] flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#FD9E76]" />
            <span>
              Toplam: {totalRuntimeSeconds}sn ({shots.length} çekim)
            </span>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-1.5 rounded-lg bg-[#1B2A41] text-white hover:bg-[#243856] text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-[#FD9E76]" />
            <span>Yeni Sahne Planla</span>
          </button>
        </div>
      </div>

      {/* Yeni Sahne Ekleme Formu */}
      {isAdding && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white rounded-xl border-2 border-[#FD9E76] p-5 shadow-md space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-[#FAF7F2] pb-2">
            <h3 className="font-bold text-sm text-[#1B2A41] font-display flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#FD9E76]" />
              <span>Yeni Kamera Planı Tanımla</span>
            </h3>
            <span className="text-xs text-[#71717A]">
              Kurgu veya çekim talimatı
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Hedef Sahne Süresi
              </label>
              <select
                aria-label="Çekim Süresi"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0] bg-white font-medium"
              >
                <option value={8}>8 Saniye (Britain Off Map temposu)</option>
                <option value={6}>6 Saniye (Dinamik kesme)</option>
                <option value={10}>10 Saniye (Geniş atmosfer panı)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Çekim / Kadraj Türü
              </label>
              <select
                aria-label="Çekim Türü"
                value={shotType}
                onChange={(e) => setShotType(e.target.value as ShotType)}
                className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0] bg-white font-medium"
              >
                {SHOT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Kamera / Kurgu Hareketi
              </label>
              <select
                aria-label="Kamera Hareketi"
                value={movement}
                onChange={(e) => setMovement(e.target.value as CameraMovement)}
                className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0] bg-white font-medium"
              >
                {MOVEMENTS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Bağlantılı Görsel Referans
              </label>
              <select
                aria-label="Bağlantılı Görsel Referans"
                value={relatedReferenceId}
                onChange={(e) => setRelatedReferenceId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0] bg-white font-medium truncate"
              >
                <option value="">Yok (Sadece Metin Planı)</option>
                {references.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
              Görsel Hedef (Bu sahnede ne görünmeli?) *
            </label>
            <input
              type="text"
              value={visualObjective}
              onChange={(e) => setVisualObjective(e.target.value)}
              placeholder="Örn: Gri sahil gökyüzüne karşı kırmızı tuğla bacaların ritmini ve teraslı evlerin dizilişini göster"
              className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0] focus:ring-1 focus:ring-[#FD9E76]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Seslendirme Cümlesi (Bu sahnede okunan metin)
              </label>
              <input
                type="text"
                value={scriptExcerpt}
                onChange={(e) => setScriptExcerpt(e.target.value)}
                placeholder="Bu sahne ekrandayken seslendirilen cümle..."
                className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Kurgu / Ken Burns Talimatı
              </label>
              <input
                type="text"
                value={productionNotes}
                onChange={(e) => setProductionNotes(e.target.value)}
                placeholder="Örn: Sabit fotoğrafa %104 yumuşak dijital push-in zoom uygula"
                className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0]"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 rounded border border-[#E2DBD0] text-xs font-semibold text-[#71717A] hover:bg-[#FAF7F2]"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#1B2A41] text-white text-xs font-bold hover:bg-[#243856]"
            >
              Sahneyi Sıraya Ekle
            </button>
          </div>
        </form>
      )}

      {/* Sıralı Sahne Listesi */}
      <div className="space-y-3">
        {shots.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2DBD0] p-10 text-center">
            <Video className="w-8 h-8 text-[#E2DBD0] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1B2A41]">
              Henüz sahne planı eklenmedi.
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              Yukarıdaki &ldquo;Yeni Sahne Planla&rdquo; butonuna basın veya kayıtlı referanslardan &ldquo;Çekim Planla&rdquo; deyin.
            </p>
          </div>
        ) : (
          shots.map((shot, idx) => {
            const linked = shot.relatedReferenceId
              ? references.find((r) => r.id === shot.relatedReferenceId)
              : undefined;

            return (
              <div
                key={shot.id}
                className="bg-white rounded-lg border border-[#E2DBD0] hover:border-[#1B2A41]/40 p-4 shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Sahne Numarası ve Rozetler */}
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#1B2A41] text-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
                    <span className="text-[10px] font-bold text-[#FD9E76]">SAHNE</span>
                    <span className="text-xs font-black">{idx + 1}</span>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#1B2A41] font-display">
                        {shot.shotType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FAF7F2] text-[#1B2A41] border border-[#E2DBD0]">
                        {shot.durationSeconds}sn
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FD9E76]/15 text-[#1B2A41]">
                        {shot.movement}
                      </span>
                      {linked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                          <Camera className="w-3 h-3" />
                          <span>Bağlı Fotoğraf Mevcut</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Öneri Plan (Görüntü Gerekiyor)
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-[#1B2A41]">
                      {shot.visualObjective}
                    </p>

                    {shot.scriptExcerpt && (
                      <div className="text-xs text-[#71717A] italic">
                        Seslendirme: &ldquo;{shot.scriptExcerpt}&rdquo;
                      </div>
                    )}

                    {shot.productionNotes && (
                      <div className="text-[11px] text-[#71717A] flex items-center space-x-1">
                        <Layers className="w-3 h-3 text-[#FD9E76]" />
                        <span>Notlar: {shot.productionNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sıralama ve Silme Butonları */}
                <div className="flex items-center space-x-1 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    title="Daha önceye al"
                    className="p-1.5 rounded border border-[#E2DBD0] hover:bg-[#FAF7F2] text-[#1B2A41] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === shots.length - 1}
                    title="Daha sonraya al"
                    className="p-1.5 rounded border border-[#E2DBD0] hover:bg-[#FAF7F2] text-[#1B2A41] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteShot(shot.id)}
                    title="Sahneyi sil"
                    className="p-1.5 rounded border border-rose-200 hover:bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
