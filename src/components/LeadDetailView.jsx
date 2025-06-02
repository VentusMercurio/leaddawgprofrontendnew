// src/components/LeadDetailView.jsx
import React, { useState, useEffect } from 'react';
import styles from './LeadDetailView.module.css'; // Make sure this CSS file exists and is styled

const generateLaDawgzPitch = (venueName) => {
  const venue = venueName || "[Venue Name]";
  // This is your existing pitch generation logic.
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

function LeadDetailView({ 
    lead, 
    onClose, 
    onUpdateLead, 
    onDeleteLead, 
    statusOptions = [],
    onEnrichLead,    
    isEnriching      
}) {
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
      setPitchText(generateLaDawgzPitch(lead.name)); 
      setShowPitchTemplate(false);
      setPitchCopied(false);
      setHeaderImageSrc(lead.photo_url || '');
      setHeaderImageError(false);
    } else {
      setCurrentNotes(''); setCurrentStatus('New'); setPitchText('');
      setShowPitchTemplate(false); setPitchCopied(false);
      setHeaderImageSrc(''); setHeaderImageError(false);
    }
  }, [lead]);

  if (!lead) {
    return null;
  }

  const handleSaveChanges = async () => {
    if (!onUpdateLead) return;
    setIsSaving(true);
    const updates = { user_notes: currentNotes, user_status: currentStatus };
    const success = await onUpdateLead(lead.id, updates);
    setIsSaving(false);
    if (success) setIsEditingNotes(false);
  };

  const handleDelete = async () => {
    if (!onDeleteLead) return;
    setIsDeleting(true);
    await onDeleteLead(lead.id);
  };
  
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
  const handleHeaderImageError = () => { if (!headerImageError) setHeaderImageError(true); };
  const handleHeaderImageLoad = () => { if (headerImageError) setHeaderImageError(false); };

  const needsEnrichment = !lead.google_maps_url || !lead.website || (lead.address && lead.address.split(',').length < 3);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.viewContainer} onClick={(e) => e.stopPropagation()}>
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
                disabled={isSaving || isDeleting || isEnriching}
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
                disabled={isSaving || isDeleting || isEnriching}
              >
                {showPitchTemplate ? 'Hide Pitch' : 'Pitch Email'}
              </button>
            </div>
          </div>

          {/* --- CORRECTED PITCH TEMPLATE SECTION --- */}
          {showPitchTemplate && ( 
            <div className={styles.pitchTemplateSection}>
              <h4>Pitch Email Template for {lead.name}:</h4>
              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                rows="15" 
                className={styles.pitchTextarea}
                placeholder="Your generated pitch will appear here..."
                disabled={isSaving || isDeleting || isEnriching}
              />
              <button 
                onClick={handleCopyPitchText} 
                className={styles.copyPitchButton}
                disabled={isSaving || isDeleting || isEnriching}
              > 
                {pitchCopied ? 'Copied ✓' : 'Copy Pitch'}
              </button>
            </div>
          )}
          {/* --- END PITCH TEMPLATE SECTION --- */}

          {/* --- NEW: Enrich with Google Button --- */}
          {onEnrichLead && needsEnrichment && (
            <div className={styles.enrichSection}>
                <button 
                    onClick={() => onEnrichLead(lead.id)} 
                    className={styles.enrichButton}
                    disabled={isEnriching || isSaving || isDeleting}
                >
                    {isEnriching ? 'Fetching Full Details...' : 'Get/Refresh Google Details'}
                </button>
            </div>
          )}
          {/* --- END: Enrich with Google Button --- */}

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Address</span><p>{lead.address || 'N/A'}</p>{displayMapsLink && <a href={displayMapsLink} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>View on Map</a>}</div>
            {lead.phone_number && <div className={styles.detailItem}><span className={styles.detailLabel}>Phone</span><p><a href={`tel:${lead.phone_number}`}>{lead.phone_number}</a></p></div>}
            {lead.website && <div className={styles.detailItem}><span className={styles.detailLabel}>Website</span><p><a href={lead.website} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>{lead.website}</a></p></div>}
            {lead.types && lead.types.length > 0 && <div className={`${styles.detailItem} ${styles.fullWidth}`}><span className={styles.detailLabel}>Categories</span><p>{lead.types.join(', ')}</p></div>}
            {lead.opening_hours && (Array.isArray(lead.opening_hours) && lead.opening_hours.length > 0) ? 
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                    <span className={styles.detailLabel}>Opening Hours</span>
                    <ul className={styles.hoursList}>{lead.opening_hours.map((line, index) => <li key={index}>{line}</li>)}</ul>
                </div>
            : lead.opening_hours && typeof lead.opening_hours === 'string' &&
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                    <span className={styles.detailLabel}>Opening Hours</span><p>{lead.opening_hours}</p>
                </div>
            }
            {lead.rating !== null && lead.rating !== undefined && <div className={styles.detailItem}><span className={styles.detailLabel}>Rating</span><p>{lead.rating} ({lead.user_ratings_total || 0} reviews)</p></div>}
            {lead.business_status && <div className={styles.detailItem}><span className={styles.detailLabel}>Status</span><p>{lead.business_status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</p></div>}
            {lead.price_level !== null && lead.price_level !== undefined && <div className={styles.detailItem}><span className={styles.detailLabel}>Price Level</span><p>{'$'.repeat(lead.price_level) || 'N/A'}</p></div>}
          </div>
          
          <div className={styles.notesSection}>
            <h4>Your Notes {isEditingNotes && <span style={{fontSize: '0.8em', fontWeight: 'normal'}}>(Editing)</span>}</h4>
            {isEditingNotes ? (
              <textarea value={currentNotes} onChange={(e) => setCurrentNotes(e.target.value)} rows="6" className={styles.notesTextarea} placeholder="Add your notes about this lead..." disabled={isSaving || isEnriching} />
            ) : (
              <div className={styles.notesDisplay} onClick={() => setIsEditingNotes(true)} title="Click to edit notes">{currentNotes || <span className={styles.placeholderText}>Click to add notes...</span>}</div>
            )}
          </div>
        </div>

        <div className={styles.footerActions}>
          <button onClick={handleDelete} className={`${styles.footerButton} ${styles.deleteBtn}`} disabled={isDeleting || isSaving || isEnriching}>{isDeleting ? 'Deleting...' : 'Delete Lead'}</button>
          <button 
            onClick={handleSaveChanges} 
            className={`${styles.footerButton} ${styles.saveBtn}`} 
            disabled={isSaving || isDeleting || isEnriching || (currentStatus === (lead.user_status || 'New') && currentNotes === (lead.user_notes || '')) } 
          >
            {isSaving ? 'Saving Notes/Status...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeadDetailView;