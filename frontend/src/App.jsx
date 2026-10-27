import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import FilterBar from './components/FilterBar';
import IncidentList from './components/IncidentList';
import IncidentModal from './components/IncidentModal';
import IncidentDetailDrawer from './components/IncidentDetailDrawer';
import ResolveModal from './components/ResolveModal';
import EmptyState from './components/EmptyState';
import LoadingSkeleton from './components/LoadingSkeleton';
import NotificationToast from './components/NotificationToast';
import { incidentApi, testApiConnection } from './services/api';
import { 
  AlertCircle, 
  RefreshCw, 
  Cpu
} from 'lucide-react';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [allIncidentsForStats, setAllIncidentsForStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [service, setService] = useState('');

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolvingIncident, setResolvingIncident] = useState(null);

  // Notifications
  const [notification, setNotification] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);

  const showNotification = (type, message, title = null) => {
    setNotification({ type, message, title });
  };

  // Check API health on load
  const checkApiHealth = useCallback(async () => {
    const res = await testApiConnection();
    setApiStatus(res);
  }, []);

  useEffect(() => {
    checkApiHealth();
  }, [checkApiHealth]);

  // Load all incidents for stats calculation
  const loadStatsData = useCallback(async () => {
    try {
      const res = await incidentApi.list();
      setAllIncidentsForStats(res.incidents || []);
    } catch (err) {
      console.warn('Could not load global stats data', err);
    }
  }, []);

  // Fetch filtered incidents
  const loadIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Map OPEN pseudo-status filter
      let queryStatus = status;
      let postFilterOpen = false;
      if (status === 'OPEN') {
        queryStatus = '';
        postFilterOpen = true;
      }

      const res = await incidentApi.list({
        search,
        status: queryStatus,
        severity,
        service,
      });

      let results = res.incidents || [];
      if (postFilterOpen) {
        results = results.filter((i) => i.status !== 'RESOLVED');
      }

      setIncidents(results);

      // Keep selected incident synced if drawer is open
      if (selectedIncident) {
        const refreshed = results.find((i) => i.id === selectedIncident.id);
        if (refreshed) {
          setSelectedIncident(refreshed);
        }
      }
    } catch (err) {
      console.error('Error loading incidents:', err);
      setError(err.message || 'Failed to load incidents. Please verify API Gateway connectivity.');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, severity, service, selectedIncident?.id]);

  useEffect(() => {
    loadIncidents();
    loadStatsData();
  }, [loadIncidents, loadStatsData]);

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setSeverity('');
    setService('');
  };

  // Stat card click filter
  const handleStatFilterSelect = ({ status: s, severity: sev }) => {
    setStatus(s);
    setSeverity(sev);
  };

  // Create or Update
  const handleSaveIncident = async (data) => {
    setIsActionPending(true);
    try {
      if (editingIncident) {
        const updated = await incidentApi.update(editingIncident.id, data);
        showNotification('success', `Incident ${updated.id} updated successfully.`, 'Updated');
        if (selectedIncident && selectedIncident.id === updated.id) {
          setSelectedIncident(updated);
        }
      } else {
        const created = await incidentApi.create(data);
        showNotification('success', `Incident ${created.id} declared and logged.`, 'Incident Reported');
        setSelectedIncident(created);
      }
      setIsModalOpen(false);
      setEditingIncident(null);
      await loadIncidents();
      await loadStatsData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to save incident', 'Error');
    } finally {
      setIsActionPending(false);
    }
  };

  // Resolve incident
  const handleConfirmResolve = async ({ rootCause, resolutionNotes, author }) => {
    if (!resolvingIncident) return;
    setIsActionPending(true);
    try {
      const updated = await incidentApi.update(resolvingIncident.id, {
        status: 'RESOLVED',
        rootCause,
        resolutionNotes,
        author,
      });
      showNotification('success', `Incident ${updated.id} resolved and closed.`, 'Resolved');
      setResolvingIncident(null);
      if (selectedIncident && selectedIncident.id === updated.id) {
        setSelectedIncident(updated);
      }
      await loadIncidents();
      await loadStatsData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to resolve incident', 'Error');
    } finally {
      setIsActionPending(false);
    }
  };

  // Quick status change from drawer
  const handleQuickStatusChange = async (incidentId, newStatus) => {
    if (newStatus === 'RESOLVED') {
      const target = incidents.find((i) => i.id === incidentId) || selectedIncident;
      setResolvingIncident(target);
      return;
    }

    setIsActionPending(true);
    try {
      const updated = await incidentApi.update(incidentId, {
        status: newStatus,
        author: 'On-Call Engineer',
      });
      showNotification('success', `Status changed to ${newStatus}.`);
      setSelectedIncident(updated);
      await loadIncidents();
      await loadStatsData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to update status');
    } finally {
      setIsActionPending(false);
    }
  };

  // Add timeline note
  const handleAddTimelineEvent = async (incidentId, event) => {
    setIsActionPending(true);
    try {
      const updated = await incidentApi.addTimelineEvent(incidentId, event);
      showNotification('success', 'Timeline note recorded.');
      setSelectedIncident(updated);
      await loadIncidents();
    } catch (err) {
      showNotification('error', err.message || 'Failed to record timeline note');
    } finally {
      setIsActionPending(false);
    }
  };

  // Delete incident
  const handleDeleteIncident = async (incidentId) => {
    if (!window.confirm(`Are you sure you want to delete incident ${incidentId}?`)) {
      return;
    }
    setIsActionPending(true);
    try {
      await incidentApi.delete(incidentId);
      showNotification('info', `Incident ${incidentId} deleted.`);
      if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident(null);
      }
      await loadIncidents();
      await loadStatsData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete incident');
    } finally {
      setIsActionPending(false);
    }
  };

  // Reset local demo data
  const handleResetData = () => {
    if (window.confirm('Reset local incident database to initial sample dataset?')) {
      incidentApi.resetLocalData();
      handleResetFilters();
      loadIncidents();
      loadStatsData();
      showNotification('info', 'Incident database reset to sample dataset.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* Navbar */}
      <Navbar
        onNewIncident={() => {
          setEditingIncident(null);
          setIsModalOpen(true);
        }}
        onResetData={handleResetData}
        apiStatus={apiStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Architecture & Serverless Info Banner */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                Serverless Incident Command Center
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                  CloudWatch • DynamoDB • Lambda
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero continuously running servers. Auto-scaling DynamoDB single-table schema with least-privilege IAM and API Gateway REST endpoints.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                loadIncidents();
                loadStatsData();
                checkApiHealth();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium transition-colors"
              title="Refresh incidents"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Dashboard KPI Stats */}
        <DashboardStats
          incidents={allIncidentsForStats.length > 0 ? allIncidentsForStats : incidents}
          activeStatus={status}
          activeSeverity={severity}
          onFilterSelect={handleStatFilterSelect}
        />

        {/* Search & Filter Bar */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          severity={severity}
          setSeverity={setSeverity}
          service={service}
          setService={setService}
          onReset={handleResetFilters}
          totalResults={incidents.length}
        />

        {/* Error Alert if API fails */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 text-red-400 shrink-0" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-sm text-red-100 mb-1">Backend Connection Issue</p>
              <p className="leading-relaxed">{error}</p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadIncidents}
                  className="px-3 py-1 bg-red-900/60 hover:bg-red-900 text-red-100 rounded text-xs font-medium border border-red-700"
                >
                  Retry Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Incidents Table / List / Loading / Empty */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : incidents.length === 0 ? (
          <EmptyState
            isFiltered={Boolean(search || status || severity || service)}
            onResetFilters={handleResetFilters}
            onCreateNew={() => {
              setEditingIncident(null);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <IncidentList
            incidents={incidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onResolveClick={(inc) => setResolvingIncident(inc)}
            onEditClick={(inc) => {
              setEditingIncident(inc);
              setIsModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            RecoverOps Serverless Incident Management System &copy; 2026. Built with React, Tailwind CSS, API Gateway, AWS Lambda &amp; DynamoDB.
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-slate-400">Zero-Credential Browser Architecture</span>
            <span>•</span>
            <span className="text-slate-500 font-mono text-[11px]">Least-Privilege IAM</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <IncidentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIncident(null);
        }}
        onSave={handleSaveIncident}
        incident={editingIncident}
        isSaving={isActionPending}
      />

      <IncidentDetailDrawer
        incident={selectedIncident}
        isOpen={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        onEdit={(inc) => {
          setEditingIncident(inc);
          setIsModalOpen(true);
        }}
        onResolveClick={(inc) => setResolvingIncident(inc)}
        onAddTimelineEvent={handleAddTimelineEvent}
        onStatusChange={handleQuickStatusChange}
        onDelete={handleDeleteIncident}
        isSubmitting={isActionPending}
      />

      <ResolveModal
        incident={resolvingIncident}
        isOpen={Boolean(resolvingIncident)}
        onClose={() => setResolvingIncident(null)}
        onResolve={handleConfirmResolve}
        isSubmitting={isActionPending}
      />

      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
