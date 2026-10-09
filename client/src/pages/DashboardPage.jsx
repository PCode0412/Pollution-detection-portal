import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import MapComponent from '../components/MapComponent';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Waves, AlertOctagon, TrendingUp, Scale, Package, Filter, ArrowUpRight, ShieldAlert, Sparkles 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [locations, setLocations] = useState([]);
  const [waterBodies, setWaterBodies] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [overviewRes, trendsRes, locsRes, wbRes] = await Promise.all([
          api.get(`/analytics/overview${selectedYear ? `?year=${selectedYear}` : ''}`),
          api.get('/analytics/trends'),
          api.get('/locations'),
          api.get('/water-bodies')
        ]);
        setOverview(overviewRes.data);
        setTrends(trendsRes.data);
        setLocations(locsRes.data);
        setWaterBodies(wbRes.data);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedYear]);

  const PIE_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Waves className="w-8 h-8 text-cyan-400" />
            Chennai Water Bodies Pollution Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitoring plastic debris density, historical trends (2022–2026), and hotspot risks across beaches, rivers, and canals.
          </p>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Filter Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Years (2022–2026)</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
          <span>Loading Chennai environmental dataset...</span>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Overall PPI Card */}
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Chennai PPI</span>
                <AlertOctagon className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-white">{overview?.overallPPI ?? 0}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getPpiBadgeColor(overview?.status)}`}>
                  {overview?.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Scale 0 (Pristine) to 100 (Critical)
              </p>
            </div>

            {/* Total Estimated Waste */}
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Est. Waste Recorded</span>
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {overview?.totalWasteKg?.toLocaleString() ?? 0}
                </span>
                <span className="text-sm font-semibold text-amber-400">kg</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Across {overview?.totalRecords ?? 0} survey samples
              </p>
            </div>

            {/* Estimated Debris Items */}
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Est. Plastic Debris Items</span>
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {overview?.totalEstimatedItems?.toLocaleString() ?? 0}
                </span>
                <span className="text-xs text-slate-400">items</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Bottles, bags, packaging fragments
              </p>
            </div>

            {/* Monitoring Points */}
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monitored Stations</span>
                <Waves className="w-5 h-5 text-blue-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{overview?.waterBodiesCount ?? 0}</span>
                <span className="text-xs text-slate-400">Water Bodies</span>
                <span className="text-slate-500 font-bold">•</span>
                <span className="text-lg font-bold text-slate-200">{overview?.observationPointsCount ?? 0}</span>
                <span className="text-xs text-slate-400">Points</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Beaches, Adyar/Cooum rivers, Canals
              </p>
            </div>

          </div>

          {/* Interactive Map & Water Body Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Map Container */}
            <div className="lg:col-span-2 bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">Chennai Observation Points Map</h3>
                  <p className="text-xs text-slate-400">Color coded by Plastic Pollution Index (PPI) status</p>
                </div>
                <Link to="/map" className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1">
                  Full Screen Map <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="h-[420px]">
                <MapComponent locations={locations} zoom={11} />
              </div>
            </div>

            {/* Water Body Comparison Bar Chart */}
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 flex flex-col space-y-4">
              <h3 className="font-bold text-lg text-white">Water Bodies PPI Comparison</h3>
              <p className="text-xs text-slate-400">Current index comparison across major Chennai waterways</p>
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterBodies} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={10} width={110} tickFormatter={(val) => val.split(' ')[0]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="ppi" name="PPI Score" fill="#0284c7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Historical Trends & Plastic Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 5-Year Historical Trend Line Chart */}
            <div className="lg:col-span-2 bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">5-Year Pollution Trends (2022–2026)</h3>
                  <p className="text-xs text-slate-400">Historical PPI progression by Chennai water body</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-cyan-400 font-semibold">
                  <TrendingUp className="w-4 h-4" /> Multi-Year Slope Analysis
                </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="Overall Chennai" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Cooum River" stroke="#f97316" strokeWidth={2} />
                    <Line type="monotone" dataKey="Marina Beach Shoreline" stroke="#06b6d4" strokeWidth={2} />
                    <Line type="monotone" dataKey="Adyar River & Estuary" stroke="#eab308" strokeWidth={2} />
                    <Line type="monotone" dataKey="Buckingham Canal" stroke="#a855f7" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plastic Category Breakdown Pie Chart */}
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 space-y-4">
              <h3 className="font-bold text-lg text-white">Plastic Waste Categories</h3>
              <p className="text-xs text-slate-400">Distribution by weight (kg) collected in field surveys</p>
              
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview?.plasticTypeBreakdown || []}
                      dataKey="total_kg"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      paddingAngle={2}
                    >
                      {(overview?.plasticTypeBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(overview?.plasticTypeBreakdown || []).map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                      <span className="text-slate-300 truncate max-w-[160px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-200">{item.total_kg} kg</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Nav Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
            <Link to="/hotspots" className="bg-gradient-to-r from-slate-800 to-slate-800/90 border border-slate-700 hover:border-cyan-500/50 p-6 rounded-xl transition group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-500/20 text-rose-400 rounded-lg">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition">
                      View Hotspot & Risk Analysis
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Identify persistent critical hotspots vs emerging areas and cleanups
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition" />
              </div>
            </Link>

            <Link to="/water-bodies" className="bg-gradient-to-r from-slate-800 to-slate-800/90 border border-slate-700 hover:border-cyan-500/50 p-6 rounded-xl transition group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-lg">
                    <Waves className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition">
                      Explore Chennai Water Bodies
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Detailed profile pages for Marina, Cooum, Adyar, Elliot's, Ennore, Kovalam, and Buckingham Canal
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition" />
              </div>
            </Link>
          </div>
        </>
      )}

    </div>
  );
}
