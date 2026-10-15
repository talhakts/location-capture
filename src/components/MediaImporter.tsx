'use client';

import React, { useState } from 'react';
import { LocalMedia, SourceReference } from '@/lib/types';
import {
  Upload,
  FileText,
  Trash2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileArchive,
} from 'lucide-react';

interface MediaImporterProps {
  media: LocalMedia[];
  references: SourceReference[];
  onUploadMedia: (file: File, referenceId?: string, notes?: string) => Promise<boolean>;
  onDeleteMedia: (mediaId: string) => void;
}

export function MediaImporter({
  media,
  references,
  onUploadMedia,
  onDeleteMedia,
}: MediaImporterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg('Dosya boyutu 50MB sınırını aşıyor.');
        setSelectedFile(null);
        return;
      }
      setErrorMsg(null);
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const ok = await onUploadMedia(selectedFile, selectedReferenceId || undefined, notes);
    setIsUploading(false);

    if (ok) {
      setSuccessMsg(`"${selectedFile.name}" yerel proje kasasına başarıyla aktarıldı.`);
      setSelectedFile(null);
      setNotes('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg('Dosya aktarılamadı. Formatı kontrol edin (JPEG, PNG, WebP, MP4, WebM).');
    }
  };

  return (
    <div className="space-y-6">
      {/* Yükleme Alanı */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] p-6 shadow-sm">
        <div className="flex items-center space-x-2 border-b border-[#FAF7F2] pb-3 mb-4">
          <HardDrive className="w-5 h-5 text-[#1B2A41]" />
          <div>
            <h2 className="text-base font-bold text-[#1B2A41] font-display">
              Yerel Medya Kasası
            </h2>
            <p className="text-xs text-[#71717A]">
              Manuel indirdiğiniz yüksek çözünürlüklü fotoğrafları veya video b-roll çekimlerinizi kaynak ve atıf kayıtlarıyla güvenle saklayın.
            </p>
          </div>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dosya Seçici */}
            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Dosya Seçin (Maksimum 50MB) *
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                onChange={handleFileChange}
                className="w-full text-xs text-[#71717A] file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#1B2A41] file:text-white hover:file:bg-[#243856] cursor-pointer border border-[#E2DBD0] rounded-lg p-1.5"
                required
              />
              <span className="text-[11px] text-[#71717A] block mt-1">
                Desteklenen formatlar: JPEG, PNG, WebP, MP4, QuickTime, WebM
              </span>
            </div>

            {/* Referansla Eşleştirme */}
            <div>
              <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
                Kayıtlı Referans ile Eşleştir (İsteğe Bağlı)
              </label>
              <select
                aria-label="Kayıtlı Referans ile Eşleştir"
                value={selectedReferenceId}
                onChange={(e) => setSelectedReferenceId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2DBD0] bg-white font-medium"
              >
                <option value="">Bağımsız Dosya</option>
                {references.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.creator})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1B2A41] mb-1">
              Prodüksiyon Notları / Klip Bilgisi
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: Geograph'tan indirilen tam çözünürlüklü orijinal görsel; renk düzeltmesi yapıldı."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2DBD0]"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-4 py-2 rounded-lg bg-[#FD9E76] text-[#1B2A41] hover:bg-[#fa8756] text-xs font-bold transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Dosya Aktarılıyor...' : 'Medya Kasasına Aktar'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Yüklenen Dosyalar Listesi */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-[#1B2A41] uppercase tracking-wider font-display">
          Kasaya Aktarılmış Dosyalar ({media.length})
        </h3>

        {media.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2DBD0] p-10 text-center">
            <FileArchive className="w-8 h-8 text-[#E2DBD0] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1B2A41]">
              Bu projeye henüz dosya aktarılmadı.
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              Geograph&apos;tan indirdiğiniz yüksek çözünürlüklü fotoğrafları veya saha çekimlerinizi buraya yükleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-[#E2DBD0] p-3 flex flex-col justify-between space-y-2 shadow-xs overflow-hidden"
              >
                {/* Önizleme */}
                <div className="aspect-16/9 bg-[#FAF7F2] rounded overflow-hidden flex items-center justify-center border border-[#E2DBD0]">
                  {item.mediaType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.localRelativePath}
                      alt={item.originalFilename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-[#1B2A41] flex flex-col items-center">
                      <FileText className="w-8 h-8 text-[#FD9E76] mb-1" />
                      <span className="text-[11px] font-semibold">{item.mediaType}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-bold text-xs text-[#1B2A41] truncate font-display">
                    {item.originalFilename}
                  </div>
                  <div className="text-[11px] text-[#71717A] flex items-center justify-between mt-1">
                    <span>{(item.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>{new Date(item.importedAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {item.notes && (
                    <div className="text-[11px] text-[#71717A] italic mt-1 truncate">
                      {item.notes}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#FAF7F2] flex items-center justify-between">
                  <a
                    href={item.localRelativePath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#1B2A41] font-semibold hover:underline"
                  >
                    Dosyayı Aç
                  </a>
                  <button
                    onClick={() => onDeleteMedia(item.id)}
                    title="Kasadan sil"
                    className="p-1 rounded text-rose-600 hover:bg-rose-50"
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
