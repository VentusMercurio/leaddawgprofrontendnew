// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import styles from './DashboardPage.module.css'; // <<< ENSURE THIS IS THE ONLY IMPORT FOR 'styles'
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import LeadDetailView from '../components/LeadDetailView'; 
import GeneralPitchModal from '../components/GeneralPitchModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
const STATUS_OPTIONS = ["New", "Contacted", "Followed Up", "Interested", "Booked", "Not Interested", "Pending Review"];

function DashboardPage() {
  const { isLoggedIn, isLoadingAuth, currentUser } = useAuth();
  const navigate = useNavigate();
  const [savedLeads, setSavedLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [error, setError] = useState('');
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneralPitchModalOpen, setIsGeneralPitchModalOpen] = useState(false);

  const fetchSavedLeads = useCallback(async () => {
    setIsLoadingLeads(true); setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/leads`, { withCredentials: true });
      if (response.data && response.data.leads) { 
        const sortedLeads = response.data.leads.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
        setSavedLeads(sortedLeads); 
      } else { 
        setSavedLeads([]); 
        console.warn("Fetched leads but response.data.leads was not an array:", response.data);
      }
    } catch (err) {
      console.error("Error fetching saved leads:", err.response || err);
      if (err.response?.status === 401 && !isLoadingAuth) {
          navigate('/login', {state: {message: "Your session expired. Please login again."}});
      } else {
        setError(err.response?.data?.message || "Failed to fetch saved leads.");
      }
      setSavedLeads([]);
    } finally { 
      setIsLoadingLeads(false); 
    }
  }, [isLoadingAuth, navigate]); // Added dependencies

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isLoggedIn) {
        navigate('/login', { state: { message: "Please login to view your dashboard." }});
      } else {
        fetchSavedLeads();
      }
    }
  }, [isLoggedIn, isLoadingAuth, navigate, fetchSavedLeads]);

  const handleStatusChangeOnTable = async (leadId, newStatus) => {
    const originalLeads = JSON.parse(JSON.stringify(savedLeads)); 
    setSavedLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId ? { ...lead, user_status: newStatus, _isUpdating: true } : lead 
      )
    );
    try {
      const response = await axios.put(`${API_BASE_URL}/api/leads/${leadId}`, 
        { user_status: newStatus }, 
        { withCredentials: true }
      );
      setSavedLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? { ...response.data.lead, _isUpdating: false } : lead 
        )
      );
      if (selectedLeadForDetail && selectedLeadForDetail.id === leadId) {
        setSelectedLeadForDetail(prev => ({...prev, ...response.data.lead}));
      }
    } catch (err) {
      console.error("Error updating lead status:", err.response || err);
      setError(err.response?.data?.message || `Failed to update status for lead ID ${leadId}.`);
      setSavedLeads(originalLeads); 
      setTimeout(() => {
        setSavedLeads(prev => prev.map(l => l.id === leadId ? {...l, _isUpdating: false} : l));
      }, 500);
    }
  };

  const handleOpenDetailView = (lead) => {
    setSelectedLeadForDetail(lead);
    setIsDetailViewOpen(true);
  };

  const handleCloseDetailView = () => {
    setIsDetailViewOpen(false);
    setSelectedLeadForDetail(null); 
  };

  const handleUpdateLeadDetails = async (leadId, updates) => { 
    // setIsLoadingLeads(true); // Can use a more specific loading state for detail view updates
    try {
      const response = await axios.put(`${API_BASE_URL}/api/leads/${leadId}`, updates, { withCredentials: true });
      if (response.data && response.data.lead) {
        const updatedLeadFromServer = response.data.lead;
        setSavedLeads(prevLeads => prevLeads.map(l => l.id === leadId ? updatedLeadFromServer : l));
        if (selectedLeadForDetail && selectedLeadForDetail.id === leadId) {
          setSelectedLeadForDetail(updatedLeadFromServer);
        }
        // setIsLoadingLeads(false);
        return true; 
      }
    } catch (err) {
      console.error("Error updating lead from detail view:", err.response || err);
      alert(err.response?.data?.message || "Failed to update lead details.");
    }
    // setIsLoadingLeads(false);
    return false;
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
        return false;
    }
    // setIsLoadingLeads(true); // More specific loading state
    try {
      await axios.delete(`${API_BASE_URL}/api/leads/${leadId}`, { withCredentials: true });
      setSavedLeads(prevLeads => prevLeads.filter(l => l.id !== leadId));
      if (selectedLeadForDetail && selectedLeadForDetail.id === leadId) { // If deleted lead was open in detail view
        handleCloseDetailView(); 
      }
      // setIsLoadingLeads(false);
      return true;
    } catch (err) {
      console.error("Error deleting lead:", err.response || err);
      alert(err.response?.data?.message || "Failed to delete lead.");
    }
    // setIsLoadingLeads(false);
    return false;
  };

  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return savedLeads;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return savedLeads.filter(lead => 
      (lead.name && lead.name.toLowerCase().includes(lowerSearchTerm)) ||
      (lead.address && lead.address.toLowerCase().includes(lowerSearchTerm)) ||
      (lead.user_notes && lead.user_notes.toLowerCase().includes(lowerSearchTerm)) ||
      (lead.categories && Array.isArray(lead.categories) && lead.categories.join(' ').toLowerCase().includes(lowerSearchTerm))
    );
  }, [savedLeads, searchTerm]);

  if (isLoadingAuth) { 
    return <div className={styles.loadingPage}>Loading user session...</div>;
  }
  if (!isLoggedIn && !isLoadingAuth) { // Should be handled by navigate in useEffect, but as fallback
      return <div className={styles.loadingPage}>Redirecting to login...</div>;
  }
  
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <div>
          <h1>{currentUser?.username || 'My'}'s Lead Dashboard</h1>
          <p>Manage your prospects and track your outreach. ({filteredLeads.length} matching / {savedLeads.length} total saved)</p>
        </div>
        <button 
            onClick={() => setIsGeneralPitchModalOpen(true)}
            className={styles.generalPitchButton}
        >
            My Pitch Template
        </button>
      </header>

      <div className={styles.filterControls}>
        <input
          type="text"
          placeholder="Search saved leads (name, address, notes, category)..."
          className={styles.searchInputDashboard}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoadingLeads && <p className={styles.loadingMessage}>Loading your leads...</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}
      
      {!isLoadingLeads && !error && savedLeads.length === 0 && (
        <p className={styles.noLeadsMessage}>You haven't saved any leads yet. <Link to="/">Start searching</Link> to build your list!</p>
      )}
      {!isLoadingLeads && !error && savedLeads.length > 0 && filteredLeads.length === 0 && searchTerm && (
        <p className={styles.noLeadsMessage}>No saved leads match your search term "{searchTerm}".</p>
      )}

      {!isLoadingLeads && filteredLeads.length > 0 && (
        <div className={styles.leadsTableContainer}>
          <table className={styles.leadsTable}>
            <thead>
              <tr>
                <th>Venue Name</th>
                <th>Address (Start)</th>
                <th>Saved On</th>
                <th>Status</th>
                <th>Actions</th> 
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} className={lead._isUpdating ? styles.isUpdatingRow : ''}>
                  <td onClick={() => handleOpenDetailView(lead)} className={styles.clickableCell}>{lead.name}</td>
                  <td onClick={() => handleOpenDetailView(lead)} className={styles.clickableCell}>{lead.address ? lead.address.split(',')[0].trim() : 'N/A'}</td>
                  <td onClick={() => handleOpenDetailView(lead)} className={styles.clickableCell}>{lead.saved_at ? new Date(lead.saved_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <select 
                      value={lead.user_status} 
                      onChange={(e) => { e.stopPropagation(); handleStatusChangeOnTable(lead.id, e.target.value);}}
                      onClick={(e) => e.stopPropagation()} 
                      className={styles.statusSelect}
                      disabled={lead._isUpdating}
                    >
                      {STATUS_OPTIONS.map(status => (<option key={status} value={status}>{status}</option>))}
                    </select>
                  </td>
                  <td>
                    <button className={styles.actionButton} onClick={(e) => { e.stopPropagation(); handleOpenDetailView(lead);}}>Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isDetailViewOpen && selectedLeadForDetail && (
        <LeadDetailView
          lead={selectedLeadForDetail} 
          onClose={handleCloseDetailView}
          onUpdateLead={handleUpdateLeadDetails} 
          onDeleteLead={handleDeleteLead} 
          statusOptions={STATUS_OPTIONS} 
        />
      )}

      <GeneralPitchModal 
        isOpen={isGeneralPitchModalOpen}
        onClose={() => setIsGeneralPitchModalOpen(false)}
      />
    </div>
  );
}

export default DashboardPage;