// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './HomePage.module.css'; // Make sure this path is correct
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Make sure this path is correct
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
const RESULTS_PER_VIEW = 6; 
const NON_PRO_VISIBLE_LIMIT = 5;

// These should ideally match or be derived from your backend's TAG_MAPPING keys
const FRONTEND_TAG_MAPPING_KEYS = [
    "bars", "restaurants", "cafes", "breweries", 
    "hotels", "salons", "gyms", "supermarkets"
    // Add other query terms your users might use that map to specific OSM tags
];

// --- Helper Function ---
const getInitials = (name, isLarge = false) => {
  if (!name) return isLarge ? "N/A" : "NA";
  const words = name.split(' ');
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && name.length >= 2) return (name.substring(0,2)).toUpperCase();
  if (name.length > 0) return name[0].toUpperCase();
  return isLarge ? "N/A" : "NA";
};

// --- LeadCard Component ---
const LeadCard = ({ place, isFeatured = false, onClickCard, onSaveLead, isLeadSaved, isSavingLead }) => {
  const placeholderText = encodeURIComponent(place.name || 'Venue');
  const featuredPlaceholderInitials = <div className={styles.initialsPlaceholder}><span>{getInitials(place.name, true)}</span></div>;
  const listPlaceholderInitials = <div className={styles.initialsPlaceholderSmall}><span>{getInitials(place.name, false)}</span></div>;
  const [currentImageSrc, setCurrentImageSrc] = useState(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    // Using 'photo_url' which comes from normalize_osm_result (likely google_photo_url)
    let determinedSrc = place.photo_url || null; 
    setCurrentImageSrc(determinedSrc);
    setImageLoadFailed(false); // Reset fail state when photo_url changes
  }, [place.photo_url, place.name]);

  const handleImageError = () => { if (!imageLoadFailed) { setImageLoadFailed(true); }};
  const handleImageLoad = () => { setImageLoadFailed(false); }; // Image loaded successfully
  
  const cardClassName = isFeatured ? styles.featuredLeadCard : styles.listLeadCard;
  // 'photo_url' from normalize_osm_result is the one to check
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

// --- SearchResults Component ---
const SearchResults = ({ currentViewResults, onSelectLeadInView, onSaveLead, savedLeadIds, savingLeadId, currentFeaturedInView }) => {
  if (!currentViewResults || currentViewResults.length === 0 || !currentFeaturedInView) return null;
  
  const featuredId = currentFeaturedInView.osm_id || currentFeaturedInView.google_place_id;
  const otherLeadsInThisView = currentViewResults.filter(p => (p.osm_id || p.google_place_id) !== featuredId).slice(0, RESULTS_PER_VIEW -1); // Show up to 5 other leads + 1 featured = RESULTS_PER_VIEW
  
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
                key={place.osm_id || place.google_place_id || (place.name + place.address + Math.random())} // More robust key
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


// --- HomePage Component ---
function HomePage() {
  const [searchOmniQuery, setSearchOmniQuery] = useState(() => sessionStorage.getItem('leadForge_omniQuery') || '');
  const [allSearchResults, setAllSearchResults] = useState(() => JSON.parse(sessionStorage.getItem('leadForge_allSearchResults') || '[]'));
  const [selectedLeadInCurrentView, setSelectedLeadInCurrentView] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(() => sessionStorage.getItem('leadForge_hasSearched') === 'true');
  const [currentResultsPage, setCurrentResultsPage] = useState(1);
  const [enrichWithGoogle, setEnrichWithGoogle] = useState(false); // State for Google enrichment toggle

  const { isLoggedIn, currentUser, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [userSavedLeadPrimaryIds, setUserSavedLeadPrimaryIds] = useState(new Set());
  const [savingLeadPrimaryId, setSavingLeadPrimaryId] = useState(null);

  const isProUser = isLoggedIn && currentUser && currentUser.tier === 'pro';
  
  console.log("HomePage Render - isLoggedIn:", isLoggedIn, "currentUser:", currentUser, "isProUser:", isProUser, "isLoadingAuth:", isLoadingAuth);

  useEffect(() => { sessionStorage.setItem('leadForge_omniQuery', searchOmniQuery); }, [searchOmniQuery]);
  useEffect(() => {
    if (allSearchResults.length > 0) sessionStorage.setItem('leadForge_allSearchResults', JSON.stringify(allSearchResults));
    else sessionStorage.removeItem('leadForge_allSearchResults');
  }, [allSearchResults]);
  useEffect(() => { sessionStorage.setItem('leadForge_hasSearched', hasSearched.toString()); }, [hasSearched]);
  
  const fetchUserSavedLeadIds = useCallback(async () => {
    if (isLoggedIn && currentUser) { // Ensure currentUser is also available
      try {
        const response = await axios.get(`${API_BASE_URL}/api/leads`, { withCredentials: true });
        if (response.data && response.data.leads) {
          const ids = new Set(response.data.leads.map(lead => lead.osm_id || lead.google_place_id).filter(Boolean));
          setUserSavedLeadPrimaryIds(ids);
        }
      } catch (error) { console.error("Error fetching user's saved lead IDs:", error); }
    } else {
      setUserSavedLeadPrimaryIds(new Set());
    }
  }, [isLoggedIn, currentUser]); // Add currentUser dependency
  useEffect(() => { fetchUserSavedLeadIds(); }, [fetchUserSavedLeadIds]);

  useEffect(() => {
    if (allSearchResults.length > 0) {
      const displayLimit = isProUser ? allSearchResults.length : NON_PRO_VISIBLE_LIMIT;
      const resultsToConsider = allSearchResults.slice(0, displayLimit);
      const startIndex = (currentResultsPage - 1) * RESULTS_PER_VIEW;
      
      if (resultsToConsider.length > 0) {
        setSelectedLeadInCurrentView(resultsToConsider[startIndex < resultsToConsider.length ? startIndex : 0]);
      } else {
        setSelectedLeadInCurrentView(null);
      }
    } else {
      setSelectedLeadInCurrentView(null);
    }
  }, [allSearchResults, currentResultsPage, isProUser]);


  const parseOmniQuery = (fullQuery) => {
    const lowerFullQuery = fullQuery.toLowerCase().trim();
    let query = "";
    let location = "";

    const preps = [" in ", " near ", " at ", " around "];
    let prepFoundIndex = -1;
    let foundPrep = "";

    for (const prep of preps) {
      const idx = lowerFullQuery.lastIndexOf(prep);
      if (idx > prepFoundIndex) {
          prepFoundIndex = idx;
          foundPrep = prep;
      }
    }

    if (prepFoundIndex !== -1) {
      query = fullQuery.substring(0, prepFoundIndex).trim();
      location = fullQuery.substring(prepFoundIndex + foundPrep.length).trim();
    } else {
      let bestMatchCategory = "";
      let categoryStartIndex = -1;
      let categoryEndIndex = -1;

      for (const cat of FRONTEND_TAG_MAPPING_KEYS) {
        const catPattern = new RegExp(`\\b${cat}\\b`, 'i');
        const match = catPattern.exec(lowerFullQuery); // Use lowerFullQuery for matching
        if (match) {
          if (!bestMatchCategory || match.index < categoryStartIndex ) { // Prefer earlier category match
            bestMatchCategory = cat; 
            categoryStartIndex = match.index;
            categoryEndIndex = match.index + cat.length;
          }
        }
      }

      if (bestMatchCategory) {
        query = bestMatchCategory; // Use the actual matched category (maintains case from mapping if needed)
        const part1 = fullQuery.substring(0, categoryStartIndex).trim();
        const part2 = fullQuery.substring(categoryEndIndex).trim();
        location = (part1 + " " + part2).trim().replace(/^,|,$/g, '').replace(/\s+/g, ' ').trim();
        
        if (!location && (part1 || part2)) location = part1 || part2;
        if (location === "" && fullQuery.toLowerCase().trim() === bestMatchCategory.toLowerCase()) {
            // Query was just the category, location is implicitly missing.
        }
      } else {
        location = fullQuery; // Assume whole string is location if no category/prep found
        query = ""; // Let backend/user decide on category
      }
    }
    
    query = query.replace(/^,|,$/g, '').trim();
    location = location.replace(/^,|,$/g, '').trim();

    console.log(`DEBUG [parseOmniQuery]: Input: "${fullQuery}" -> Query: "${query}", Location: "${location}"`);
    return { searchTerm: query, locationTerm: location };
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const trimmedOmniQuery = searchOmniQuery.trim();
    if (!trimmedOmniQuery) {
      setSearchError('Please enter your search query.');
      setAllSearchResults([]); setSelectedLeadInCurrentView(null); setHasSearched(true);
      return;
    }

    let { searchTerm: parsedSearchTerm, locationTerm: parsedLocationTerm } = parseOmniQuery(trimmedOmniQuery);

    if (!parsedLocationTerm) {
      setSearchError('Please specify a location (e.g., "restaurants in New York City").');
      setAllSearchResults([]); setSelectedLeadInCurrentView(null); setHasSearched(true);
      return;
    }
    if (!parsedSearchTerm) {
      // If query is empty after parsing, use a default or let backend handle
      // For now, if the user only typed a location, we'll let the backend use its default tag mapping (e.g., for an empty query string)
      // Or, you could default it here: parsedSearchTerm = "places"; 
      console.warn("Search term is empty after parsing. Backend TAG_MAPPING should handle an empty query string or have a default.");
    }

    setIsLoading(true); setSearchError('');
    setAllSearchResults([]); setSelectedLeadInCurrentView(null);
    setHasSearched(true); setCurrentResultsPage(1);
    
    try {
      const params = { 
        query: parsedSearchTerm, 
        location: parsedLocationTerm,
        enrich_google: (isProUser && enrichWithGoogle).toString(), // Only allow enrich if pro & toggled
        limit: isProUser ? 50 : 20 // Backend fetch limit
      };
      console.log("DEBUG: Submitting search with params:", params);
      const response = await axios.get(`${API_BASE_URL}/api/search/osm-places`, { params });
      
      console.log("DEBUG: Search API response status:", response.data.status, "Count:", response.data.count);
      // console.log("DEBUG: Search API places (first 3):", response.data.places?.slice(0,3));


      if (response.data && response.data.status === "OK" && response.data.places && response.data.places.length > 0) {
        setAllSearchResults(response.data.places);
      } else {
        setAllSearchResults([]); setSelectedLeadInCurrentView(null);
        setSearchError(response.data.message || `No leads found for your search.`);
      }
    } catch (err) {
      console.error("Search API error:", err.response || err);
      setAllSearchResults([]); setSelectedLeadInCurrentView(null);
      setSearchError(err.response?.data?.message || err.message || 'Failed to connect to the search service.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectLeadFromListInView = (place) => { setSelectedLeadInCurrentView(place); };

  const handleSaveLead = async (placeToSave) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/', message: 'Please login to save leads.' } });
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
      address: placeToSave.address,
      phone_number: placeToSave.phone_number,
      website: placeToSave.website,
      photo_url: placeToSave.photo_url, 
      latitude: placeToSave.latitude,
      longitude: placeToSave.longitude,
      types: placeToSave.types ? placeToSave.types.join(',') : null,
      business_status: placeToSave.business_status,
      rating: placeToSave.rating,
      user_ratings_total: placeToSave.user_ratings_total,
      google_maps_url: placeToSave.google_maps_url,
      price_level: placeToSave.price_level,
    };
    console.log("Payload for saving lead:", payload);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/leads`, payload, { withCredentials: true });
      if (response.status === 201 || response.status === 200) {
        setUserSavedLeadPrimaryIds(prev => new Set(prev).add(primaryIdToSave));
        alert(`${placeToSave.name} saved to My Leads!`);
      } else if (response.status === 409) {
        setUserSavedLeadPrimaryIds(prev => new Set(prev).add(primaryIdToSave));
        alert(`${placeToSave.name} was already in your saved leads.`);
      } else {
        alert(`Unexpected response from server: ${response.status}. ${response.data?.message || ''}`);
      }
    } catch (err) {
      console.error("Error saving lead API call:", err.response || err);
      alert(err.response?.data?.message || "Failed to save lead. Please try again.");
    } finally {
      setSavingLeadPrimaryId(null);
    }
  };

  let resultsForCurrentView;
  let totalResultsAvailableToUserInView; // How many items are in the current view slice

  if (isProUser) {
    totalResultsAvailableToUserInView = allSearchResults.length; // Pro sees all fetched
    resultsForCurrentView = allSearchResults.slice(
      (currentResultsPage - 1) * RESULTS_PER_VIEW,
      currentResultsPage * RESULTS_PER_VIEW
    );
  } else { // Free user
    // Free user sees a limited slice from the start of allSearchResults
    totalResultsAvailableToUserInView = Math.min(allSearchResults.length, NON_PRO_VISIBLE_LIMIT);
    resultsForCurrentView = allSearchResults.slice(0, NON_PRO_VISIBLE_LIMIT);
    // No pagination for free users in this model, they see first N_P_V_L items.
  }
  
  const totalResultPagesForPro = Math.ceil(allSearchResults.length / RESULTS_PER_VIEW);

  if (isLoadingAuth) {
    return (
      <div className={styles.homePageContainer} style={{justifyContent: 'flex-start'}}>
         <header className={styles.heroSection}>
            <p className={styles.tagline}>Discover Local Leads Effortlessly</p>
         </header>
        <p className={styles.loadingMessage} style={{marginTop: '50px'}}>Initializing user session...</p>
      </div>
    );
  }

  return (
    <div className={styles.homePageContainer}>
      <header className={styles.heroSection}>
        <p className={styles.tagline}>Discover Local Leads Effortlessly</p>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input 
            type="text" 
            className={styles.searchInput} // Ensure this class provides enough width
            value={searchOmniQuery} 
            onChange={(e) => setSearchOmniQuery(e.target.value)} 
            placeholder="e.g., restaurants in New York City, Albany NY bars" 
          />
          <button type="submit" className={styles.searchButton} disabled={isLoading}>
            {isLoading ? 'Fetching...' : 'Fetch Leads'}
          </button>
        </form>
        {isLoggedIn && isProUser && ( // Only show enrichment toggle to Pro users
             <div className={styles.enrichToggleContainer}> {/* Add styling for this */}
                 <label>
                     <input 
                        type="checkbox" 
                        checked={enrichWithGoogle} 
                        onChange={(e) => setEnrichWithGoogle(e.target.checked)} 
                     />
                     Enrich with Google Details
                 </label>
             </div>
        )}
      </header>

      <div className={styles.resultsArea} id="featured-lead-area">
        {isLoading && <p className={styles.loadingMessage}>✨ Fetching fresh leads...</p>}
        {!isLoading && searchError && <p className={`${styles.message} ${styles.errorMessage}`}>{searchError}</p>}
        {!isLoading && !searchError && hasSearched && allSearchResults.length === 0 && (
          <p className={styles.message}>🤔 No leads found. Try different search terms or locations!</p>
        )}

        {!isLoading && !searchError && allSearchResults.length > 0 && resultsForCurrentView.length > 0 && (
          <SearchResults 
            currentViewResults={resultsForCurrentView} 
            currentFeaturedInView={selectedLeadInCurrentView || resultsForCurrentView[0]} 
            onSelectLeadInView={handleSelectLeadFromListInView}
            onSaveLead={handleSaveLead}
            savedLeadIds={userSavedLeadPrimaryIds}
            savingLeadId={savingLeadPrimaryId}
          />
        )}

        {!isLoading && !searchError && isProUser && allSearchResults.length > 0 && totalResultPagesForPro > 1 && (
          <div className={styles.resultsPaginationControls}>
            <button onClick={() => setCurrentResultsPage(p => Math.max(1, p - 1))} disabled={currentResultsPage === 1} className={styles.pageButton}>« Prev</button>
            <span>Page {currentResultsPage} of {totalResultPagesForPro} ({allSearchResults.length} total leads)</span>
            <button onClick={() => setCurrentResultsPage(p => Math.min(totalResultPagesForPro, p + 1))} disabled={currentResultsPage === totalResultPagesForPro} className={styles.pageButton}>Next »</button>
          </div>
        )}

        {!isLoading && !searchError && isLoggedIn && !isProUser && allSearchResults.length > NON_PRO_VISIBLE_LIMIT && (
           <div className={styles.proTeaser}>
             <p>Showing {NON_PRO_VISIBLE_LIMIT} of {allSearchResults.length} results. <Link to="/pricing" className={styles.proButton}>Go Pro for full access!</Link></p>
           </div>
        )}
         {!isLoading && !searchError && !isLoggedIn && allSearchResults.length > 0 && ( // Teaser for logged-out users
           <div className={styles.proTeaser}>
             <p>Showing a preview. <Link to="/login" className={styles.proButton}>Login</Link> or <Link to="/register" className={styles.proButton}>Sign Up</Link> to save leads and see more!</p>
           </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;