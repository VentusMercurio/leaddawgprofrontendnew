// src/components/GeneralPitchModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './GeneralPitchModal.module.css'; // <<< Ensure this path is correct and file exists

const DEFAULT_PITCH_TEMPLATE_KEY = 'leadDawg_generalPitchTemplate';

// Default pitch template - make sure to customize this thoroughly!
const getDefaultLaDawgzPitch = () => {
  return `Subject: LA Dawgz 🌭 Bringing the Sizzle to [Venue Name]!

Hey [Venue Name] Team,

My name is Chris, and I run LA Dawgz, a high-energy pop-up serving authentic Los Angeles-style bacon-wrapped street dogs, topped with sizzling onions & peppers (fajitas), fresh pico de gallo, and our signature sauces! 🌶️

We're known for bringing a vibrant, fun atmosphere to events, festivals, and local venues, and our unique offering is a huge hit with crowds looking for something exciting and delicious. 
You can check out our vibe and menu here: [YOUR_LA_DAWGZ_WEBSITE_OR_INSTAGRAM_LINK_HERE]

I came across [Venue Name] and was really impressed by [MENTION_SOMETHING_SPECIFIC_ABOUT_THEIR_VENUE_HERE - e.g., "your great patio," "the awesome events you host," "your cool crowd"]. I believe LA Dawgz would be a fantastic and memorable addition to your lineup, potentially for:
*   Special event nights
*   Weekend pop-ups
*   Collaborations with your existing offerings (e.g., "Dawgz & Brews")

We're fully equipped for pop-up operations and are looking for cool spots in the area to partner with. 

Would you be open to a quick chat next week about how LA Dawgz could bring some LA flavor and draw a crowd to [Venue Name]?

Best regards,

Chris
LA Dawgz
[YOUR_PHONE_NUMBER_OPTIONAL]
[YOUR_LA_DAWGZ_WEBSITE_OR_INSTAGRAM_LINK_HERE_AGAIN_OR_EMAIL]`;
};

function GeneralPitchModal({ isOpen, onClose }) {
  const [pitchText, setPitchText] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');


  useEffect(() => {
    if (isOpen) {
      const savedTemplate = localStorage.getItem(DEFAULT_PITCH_TEMPLATE_KEY);
      setPitchText(savedTemplate || getDefaultLaDawgzPitch());
      setCopied(false); // Reset copied status when modal opens
      setSavedMessage(''); // Clear any previous saved message
    }
  }, [isOpen]); // Only re-run when isOpen changes

  // If the modal is not open, render nothing (don't take up space in the DOM)
  if (!isOpen) {
    return null;
  }

  const handleSaveTemplate = () => {
    localStorage.setItem(DEFAULT_PITCH_TEMPLATE_KEY, pitchText);
    setSavedMessage("Pitch template saved!");
    setTimeout(() => setSavedMessage(''), 3000); // Clear message after 3 seconds
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(pitchText).then(() => {
      setCopied(true);
      setSavedMessage(''); // Clear save message if copying
      setTimeout(() => setCopied(false), 2500); // Reset copied status
    }).catch(err => {
      console.error('Failed to copy pitch text: ', err);
      alert("Failed to copy. Please check browser permissions or copy manually.");
    });
  };

  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset to the default pitch template? Any unsaved changes will be lost.")) {
        const defaultPitch = getDefaultLaDawgzPitch();
        setPitchText(defaultPitch);
        localStorage.setItem(DEFAULT_PITCH_TEMPLATE_KEY, defaultPitch); // Also save the default after reset
        setSavedMessage("Template reset to default and saved.");
        setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  return (
    // The root div uses modalOverlay for the backdrop
    <div className={styles.modalOverlay} onClick={onClose}> 
      <div 
        // This div is the modal's content box
        className={`${styles.modalContent} ${styles.generalPitchModalContent || ''}`} // Added || '' for safety if specific class not in CSS
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing the modal
      >
        <div className={styles.modalHeader}>
          <h3>Your General Pitch Template</h3>
          <button onClick={onClose} className={styles.closeButtonTopRight} title="Close">×</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.templateInfo}> 
            Edit your base pitch template below. Use placeholders like <strong>[Venue Name]</strong> where appropriate.
            This template will be used as a starting point when generating pitches for specific leads.
          </p>
          <textarea
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            rows="18" // Adjust rows as needed for typical pitch length
            className={styles.pitchTextarea}
            placeholder="Enter your general pitch template here..."
          />
          {savedMessage && <p className={styles.savedMessageIndicator}>{savedMessage}</p>} {/* Add styling for this */}
        </div>

        <div className={`${styles.modalFooter} ${styles.generalPitchFooter || ''}`}> {/* Added || '' for safety */}
            <button 
                onClick={handleResetToDefault} 
                className={`${styles.modalButton} ${styles.resetButton}`}
            >
                Reset to Default
            </button>
            <div className={styles.actionsGroupRight}> {/* Wrapper for right-aligned buttons */}
                <button 
                    onClick={handleSaveTemplate} 
                    className={`${styles.modalButton} ${styles.saveTemplateButton}`}
                >
                    Save My Template
                </button>
                <button 
                    onClick={handleCopyToClipboard} 
                    className={`${styles.modalButton} ${styles.copyPitchButtonMain}`}
                    disabled={copied} // Disable button briefly after copying
                >
                    {copied ? 'Copied to Clipboard ✓' : 'Copy Template Text'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default GeneralPitchModal;