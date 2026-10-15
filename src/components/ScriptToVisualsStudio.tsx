'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Project, ScriptScene, SceneCandidateResult } from '@/lib/types';
import {
  Sparkles,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Film,
  Image as ImageIcon,
  SlidersHorizontal,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  Palette,
  Eye,
  FileCode
} from 'lucide-react';

interface ScriptToVisualsStudioProps {
  project: Project | null;
  hasGeographKey: boolean;
  hasPexelsKey?: boolean;
}

const SAMPLE_NINE_SCENE_PLAN = `1 | 0:00 | trigger: "Here's"
Voiceover: "Here's a two-bedroom terrace in County Durham with a back garden..."
Stock: Northern England terraced houses → British terraced houses street → UK red brick terrace row
Notes: Exterior, understated, grey sky. Keep the visual world consistent with the documentary thumbnail.
AI prompt: Photorealistic exterior of a two-storey Northern English red-brick terraced house in County Durham, front door and two windows, small front yard wall, overcast natural daylight, muted colours, eye-level 35mm documentary look, no people, no text.
Motion: Very slow push-in toward the front door, slight handheld drift, 6 seconds.

2 | 0:03 | trigger: "back garden"
Voiceover: "A tidy rear yard that could easily be transformed."
Stock: terraced house back garden UK → British back yard washing line → English rear garden terrace
Notes: Small but tidy rear garden, brick boundary walls.
Motion: Gentle pan across rear fence, 6 seconds.

3 | 0:06 | trigger: "primary school"
Voiceover: "Just around the corner sits the local primary school..."
Stock: UK primary school exterior → British school gates → English primary school playground
Notes: Keep readable signs and logos out of frame where possible.
Motion: Static establishing shot, natural morning light, 8 seconds.

4 | 0:10 | trigger: "fish and chips"
Voiceover: "The village fish and chip shop remains the social hub of the high street."
Stock: British fish and chip shop exterior → Northern England local chippy → UK traditional takeaway storefront
Notes: Real community feel, brick pavement, warm interior lights glowing.
Motion: Slow right-to-left tracking pass, 6 seconds.

5 | 0:14 | trigger: "1970s heyday"
Voiceover: "In the 1970s, miners would line up here every Friday evening."
Stock: 1970s British mining village street → historic Northern England pit town archive → vintage UK terraced street 1970s
Notes: Historic reconstruction or archival tone. Sepia or muted vintage grain.
AI prompt: 1970s vintage photograph of a bustling Northern England coal mining village high street, vintage British cars parked, miners walking in flat caps, muted Kodachrome film grain look, 1974.
Motion: Slow digital push-in on still photograph, 6 seconds.

6 | 0:18 | trigger: "£45,000"
Voiceover: "And the asking price on the open market? Just forty-five thousand pounds."
Stock: price card £45,000 → custom graphic property card
Notes: Custom graphic card: "£45,000" with cream background, navy border, and description "2 bed terrace • back garden".
Motion: Center pop-in with subtle 102% float, 6 seconds.

7 | 0:22 | trigger: "for sale"
Voiceover: "Houses like this attract property investors from across the South East."
Stock: UK for sale board outside terraced house → estate agent board British street → house sold sign UK
Notes: Estate agent board in foreground, terraced street receding into distance.
Motion: Depth-of-field rack focus from for-sale sign to street, 6 seconds.

8 | 0:26 | trigger: "tidy street"
Voiceover: "A peaceful row of homes with panoramic coastal views just over the crest."
Stock: neat British terraced street → quiet Northern England village road → clean red brick terraces
Notes: Long view down street, chimneys silhouetted against overcast coastal sky.
Motion: Slow forward gimbal walk, 8 seconds.

9 | 0:32 | trigger: "North Sea coast"
Voiceover: "Walking past the final terrace reveals the untamed expanse of the Durham heritage coast."
Stock: Easington Colliery coastal path → Durham heritage coast cliffs → North Sea crashing on northern British beach
Notes: Dramatic coastal horizon, grassland meeting grey North Sea, authentic British weather.
Motion: Wide aerial drone pull-back revealing coastline, 8 seconds.`;

export function ScriptToVisualsStudio({
  project,
  hasGeographKey,
  hasPexelsKey,
}: ScriptToVisualsStudioProps) {
  const [scenes, setScenes] = useState<ScriptScene[]>([]);
  const [candidates, setCandidates] = useState<SceneCandidateResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingBatch, setIsSearchingBatch] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [rawPlanText, setRawPlanText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [exportData, setExportData] = useState<{
    metadataDir?: string;
    assetsDir?: string;
    content?: {
      assetMapCsv: string;
      shotListMd: string;
      attributionMd: string;
      manifestJson: string;
    };
  } | null>(null);

  // Load existing visual plan for current project
  const loadVisualPlan = useCallback(async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/visual-plan`);
      const data = await res.json();
      if (data.success) {
        setScenes(data.scenes || []);
        setCandidates(data.candidates || []);
        if (data.plan?.rawInput) {
          setRawPlanText(data.plan.rawInput);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  useEffect(() => {
    loadVisualPlan();
  }, [loadVisualPlan]);

  // Handle parsing submitted visual plan
  const handleParsePlan = async (textToParse: string) => {
    if (!project || !textToParse.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/visual-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: textToParse }),
      });

      const data = await res.json();
      if (data.success) {
        setScenes(data.scenes || []);
        setIsInputModalOpen(false);
        setStatusMessage(
          `Başarılı: ${data.scenes.length} sahne sırasıyla ayrıştırıldı. Şimdi toplu arama başlatabilirsiniz!`
        );
        loadVisualPlan();
      } else {
        setStatusMessage(`Ayrıştırma hatası: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`Hata: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger batch search across all scenes
  const handleBatchSearch = async () => {
    if (!project || scenes.length === 0) return;
    setIsSearchingBatch(true);
    setStatusMessage('Toplu görsel araması yürütülüyor (Geograph, Pexels ve Özel Grafikler)...');

    try {
      const res = await fetch(`/api/projects/${project.id}/visual-plan/batch-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useDemoData: !hasPexelsKey && !hasGeographKey }),
      });

      const data = await res.json();
      if (data.success) {
        setScenes(data.scenes || []);
        setCandidates(data.candidates || []);
        setStatusMessage(
          `Arama tamamlandı: ${data.stats.succeeded} sahne için toplam ${data.stats.totalCandidates} görsel adayı toplandı.`
        );
      } else {
        setStatusMessage(`Arama hatası: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`Bağlantı hatası: ${err.message}`);
    } finally {
      setIsSearchingBatch(false);
    }
  };

  // Select candidate for scene
  const handleSelectCandidate = async (sceneId: string, candidateId: string) => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/visual-plan/select-candidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId, candidateId }),
      });
      const data = await res.json();
      if (data.success) {
        setScenes((prev) =>
          prev.map((s) => (s.id === sceneId ? data.scene : s))
        );
      }
    } catch {
      // Ignore
    }
  };

  // Download selected assets
  const handleDownloadAssets = async (sceneId?: string) => {
    if (!project) return;
    setIsDownloading(true);
    setStatusMessage(sceneId ? 'Görsel indiriliyor...' : 'Tüm onaylı görseller indiriliyor ve numaralandırılıyor...');

    try {
      const res = await fetch(`/api/projects/${project.id}/visual-plan/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId }),
      });

      const data = await res.json();
      if (data.success) {
        setScenes(data.scenes || []);
        setStatusMessage(
          `İndirme tamamlandı: ${data.downloadedCount} dosya proje klasörüne kaydedildi.`
        );
      } else {
        setStatusMessage(`İndirme uyarısı: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`İndirme hatası: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Fetch export package
  const handleOpenExport = async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/visual-plan/export`);
      const data = await res.json();
      if (data.success) {
        setExportData(data);
        setIsExportModalOpen(true);
      }
    } catch {
      // Ignore
    }
  };

  // Copy AI Prompt helper
  const handleCopyPrompt = (promptText: string, id: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  // Aggregate stats
  const totalCount = scenes.length;
  const completedCount = scenes.filter((s) => s.searchStatus === 'completed').length;
  const selectedCount = scenes.filter((s) => s.selectedCandidateId).length;
  const downloadedCount = scenes.filter((s) => s.downloadStatus === 'completed').length;
  const needsManualCount = scenes.filter((s) => s.searchStatus === 'needs_manual').length;

  return (
    <div className="space-y-6">
      {/* Üst Bilgi ve Eylem Çubuğu */}
      <div className="bg-white p-5 rounded-xl border border-[#E2DBD0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-[#1B2A41] text-[#FD9E76] font-bold text-xs uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Batch Studio
            </span>
            <h2 className="text-xl font-bold text-[#1B2A41] font-display">
              Senaryo → Görseller (Script to Visuals)
            </h2>
          </div>
          <p className="text-xs text-[#71717A] mt-1">
            Yapay zeka görsel planını yapıştırın, tüm sahneleri otomatik arayın, uygun fotoğraf/videoları seçip numaralı klasöre indirin.
          </p>
        </div>

        {/* Eylem Butonları */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsInputModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#E2DBD0] border border-[#E2DBD0] text-[#1B2A41] text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4 text-[#FD9E76]" />
            <span>{scenes.length > 0 ? 'Planı Düzenle / Yeniden Yapıştır' : 'Görsel Planı Yapıştır'}</span>
          </button>

          <button
            type="button"
            onClick={handleBatchSearch}
            disabled={scenes.length === 0 || isSearchingBatch}
            className="px-4 py-2 rounded-lg bg-[#FD9E76] hover:bg-[#fa8756] text-[#1B2A41] text-xs font-bold transition-all shadow-2xs disabled:opacity-50 flex items-center space-x-1.5"
          >
            <Compass className={`w-4 h-4 text-[#1B2A41] ${isSearchingBatch ? 'animate-spin' : ''}`} />
            <span>{isSearchingBatch ? 'Toplu Aranıyor...' : 'Tüm Sahneleri Ara'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadAssets()}
            disabled={selectedCount === 0 || isDownloading}
            className="px-4 py-2 rounded-lg bg-[#1B2A41] hover:bg-[#243856] text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50 flex items-center space-x-1.5"
          >
            <Download className={`w-4 h-4 text-[#FD9E76] ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'İndiriliyor...' : `Seçilenleri İndir (${selectedCount})`}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenExport}
            disabled={scenes.length === 0}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E2DBD0] text-[#1B2A41] text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Dışa Aktar</span>
          </button>
        </div>
      </div>

      {/* Durum Bildirim Şeridi */}
      {statusMessage && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-amber-700 hover:text-amber-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* İlerleme ve Durum Sayacı */}
      {scenes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-white rounded-lg border border-[#E2DBD0] text-center">
            <div className="text-xl font-bold text-[#1B2A41]">{totalCount}</div>
            <div className="text-[11px] text-[#71717A] font-medium">Toplam Sahne</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-[#E2DBD0] text-center">
            <div className="text-xl font-bold text-blue-600">{completedCount}</div>
            <div className="text-[11px] text-[#71717A] font-medium">Görsel Bulundu</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-[#E2DBD0] text-center">
            <div className="text-xl font-bold text-amber-600">{selectedCount}</div>
            <div className="text-[11px] text-[#71717A] font-medium">Seçilen Varlık</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-[#E2DBD0] text-center">
            <div className="text-xl font-bold text-emerald-600">{downloadedCount}</div>
            <div className="text-[11px] text-[#71717A] font-medium">İndirildi (01..09)</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-[#E2DBD0] text-center">
            <div className="text-xl font-bold text-rose-600">{needsManualCount}</div>
            <div className="text-[11px] text-[#71717A] font-medium">Manuel Arama</div>
          </div>
        </div>
      )}

      {/* Başlangıç Durumu (Henüz plan yapıştırılmadıysa) */}
      {scenes.length === 0 && !isLoading && (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-[#E2DBD0] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF7F2] border border-[#E2DBD0] flex items-center justify-center">
            <Film className="w-8 h-8 text-[#FD9E76]" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-bold text-lg text-[#1B2A41] font-display">
              Senaryo Görsel Planınızı Yükleyin
            </h3>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Yapay zeka asistanınızın ürettiği 9 sahnelik (veya daha uzun) görsel planı doğrudan buraya yapıştırabilirsiniz. Sistem zaman kodlarını, tetikleyicileri, alternatif arama sorgularını ve özel grafikleri otomatik tanır.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setRawPlanText(SAMPLE_NINE_SCENE_PLAN);
                handleParsePlan(SAMPLE_NINE_SCENE_PLAN);
              }}
              className="px-5 py-2.5 rounded-lg bg-[#FD9E76] hover:bg-[#fa8756] text-[#1B2A41] text-xs font-bold transition-all shadow-sm flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-[#1B2A41]" />
              <span>County Durham 9 Sahnelik Örnek Planı Yükle</span>
            </button>
            <button
              type="button"
              onClick={() => setIsInputModalOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E2DBD0] text-[#1B2A41] text-xs font-bold transition-all shadow-2xs"
            >
              Kendi Planımı Yapıştır
            </button>
          </div>
        </div>
      )}

      {/* Sahne Listesi */}
      <div className="space-y-4">
        {scenes.map((scene) => {
          const sceneCandidates = candidates.filter((c) => c.sceneId === scene.id);
          const selectedCandidate = scene.selectedCandidateId
            ? candidates.find((c) => c.id === scene.selectedCandidateId) || scene.selectedAssetSnapshot
            : undefined;

          return (
            <div
              key={scene.id}
              className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs overflow-hidden transition-all hover:border-[#FD9E76]/50"
            >
              {/* Sahne Başlığı */}
              <div className="p-4 bg-gradient-to-r from-white to-[#FAF7F2] border-b border-[#E2DBD0] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#1B2A41] text-white font-mono text-xs font-bold">
                    #{String(scene.sceneNumber).padStart(2, '0')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E2DBD0] text-[#1B2A41] text-xs font-medium flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-[#FD9E76]" />
                    {scene.timecode} ({scene.targetDurationSeconds}s)
                  </span>
                  {scene.triggerPhrase && (
                    <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                      Tetikleyici: &quot;{scene.triggerPhrase}&quot;
                    </span>
                  )}
                  {scene.sceneType === 'custom_graphic' && (
                    <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center">
                      <Palette className="w-3 h-3 mr-1 text-purple-600" />
                      Özel Grafik Kartı
                    </span>
                  )}
                  {scene.targetMediaType === 'video' && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center">
                      <Film className="w-3 h-3 mr-1 text-blue-600" />
                      Video Tercihli
                    </span>
                  )}
                </div>

                {/* Sahne Durum Göstergesi */}
                <div className="flex items-center space-x-2">
                  {scene.searchStatus === 'searching' && (
                    <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 text-[11px] font-semibold flex items-center">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Aranıyor...
                    </span>
                  )}
                  {scene.downloadStatus === 'completed' && (
                    <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      İndirildi: {scene.downloadedFilename}
                    </span>
                  )}
                  {scene.searchStatus === 'needs_manual' && (
                    <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-800 text-[11px] font-semibold flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                      Manuel Arama Gerekiyor
                    </span>
                  )}
                </div>
              </div>

              {/* Sahne İçerik Özeti (Seslendirme, Notlar, AI Prompts) */}
              <div className="p-4 border-b border-[#E2DBD0] space-y-2 text-xs">
                {scene.voiceover && (
                  <div className="text-[#1B2A41]">
                    <span className="font-bold text-[#71717A]">Seslendirme:</span>{' '}
                    <span className="italic font-medium">&quot;{scene.voiceover}&quot;</span>
                  </div>
                )}

                {/* Arama Sorgu Alternatifleri */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="font-bold text-[#71717A]">Arama Terimleri:</span>
                  {scene.searchQueries.map((q, qIdx) => (
                    <span
                      key={qIdx}
                      className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E2DBD0] text-[#1B2A41] text-[11px] font-medium"
                    >
                      {qIdx === 0 && '⭐ '}
                      {q}
                    </span>
                  ))}
                </div>

                {scene.visualNotes && (
                  <div className="text-[#71717A]">
                    <span className="font-bold">Görsel Not:</span> {scene.visualNotes}
                  </div>
                )}

                {/* AI / Canlandırma İstemi Varsa */}
                {scene.aiPrompt && (
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#E2DBD0] flex items-center justify-between gap-2">
                    <div className="truncate text-[#1B2A41]">
                      <span className="font-bold text-[#FD9E76]">Yapay Zeka İstemi (Tarihi Canlandırma):</span>{' '}
                      <span className="font-mono text-[11px]">{scene.aiPrompt}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(scene.aiPrompt!, scene.id)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-gray-100 border border-[#E2DBD0] text-[11px] font-semibold text-[#1B2A41] shrink-0 flex items-center space-x-1"
                    >
                      {copiedPromptId === scene.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Kopyalandı!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#71717A]" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Aday Görseller Galerisi */}
              <div className="p-4 bg-[#FAF7F2]/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-[#1B2A41] flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#FD9E76]" />
                    <span>Bulunan Aday Görseller ({sceneCandidates.length}):</span>
                  </div>
                  {selectedCandidate && (
                    <button
                      type="button"
                      onClick={() => handleDownloadAssets(scene.id)}
                      disabled={isDownloading || scene.downloadStatus === 'completed'}
                      className="px-3 py-1 rounded bg-[#1B2A41] text-white hover:bg-[#243856] text-xs font-semibold disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3 text-[#FD9E76]" />
                      <span>{scene.downloadStatus === 'completed' ? 'Dosya İndirildi' : 'Bu Sahneyi İndir'}</span>
                    </button>
                  )}
                </div>

                {sceneCandidates.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-lg border border-[#E2DBD0] text-xs text-[#71717A]">
                    Bu sahne için henüz arama yapılmadı. Yukarıdaki &quot;Tüm Sahneleri Ara&quot; butonuna tıklayarak aramayı başlatın.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sceneCandidates.map((cand) => {
                      const isSelected = scene.selectedCandidateId === cand.id;

                      return (
                        <div
                          key={cand.id}
                          className={`bg-white rounded-lg border overflow-hidden transition-all flex flex-col ${
                            isSelected
                              ? 'border-[#1B2A41] ring-2 ring-[#1B2A41] shadow-md'
                              : 'border-[#E2DBD0] hover:border-[#FD9E76]'
                          }`}
                        >
                          {/* Görsel / Video Önizleme */}
                          <div className="relative aspect-video bg-[#1B2A41] overflow-hidden group">
                            {cand.mediaType === 'video' ? (
                              <div className="relative w-full h-full flex items-center justify-center bg-black">
                                <img
                                  src={cand.previewUrl}
                                  alt={cand.title}
                                  className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center">
                                    <Film className="w-4 h-4 text-[#FD9E76]" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={cand.previewUrl}
                                alt={cand.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            )}

                            {/* Sağlayıcı & Tür Rozetleri */}
                            <div className="absolute top-2 left-2 flex items-center space-x-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1B2A41]/90 text-white">
                                {cand.providerId.toUpperCase()}
                              </span>
                              {cand.isRecommended && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FD9E76] text-[#1B2A41]">
                                  ÖNERİLEN
                                </span>
                              )}
                            </div>

                            {cand.durationSeconds && (
                              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75 text-white">
                                {cand.durationSeconds}s
                              </span>
                            )}
                          </div>

                          {/* Bilgiler ve Seç Butonu */}
                          <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h4 className="font-bold text-xs text-[#1B2A41] line-clamp-1" title={cand.title}>
                                {cand.title}
                              </h4>
                              <div className="text-[11px] text-[#71717A] mt-0.5 truncate">
                                {cand.creator} • {cand.licenceName}
                              </div>
                              <div className="text-[10px] font-medium text-amber-700 mt-1">
                                {cand.matchType === 'exact_location' && '📍 Tam Konum Eşleşmesi'}
                                {cand.matchType === 'nearby_reference' && '🧭 Yakın Referans'}
                                {cand.matchType === 'custom_graphic' && '🎨 Özel Grafik Kartı'}
                                {cand.matchType === 'historic_reconstruction' && '🏛️ Tarihi Canlandırma'}
                                {cand.matchType === 'generic_visual' && '👁️ Genel Görsel Eşleşme'}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[#E2DBD0] flex items-center justify-between">
                              <a
                                href={cand.originalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#71717A] hover:text-[#1B2A41] flex items-center space-x-1"
                              >
                                <span>Kaynak</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>

                              <button
                                type="button"
                                onClick={() => handleSelectCandidate(scene.id, cand.id)}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'bg-[#1B2A41] text-white shadow-xs'
                                    : 'bg-[#FAF7F2] hover:bg-[#FD9E76]/20 text-[#1B2A41] border border-[#E2DBD0]'
                                }`}
                              >
                                {isSelected ? '✓ Seçildi' : 'Seç'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Görsel Plan Metin Giriş Modalı */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DBD0] pb-3">
              <h3 className="text-lg font-bold text-[#1B2A41] font-display">
                Görsel Senaryo Planını Yapıştırın
              </h3>
              <button
                type="button"
                onClick={() => setIsInputModalOpen(false)}
                className="text-[#71717A] hover:text-[#1B2A41] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#71717A]">
              Metin içinde numaralandırılmış sahneler (örn: <code>1 | 0:00 | trigger: ...</code>) ve arama terimleri (<code>Stock: ...</code>) otomatik algılanır.
            </p>

            <textarea
              rows={12}
              value={rawPlanText}
              onChange={(e) => setRawPlanText(e.target.value)}
              placeholder="1 | 0:00 | trigger: &quot;Here's&quot;
Voiceover: &quot;Here's a two-bedroom terrace...&quot;
Stock: Northern England terraced houses → British terraced houses street
Notes: Exterior, understated, grey sky.
Motion: Slow push-in, 6 seconds."
              className="w-full p-3 rounded-lg border border-[#E2DBD0] font-mono text-xs text-[#1B2A41] focus:ring-2 focus:ring-[#FD9E76]/20 focus:border-[#FD9E76]"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setRawPlanText(SAMPLE_NINE_SCENE_PLAN)}
                className="text-xs text-[#FD9E76] hover:text-[#fa8756] font-semibold underline"
              >
                9 Sahnelik County Durham Şablonunu Doldur
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsInputModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E2DBD0] text-xs font-semibold text-[#71717A]"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => handleParsePlan(rawPlanText)}
                  disabled={!rawPlanText.trim()}
                  className="px-5 py-2 rounded-lg bg-[#1B2A41] hover:bg-[#243856] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
                >
                  Planı Çözümle ve Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dışa Aktarma İnceleme Modalı */}
      {isExportModalOpen && exportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2DBD0] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#1B2A41] font-display">
                  Batch Studio Çıktıları ve Raporlar
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Dosyalar doğrudan <code>{exportData.metadataDir}</code> klasörüne kaydedilmiştir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-[#71717A] hover:text-[#1B2A41] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* CSV Önizleme */}
              <div>
                <h4 className="font-bold text-[#1B2A41] mb-1 flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" />
                  asset-map.csv (Sahne ve Numaralı Dosya Eşleşmesi)
                </h4>
                <pre className="p-3 bg-[#FAF7F2] rounded border border-[#E2DBD0] overflow-x-auto text-[11px] font-mono">
                  {exportData.content?.assetMapCsv}
                </pre>
              </div>

              {/* Attribution Raporu */}
              <div>
                <h4 className="font-bold text-[#1B2A41] mb-1 flex items-center">
                  <FileText className="w-4 h-4 mr-1 text-blue-600" />
                  attribution-report.md (YouTube Açıklaması Telif ve Atıf Metni)
                </h4>
                <pre className="p-3 bg-[#FAF7F2] rounded border border-[#E2DBD0] overflow-x-auto text-[11px] font-mono">
                  {exportData.content?.attributionMd}
                </pre>
              </div>

              {/* Çekim Planı */}
              <div>
                <h4 className="font-bold text-[#1B2A41] mb-1 flex items-center">
                  <Film className="w-4 h-4 mr-1 text-[#FD9E76]" />
                  shot-list.md (Kurgu Planı ve Zaman Kodları)
                </h4>
                <pre className="p-3 bg-[#FAF7F2] rounded border border-[#E2DBD0] overflow-x-auto text-[11px] font-mono">
                  {exportData.content?.shotListMd}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2DBD0] flex justify-end">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-5 py-2 rounded-lg bg-[#1B2A41] text-white text-xs font-bold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
