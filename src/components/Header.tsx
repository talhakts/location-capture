'use client';

import React from 'react';
import { Project } from '@/lib/types';
import {
  Compass,
  FolderOpen,
  Plus,
  Key,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onOpenNewProject: () => void;
  onOpenConfig: () => void;
  onOpenExport: () => void;
  hasGeographKey: boolean;
  useDemoData: boolean;
  onToggleDemoData: () => void;
  activeTab: 'search' | 'project' | 'shots' | 'media';
  onChangeTab: (tab: 'search' | 'project' | 'shots' | 'media') => void;
  savedCount: number;
  shotCount: number;
}

export function Header({
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProject,
  onOpenConfig,
  onOpenExport,
  hasGeographKey,
  useDemoData,
  onToggleDemoData,
  activeTab,
  onChangeTab,
  savedCount,
  shotCount,
}: HeaderProps) {
  return (
    <header className="border-b border-[#E2DBD0] bg-[#1B2A41] text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Kanal Başlığı */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-[#FD9E76] flex items-center justify-center text-[#1B2A41] shadow-inner font-bold">
              <Compass className="w-5 h-5 text-[#1B2A41]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg tracking-tight text-white font-display">
                  LOCATION CAPTURE
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#243856] text-[#FD9E76] border border-[#FD9E76]/30">
                  Britain Off Map
                </span>
              </div>
              <p className="text-xs text-[#E2DBD0]/70 -mt-0.5 hidden sm:block">
                Birleşik Krallık Konum Araştırma &amp; Çekim Planlama Aracı
              </p>
            </div>
          </div>

          {/* Aktif Proje Seçici & Hızlı Aksiyonlar */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-[#243856] rounded-md px-3 py-1.5 border border-[#374f72]">
              <FolderOpen className="w-4 h-4 text-[#FD9E76] mr-2 shrink-0" />
              <div className="text-xs mr-2 text-[#E2DBD0]/70 hidden md:inline">Proje:</div>
              <select
                aria-label="Aktif Proje"
                value={activeProject?.id || ''}
                onChange={(e) => {
                  const target = projects.find((p) => p.id === e.target.value);
                  if (target) onSelectProject(target);
                }}
                className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#1B2A41] text-white">
                    {p.title}
                  </option>
                ))}
              </select>
              <button
                onClick={onOpenNewProject}
                title="Yeni Proje Oluştur"
                className="ml-2 p-1 text-[#FD9E76] hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Demo Modu / Canlı Mod Geçişi */}
            <button
              onClick={onToggleDemoData}
              title={useDemoData ? 'Demo modu açık (Örnek UK verileri)' : 'Canlı API modu açık'}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                useDemoData
                  ? 'bg-[#FD9E76] text-[#1B2A41] border-[#FD9E76] font-semibold'
                  : 'bg-[#243856] text-[#E2DBD0] border-[#374f72] hover:border-[#FD9E76]/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {useDemoData ? 'DEMO MODU: AÇIK' : 'CANLI MOD'}
              </span>
            </button>

            {/* Geograph API Anahtar Durumu */}
            <button
              onClick={onOpenConfig}
              title="Geograph API & Sistem Ayarları"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-[#243856] border border-[#374f72] hover:bg-[#2b4366] text-[#E2DBD0] transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-[#FD9E76]" />
              <span className="hidden lg:inline">API</span>
              {hasGeographKey ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Dışa Aktar Butonu */}
            <button
              onClick={onOpenExport}
              disabled={!activeProject}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#FD9E76] text-[#1B2A41] hover:bg-[#fa8756] transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dışa Aktar</span>
            </button>
          </div>
        </div>

        {/* Ana Navigasyon Sekmeleri */}
        <div className="flex space-x-1 border-t border-[#243856] pt-1 overflow-x-auto">
          <button
            onClick={() => onChangeTab('search')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'search'
                ? 'border-[#FD9E76] text-[#FD9E76] bg-[#243856]/40'
                : 'border-transparent text-[#E2DBD0]/70 hover:text-white'
            }`}
          >
            Konum Arama &amp; Görsel Keşif
          </button>
          <button
            onClick={() => onChangeTab('project')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'project'
                ? 'border-[#FD9E76] text-[#FD9E76] bg-[#243856]/40'
                : 'border-transparent text-[#E2DBD0]/70 hover:text-white'
            }`}
          >
            <span>Proje Referansları</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FD9E76] text-[#1B2A41] font-bold">
                {savedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onChangeTab('shots')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'shots'
                ? 'border-[#FD9E76] text-[#FD9E76] bg-[#243856]/40'
                : 'border-transparent text-[#E2DBD0]/70 hover:text-white'
            }`}
          >
            <span>Çekim / Plan Planlayıcı</span>
            {shotCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FD9E76] text-[#1B2A41] font-bold">
                {shotCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onChangeTab('media')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'media'
                ? 'border-[#FD9E76] text-[#FD9E76] bg-[#243856]/40'
                : 'border-transparent text-[#E2DBD0]/70 hover:text-white'
            }`}
          >
            Yerel Medya Kasası
          </button>
        </div>
      </div>
    </header>
  );
}
