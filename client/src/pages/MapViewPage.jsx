import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import MapComponent from '../components/MapComponent';
import { MapPin, Filter, Layers, Info } from 'lucide-react';

export default function MapViewPage() {
  const [locations, setLocations] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await api.get('/locations');
        setLocations(res.data);
      } catch (err) {
        console.error('Error fetching map locations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  const filteredLocations = locations.filter((loc) => {
    return selectedStatus === 'All' || loc.status === selectedStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <MapPin className="w-7 h-7 text-cyan-400" /> Interactive Chennai Coastal & Waterway Map
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Click any station pin to view site metrics, plastic density, and observation record details.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Filter PPI Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Statuses ({locations.length})</option>
            <option value="Critical">Critical (PPI 76–100)</option>
            <option value="High">High (PPI 51–75)</option>
            <option value="Moderate">Moderate (PPI 26–50)</option>
            <option value="Low">Low (PPI 0–25)</option>
          </select>
        </div>
      </div>

      {/* Map + Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[650px]">
        
        {/* Main Map */}
        <div className="lg:col-span-3 bg-slate-800 rounded-xl border border-slate-700 h-full p-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">Loading Map...</div>
          ) : (
            <MapComponent
              locations={filteredLocations}
              zoom={11}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
            />
          )}
        </div>

        {/* Selected Location Info Drawer */}
        <div className="bg-slate-800/90 rounded-xl border border-slate-700 p-5 flex flex-col justify-between overflow-y-auto">
          {selectedLocation ? (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                  {selectedLocation.water_body_name}
                </span>
                <h3 className="font-bold text-lg text-white mt-1">{selectedLocation.name}</h3>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  PPI {selectedLocation.ppi} ({selectedLocation.status})
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p><strong>Description:</strong> {selectedLocation.description}</p>
                <p><strong>Coordinates:</strong> {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}</p>
                <p><strong>Avg Survey Quantity:</strong> {selectedLocation.avgQtyKg} kg</p>
                <p><strong>Total Surveys Recorded:</strong> {selectedLocation.recordCount}</p>
                <p><strong>Hotspot Classification:</strong> <span className="text-amber-400 font-semibold">{selectedLocation.hotspotCategory}</span></p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Info className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs">Click on any marker on the map to inspect location metrics & hotspot classification.</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-700/80 text-[11px] text-slate-400">
            Legend: <span className="text-rose-400 font-bold">● Critical</span> | <span className="text-orange-400 font-bold">● High</span> | <span className="text-amber-400 font-bold">● Moderate</span> | <span className="text-emerald-400 font-bold">● Low</span>
          </div>
        </div>

      </div>

    </div>
  );
}
