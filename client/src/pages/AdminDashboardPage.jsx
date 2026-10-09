import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  ShieldCheck, Plus, Trash2, Edit2, Waves, MapPin, Activity, Sparkles, Check, X, RefreshCw 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pollution'); // 'pollution', 'waterBodies', 'locations', 'cleanups'
  
  const [pollutionRecords, setPollutionRecords] = useState([]);
  const [waterBodies, setWaterBodies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [plasticTypes, setPlasticTypes] = useState([]);
  const [cleanups, setCleanups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Modal forms state
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [pRes, wbRes, locRes, ptRes, cRes] = await Promise.all([
        api.get('/pollution?limit=100'),
        api.get('/water-bodies'),
        api.get('/locations'),
        api.get('/pollution/plastic-types'),
        api.get('/cleanups')
      ]);
      setPollutionRecords(pRes.data);
      setWaterBodies(wbRes.data);
      setLocations(locRes.data);
      setPlasticTypes(ptRes.data);
      setCleanups(cRes.data);
    } catch (err) {
      console.error('Error loading admin data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (item = null) => {
    setEditItem(item);
    if (activeTab === 'pollution') {
      setFormData(item ? {
        observation_point_id: item.observation_point_id,
        plastic_type_id: item.plastic_type_id,
        date: item.date,
        quantity_kg: item.quantity_kg,
        estimated_items: item.estimated_items,
        severity: item.severity,
        description: item.description,
        source_type: item.source_type
      } : {
        observation_point_id: locations[0]?.id || '',
        plastic_type_id: plasticTypes[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        quantity_kg: 25,
        estimated_items: 500,
        severity: 'Moderate',
        description: 'Field survey record',
        source_type: 'Municipal Survey'
      });
    } else if (activeTab === 'waterBodies') {
      setFormData(item ? {
        name: item.name,
        type: item.type,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude
      } : {
        name: '',
        type: 'Beach',
        description: '',
        latitude: 13.0475,
        longitude: 80.2824
      });
    } else if (activeTab === 'locations') {
      setFormData(item ? {
        water_body_id: item.water_body_id,
        name: item.name,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude
      } : {
        water_body_id: waterBodies[0]?.id || '',
        name: '',
        description: '',
        latitude: 13.0475,
        longitude: 80.2824
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'pollution') {
        if (editItem) {
          await api.put(`/pollution/${editItem.id}`, formData);
        } else {
          await api.post('/pollution', formData);
        }
      } else if (activeTab === 'waterBodies') {
        if (editItem) {
          await api.put(`/water-bodies/${editItem.id}`, formData);
        } else {
          await api.post('/water-bodies', formData);
        }
      } else if (activeTab === 'locations') {
        if (editItem) {
          await api.put(`/locations/${editItem.id}`, formData);
        } else {
          await api.post('/locations', formData);
        }
      }
      setShowModal(false);
      setMessage('Operation completed successfully!');
      setTimeout(() => setMessage(''), 3000);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save record.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      if (activeTab === 'pollution') await api.delete(`/pollution/${id}`);
      else if (activeTab === 'waterBodies') await api.delete(`/water-bodies/${id}`);
      else if (activeTab === 'locations') await api.delete(`/locations/${id}`);
      else if (activeTab === 'cleanups') await api.delete(`/cleanups/${id}`);

      setMessage('Record deleted.');
      setTimeout(() => setMessage(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
            Administrator Control Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage water bodies, observation stations, and pollution survey entries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md"
          >
            <Plus className="w-4 h-4" /> Add New Entry
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pollution')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'pollution' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" /> Pollution Survey Records ({pollutionRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('waterBodies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'waterBodies' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Waves className="w-4 h-4" /> Water Bodies ({waterBodies.length})
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'locations' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <MapPin className="w-4 h-4" /> Observation Points ({locations.length})
        </button>
      </div>

      {/* Data Tables */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading admin console data...</div>
      ) : (
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
          
          {/* Pollution Records Tab */}
          {activeTab === 'pollution' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Observation Point</th>
                    <th className="py-3 px-4">Plastic Category</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {pollutionRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-700/40">
                      <td className="py-3 px-4 font-mono">{r.date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{r.location_name}</td>
                      <td className="py-3 px-4 text-cyan-300">{r.plastic_type_name}</td>
                      <td className="py-3 px-4 font-bold">{r.quantity_kg} kg</td>
                      <td className="py-3 px-4">{r.severity}</td>
                      <td className="py-3 px-4 text-slate-400">{r.source_type}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button onClick={() => handleOpenModal(r)} className="text-slate-400 hover:text-cyan-400">
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-rose-400">
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Water Bodies Tab */}
          {activeTab === 'waterBodies' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Coordinates</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {waterBodies.map((wb) => (
                    <tr key={wb.id} className="hover:bg-slate-700/40">
                      <td className="py-3 px-4 font-mono text-slate-500">#{wb.id}</td>
                      <td className="py-3 px-4 font-bold text-white">{wb.name}</td>
                      <td className="py-3 px-4 text-cyan-300">{wb.type}</td>
                      <td className="py-3 px-4 text-slate-400">{wb.latitude}, {wb.longitude}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button onClick={() => handleOpenModal(wb)} className="text-slate-400 hover:text-cyan-400">
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button onClick={() => handleDelete(wb.id)} className="text-slate-400 hover:text-rose-400">
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Observation Points Tab */}
          {activeTab === 'locations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Station Name</th>
                    <th className="py-3 px-4">Water Body</th>
                    <th className="py-3 px-4">Coordinates</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-700/40">
                      <td className="py-3 px-4 font-bold text-white">{loc.name}</td>
                      <td className="py-3 px-4 text-cyan-300">{loc.water_body_name}</td>
                      <td className="py-3 px-4 text-slate-400">{loc.latitude}, {loc.longitude}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button onClick={() => handleOpenModal(loc)} className="text-slate-400 hover:text-cyan-400">
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button onClick={() => handleDelete(loc.id)} className="text-slate-400 hover:text-rose-400">
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-lg text-white">
                {editItem ? 'Edit Entry' : 'Create New Entry'} ({activeTab})
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {activeTab === 'pollution' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Observation Station</label>
                    <select
                      value={formData.observation_point_id}
                      onChange={(e) => setFormData({ ...formData, observation_point_id: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.water_body_name} - {l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Plastic Category</label>
                    <select
                      value={formData.plastic_type_id}
                      onChange={(e) => setFormData({ ...formData, plastic_type_id: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                    >
                      {plasticTypes.map((pt) => (
                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Quantity (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.quantity_kg}
                        onChange={(e) => setFormData({ ...formData, quantity_kg: parseFloat(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'waterBodies' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Water Body Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ecosystem Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                    >
                      <option value="Beach">Beach</option>
                      <option value="River">River</option>
                      <option value="Estuary/Creek">Estuary/Creek</option>
                      <option value="Canal">Canal</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'locations' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Water Body</label>
                    <select
                      value={formData.water_body_id}
                      onChange={(e) => setFormData({ ...formData, water_body_id: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                    >
                      {waterBodies.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Station Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-500 font-semibold shadow"
                >
                  Save Entry
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
