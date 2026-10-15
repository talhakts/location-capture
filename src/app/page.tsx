'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Project, SourceReference, ShotPlan, LocalMedia, LocationRecord, ResolvedLocationCandidate, WorkflowStatus } from '@/lib/types';
import { SearchResultItem } from '@/lib/providers/types';
import { Header } from '@/components/Header';
import { DashboardStats } from '@/components/DashboardStats';
import { LocationSearch } from '@/components/LocationSearch';
import { Gallery } from '@/components/Gallery';
import { ProjectWorkspace } from '@/components/ProjectWorkspace';
import { ShotPlanner } from '@/components/ShotPlanner';
import { MediaImporter } from '@/components/MediaImporter';
import { NewProjectModal } from '@/components/NewProjectModal';
import { ExportModal } from '@/components/ExportModal';
import { ConfigModal } from '@/components/ConfigModal';
import { fetchGeographClientJsonp } from '@/lib/location/geograph-client';

export default function Home() {
  // Navigation & Modal states
  const [activeTab, setActiveTab] = useState<'search' | 'project' | 'shots' | 'media'>('search');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Configuration & System Stats
  const [hasGeographKey, setHasGeographKey] = useState(false);
  const [geographApiKey, setGeographApiKey] = useState('');
  const [useDemoData, setUseDemoData] = useState(false); // Default to live now that key is configured!
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalSavedReferences: 0,
    referencesToReview: 0,
    manuallyDownloaded: 0,
    importedLocally: 0,
    totalShotPlans: 0,
  });
  const [recentLocations, setRecentLocations] = useState<LocationRecord[]>([]);

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projectReferences, setProjectReferences] = useState<SourceReference[]>([]);
  const [projectShots, setProjectShots] = useState<ShotPlan[]>([]);
  const [projectMedia, setProjectMedia] = useState<LocalMedia[]>([]);

  // Search & Gallery state
  const [activeLocation, setActiveLocation] = useState<LocationRecord | null>(null);
  const [candidates, setCandidates] = useState<ResolvedLocationCandidate[]>([]);
  const [photographs, setPhotographs] = useState<SearchResultItem[]>([]);
  const [inspectionTools, setInspectionTools] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load initial system config & stats
  const loadSystemConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/system/config');
      const data = await res.json();
      if (data.success) {
        setHasGeographKey(data.config.hasGeographKey);
        setGeographApiKey(data.config.geographKey || '');
        setStats(data.stats);
        setRecentLocations(data.recentLocations || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Load project details
  const loadProjectDetails = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (data.success && data.project) {
        setProjectReferences(data.project.references || []);
        setProjectShots(data.project.shotPlans || []);
        setProjectMedia(data.project.localMedia || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        const list: Project[] = data.projects || [];
        setProjects(list);

        if (list.length > 0) {
          const current = list[0];
          setActiveProject(current);
          loadProjectDetails(current.id);
        } else {
          // Create initial seed project for Britain Off Map
          const createRes = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Morecambe Bay & Coastal Housing',
              workingVideoTitle: 'The British Seaside Town That Refused to Fade',
              description:
                'Documentary exploring Victorian red-brick terraces, promenade erosion, and post-war guesthouse architecture.',
              scriptExcerpt:
                'Walking along the promenade at low tide, the grand Victorian terraces stand as quiet sentinels above Morecambe Bay.',
            }),
          });
          const createdData = await createRes.json();
          if (createdData.success && createdData.project) {
            setProjects([createdData.project]);
            setActiveProject(createdData.project);
            loadProjectDetails(createdData.project.id);
          }
        }
      }
    } catch {
      // Ignore
    }
  }, [loadProjectDetails]);

  useEffect(() => {
    loadSystemConfig();
    loadProjects();
  }, [loadSystemConfig, loadProjects]);

  // Execute Media Search
  const handleSearchMedia = async (params: {
    latitude: number;
    longitude: number;
    locationName: string;
    postcode?: string;
    radiusKm: number;
    queryText?: string;
  }) => {
    setIsSearching(true);
    setSearchError(null);

    // If in live mode and we have an API key, call Geograph directly from the browser (JSONP)
    // to bypass server-side Cloudflare bot blocking
    const activeKey = geographApiKey || '50d6956376';
    if (!useDemoData && activeKey) {
      try {
        const livePhotos = await fetchGeographClientJsonp(
          activeKey,
          params.latitude,
          params.longitude,
          params.radiusKm,
          params.queryText
        );

        if (livePhotos && livePhotos.length > 0) {
          setPhotographs(livePhotos);

          // Fetch inspection tools (Google Maps / Earth links) from server
          try {
            const inspRes = await fetch('/api/locations/search-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...params, useDemoData: true }),
            });
            const inspData = await inspRes.json();
            setInspectionTools(inspData.results?.inspectionTools || []);
          } catch {
            // Ignore inspection tool fetch errors
          }

          loadSystemConfig();
          setIsSearching(false);
          return;
        }
      } catch (browserErr: any) {
        console.warn('Browser JSONP live call notice:', browserErr.message);
      }
    }

    try {
      const res = await fetch('/api/locations/search-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          useDemoData,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.needsConfig) {
          setSearchError(data.error);
          setIsConfigModalOpen(true);
        } else {
          setSearchError(data.error || 'Search failed');
        }
        setIsSearching(false);
        return;
      }

      setPhotographs(data.results.photographs || []);
      setInspectionTools(data.results.inspectionTools || []);
      loadSystemConfig(); // Refresh recent locations and stats
    } catch (err: any) {
      setSearchError(err.message || 'Network request failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Add reference to active project
  const handleAddReference = async (item: SearchResultItem) => {
    if (!activeProject) return;

    try {
      const res = await fetch(`/api/projects/${activeProject.id}/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: activeLocation?.id,
          providerId: item.providerId,
          externalAssetId: item.externalAssetId,
          title: item.title,
          description: item.description,
          originalUrl: item.originalUrl,
          previewUrl: item.previewUrl,
          creator: item.creator,
          licenceName: item.licenceName,
          licenceUrl: item.licenceUrl,
          attributionText: item.attributionText,
          commercialUseStatus: item.commercialUseStatus,
          adaptationRestrictions: item.adaptationRestrictions,
          latitude: item.latitude,
          longitude: item.longitude,
          distanceMeters: item.distanceMeters,
          mediaType: item.mediaType,
          workflowStatus: 'Shortlisted',
        }),
      });

      const data = await res.json();
      if (data.success && data.reference) {
        loadProjectDetails(activeProject.id);
        loadSystemConfig();
      }
    } catch {
      // Ignore
    }
  };

  // Update Reference Workflow Status
  const handleUpdateReferenceStatus = async (refId: string, status: WorkflowStatus, notes?: string) => {
    if (!activeProject) return;
    try {
      await fetch(`/api/projects/${activeProject.id}/references`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: refId, workflowStatus: status, notes }),
      });
      loadProjectDetails(activeProject.id);
      loadSystemConfig();
    } catch {
      // Ignore
    }
  };

  // Delete Reference
  const handleDeleteReference = async (refId: string) => {
    if (!activeProject) return;
    try {
      await fetch(`/api/projects/${activeProject.id}/references?refId=${refId}`, {
        method: 'DELETE',
      });
      loadProjectDetails(activeProject.id);
      loadSystemConfig();
    } catch {
      // Ignore
    }
  };

  // Add Shot Plan
  const handleAddShot = async (shot: Omit<ShotPlan, 'id' | 'sequenceOrder'>) => {
    if (!activeProject) return;
    try {
      await fetch(`/api/projects/${activeProject.id}/shot-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shot,
          locationId: activeLocation?.id,
        }),
      });
      loadProjectDetails(activeProject.id);
      loadSystemConfig();
    } catch {
      // Ignore
    }
  };

  // Reorder Shots
  const handleReorderShots = async (orderedIds: string[]) => {
    if (!activeProject) return;
    try {
      await fetch(`/api/projects/${activeProject.id}/shot-plans`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', orderedIds }),
      });
      loadProjectDetails(activeProject.id);
    } catch {
      // Ignore
    }
  };

  // Delete Shot
  const handleDeleteShot = async (shotId: string) => {
    if (!activeProject) return;
    try {
      await fetch(`/api/projects/${activeProject.id}/shot-plans?shotId=${shotId}`, {
        method: 'DELETE',
      });
      loadProjectDetails(activeProject.id);
      loadSystemConfig();
    } catch {
      // Ignore
    }
  };

  // Upload Local Media
  const handleUploadMedia = async (file: File, referenceId?: string, notes?: string): Promise<boolean> => {
    if (!activeProject) return false;
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (referenceId) formData.append('sourceReferenceId', referenceId);
      if (notes) formData.append('notes', notes);

      const res = await fetch(`/api/projects/${activeProject.id}/media`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        loadProjectDetails(activeProject.id);
        loadSystemConfig();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Delete Media
  const handleDeleteMedia = async (mediaId: string) => {
    if (!activeProject) return;
    try {
      await fetch(`/api/projects/${activeProject.id}/media?mediaId=${mediaId}`, {
        method: 'DELETE',
      });
      loadProjectDetails(activeProject.id);
      loadSystemConfig();
    } catch {
      // Ignore
    }
  };

  // Create Shot from Reference quick action
  const handleCreateShotFromRef = (ref: SourceReference) => {
    setActiveTab('shots');
    handleAddShot({
      projectId: activeProject?.id || '',
      durationSeconds: 8,
      shotType: ref.mediaType === 'photograph' ? 'Street-level establishing shot' : 'Wide establishing shot',
      visualObjective: `Visual reference of ${ref.title}`,
      movement: 'Slow push-in',
      scriptExcerpt: activeProject?.scriptExcerpt,
      relatedReferenceId: ref.id,
      productionNotes: 'Ken Burns digital zoom 105% on still photograph; CC BY-SA attribution required.',
    });
  };

  // Select Candidate Location
  const handleSelectCandidate = (candidate: ResolvedLocationCandidate) => {
    const loc: LocationRecord = {
      id: `loc_${Date.now()}`,
      query: candidate.query,
      resolvedName: candidate.resolvedName,
      postcode: candidate.postcode,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      resolutionProvider: candidate.resolutionProvider,
      resolutionPrecision: candidate.resolutionPrecision,
      county: candidate.county,
      district: candidate.district,
      country: candidate.country,
      createdAt: new Date().toISOString(),
    };
    setActiveLocation(loc);

    // Auto-search photographs for resolved point
    handleSearchMedia({
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationName: loc.resolvedName,
      postcode: loc.postcode,
      radiusKm: 5,
    });
  };

  // Set of saved external IDs for quick lookups
  const savedExternalIds = new Set(projectReferences.map((r) => r.externalAssetId));

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      {/* Primary Header */}
      <Header
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(p) => {
          setActiveProject(p);
          loadProjectDetails(p.id);
        }}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        hasGeographKey={hasGeographKey}
        useDemoData={useDemoData}
        onToggleDemoData={() => setUseDemoData(!useDemoData)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        savedCount={projectReferences.length}
        shotCount={projectShots.length}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Dashboard Aggregate Stats */}
        <DashboardStats
          stats={stats}
          recentLocations={recentLocations}
          onSelectLocation={(loc) => {
            setActiveLocation(loc);
            setActiveTab('search');
            handleSearchMedia({
              latitude: loc.latitude,
              longitude: loc.longitude,
              locationName: loc.resolvedName,
              postcode: loc.postcode,
              radiusKm: 5,
            });
          }}
        />

        {/* Tab 1: Location Search & Discovery */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <LocationSearch
              onSearchMedia={handleSearchMedia}
              isLoading={isSearching}
              activeLocation={activeLocation}
              candidates={candidates}
              onSelectCandidate={handleSelectCandidate}
              onCandidatesFound={setCandidates}
              errorMessage={searchError}
            />

            <Gallery
              photographs={photographs}
              inspectionTools={inspectionTools}
              savedExternalIds={savedExternalIds}
              onAddReference={handleAddReference}
              usedDemoData={useDemoData}
            />
          </div>
        )}

        {/* Tab 2: Project Collection Workspace */}
        {activeTab === 'project' && activeProject && (
          <ProjectWorkspace
            project={activeProject}
            references={projectReferences}
            onUpdateProject={async (updates) => {
              await fetch(`/api/projects/${activeProject.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
              });
              loadProjects();
            }}
            onUpdateReferenceStatus={handleUpdateReferenceStatus}
            onDeleteReference={handleDeleteReference}
            onCreateShotFromReference={handleCreateShotFromRef}
          />
        )}

        {/* Tab 3: Shot Planner Sequence */}
        {activeTab === 'shots' && (
          <ShotPlanner
            shots={projectShots}
            references={projectReferences}
            onAddShot={handleAddShot}
            onReorderShots={handleReorderShots}
            onDeleteShot={handleDeleteShot}
            activeScriptExcerpt={activeProject?.scriptExcerpt}
          />
        )}

        {/* Tab 4: Local Media Vault */}
        {activeTab === 'media' && (
          <MediaImporter
            media={projectMedia}
            references={projectReferences}
            onUploadMedia={handleUploadMedia}
            onDeleteMedia={handleDeleteMedia}
          />
        )}
      </main>

      {/* Alt Bilgi */}
      <footer className="border-t border-[#E2DBD0] bg-white py-4 text-center text-xs text-[#71717A]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>Location Capture</strong> • <em>Britain Off Map</em> belgesel prodüksiyonu için geliştirildi
          </span>
          <span>
            CC BY-SA 2.0 atıf hakları korunur • Otomatik sokak haritası kazıması yapılmaz
          </span>
        </div>
      </footer>

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={async (data) => {
          const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const resData = await res.json();
          if (resData.success) {
            loadProjects();
            return true;
          }
          return false;
        }}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        hasGeographKey={hasGeographKey}
        useDemoData={useDemoData}
        onToggleDemoData={() => setUseDemoData(!useDemoData)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={activeProject}
        referenceCount={projectReferences.length}
        shotCount={projectShots.length}
      />
    </div>
  );
}
