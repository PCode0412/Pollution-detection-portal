import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Flame, ShieldAlert, TrendingUp, TrendingDown, CheckCircle, Info, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHotspots() {
      try {
        const res = await api.get('/analytics/hotspots');
        setHotspots(res.data);
      } catch (err) {
        console.error('Error loading hotspots:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHotspots();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Computing hotspot classifications...</div>;
  }

  const categories = [
    {
      title: 'Persistent / Critical Hotspots',
      key: 'Persistent / Critical Hotspot',
      description: 'Locations with consistently high plastic pollution index (PPI ≥ 68) across multiple consecutive years.',
      icon: ShieldAlert,
      color: 'border-rose-500/40 bg-rose-950/20 text-rose-400',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    },
    {
      title: 'Emerging Hotspots',
      key: 'Emerging Hotspot',
      description: 'Observation points experiencing rapid plastic buildup (PPI increased by ≥ 15% in recent years).',
      icon: TrendingUp,
      color: 'border-orange-500/40 bg-orange-950/20 text-orange-400',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
    },
    {
      title: 'Improving Areas',
      key: 'Improving Area',
      description: 'Locations showing consistent PPI reduction due to targeted cleanup drives or waste intervention.',
      icon: TrendingDown,
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    {
      title: 'Stable Areas',
      key: 'Stable Area',
      description: 'Baseline observation points where plastic pollution levels remain unchanged or within variance limits.',
      icon: CheckCircle,
      color: 'border-slate-700 bg-slate-800/40 text-slate-400',
      badgeColor: 'bg-slate-700/50 text-slate-300 border-slate-600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Flame className="w-8 h-8 text-rose-500" />
          Pollution Hotspots & Risk Classification
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Rule-based spatial classification of Chennai observation points evaluated against historical survey trends (2022–2026).
        </p>
      </div>

      {/* Logic Rule Banner */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Info className="w-4 h-4" /> Hotspot Rule Engine Methodology
        </div>
        <p className="text-slate-400 leading-relaxed">
          The portal evaluates each observation station by calculating its annual Plastic Pollution Index (PPI) slope across 2022–2026. Stations exhibiting mean PPI ≥ 68 are flagged as <strong>Persistent Hotspots</strong> requiring immediate municipal interceptor barriers.
        </p>
      </div>

      {/* Hotspot Category Groups */}
      <div className="space-y-8">
        {categories.map((cat) => {
          const items = hotspots ? (hotspots[cat.key] || []) : [];
          const Icon = cat.icon;

          return (
            <div key={cat.key} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${cat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {cat.title}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      {items.length} Locations
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{cat.description}</p>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-4 bg-slate-800/30 rounded-lg border border-slate-800">
                  No observation stations currently categorized under {cat.title}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-5 space-y-3 shadow-md hover:border-slate-600 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                            {item.waterBodyName}
                          </span>
                          <h3 className="font-bold text-white text-base mt-0.5">{item.name}</h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold border ${cat.badgeColor}`}>
                          PPI {item.currentPPI}
                        </span>
                      </div>

                      {/* Yearly Trend Pills */}
                      <div className="pt-2 border-t border-slate-700/60">
                        <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Historical PPI Trend (2022–2026):</span>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {Object.keys(item.yearlyPpi || {}).map((yr) => (
                            <div key={yr} className="bg-slate-900 px-2 py-1 rounded text-center min-w-[42px] border border-slate-700">
                              <span className="text-[9px] text-slate-500 block leading-none">{yr}</span>
                              <span className="text-xs font-extrabold text-slate-200 mt-0.5 block">{item.yearlyPpi[yr]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {item.latitude.toFixed(3)}, {item.longitude.toFixed(3)}
                        </span>
                        <span>Avg Qty: <strong className="text-slate-200">{item.avgQtyKg} kg</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
