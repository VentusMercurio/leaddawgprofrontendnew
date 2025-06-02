// src/components/LeadDetailView.jsx
import React, { useState, useEffect } from 'react';
import styles from './LeadDetailView.module.css'; // Make sure this CSS file exists and is styled

// Ensure API_BASE_URL is correctly defined (though not used directly in this version for image proxy)
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

// STATUS_OPTIONS should be passed as a prop from DashboardPage for consistency
// const STATUS_OPTIONS = ["New", "Contacted", "Followed Up", "Interested", "Booked", "Not Interested", "Pending"];

const generateLaDawgzPitch = (venueName) => {
  const venue = venueName || "[Venue Name]";
  return `Subject: LA Dawgz 🌭 Bringing the Sizzle to ${venue}!\n\nHey ${venue} Team,\n\nMy name is Chris, and I run LA Dawgz, a high-energy pop-up serving authentic Los Angeles-style bacon-wrapped street dogs, topped with sizzling onions & peppers (fajitas), fresh pico de gallo, and our signature sauces! 🌶️\n\nWe're known for bringing a vibrant, fun atmosphere to events, festivals, and local venues, and our unique offering is a huge hit with crowds looking for something exciting and delicious. \nYou can check out our vibe and menu here: [YOUR_LA_DAWGZ_WEBSITE_OR_INSTAGRAM_LINK_HERE]\n\nI came across ${venue} and was really impressed by [MENTION_SOMETHING_SPECIFIC_ABOUT_THEIR_VENUE_HERE - e.g., "your great patio," "the awesome events you host," "your cool crowd"]. I believe LA Dawgz would be a fantastic and memorable addition to your lineup, potentially for:\n*   Special event nights\n*   Weekend pop-ups\n*   Collaborations with your existing offerings (e.g., "Dawgz & Brews")\n\nWe're fully equipped for pop-up operations and are looking for cool spots in the area to partner with. \n\nWould you be open to a quick chat next week about how LA Dawgz could bring some LA flavor and draw a crowd to ${venue}?\n\nBest regards,\n\nChris\nLA Dawgz\n[YOUR_PHONE_NUMBER_OPTIONAL]\n[YOUR_LA_DAWGZ_WEBSITE_OR_INSTAGRAM_LINK_HERE_AGAIN_OR_EMAIL]`;
};

const getInitialsForPlaceholder = (name) => {
  if (!name) return "N/A";
  const words = name.split(' ');
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && name.length >= 2) return (name.substring(0,2)).toUpperCase();
  if (name.length > 0) return name[0].toUpperCase();
  return "N/A";
};


function LeadDetailView({ lead, onClose, onUpdateLead, onDeleteLead, statusOptions = [] }) { // Added statusOptions prop
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showPitchTemplate, setShowPitchTemplate] = useState(false);
  const [pitchText, setPitchText] = useState('');
  const [pitchCopied, setPitchCopied] = useState(false);

  const [headerImageSrc, setHeaderImageSrc] = useState('');
  const [headerImageError, setHeaderImageError] = useState(false);

  useEffect(() => {
    if (lead) {
      setCurrentNotes(lead.user_notes || '');
      setCurrentStatus(lead.user_status || 'New');
      setIsEditingNotes(false);
      // Use the current 'name' field
      setPitchText(generateLaDawgzPitch(lead.name)); 
      setShowPitchTemplate(false);
      setPitchCopied(false);

      // Use the 'photo_url' field directly (which is google_photo_url if enriched)
      if (lead.photo_url && typeof lead.photo_url === 'string' && lead.photo_url.trim() !== '') {
        setHeaderImageSrc(lead.photo_url); 
      } else {
        setHeaderImageSrc(''); 
      }
      setHeaderImageError(false);
    } else {
      setCurrentNotes(''); setCurrentStatus('New'); setPitchText('');
      setShowPitchTemplate(false); setPitchCopied(false);
      setHeaderImageSrc(''); setHeaderImageError(false);
    }
  }, [lead]); // Re-run when the lead prop changes

  if (!lead) {
    return null; // Don't render if no lead data
  }

  const handleSaveChanges = async () => {
    if (!onUpdateLead) return; // Guard if prop is not passed
    setIsSaving(true);
    const updates = { user_notes: currentNotes, user_status: currentStatus };
    const success = await onUpdateLead(lead.id, updates); // Call prop function from DashboardPage
    setIsSaving(false);
    if (success) setIsEditingNotes(false);
  };

  const handleDelete = async () => {
    if (!onDeleteLead) return; // Guard
    // Confirmation is handled in DashboardPage now, but can be here too
    // if (window.confirm(`Are you sure you want to delete ${lead.name}? This cannot be undone.`)) {
      setIsDeleting(true);
      await onDeleteLead(lead.id); // Call prop function from DashboardPage
      // DashboardPage will handle closing the modal/view by setting selectedLeadForDetail to null
    // } else {
    //   setIsDeleting(false); 
    // }
    // No need to setIsDeleting(false) here if component unmounts
  };
  
  // Use current 'address' field for Google Maps query
  const googleMapsQueryLink = lead.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ", " + lead.address)}` : null;
  const displayMapsLink = lead.google_maps_url || googleMapsQueryLink;


  const handleCopyPitchText = () => {
    navigator.clipboard.writeText(pitchText).then(() => {
      setPitchCopied(true);
      setTimeout(() => setPitchCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy pitch text: ', err);
      alert("Failed to copy. Please check browser permissions or copy manually.");
    });
  };

  const handleHeaderImageError = () => {
    if (!headerImageError) { 
        console.warn(`Header image load error for "${lead.name}". Attempted src:`, headerImageSrc);
        setHeaderImageError(true);
    }
  };
  
  const handleHeaderImageLoad = () => {
    if (headerImageError) { // If it was previously errored and now loads
        setHeaderImageError(false);
    }
  };

  // Use current 'name', 'address', 'phone_number', 'website', 'opening_hours' (which is opening_hours_text)
  // 'types' (which is an array)
  return (
    <div className={styles.overlay}> {/* Assuming this is a modal overlay */}
      <div className={styles.viewContainer}> {/* The modal/view content box */}
        <button onClick={onClose} className={styles.closeButtonTopRight} title="Close Details">×</button>

        <div className={styles.headerImageContainer}>
            {headerImageSrc && !headerImageError ? (
                <img 
                    key={headerImageSrc}
                    src={headerImageSrc} 
                    alt={`${lead.name || 'Header'} image`} 
                    className={styles.headerActualImage}
                    onLoad={handleHeaderImageLoad}
                    onError={handleHeaderImageError}
                />
            ) : (
                <div className={styles.initialsPlaceholderHeader}>
                    <span>{getInitialsForPlaceholder(lead.name)}</span>
                </div>
            )}
        </div>

        <div className={styles.mainContent}>
          <div className={styles.titleSection}>
            <h1>{lead.name || 'Lead Details'}</h1>
            <div className={styles.statusAndActions}>
              <select 
                value={currentStatus} 
                onChange={(e) => setCurrentStatus(e.target.value)}
                className={styles.statusDropdown}
                disabled={isSaving || isDeleting}
              >
                {statusOptions.map(status => (<option key={status} value={status}>{status}</option>))}
              </select>
              <button 
                onClick={() => {
                    if (lead && lead.name && (pitchText.includes("[Venue Name]") || !pitchText.startsWith("Subject:"))) {
                         setPitchText(generateLaDawgzPitch(lead.name));
                    }
                    setShowPitchTemplate(!showPitchTemplate);
                    setPitchCopied(false); 
                }} 
                className={styles.pitchToggleButton}
                disabled={isSaving || isDeleting}
              >
                {showPitchTemplate ? 'Hide Pitch' : 'Pitch Email'}
              </button>
            </div>
          </div>

          {showPitchTemplate && (
            <div className={styles.pitchTemplateSection}>
              <h4>Pitch Email Template for {lead.name}:</h4>
              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                rows="15" 
                className={styles.pitchTextarea}
                placeholder="Your generated pitch will appear here..."
              />
              <button onClick={handleCopyPitchText} className={styles.copyPitchButton}> 
                {pitchCopied ? 'Copied ✓' : 'Copy Pitch'}
              </button>
            </div>
          )}

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Address</span><p>{lead.address || 'N/A'}</p>{displayMapsLink && <a href={displayMapsLink} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>View on Map</a>}</div>
            {lead.phone_number && <div className={styles.detailItem}><span className={styles.detailLabel}>Phone</span><p><a href={`tel:${lead.phone_number}`}>{lead.phone_number}</a></p></div>}
            {lead.website && <div className={styles.detailItem}><span className={styles.detailLabel}>Website</span><p><a href={lead.website} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>{lead.website}</a></p></div>}
            {/* Types / Categories */}
            {lead.types && lead.types.length > 0 && <div className={`${styles.detailItem} ${styles.fullWidth}`}><span className={styles.detailLabel}>Categories</span><p>{lead.types.join(', ')}</p></div>}
            {/* Opening Hours */}
            {lead.opening_hours && Array.isArray(lead.opening_hours) && lead.opening_hours.length > 0 && 
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                    <span className={styles.detailLabel}>Opening Hours</span>
                    <ul className={styles.hoursList}>{lead.opening_hours.map((line, index) => <li key={index}>{line}</li>)}</ul>
                </div>
            }
            {lead.opening_hours && typeof lead.opening_hours === 'string' && // If it's just a string
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                    <span className={styles.detailLabel}>Opening Hours</span><p>{lead.opening_hours}</p>
                </div>
            }
            {/* Google Specific if available */}
            {lead.rating !== null && lead.rating !== undefined && <div className={styles.detailItem}><span className={styles.detailLabel}>Rating</span><p>{lead.rating} ({lead.user_ratings_total || 0} reviews)</p></div>}
            {lead.business_status && <div className={styles.detailItem}><span className={styles.detailLabel}>Status</span><p>{lead.business_status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</p></div>}

          </div>
          
          <div className={styles.notesSection}>
            <h4>Your Notes {isEditingNotes && <span style={{fontSize: '0.8em', fontWeight: 'normal'}}>(Editing)</span>}</h4>
            {isEditingNotes ? (
              <textarea value={currentNotes} onChange={(e) => setCurrentNotes(e.target.value)} rows="6" className={styles.notesTextarea} placeholder="Add your notes about this lead..." disabled={isSaving} />
            ) : (
              <div className={styles.notesDisplay} onClick={() => setIsEditingNotes(true)} title="Click to edit notes">{currentNotes || <span className={styles.placeholderText}>Click to add notes...</span>}</div>
            )}
          </div>
        </div>

        <div className={styles.footerActions}>
          <button onClick={handleDelete} className={`${styles.footerButton} ${styles.deleteBtn}`} disabled={isDeleting || isSaving}>{isDeleting ? 'Deleting...' : 'Delete Lead'}</button>
          <button 
            onClick={handleSaveChanges} 
            className={`${styles.footerButton} ${styles.saveBtn}`} 
            disabled={isSaving || isDeleting || (currentStatus === (lead.user_status || 'New') && currentNotes === (lead.user_notes || '')) } 
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeadDetailView;