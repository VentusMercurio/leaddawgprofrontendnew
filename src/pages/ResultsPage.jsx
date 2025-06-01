// src/pages/ResultsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './HomePage.module.css'; // Reuse styles for now, or create ResultsPage.module.css
import { useAuth } from '../context/AuthContext'; // Path to your AuthContext
import MapDisplay from '../components/MapDisplay'; // Path to your MapDisplay component

// --- Constants (can be shared or defined here) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
const RESULTS_PER_VIEW = 6; // How many items in the list view section per "page" if paginating list
const NON_PRO_VISIBLE_LIMIT = 5; // Max results a non-pro sees in total

// --- Re-import or redefine LeadCard and SearchResults Components ---
// Option 1: Import them if they are now separate generic components
// import LeadCard from '../components/LeadCard';
// import SearchResultsDisplay from '../components/SearchResultsDisplay'; // If you rename SearchResults

// Option 2: Redefine them here if they are tightly coupled to this page's logic & state
// For simplicity in this step, I'll assume you might copy/paste their definitions here initially,
// or that they are already generic enough to be imported.
// For brevity, I will omit their full code here, assuming they are available.
// We will need to pass correct props to them.

// --- Helper Function (if not imported) ---
const getInitials = (name, isLarge = false) => { /* ... same as before ... */ };

// --- LeadCard (Copied or Imported) ---
const LeadCard = ({ place, isFeatured = false, onClickCard, onSaveLead, isLeadSaved, isSavingLead }) => {
  // ... (Full LeadCard JSX and logic from previous HomePage.jsx)
  // Ensure it uses place.photo_url, place.name, place.address, place.phone_number, place.website
  // The 'onSaveLead' prop will be connected to a function within ResultsPage
  const placeholderText = encodeURIComponent(place.name || 'Venue');
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
        {isFeatured && (
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

// --- SearchResultsDisplay (formerly SearchResults, for clarity if you change the component) ---
const SearchResultsDisplay = ({ currentViewResults, onSelectLeadInView, onSaveLead, savedLeadIds, savingLeadId, currentFeaturedInView }) => {
  // ... (Full SearchResults JSX and logic from previous HomePage.jsx)
  // It will display the featured lead and a list of other leads.
  // It needs `currentFeaturedInView` and `currentViewResults` (which will be a slice of `allSearchResults`)
  if (!currentViewResults || currentViewResults.length === 0 || !currentFeaturedInView) {
      // If currentFeaturedInView is null but currentViewResults has items,
      // it means the selection logic might need adjustment, or the first item should be auto-selected.
      // For now, if no featured, don't render this specific layout. Map will still show.
      return null; 
  }
  
  const featuredId = currentFeaturedInView.osm_id || currentFeaturedInView.google_place_id;
  // Slice the list of leads for the "other leads" section
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
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, isLoadingAuth } = useAuth();

  const [allSearchResults, setAllSearchResults] = useState([]);
  const [featuredLead, setFeaturedLead] = useState(null); // The lead currently featured/selected
  const [isLoading, setIsLoading] = useState(true); // Start loading true as we fetch on mount
  const [searchError, setSearchError] = useState('');
  const [currentResultsPage, setCurrentResultsPage] = useState(1); // For pagination of the list (if any)
  const [userSavedLeadPrimaryIds, setUserSavedLeadPrimaryIds] = useState(new Set());
  const [savingLeadPrimaryId, setSavingLeadPrimaryId] = useState(null);
  const [mapCenter, setMapCenter] = useState(null); // Default map center [lat, lon]
  const [mapZoom, setMapZoom] = useState(10);     // Default map zoom

  // Extract search params from URL
  const queryParams = new URLSearchParams(location.search);
  const queryTerm = queryParams.get('query') || ""; // Default to empty if not present
  const locationTerm = queryParams.get('location');
  const enrichGoogleParam = queryParams.get('enrich') === 'true'; // Convert string to boolean

  const isProUser = isLoggedIn && currentUser && currentUser.tier === 'pro';
  
  // Effect to fetch data when search terms change or page loads with terms
  useEffect(() => {
    if (!locationTerm) { // Location is essential
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
          location: locationTerm,
          enrich_google: (isProUser && enrichGoogleParam).toString(), // Backend expects string 'true'/'false'
          limit: isProUser ? 100 : 30 // Fetch more for Pro, backend does some filtering
        };
        console.log("DEBUG [ResultsPage]: Fetching data with params:", params);
        const response = await axios.get(`${API_BASE_URL}/api/search/osm-places`, { params });
        
        console.log("DEBUG [ResultsPage]: API response status:", response.data.status, "Count:", response.data.count);

        if (response.data && response.data.status === "OK" && response.data.places && response.data.places.length > 0) {
          setAllSearchResults(response.data.places);
          // Set initial featured lead to the first result
          setFeaturedLead(response.data.places[0]); 
          // Set map center based on first result or geocoded area (if backend provides it)
          if (response.data.places[0].latitude && response.data.places[0].longitude) {
            setMapCenter([response.data.places[0].latitude, response.data.places[0].longitude]);
            setMapZoom(13); // Zoom in a bit
          }
        } else {
          setSearchError(response.data.message || `No leads found for "${queryTerm}" in "${locationTerm}".`);
        }
      } catch (err) {
        console.error("Search API error on ResultsPage:", err.response || err);
        setSearchError(err.response?.data?.message || err.message || 'Failed to fetch search results.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [queryTerm, locationTerm, enrichGoogleParam, isProUser]); // Re-fetch if these change

  // Effect to fetch user's saved leads (similar to HomePage)
  const fetchUserSavedLeadIds = useCallback(async () => {
    // ... (same logic as in HomePage to fetch and set userSavedLeadPrimaryIds) ...
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
    // ... (same handleSaveLead logic as in HomePage, using placeToSave, userSavedLeadPrimaryIds, setSavingLeadPrimaryId) ...
    if (!isLoggedIn) { /* ... navigate to login ... */ return; }
    const primaryIdToSave = placeToSave.google_place_id || placeToSave.osm_id;
    if (!primaryIdToSave) { /* ... alert missing ID ... */ return; }
    if (userSavedLeadPrimaryIds.has(primaryIdToSave)) { /* ... alert already saved ... */ return; }

    setSavingLeadPrimaryId(primaryIdToSave);
    const payload = { /* ... construct payload from placeToSave ... */ };
     // See previous HomePage for full payload construction
    payload.google_place_id = placeToSave.google_place_id || null;
    payload.osm_id = placeToSave.osm_id || null;
    payload.name = placeToSave.name;
    // ... other fields

    try {
      const response = await axios.post(`${API_BASE_URL}/api/leads`, payload, { withCredentials: true });
      if (response.status === 201 || response.status === 200) {
        setUserSavedLeadPrimaryIds(prev => new Set(prev).add(primaryIdToSave));
        alert(`${placeToSave.name} saved!`);
      } else { /* ... */ }
    } catch (err) { /* ... */ } 
    finally { setSavingLeadPrimaryId(null); }
  };

  const handleSelectLeadFromList = (place) => {
    setFeaturedLead(place);
    // Optionally pan map to this lead if mapRef is available and lead has coords
  };

  const handleMapMarkerClick = (place) => {
    setFeaturedLead(place);
  };

  // Logic for list pagination (Pro users)
  const resultsToList = isProUser ? allSearchResults : allSearchResults.slice(0, NON_PRO_VISIBLE_LIMIT);
  const listForCurrentPage = resultsToList.slice(
    (currentResultsPage - 1) * RESULTS_PER_VIEW,
    currentResultsPage * RESULTS_PER_VIEW
  );
  const totalListPagesForPro = Math.ceil(resultsToList.length / RESULTS_PER_VIEW);


  if (isLoadingAuth) {
    return <div className={styles.pageLoading}>Initializing authentication...</div>; // Simple full page loader
  }
  if (isLoading) {
    return <div className={styles.pageLoading}>Loading results for "{queryTerm}" in "{locationTerm}"...</div>;
  }
  if (searchError) {
    return (
      <div className={styles.resultsPageContainer}>
        <p className={`${styles.message} ${styles.errorMessage}`}>{searchError}</p>
        <Link to="/" className={styles.backButton}>Try a New Search</Link>
      </div>
    );
  }
  if (allSearchResults.length === 0) {
     return (
      <div className={styles.resultsPageContainer}>
        <p className={styles.message}>No leads found for "{queryTerm}" in "{locationTerm}".</p>
        <Link to="/" className={styles.backButton}>Try a New Search</Link>
      </div>
    );
  }

  // Main layout: Map on one side, Details/List on the other
  return (
    <div className={styles.resultsPageContainer}> {/* You'll need styles for this new container */}
      <Link to="/" className={styles.backToSearchButton}>← New Search</Link>
      <div className={styles.resultsPageLayout}> {/* e.g., display: flex */}
        <div className={styles.mapSection}> {/* e.g., flex: 1 or fixed width */}
          <MapDisplay 
            leads={allSearchResults} // Pass all results for map bounds
            onMarkerClick={handleMapMarkerClick}
            centerCoordinates={mapCenter}
            zoomLevel={mapZoom}
          />
        </div>
        <div className={styles.detailsAndListSection}> {/* e.g., flex: 1 or fixed width */}
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
          <div className={styles.resultsListScrollable}> {/* Make this scrollable */}
            {listForCurrentPage.filter(p => (p.osm_id || p.google_place_id) !== (featuredLead?.osm_id || featuredLead?.google_place_id))
              .map(place => (
              <LeadCard 
                key={place.osm_id || place.google_place_id || (place.name + Math.random())}
                place={place}
                isFeatured={false}
                onClickCard={() => handleSelectLeadFromList(place)}
                // Save button is not typically on small list items, but on the featured/detail view
              />
            ))}
          </div>

          {/* Pagination for the list (Pro users) */}
          {isProUser && resultsToList.length > RESULTS_PER_VIEW && totalListPagesForPro > 1 && (
            <div className={styles.resultsPaginationControls}>
              <button onClick={() => setCurrentResultsPage(p => Math.max(1, p - 1))} disabled={currentResultsPage === 1}>« Prev</button>
              <span>Page {currentResultsPage} of {totalListPagesForPro}</span>
              <button onClick={() => setCurrentResultsPage(p => Math.min(totalListPagesForPro, p + 1))} disabled={currentResultsPage === totalListPagesForPro}>Next »</button>
            </div>
          )}

          {/* Pro Teaser if free user and more results were fetched by backend than shown */}
          {!isProUser && allSearchResults.length > NON_PRO_VISIBLE_LIMIT && (
            <div className={styles.proTeaser}>
              <p>Showing {NON_PRO_VISIBLE_LIMIT} of {allSearchResults.length} potential leads. <Link to="/pricing" className={styles.proButton}>Go Pro for all results!</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;