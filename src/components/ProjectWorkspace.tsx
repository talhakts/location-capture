'use client';

import React, { useState } from 'react';
import { Project, SourceReference, WorkflowStatus } from '@/lib/types';
import {
  ExternalLink,
  Trash2,
  FileText,
  Camera,
  Film,
} from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  references: SourceReference[];
  onUpdateProject: (updates: Partial<Project>) => void;
  onUpdateReferenceStatus: (refId: string, status: WorkflowStatus, notes?: string) => void;
  onDeleteReference: (refId: string) => void;
  onCreateShotFromReference: (ref: SourceReference) => void;
}

const WORKFLOW_STATUS_OPTIONS: { label: string; value: WorkflowStatus; color: string }[] = [
  { label: 'Keşfedildi', value: 'Discovered', color: 'bg-slate-100 text-slate-700' },
  { label: 'Kısa Listede', value: 'Shortlisted', color: 'bg-blue-100 text-blue-800' },
  { label: 'Lisansı İncelenecek', value: 'Licence to review', color: 'bg-amber-100 text-amber-800' },
  { label: 'Kullanıma Hazır', value: 'Ready to use', color: 'bg-emerald-100 text-emerald-800' },
  { label: 'Manuel İndirildi', value: 'Manually downloaded', color: 'bg-teal-100 text-teal-800' },
  { label: 'Projeye Aktarıldı', value: 'Imported locally', color: 'bg-purple-100 text-purple-800' },
  { label: 'Kurguda Kullanıldı', value: 'Used in edit', color: 'bg-[#FD9E76]/20 text-[#1B2A41] font-bold' },
  { label: 'Reddedildi / Kullanılmayacak', value: 'Rejected', color: 'bg-rose-100 text-rose-800' },
];

export function ProjectWorkspace({
  project,
  references,
  onUpdateProject,
  onUpdateReferenceStatus,
  onDeleteReference,
  onCreateShotFromReference,
}: ProjectWorkspaceProps) {
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [workingTitle, setWorkingTitle] = useState(project.workingVideoTitle || '');
  const [description, setDescription] = useState(project.description || '');
  const [scriptExcerpt, setScriptExcerpt] = useState(project.scriptExcerpt || '');

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProject({
      workingVideoTitle: workingTitle,
      description,
      scriptExcerpt,
    });
    setIsEditingMeta(false);
  };

  return (
    <div className="space-y-6">
      {/* Proje Genel Bilgi Kartı */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#FAF7F2] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF7F2] text-[#1B2A41] border border-[#E2DBD0]">
                Aktif YouTube Prodüksiyon Projesi
              </span>
              <h2 className="text-xl font-bold text-[#1B2A41] font-display">
                {project.title}
              </h2>
            </div>
            {project.workingVideoTitle && (
              <p className="text-sm font-semibold text-[#FD9E76] mt-1">
                Çalışma Bölüm Başlığı: &ldquo;{project.workingVideoTitle}&rdquo;
              </p>
            )}
            {project.description && (
              <p className="text-xs text-[#71717A] mt-2 max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <button
            onClick={() => setIsEditingMeta(!isEditingMeta)}
            className="px-3.5 py-1.5 rounded border border-[#E2DBD0] hover:bg-[#FAF7F2] text-xs font-semibold text-[#1B2A41] transition-colors shrink-0"
          >
            {isEditingMeta ? 'İptal' : 'Metin & Bilgileri Düzenle'}
          </button>
        </div>

        {/* Seslendirme Metni ve Form */}
        {isEditingMeta ? (
          <form onSubmit={handleSaveMeta} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Çalışma Bölüm Başlığı
              </label>
              <input
                type="text"
                value={workingTitle}
                onChange={(e) => setWorkingTitle(e.target.value)}
                placeholder="Örn: Morecambe: Unutulan Viktorya Dönemi Sahili"
                className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Bölüm Teması / Araştırma Özeti
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Bölüm odak noktaları: teraslı evler, sahil şeridi erozyonu, maden kasabası tarihi..."
                className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Seslendirme Metni Paragrafı (Voiceover)
              </label>
              <textarea
                value={scriptExcerpt}
                onChange={(e) => setScriptExcerpt(e.target.value)}
                rows={3}
                placeholder="Bu sahnede videoda seslendireceğin cümleleri buraya yapıştır..."
                className="w-full px-3 py-2 text-xs rounded border border-[#E2DBD0] font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#1B2A41] text-white text-xs font-semibold hover:bg-[#243856]"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </form>
        ) : (
          project.scriptExcerpt && (
            <div className="mt-4 p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E2DBD0] text-xs">
              <div className="flex items-center text-[#71717A] text-[11px] font-semibold mb-1">
                <FileText className="w-3.5 h-3.5 mr-1 text-[#1B2A41]" />
                Bağlantılı Seslendirme Cümlesi (Voiceover):
              </div>
              <p className="italic text-[#1B2A41] font-mono leading-relaxed">
                &ldquo;{project.scriptExcerpt}&rdquo;
              </p>
            </div>
          )
        )}
      </div>

      {/* Kayıtlı Referanslar Koleksiyonu */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-[#1B2A41]" />
            <h3 className="font-bold text-sm text-[#1B2A41] uppercase tracking-wider font-display">
              Proje Referans Koleksiyonu ({references.length})
            </h3>
          </div>
          <span className="text-xs text-[#71717A]">
            Görsel durumlarını ve atıf kayıtlarını yönetin
          </span>
        </div>

        {references.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2DBD0] p-10 text-center">
            <Camera className="w-8 h-8 text-[#E2DBD0] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1B2A41]">
              Bu projeye henüz referans eklenmedi.
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              &ldquo;Konum Arama &amp; Görsel Keşif&rdquo; sekmesinden fotoğraf keşfedip &ldquo;Projeye Ekle&rdquo; butonuna basın.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {references.map((ref) => (
              <div
                key={ref.id}
                className="bg-white rounded-lg border border-[#E2DBD0] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
              >
                {/* Küçük Resim ve Başlık */}
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E2DBD0]">
                    {ref.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ref.previewUrl}
                        alt={ref.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#71717A]">
                        <Camera className="w-6 h-6 text-[#E2DBD0]" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h4 className="font-bold text-sm text-[#1B2A41] truncate font-display">
                      {ref.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#71717A]">
                      <span>Fotoğrafçı: <strong>{ref.creator}</strong></span>
                      <span>•</span>
                      <span>{ref.licenceName}</span>
                      {ref.distanceMeters !== undefined && (
                        <>
                          <span>•</span>
                          <span>{ref.distanceMeters}m uzakta</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-[#71717A] italic">
                      Atıf: {ref.attributionText}
                    </div>
                  </div>
                </div>

                {/* İş Akışı Durumu ve Eylemler */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#FAF7F2]">
                  {/* Durum Seçici */}
                  <select
                    aria-label="İş Akışı Durumu"
                    value={ref.workflowStatus}
                    onChange={(e) =>
                      onUpdateReferenceStatus(ref.id, e.target.value as WorkflowStatus)
                    }
                    className="text-xs font-semibold px-2.5 py-1.5 rounded border border-[#E2DBD0] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#FD9E76]"
                  >
                    {WORKFLOW_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Çekim Planı Oluştur Butonu */}
                  <button
                    onClick={() => onCreateShotFromReference(ref)}
                    title="Bu referanstan zamanlanmış sahne planı üret"
                    className="px-2.5 py-1.5 rounded bg-[#1B2A41] hover:bg-[#243856] text-white text-xs font-medium flex items-center space-x-1"
                  >
                    <Film className="w-3.5 h-3.5 text-[#FD9E76]" />
                    <span className="hidden sm:inline">Çekim Planla</span>
                  </button>

                  {/* Orijinal Sayfayı Aç */}
                  <a
                    href={ref.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Orijinal Geograph sayfasını aç"
                    className="p-1.5 rounded border border-[#E2DBD0] hover:bg-[#FAF7F2] text-[#1B2A41]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Referansı Kaldır */}
                  <button
                    onClick={() => onDeleteReference(ref.id)}
                    title="Referansı projeden kaldır"
                    className="p-1.5 rounded border border-rose-200 hover:bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
