import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Waves, Search, Filter, MapPin, ArrowRight, Activity } from 'lucide-react';

export default function WaterBodiesPage() {
  const [waterBodies, setWaterBodies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWaterBodies() {
      try {
        const res = await api.get('/water-bodies');
        setWaterBodies(res.data);
      } catch (err) {
        console.error('Error fetching water bodies:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWaterBodies();
  }, []);

  const types = ['All', 'Beach', 'River', 'Estuary/Creek', 'Canal'];

  const filteredWaterBodies = waterBodies.filter(wb => {
    const matchesSearch = wb.name.toLowerCase().includes(search.toLowerCase()) || 
                          wb.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || wb.type.toLowerCase().includes(selectedType.toLowerCase());
    return matchesSearch && matchesType;
  });

  const getPpiBadgeColor = (status) => {
    switch (status) {
      case 'Critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Moderate': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Waves className="w-8 h-8 text-cyan-400" />
          Chennai Water Bodies Directory
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore environmental observation points, pollution indices, and historical survey trends across Chennai coastal & inland water ecosystems.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search water body name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedType === type
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading water bodies...</div>
      ) : filteredWaterBodies.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700/50">
          No water bodies matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWaterBodies.map((wb) => (
            <div
              key={wb.id}
              className="bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-xl p-6 flex flex-col justify-between shadow-lg transition duration-200 group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      {wb.type}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                      {wb.name}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getPpiBadgeColor(wb.status)}`}>
                    PPI {wb.ppi} ({wb.status})
                  </span>
                </div>

                <p className="text-slate-400 text-xs mt-3 line-clamp-3 leading-relaxed">
                  {wb.description}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Observation Stations</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {wb.observationPointsCount} Points
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Survey Samples</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      {wb.totalRecordsCount} Records
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4">
                <Link
                  to={`/water-bodies/${wb.id}`}
                  className="w-full bg-slate-700/80 hover:bg-cyan-600 text-slate-200 hover:text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  View Detail & Historical Trends <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
