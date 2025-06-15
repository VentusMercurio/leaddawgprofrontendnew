// src/pages/ResultsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './HomePage.module.css'; // Or './ResultsPage.module.css'
import { useAuth } from '../context/AuthContext';
import MapDisplay from '../components/MapDisplay';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
const RESULTS_PER_VIEW = 6; 
// const NON_PRO_VISIBLE_LIMIT = 10; // REMOVED: This limit is no longer needed

const getInitials = (name, isLarge = false) => {
  if (!name) return isLarge ? "N/A" : "NA";
  const words = name.split(' ');
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && name.length >= 2) return (name.substring(0,2)).toUpperCase();
  if (name.length > 0) return name[0].toUpperCase();
  return isLarge ? "N/A" : "NA";
};

const LeadCard = ({ place, isFeatured = false, onClickCard, onSaveLead, isLeadSaved, isSavingLead }) => {
  const featuredPlaceholderInitials = <div className={styles.initialsPlaceholder}><span>{getInitials(place.name, true)}</span></div>;
  const listPlaceholderInitials = <div className={styles.initialsPlaceholderSmall}><span>{getInitials(place.name, false)}</span></div>;
  const [currentImageSrc, setCurrentImageSrc] = useState(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    let determinedSrc = place.photo_url || null; 
    setCurrentImageSrc(determinedSrc);
    setImageLoadFailed(false);
  }, [place.photo_url, place.name]);

  const handleImageError = () => { if (!imageLoadFailed) { setImageLoadFailed(true); }};
  const handleImageLoad = () => { setImageLoadFailed(false); };
  
  const cardClassName = isFeatured ? styles.featuredLeadCard : styles.listLeadCard;
  const showImageVisualInList = !isFeatured && place.photo_url;
  const showImageContainer = isFeatured || showImageVisualInList;
  let imageDisplayElement = isFeatured ? featuredPlaceholderInitials : (showImageVisualInList ? listPlaceholderInitials : null);

  if (currentImageSrc && !imageLoadFailed) {
    imageDisplayElement = <img key={currentImageSrc} src={currentImageSrc} alt={`${place.name || 'Venue'} image`} className={styles.cardImage} onLoad={handleImageLoad} onError={handleImageError} />;
  }

  return (
    <div className={cardClassName} onClick={!isFeatured && onClickCard ? () => onClickCard(place) : undefined} style={!isFeatured && onClickCard ? { cursor: 'pointer' } : {}} title={!isFeatured && onClickCard ? `View details for ${place.name}` : ''}>
      {showImageContainer && <div className={isFeatured ? styles.cardImageContainer : styles.listCardImageContainer}>{imageDisplayElement}</div>}
      <div className={styles.cardContent}>
        <h4 className={isFeatured ? styles.featuredCardName : styles.listCardName}>{place.name || 'N/A'}</h4>
        <p className={isFeatured ? styles.featuredCardAddress : styles.listCardAddress}>
          {isFeatured ? (place.address || 'N/A') : (place.address ? place.address.split(',')[0].trim() : 'N/A')}
        </p>
        {isFeatured && place.phone_number && <p className={styles.featuredCardDetail}>Phone: {place.phone_number}</p>}
        {isFeatured && place.website && <p className={styles.featuredCardDetail}><a href={place.website} target="_blank" rel="noopener noreferrer" className={styles.websiteLink}>Visit Website</a></p>}
        {isFeatured && onSaveLead && ( // Check if onSaveLead is provided
          <div className={styles.cardActions}>
            <button className={styles.saveLeadButton} onClick={(e) => { e.stopPropagation(); onSaveLead(place); }} disabled={isLeadSaved || isSavingLead}>
              {isSavingLead ? 'Saving...' : (isLeadSaved ? 'Saved ✓' : 'Save Lead')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchResultsDisplay = ({ currentViewResults, onSelectLeadInView, onSaveLead, savedLeadIds, savingLeadId, currentFeaturedInView }) => {
  if (!currentViewResults || currentViewResults.length === 0 || !currentFeaturedInView) {
      return null; 
  }
  
  const featuredId = currentFeaturedInView.osm_id || currentFeaturedInView.google_place_id;
  const otherLeadsInThisView = currentViewResults.filter(p => (p.osm_id || p.google_place_id) !== featuredId).slice(0, RESULTS_PER_VIEW -1);
  
  return (
    <div className={styles.resultsDisplayContainer}>
      <div className={styles.leadsLayout}>
        {currentFeaturedInView && (
          <div className={styles.featuredLeadSection}>
            <LeadCard 
              place={currentFeaturedInView} 
              isFeatured={true} 
              onSaveLead={onSaveLead} 
              isLeadSaved={savedLeadIds.has(currentFeaturedInView.osm_id || currentFeaturedInView.google_place_id)} 
              isSavingLead={savingLeadId === (currentFeaturedInView.osm_id || currentFeaturedInView.google_place_id)} />
          </div>
        )}
        {otherLeadsInThisView.length > 0 && (
          <div className={styles.otherLeadsSection}>
            {otherLeadsInThisView.map(place => (
              <LeadCard 
                key={place.osm_id || place.google_place_id || (place.name + place.address + Math.random())}
                place={place} 
                isFeatured={false} 
                onClickCard={() => onSelectLeadInView(place)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


function ResultsPage() {
  const locationHook = useLocation(); // Renamed to avoid conflict if 'location' var is used
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, isLoadingAuth } = useAuth();

  const [allSearchResults, setAllSearchResults] = useState([]);
  const [featuredLead, setFeaturedLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [currentResultsPage, setCurrentResultsPage] = useState(1);
  const [userSavedLeadPrimaryIds, setUserSavedLeadPrimaryIds] = useState(new Set());
  const [savingLeadPrimaryId, setSavingLeadPrimaryId] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(10);

  const queryParams = new URLSearchParams(locationHook.search);
  const queryTerm = queryParams.get('query') || "";
  const locationTermParam = queryParams.get('location'); // Use a different name from hook
  const enrichGoogleParam = queryParams.get('enrich') === 'true';

  // const isProUser = isLoggedIn && currentUser && currentUser.tier === 'pro'; // We are removing the concept of 'pro' user for feature access
  const isProUser = true; // Assume all users are "pro" for feature access purposes on this page

  useEffect(() => {
    if (!locationTermParam) {
      setSearchError("Location parameter is missing for search.");
      setIsLoading(false);
      setAllSearchResults([]);
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      setSearchError('');
      setAllSearchResults([]);
      setFeaturedLead(null);

      try {
        const params = { 
          query: queryTerm, 
          location: locationTermParam,
          // Always send enrich_google as requested by the URL param, regardless of 'pro' status
          // The backend's default limit for Google enrichment is 5, which aligns with your desired cost control.
          enrich_google: enrichGoogleParam.toString(), 
          // Set a high limit for results as we want to show all. The backend itself might have limits.
          limit: 100 // Fetch up to 100 results from the backend. Adjust this if you expect more or less.
        };
        console.log("DEBUG [ResultsPage]: Fetching data with params:", params);
        const response = await axios.get(`${API_BASE_URL}/api/search/osm-places`, { params });
        
        console.log("DEBUG [ResultsPage]: API response status:", response.data.status, "Count:", response.data.count);

        if (response.data && response.data.status === "OK" && response.data.places && response.data.places.length > 0) {
          setAllSearchResults(response.data.places);
          setFeaturedLead(response.data.places[0]); 
          if (response.data.places[0].latitude && response.data.places[0].longitude) {
            setMapCenter([response.data.places[0].latitude, response.data.places[0].longitude]);
            setMapZoom(13);
          }
        } else {
          setSearchError(response.data.message || `No leads found for "${queryTerm}" in "${locationTermParam}".`);
        }
      } catch (err) {
        console.error("Search API error on ResultsPage:", err.response || err);
        setSearchError(err.response?.data?.message || err.message || 'Failed to fetch search results.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [queryTerm, locationTermParam, enrichGoogleParam, 
    // isProUser // Removed from dependencies as it's now hardcoded true
  ]);

  const fetchUserSavedLeadIds = useCallback(async () => {
     if (isLoggedIn && currentUser) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/leads`, { withCredentials: true });
        if (response.data && response.data.leads) {
          const ids = new Set(response.data.leads.map(lead => lead.osm_id || lead.google_place_id).filter(Boolean));
          setUserSavedLeadPrimaryIds(ids);
        }
      } catch (error) { console.error("Error fetching user's saved lead IDs on ResultsPage:", error); }
    } else {
      setUserSavedLeadPrimaryIds(new Set());
    }
  }, [isLoggedIn, currentUser]);
  useEffect(() => { fetchUserSavedLeadIds(); }, [fetchUserSavedLeadIds]);

  const handleSaveLead = async (placeToSave) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: locationHook.pathname + locationHook.search, message: 'Please login to save leads.' } });
      return;
    }
    const primaryIdToSave = placeToSave.google_place_id || placeToSave.osm_id;
    if (!primaryIdToSave) {
      alert("Cannot save this lead, essential ID (OSM or Google Place ID) is missing.");
      console.error("Invalid place data to save (missing ID):", placeToSave);
      return;
    }
    if (userSavedLeadPrimaryIds.has(primaryIdToSave)) {
        alert(`${placeToSave.name} is already in your saved leads!`);
        return;
    }

    setSavingLeadPrimaryId(primaryIdToSave);
    
    const payload = {
      google_place_id: placeToSave.google_place_id || null,
      osm_id: placeToSave.osm_id || null,
      name: placeToSave.name,
      address: placeToSave.address || null,
      phone_number: placeToSave.phone_number || null, // Key for backend
      website: placeToSave.website || null,
      photo_url: placeToSave.photo_url || null,
      latitude: placeToSave.latitude,
      longitude: placeToSave.longitude,
      types: placeToSave.types, // Send as array, backend will join if needed for 'categories_text'
      business_status: placeToSave.business_status,
      rating: placeToSave.rating,
      user_ratings_total: placeToSave.user_ratings_total,
      Maps_url: placeToSave.Maps_url,
      opening_hours: placeToSave.opening_hours, // Send as is (array or string)
      price_level: placeToSave.price_level,
    };
    console.log("DEBUG [ResultsPage]: Payload for saving lead:", JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(`${API_BASE_URL}/api/leads`, payload, { withCredentials: true });
      if (response.status === 201 || response.status === 200) {
        setUserSavedLeadPrimaryIds(prev => new Set(prev).add(primaryIdToSave));
        alert(`${placeToSave.name} saved!`);
      } else if (response.status === 409) { 
        setUserSavedLeadPrimaryIds(prev => new Set(prev).add(primaryIdToSave));
        alert(`${placeToSave.name} was already in your saved leads.`);
      } else {
        alert(`Unexpected response from server: ${response.status}. ${response.data?.message || ''}`);
      }
    } catch (err) {
      console.error("Error saving lead API call:", err.response || err);
      if (err.response && err.response.status === 409) {
        setUserSavedLeadPrimaryIds(prev => new Set(prev).add(primaryIdToSave));
        alert(`${placeToSave.name} was already in your saved leads.`);
      } else {
        alert(err.response?.data?.message || "Failed to save lead. Please try again.");
      }
    } finally {
      setSavingLeadPrimaryId(null);
    }
  };

  const handleSelectLeadFromList = (place) => { setFeaturedLead(place); };
  const handleMapMarkerClick = (place) => { setFeaturedLead(place); };

  // MODIFIED: Always show all results; pagination applies to all.
  // const resultsToList = isProUser ? allSearchResults : allSearchResults.slice(0, NON_PRO_VISIBLE_LIMIT); // Original Line
  const resultsToList = allSearchResults; // Now all users see all results

  const listForCurrentPage = resultsToList.slice(
    (currentResultsPage - 1) * RESULTS_PER_VIEW,
    currentResultsPage * RESULTS_PER_VIEW
  );
  // Pagination now applies to the full list, not just a "pro" subset
  const totalListPages = Math.ceil(resultsToList.length / RESULTS_PER_VIEW); // Renamed from totalListPagesForPro

  if (isLoadingAuth) return <div className={styles.pageLoading}>Initializing authentication...</div>;
  if (isLoading) return <div className={styles.pageLoading}>Loading results for "{queryTerm}" in "{locationTermParam}"...</div>;
  
  if (searchError) {
    return (
      <div className={styles.resultsPageContainer}>
        <p className={`${styles.message} ${styles.errorMessage}`}>{searchError}</p>
        <Link to="/" className={styles.backButton || styles.backToSearchButton}>Try a New Search</Link>
      </div>
    );
  }
  if (!isLoading && allSearchResults.length === 0) { // Check after loading is false
     return (
      <div className={styles.resultsPageContainer}>
        <p className={styles.message}>No leads found for "{queryTerm}" in "{locationTermParam}".</p>
        <Link to="/" className={styles.backButton || styles.backToSearchButton}>Try a New Search</Link>
      </div>
    );
  }

  return (
    <div className={styles.resultsPageContainer}>
      <Link to="/" className={styles.backToSearchButton}>← New Search</Link>
      <div className={styles.resultsPageLayout}>
        <div className={styles.mapSection}>
          <MapDisplay 
            leads={allSearchResults}
            onMarkerClick={handleMapMarkerClick}
            centerCoordinates={mapCenter}
            zoomLevel={mapZoom}
          />
        </div>
        <div className={styles.detailsAndListSection}>
          {featuredLead && (
            <LeadCard 
              place={featuredLead}
              isFeatured={true}
              onSaveLead={handleSaveLead}
              isLeadSaved={userSavedLeadPrimaryIds.has(featuredLead.osm_id || featuredLead.google_place_id)}
              isSavingLead={savingLeadPrimaryId === (featuredLead.osm_id || featuredLead.google_place_id)}
            />
          )}
          <h3 className={styles.listHeader}>Other Nearby Leads:</h3>
          <div className={styles.resultsListScrollable}>
            {listForCurrentPage
              .filter(p => featuredLead ? (p.osm_id || p.google_place_id) !== (featuredLead.osm_id || featuredLead.google_place_id) : true)
              .map(place => (
              <LeadCard 
                key={place.osm_id || place.google_place_id || (place.name + Math.random())}
                place={place}
                isFeatured={false}
                onClickCard={() => handleSelectLeadFromList(place)}
              />
            ))}
            {listForCurrentPage.length === 0 && !featuredLead && <p>No other leads in this view.</p>}
          </div>

          {/* MODIFIED: Pagination always visible if needed, no longer tied to isProUser */}
          {resultsToList.length > RESULTS_PER_VIEW && totalListPages > 1 && (
            <div className={styles.resultsPaginationControls}>
              <button onClick={() => setCurrentResultsPage(p => Math.max(1, p - 1))} disabled={currentResultsPage === 1}>« Prev</button>
              <span>Page {currentResultsPage} of {totalListPages}</span>
              <button onClick={() => setCurrentResultsPage(p => Math.min(totalListPages, p + 1))} disabled={currentResultsPage === totalListPages}>Next »</button>
            </div>
          )}

          {/* REMOVED: The "Go Pro" paywall teaser */}
          {/* {!isProUser && allSearchResults.length > NON_PRO_VISIBLE_LIMIT && (
            <div className={styles.proTeaser}>
              <p>Showing {NON_PRO_VISIBLE_LIMIT} of {allSearchResults.length} potential leads. <Link to="/pricing" className={styles.proButton}>Go Pro for all results!</Link></p>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;