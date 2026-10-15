'use client';

import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: {
    title: string;
    workingVideoTitle?: string;
    description?: string;
    scriptExcerpt?: string;
  }) => Promise<boolean>;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreateProject,
}: NewProjectModalProps) {
  const [title, setTitle] = useState('');
  const [workingVideoTitle, setWorkingVideoTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scriptExcerpt, setScriptExcerpt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const ok = await onCreateProject({
      title: title.trim(),
      workingVideoTitle: workingVideoTitle.trim() || undefined,
      description: description.trim() || undefined,
      scriptExcerpt: scriptExcerpt.trim() || undefined,
    });
    setIsSubmitting(false);

    if (ok) {
      setTitle('');
      setWorkingVideoTitle('');
      setDescription('');
      setScriptExcerpt('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-[#1B2A41] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-[#FD9E76]" />
            <h3 className="font-bold text-base font-display">Yeni Prodüksiyon Projesi Oluştur</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#E2DBD0] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-1">
              Proje Başlığı *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Morecambe Sahili: Viktorya Dönemi Terasları"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2DBD0] focus:ring-2 focus:ring-[#FD9E76]/20 focus:border-[#FD9E76]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-1">
              Çalışma Video Başlığı
            </label>
            <input
              type="text"
              value={workingVideoTitle}
              onChange={(e) => setWorkingVideoTitle(e.target.value)}
              placeholder="Örn: İngiltere'nin Kapatılmaya Direnen Sahil Kasabası"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2DBD0]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-1">
              Bölüm Konusu / Araştırma Özeti
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Odak alanları: teraslı evler, sahil şeridi, yerel hikayeler..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2DBD0]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-1">
              Seslendirme Metni (Voiceover - İsteğe Bağlı)
            </label>
            <textarea
              value={scriptExcerpt}
              onChange={(e) => setScriptExcerpt(e.target.value)}
              rows={3}
              placeholder="Bu bölümde seslendireceğiniz taslak metni buraya ekleyin..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2DBD0] font-mono text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#FAF7F2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E2DBD0] text-xs font-semibold text-[#71717A] hover:bg-[#FAF7F2]"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-lg bg-[#FD9E76] text-[#1B2A41] hover:bg-[#fa8756] text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Proje Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
