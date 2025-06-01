// src/components/MapDisplay.jsx
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet'; // Import L for custom icons if needed

// Fix for default marker icon issue with Webpack/React-Leaflet
// (Sometimes the default blue marker icons don't show up without this)
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});
// --- End of icon fix ---


// Helper component to adjust map view when leads change
const MapBoundsAdjuster = ({ leads }) => {
  const map = useMap();
  useEffect(() => {
    if (leads && leads.length > 0) {
      const validLeadsWithCoords = leads.filter(lead => lead.latitude != null && lead.longitude != null);
      if (validLeadsWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          validLeadsWithCoords.map(lead => [lead.latitude, lead.longitude])
        );
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] }); // Add some padding
        } else if (validLeadsWithCoords.length === 1) {
            map.setView([validLeadsWithCoords[0].latitude, validLeadsWithCoords[0].longitude], 13); // Zoom to single point
        }
      }
    }
  // Only re-run if the leads array reference changes (i.e., new search results)
  // or if the number of leads with valid coordinates changes significantly.
  // A simple way is to use leads.length, but for deep changes, you might need a more complex dependency.
  }, [leads, map]); 
  return null;
};


function MapDisplay({ leads, onMarkerClick, centerCoordinates, zoomLevel = 10 }) {
  const mapRef = useRef(null);

  if (!leads || leads.length === 0) {
    // Optionally, display a message or a default map view of a wider area
    // For now, if no leads, perhaps don't render the map or show a placeholder message.
    // Or, center on a default location if centerCoordinates is not provided.
    // return <p>No leads to display on map.</p>; 
  }

  // Determine initial map center
  // Priority: 1. explicit centerCoordinates, 2. first lead, 3. default
  let initialCenter = centerCoordinates;
  if (!initialCenter && leads && leads.length > 0) {
    const firstValidLead = leads.find(lead => lead.latitude != null && lead.longitude != null);
    if (firstValidLead) {
      initialCenter = [firstValidLead.latitude, firstValidLead.longitude];
    }
  }
  if (!initialCenter) {
    initialCenter = [40.7128, -74.0060]; // Default to NYC if no other center
  }


  return (
    <div style={{ height: '500px', width: '100%', border: '1px solid #ccc', marginBottom: '20px' }}> {/* Adjust height as needed */}
      <MapContainer 
        center={initialCenter} 
        zoom={zoomLevel} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
        whenCreated={mapInstance => { mapRef.current = mapInstance; }} // Store map instance
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {leads && leads.map((lead) => {
          // Ensure lead has valid coordinates before trying to render a Marker
          if (lead.latitude != null && lead.longitude != null) {
            return (
              <Marker 
                key={lead.osm_id || lead.google_place_id || lead.name} 
                position={[lead.latitude, lead.longitude]}
                eventHandlers={{
                  click: () => {
                    if (onMarkerClick) {
                      onMarkerClick(lead);
                    }
                  },
                }}
              >
                <Popup>
                  <b>{lead.name || 'Unknown Venue'}</b><br />
                  {lead.address || 'No address available.'}
                  {onMarkerClick && <div style={{marginTop: '5px'}}><button onClick={() => onMarkerClick(lead)}>View Details</button></div>}
                </Popup>
              </Marker>
            );
          }
          return null; // Don't render marker if no coords
        })}
        <MapBoundsAdjuster leads={leads} />
      </MapContainer>
    </div>
  );
}

export default MapDisplay;