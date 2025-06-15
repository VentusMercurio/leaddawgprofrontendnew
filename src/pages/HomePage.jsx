// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import styles from './HomePage.module.css'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

// Keys for parsing help, copied from backend or shared config
const FRONTEND_TAG_MAPPING_KEYS = [
    "bars", "restaurants", "cafes", "breweries", 
    "hotels", "salons", "gyms", "supermarkets"
    // Add other query terms your users might use
];

function HomePage() {
  const [searchOmniQuery, setSearchOmniQuery] = useState(() => sessionStorage.getItem('leadForge_omniQuery_splash') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, isLoadingAuth } = useAuth();
  const isProUser = isLoggedIn && currentUser && currentUser.tier === 'pro';

  useEffect(() => {
    sessionStorage.setItem('leadForge_omniQuery_splash', searchOmniQuery);
  }, [searchOmniQuery]);

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
        const match = catPattern.exec(lowerFullQuery);
        if (match) {
          if (!bestMatchCategory || match.index < categoryStartIndex ) {
            bestMatchCategory = cat; 
            categoryStartIndex = match.index;
            categoryEndIndex = match.index + cat.length;
          }
        }
      }
      if (bestMatchCategory) {
        query = bestMatchCategory;
        const part1 = fullQuery.substring(0, categoryStartIndex).trim();
        const part2 = fullQuery.substring(categoryEndIndex).trim();
        location = (part1 + " " + part2).trim().replace(/^,|,$/g, '').replace(/\s+/g, ' ').trim();
        if (!location && (part1 || part2)) location = part1 || part2;
      } else {
        location = fullQuery;
        query = ""; 
      }
    }
    query = query.replace(/^,|,$/g, '').trim();
    location = location.replace(/^,|,$/g, '').trim();
    console.log(`DEBUG [parseOmniQuery - HomePage]: Input: "${fullQuery}" -> Query: "${query}", Location: "${location}"`);
    return { searchTerm: query, locationTerm: location };
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    setSearchError(''); 
    const trimmedOmniQuery = searchOmniQuery.trim();
    if (!trimmedOmniQuery) {
      setSearchError('Please enter your search query.');
      return;
    }

    setIsLoading(true); 
    let { searchTerm: parsedSearchTerm, locationTerm: parsedLocationTerm } = parseOmniQuery(trimmedOmniQuery);

    if (!parsedLocationTerm) {
      setSearchError('Please specify a location (e.g., "restaurants in New York City").');
      setIsLoading(false);
      return;
    }
    
    const defaultEnrich = 'false'; 

    // Navigate to results page with search parameters
    navigate(`/search-results?query=${encodeURIComponent(parsedSearchTerm)}&location=${encodeURIComponent(parsedLocationTerm)}&enrich=${defaultEnrich}`);
    // setIsLoading(false); // Usually not needed here as component might unmount or re-render due to navigation
  };

  if (isLoadingAuth) {
    return (
      <div className={styles.homePageContainer} style={{justifyContent: 'center', alignItems: 'center', height: '80vh'}}>
        <p className={styles.loadingMessage}>Initializing...</p>
      </div>
    );
  }

  return (
    <div className={styles.homePageContainer}>
      <header className={styles.heroSection}>
        {/* This is your main call to action tagline */}
        <p className={styles.tagline}>What can we fetch today?</p> 
        
        {/* Your single search form */}
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input 
            type="text" 
            className={styles.searchInput} // Ensure this class makes it look good and prominent
            value={searchOmniQuery} 
            onChange={(e) => setSearchOmniQuery(e.target.value)} 
            placeholder="e.g., restaurants in schenectady ny, albany ny bars" 
            disabled={isLoading}
          />
          <button type="submit" className={styles.searchButton} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Fetch Leads'}
          </button>
        </form>
        {searchError && <p className={`${styles.message} ${styles.errorMessage} ${styles.splashError}`}>{searchError}</p>} {/* Added splashError for specific styling */}
      </header>
      
      {/* You can add more subtle content below if desired, or keep it very minimal */}
      {/* 
      <section className={styles.featuresPreview}>
        <p>Discover untapped local businesses instantly.</p>
      </section> 
      */}
    </div>
  );
}

export default HomePage;