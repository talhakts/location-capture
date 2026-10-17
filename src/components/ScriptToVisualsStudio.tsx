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

const SAMPLE_NINE_SCENE_PLAN = `1 | 0:00 | trigger: “On Grosvenor Street”
Stock: Blackpool terraced house street → Blackpool guest house terrace → British Victorian terraced street
Notes: Wide street shot of a tall Victorian guest-house terrace, overcast sky. Stock only, no graphic.
AI prompt: None
Motion: Zoom in 100% → 109% from the first frame, linear ease, 5 seconds.

2 | 0:05 | trigger: “guide price of £35,000”
Stock: None
Notes: Price card graphic that appears on the word “£35,000”. Pastel-orange price on deep navy, location tag in cream.
AI prompt: Clean editorial price-card graphic, deep navy panel with large pastel-orange “£35,000”, small cream text “AUCTION GUIDE PRICE · GROSVENOR STREET, BLACKPOOL”, flat modern documentary design, no clutter, transparent background for overlay.
Motion: Zoom out 109% → 100% from the first frame, linear ease, 3 seconds.

3 | 0:08 | trigger: “That is less than many people spend”
Stock: None
Notes: Simple comparison bar graphic. “£35,000 house” is shorter than “New family car”. The car bar fills in on the words “new family car”.
AI prompt: Minimal two-bar comparison infographic, deep navy background, pastel-orange bar labelled “Terraced house £35,000” beside a slightly longer cream bar labelled “New family car”, clean sans-serif typography, documentary editorial style, transparent background.
Motion: Zoom in 100% → 108% from the first frame, linear ease, 5 seconds.

4 | 0:13 | trigger: “A few streets away”
Stock: Blackpool back street terraced houses → Geograph Blackpool General Street → British terraced houses
Notes: Quiet back street with ordinary terraced houses. Stock only, no graphic.
AI prompt: None
Motion: Zoom out 110% → 100% from the first frame, linear ease, 3 seconds.

5 | 0:16 | trigger: “three-bedroom houses are listed for £40,000”
Stock: None
Notes: Two-line price card. The first row appears on “£40,000” and the second on “£25,000” (the General Street flat).
AI prompt: Two-row price card graphic, deep navy panel, pastel-orange prices “£40,000” and “£25,000” with cream labels “3-BED HOUSE” and “1-BED FLAT · GENERAL STREET”, modern editorial design, transparent background.
Motion: Zoom in 100% → 109% from the first frame, linear ease, 5 seconds.`;

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
  const [disableCustomGraphics, setDisableCustomGraphics] = useState(true);
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
    setStatusMessage('Toplu görsel araması yürütülüyor (Geograph ve stok fotoğraf/videoları)...');

    try {
      const res = await fetch(`/api/projects/${project.id}/visual-plan/batch-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useDemoData: false,
          generateCustomGraphics: !disableCustomGraphics,
        }),
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

  const isAiSceneItem = (scene: ScriptScene) => {
    if (scene.sceneType === 'ai_prompt') return true;
    if (!scene.aiPrompt) return false;
    const p = scene.aiPrompt.trim().toLowerCase();
    return !['none', 'n/a', 'yok', 'no', 'null', 'undefined', '-', ''].includes(p);
  };

  // Aggregate stats
  const totalCount = scenes.length;
  const aiCount = scenes.filter(isAiSceneItem).length;
  const stockScenes = scenes.filter((s) => !isAiSceneItem(s));
  const completedCount = stockScenes.filter((s) => s.searchStatus === 'completed' || s.selectedCandidateId).length;
  const selectedCount = stockScenes.filter((s) => s.selectedCandidateId).length;
  const downloadedCount = stockScenes.filter((s) => s.downloadStatus === 'completed').length;
  const needsManualCount = stockScenes.filter((s) => s.searchStatus === 'needs_manual' && !s.selectedCandidateId).length;

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

          <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold text-[#1B2A41] select-none bg-white px-2.5 py-2 rounded-lg border border-[#E2DBD0] hover:bg-[#FAF7F2] transition-colors shadow-2xs">
            <input
              type="checkbox"
              checked={disableCustomGraphics}
              onChange={(e) => setDisableCustomGraphics(e.target.checked)}
              className="rounded text-[#FD9E76] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Yalnızca Gerçek Stok / Fotoğraf Ara</span>
          </label>

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-white rounded-lg border border-[#E2DBD0] text-center">
            <div className="text-xl font-bold text-[#1B2A41]">{totalCount}</div>
            <div className="text-[11px] text-[#71717A] font-medium">Toplam Sahne</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-[#E2DBD0] text-center">
            <div className="text-xl font-bold text-blue-600">{completedCount}</div>
            <div className="text-[11px] text-[#71717A] font-medium">Stok Bulundu</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-purple-200 bg-purple-50/50 text-center">
            <div className="text-xl font-bold text-purple-700">{aiCount}</div>
            <div className="text-[11px] text-purple-800 font-bold">✨ AI Sahnesi (Atlandı)</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-[#E2DBD0] text-center">
            <div className="text-xl font-bold text-amber-600">{selectedCount}</div>
            <div className="text-[11px] text-[#71717A] font-medium">Seçilen Stok</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-[#E2DBD0] text-center">
            <div className="text-xl font-bold text-emerald-600">{downloadedCount}</div>
            <div className="text-[11px] text-[#71717A] font-medium">İndirildi (HD)</div>
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
          const isAi = isAiSceneItem(scene);
          const sceneCandidates = candidates.filter((c) => c.sceneId === scene.id);
          const selectedCandidate = scene.selectedCandidateId
            ? candidates.find((c) => c.id === scene.selectedCandidateId) || scene.selectedAssetSnapshot
            : undefined;

          return (
            <div
              key={scene.id}
              className={`bg-white rounded-xl border shadow-2xs overflow-hidden transition-all ${
                isAi
                  ? 'border-purple-300 ring-1 ring-purple-100 hover:border-purple-400'
                  : 'border-[#E2DBD0] hover:border-[#FD9E76]/50'
              }`}
            >
              {/* Sahne Başlığı */}
              <div className="p-4 bg-gradient-to-r from-white to-[#FAF7F2] border-b border-[#E2DBD0] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-white font-mono text-xs font-bold ${isAi ? 'bg-purple-800' : 'bg-[#1B2A41]'}`}>
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
                  {isAi && (
                    <span className="px-2.5 py-0.5 rounded bg-purple-600 text-white text-xs font-bold flex items-center shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
                      ✨ AI Sahnesi (Stok Arama Atlandı)
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
                  {isAi ? (
                    <span className="px-2.5 py-1 rounded bg-purple-100 border border-purple-200 text-purple-900 text-[11px] font-bold flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-purple-600" />
                      AI Promptuna Ayrıldı (Atlandı)
                    </span>
                  ) : (
                    <>
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
                      {scene.searchStatus === 'needs_manual' && !scene.selectedCandidateId && (
                        <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-800 text-[11px] font-semibold flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                          Manuel Arama Gerekiyor
                        </span>
                      )}
                    </>
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
                {!isAi && scene.searchQueries.length > 0 && (
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
                )}

                {scene.visualNotes && (
                  <div className="text-[#71717A]">
                    <span className="font-bold">Görsel Not:</span> {scene.visualNotes}
                  </div>
                )}

                {/* AI / Canlandırma İstemi Varsa */}
                {scene.aiPrompt && (
                  <div className="p-2.5 rounded bg-purple-50/60 border border-purple-200 flex items-center justify-between gap-2">
                    <div className="truncate text-[#1B2A41]">
                      <span className="font-bold text-purple-700">✨ Yapay Zeka İstemi:</span>{' '}
                      <span className="font-mono text-[11px] text-purple-950">{scene.aiPrompt}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(scene.aiPrompt!, scene.id)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-purple-100 border border-purple-200 text-[11px] font-semibold text-purple-900 shrink-0 flex items-center space-x-1 shadow-2xs"
                    >
                      {copiedPromptId === scene.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Kopyalandı!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-purple-600" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Aday Görseller Galerisi veya AI İstemi Kartı */}
              {isAi ? (
                <div className="p-4 bg-purple-50/40">
                  <div className="p-4 bg-white rounded-lg border border-purple-200 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                        <h4 className="text-xs font-bold text-purple-950">
                          Sahne #{scene.sceneNumber} — Yapay Zeka Canlandırma Sahnesi
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(scene.aiPrompt || '', scene.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 self-start sm:self-auto"
                      >
                        {copiedPromptId === scene.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>İstem Kopyalandı!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Promptu Kopyala (Midjourney / Flux)</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 font-mono text-xs text-purple-950 leading-relaxed select-all">
                      {scene.aiPrompt}
                    </div>

                    <p className="text-[11px] text-purple-700 leading-relaxed">
                      💡 Bu sahne tarihi veya senaryo canlandırması içerdiği için stok görsel aramasından ve indirmeden muaf tutulmuştur (atlandı). Görseli oluşturmak için yukarıdaki promptu kopyalayıp Midjourney, Flux veya tercih ettiğiniz yapay zeka aracına yapıştırınız.
                    </p>
                  </div>
                </div>
              ) : (
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
                                  {cand.previewUrl ? (
                                    <video
                                      src={cand.previewUrl}
                                      className="w-full h-full object-cover"
                                      muted
                                      loop
                                      onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                                      onMouseOut={(e) => {
                                        const v = e.target as HTMLVideoElement;
                                        v.pause();
                                        v.currentTime = 0;
                                      }}
                                    />
                                  ) : (
                                    <Film className="w-8 h-8 text-white/50" />
                                  )}
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] flex items-center">
                                    <Film className="w-2.5 h-2.5 mr-1 text-[#FD9E76]" />
                                    {cand.durationSeconds ? `${cand.durationSeconds}s` : 'VİDEO'}
                                  </span>
                                </div>
                              ) : (
                                <div className="relative w-full h-full">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={cand.previewUrl}
                                    alt={cand.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                </div>
                              )}

                              {cand.isRecommended && (
                                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold shadow-xs flex items-center">
                                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                  Önerilen
                                </span>
                              )}
                            </div>

                            {/* Görsel Detayı & Seçim */}
                            <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                              <div>
                                <h5 className="font-semibold text-xs text-[#1B2A41] line-clamp-1" title={cand.title}>
                                  {cand.title}
                                </h5>
                                <p className="text-[10px] text-[#71717A] line-clamp-2 mt-0.5" title={cand.description}>
                                  {cand.description}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-[#E2DBD0] flex items-center justify-between">
                                <span className="text-[10px] text-[#71717A] truncate font-medium">
                                  {cand.providerId === 'geograph'
                                    ? 'Geograph UK'
                                    : cand.providerId === 'pexels'
                                    ? 'Pexels'
                                    : cand.providerId === 'openverse'
                                    ? 'Openverse Stok'
                                    : 'Grafik'}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleSelectCandidate(scene.id, cand.id)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-[#FAF7F2] hover:bg-[#E2DBD0] text-[#1B2A41] border border-[#E2DBD0]'
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
              )}
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
