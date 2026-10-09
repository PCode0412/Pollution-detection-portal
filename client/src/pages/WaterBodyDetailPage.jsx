import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import MapComponent from '../components/MapComponent';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Waves, ArrowLeft, MapPin, Activity, Calendar, Shield, Sparkles, Filter } from 'lucide-react';

export default function WaterBodyDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await api.get(`/water-bodies/${id}`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching water body detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading water body detail...</div>;
  }

  if (!data || !data.waterBody) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-rose-400">Water body not found</h2>
        <Link to="/water-bodies" className="text-cyan-400 underline mt-4 inline-block text-sm">
          Return to Water Bodies Directory
        </Link>
      </div>
    );
  }

  const { waterBody, ppiMetrics, locations, recentRecords, cleanups } = data;

  const filteredRecords = recentRecords.filter((r) => {
    return selectedSeverity === 'All' || r.severity === selectedSeverity;
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
      
      {/* Back link */}
      <div>
        <Link to="/water-bodies" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
            {waterBody.type} Ecosystem
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {waterBody.name}
          </h1>
          <p className="text-slate-300 text-sm mt-2 max-w-3xl leading-relaxed">
            {waterBody.description}
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 p-5 rounded-xl flex flex-col items-center justify-center min-w-[200px] shrink-0">
          <span className="text-xs text-slate-400 uppercase font-semibold">Plastic Pollution Index</span>
          <span className="text-4xl font-extrabold text-white mt-1">{ppiMetrics?.ppi ?? 0}</span>
          <span className={`mt-2 px-3 py-0.5 rounded-full text-xs font-bold border ${getPpiBadgeColor(ppiMetrics?.status)}`}>
            {ppiMetrics?.status} Status
          </span>
        </div>
      </div>

      {/* Map & Locations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map */}
        <div className="lg:col-span-2 bg-slate-800/80 p-5 rounded-xl border border-slate-700 space-y-3">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" /> Observation Points Map
          </h3>
          <div className="h-[380px]">
            <MapComponent locations={locations} center={[waterBody.latitude, waterBody.longitude]} zoom={12} />
          </div>
        </div>

        {/* Observation Points List */}
        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 flex flex-col space-y-4">
          <h3 className="font-bold text-lg text-white">Observation Points ({locations.length})</h3>
          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{loc.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPpiBadgeColor(loc.status)}`}>
                    PPI {loc.ppi}
                  </span>
                </div>
                <p className="text-slate-400 line-clamp-2">{loc.description}</p>
                <div className="pt-1 text-[11px] text-slate-500 flex justify-between">
                  <span>Avg Qty: <strong className="text-slate-300">{loc.avgQtyKg} kg</strong></span>
                  <span>Records: <strong className="text-slate-300">{loc.recordCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Historical Survey Log Table */}
      <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" /> Field Pollution Survey Log
            </h3>
            <p className="text-xs text-slate-400">Historical sampling entries recorded at observation points</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-medium"
            >
              <option value="All" className="bg-slate-900">All Severities</option>
              <option value="Critical" className="bg-slate-900">Critical</option>
              <option value="High" className="bg-slate-900">High</option>
              <option value="Moderate" className="bg-slate-900">Moderate</option>
              <option value="Low" className="bg-slate-900">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Observation Point</th>
                <th className="py-3 px-4">Plastic Category</th>
                <th className="py-3 px-4">Quantity (kg)</th>
                <th className="py-3 px-4">Est. Items</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Survey Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredRecords.slice(0, 30).map((record) => (
                <tr key={record.id} className="hover:bg-slate-700/30 transition">
                  <td className="py-3 px-4 font-mono text-slate-300">{record.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{record.location_name}</td>
                  <td className="py-3 px-4 text-cyan-300">{record.plastic_type_name}</td>
                  <td className="py-3 px-4 font-bold text-slate-100">{record.quantity_kg} kg</td>
                  <td className="py-3 px-4 text-slate-400">{record.estimated_items?.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPpiBadgeColor(record.severity)}`}>
                      {record.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{record.source_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
