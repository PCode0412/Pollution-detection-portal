import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix for default Leaflet marker icon paths in Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function getSeverityColor(status) {
  switch (status) {
    case 'Critical': return '#ef4444'; // Red
    case 'High': return '#f97316'; // Orange
    case 'Moderate': return '#eab308'; // Yellow
    case 'Low': return '#22c55e'; // Green
    default: return '#3b82f6';
  }
}

export default function MapComponent({ locations = [], center = [13.0475, 80.2824], zoom = 11, onSelectLocation }) {
  return (
    <div className="w-full h-full min-h-[400px] relative rounded-xl overflow-hidden border border-slate-700 shadow-inner">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locations.map((loc) => {
          const color = getSeverityColor(loc.status);
          const position = [loc.latitude, loc.longitude];

          return (
            <CircleMarker
              key={loc.id}
              center={position}
              radius={loc.status === 'Critical' ? 12 : loc.status === 'High' ? 10 : 8}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.75,
                weight: 2
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectLocation) onSelectLocation(loc);
                }
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 text-slate-900 font-sans max-w-xs">
                  <div className="flex items-center justify-between gap-2 border-b pb-1 mb-2">
                    <span className="font-bold text-sm">{loc.name}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white"
                      style={{ backgroundColor: color }}
                    >
                      PPI {loc.ppi || 'N/A'} ({loc.status || 'Low'})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    <strong>Water Body:</strong> {loc.water_body_name || loc.waterBodyName || 'Chennai Waterway'}
                  </p>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                    {loc.description || 'Observation point sampling site.'}
                  </p>
                  {loc.water_body_id && (
                    <Link
                      to={`/water-bodies/${loc.water_body_id}`}
                      className="text-xs text-cyan-600 hover:text-cyan-800 font-medium inline-flex items-center gap-1"
                    >
                      View Water Body Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
