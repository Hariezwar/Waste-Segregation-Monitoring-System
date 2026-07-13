import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  FileText, 
  Truck, 
  PlusCircle, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Search,
  Filter,
  User,
  Activity,
  ChevronRight,
  TrendingUp,
  Settings
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [wards, setWards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // New Log Form State
  const [logForm, setLogForm] = useState({
    ward_id: '',
    date: new Date().toISOString().split('T')[0],
    wet_waste_kg: '',
    dry_waste_kg: '',
    hazardous_waste_kg: '',
    status: 'Fully Segregated',
    supervisor_name: '',
    notes: ''
  });

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, wardsRes, logsRes, trucksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`),
        fetch(`${API_BASE_URL}/wards`),
        fetch(`${API_BASE_URL}/logs`),
        fetch(`${API_BASE_URL}/trucks`)
      ]);

      if (!statsRes.ok || !wardsRes.ok || !logsRes.ok || !trucksRes.ok) {
        throw new Error('Failed to fetch data from API. Make sure the backend server is running.');
      }

      const statsData = await statsRes.json();
      const wardsData = await wardsRes.json();
      const logsData = await logsRes.json();
      const trucksData = await trucksRes.json();

      setStats(statsData);
      setWards(wardsData);
      setLogs(logsData);
      setTrucks(trucksData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle log submission
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!logForm.ward_id || !logForm.wet_waste_kg || !logForm.dry_waste_kg || !logForm.hazardous_waste_kg || !logForm.supervisor_name) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logForm,
          ward_id: parseInt(logForm.ward_id),
          wet_waste_kg: parseFloat(logForm.wet_waste_kg),
          dry_waste_kg: parseFloat(logForm.dry_waste_kg),
          hazardous_waste_kg: parseFloat(logForm.hazardous_waste_kg)
        })
      });

      if (!response.ok) throw new Error('Failed to submit collection log.');

      const newLog = await response.json();
      setLogs(prev => [newLog, ...prev]);
      showToast('Collection log submitted successfully!', 'success');
      
      // Reset Form (except date and supervisor)
      setLogForm(prev => ({
        ...prev,
        ward_id: '',
        wet_waste_kg: '',
        dry_waste_kg: '',
        hazardous_waste_kg: '',
        notes: ''
      }));

      // Refresh Stats and Wards
      fetchAllData();
      setActiveTab('dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle truck status update
  const handleTruckUpdate = async (truckId, newStatus, wardId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trucks/${truckId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, current_ward_id: wardId })
      });

      if (!response.ok) throw new Error('Failed to update truck status.');

      const updatedTruck = await response.json();
      setTrucks(prev => prev.map(t => t.id === truckId ? updatedTruck : t));
      showToast(`Truck ${updatedTruck.truck_number} updated to ${newStatus}`, 'success');
      
      // Refresh stats
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Helper: Format weight
  const formatWeight = (kg) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(2)} Tons`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  // Custom SVG Area Chart Component for Waste Timeline
  const RenderWasteChart = ({ data }) => {
    if (!data || data.length === 0) return <div>No data available</div>;

    const padding = 40;
    const width = 600;
    const height = 250;
    
    // Find Max Value
    const maxVal = Math.max(...data.map(d => d.wet + d.dry + d.hazardous), 100);
    const scaleY = (val) => height - padding - (val / maxVal) * (height - 2 * padding);
    const scaleX = (index) => padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);

    // Create points path
    let wetPoints = '';
    let dryPoints = '';
    let hazPoints = '';

    data.forEach((d, idx) => {
      const x = scaleX(idx);
      wetPoints += `${idx === 0 ? 'M' : 'L'} ${x} ${scaleY(d.wet)} `;
      dryPoints += `${idx === 0 ? 'M' : 'L'} ${x} ${scaleY(d.dry)} `;
      hazPoints += `${idx === 0 ? 'M' : 'L'} ${x} ${scaleY(d.hazardous)} `;
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <linearGradient id="wetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-wet)" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="var(--color-wet)" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="dryGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-dry)" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="var(--color-dry)" stopOpacity={0}/>
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - 2 * padding);
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <text x={padding - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">{val}</text>
            </g>
          );
        })}

        {/* X axis labels */}
        {data.map((d, idx) => {
          const x = scaleX(idx);
          // Show label only for some indices to avoid crowding
          if (data.length > 7 && idx % 2 !== 0) return null;
          // Format date to MM/DD
          const dateStr = d.date.substring(5);
          return (
            <text key={idx} x={x} y={height - padding + 18} fill="var(--text-muted)" fontSize="10" textAnchor="middle">
              {dateStr}
            </text>
          );
        })}

        {/* Paths */}
        <path d={wetPoints} fill="none" stroke="var(--color-wet)" strokeWidth="2.5" />
        <path d={dryPoints} fill="none" stroke="var(--color-dry)" strokeWidth="2.5" />
        <path d={hazPoints} fill="none" stroke="var(--color-hazard)" strokeWidth="2" strokeDasharray="4 2" />

        {/* Interactive dots on the last point */}
        {data.length > 0 && (
          <g>
            <circle cx={scaleX(data.length - 1)} cy={scaleY(data[data.length - 1].wet)} r="5" fill="var(--color-wet)" stroke="white" strokeWidth="1.5" />
            <circle cx={scaleX(data.length - 1)} cy={scaleY(data[data.length - 1].dry)} r="5" fill="var(--color-dry)" stroke="white" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    );
  };

  // Mock Map Tracker Wards Markers
  const mapMarkers = [
    { id: 1, top: '40%', left: '35%', name: 'Ward 1 - Sector Alpha', state: 'active' },
    { id: 2, top: '25%', left: '60%', name: 'Ward 2 - Sector Beta', state: 'active' },
    { id: 3, top: '70%', left: '20%', name: 'Ward 3 - Sector Gamma', state: 'maintenance' },
    { id: 4, top: '65%', left: '75%', name: 'Ward 4 - Sector Delta', state: 'active' },
    { id: 5, top: '15%', left: '25%', name: 'Ward 5 - Sector Epsilon', state: 'idle' }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <Activity className="logo-icon" size={28} />
          <span className="logo-text">ULB SegregAlert</span>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            className={`menu-item ${activeTab === 'wards' ? 'active' : ''}`}
            onClick={() => setActiveTab('wards')}
          >
            <MapPin size={20} />
            Wards Status
          </button>
          <button 
            className={`menu-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <FileText size={20} />
            Collection Logs
          </button>
          <button 
            className={`menu-item ${activeTab === 'fleet' ? 'active' : ''}`}
            onClick={() => setActiveTab('fleet')}
          >
            <Truck size={20} />
            Fleet Tracker
          </button>
          <button 
            className={`menu-item ${activeTab === 'new-log' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-log')}
          >
            <PlusCircle size={20} />
            Log Waste Entry
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="ulb-badge">
            <span className="ulb-title">Urban Local Body</span>
            <span className="ulb-name">Metropolitan MC</span>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <div>
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Operations Dashboard'}
              {activeTab === 'wards' && 'Ward-wise Segregation'}
              {activeTab === 'logs' && 'Waste Collection Logs'}
              {activeTab === 'fleet' && 'Collection Fleet Management'}
              {activeTab === 'new-log' && 'Submit Daily Collection Log'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Waste Segregation Monitoring & Compliance Portal
            </p>
          </div>

          <div className="date-badge">
            <Calendar size={16} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="alert-item" style={{ marginBottom: '24px' }}>
            <AlertTriangle className="text-mixed" size={24} />
            <div className="alert-content">
              <p className="alert-message">{error}</p>
              <p className="alert-meta">Please make sure database backend is initialized and running on localhost:5000</p>
            </div>
            <button className="btn btn-secondary" onClick={fetchAllData} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Retry Connection
            </button>
          </div>
        )}

        {/* Dashboard Loading Overlay */}
        {loading && !stats && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--color-dry)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading live data streams...</p>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {stats && !loading && (
          <>
            {/* 1. DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div>
                {/* Stats Summary Cards */}
                <div className="stats-grid">
                  <div className="glass-panel stat-card border-wet">
                    <div className="stat-header">
                      <span className="stat-title">Wet waste (Organic)</span>
                      <CheckCircle className="text-wet" size={20} />
                    </div>
                    <div className="stat-value text-wet">
                      {formatWeight(stats.waste.wet).split(' ')[0]}
                      <span className="stat-unit">{formatWeight(stats.waste.wet).split(' ')[1]}</span>
                    </div>
                    <div className="stat-footer">Biodegradable Compostable load</div>
                  </div>

                  <div className="glass-panel stat-card border-dry">
                    <div className="stat-header">
                      <span className="stat-title">Dry waste (Recyclable)</span>
                      <TrendingUp className="text-dry" size={20} />
                    </div>
                    <div className="stat-value text-dry">
                      {formatWeight(stats.waste.dry).split(' ')[0]}
                      <span className="stat-unit">{formatWeight(stats.waste.dry).split(' ')[1]}</span>
                    </div>
                    <div className="stat-footer">Paper, plastic, metal sorted</div>
                  </div>

                  <div className="glass-panel stat-card border-hazard">
                    <div className="stat-header">
                      <span className="stat-title">Hazardous / Toxic</span>
                      <AlertTriangle className="text-hazard" size={20} />
                    </div>
                    <div className="stat-value text-hazard">
                      {formatWeight(stats.waste.hazardous).split(' ')[0]}
                      <span className="stat-unit">{formatWeight(stats.waste.hazardous).split(' ')[1]}</span>
                    </div>
                    <div className="stat-footer">Requires special treatment</div>
                  </div>

                  <div className="glass-panel stat-card border-mixed" style={{ borderLeftColor: stats.efficiency >= 80 ? 'var(--color-wet)' : 'var(--color-mixed)' }}>
                    <div className="stat-header">
                      <span className="stat-title">Segregation Efficiency</span>
                      <Activity size={20} style={{ color: stats.efficiency >= 80 ? 'var(--color-wet)' : 'var(--color-mixed)' }} />
                    </div>
                    <div className="stat-value" style={{ color: stats.efficiency >= 80 ? 'var(--color-wet)' : 'var(--color-mixed)' }}>
                      {stats.efficiency}%
                    </div>
                    <div className="stat-footer">Target ULB threshold: 85%</div>
                  </div>
                </div>

                {/* Main Graph & Leaderboard row */}
                <div className="dashboard-grid">
                  <div className="glass-panel chart-container">
                    <div className="chart-header">
                      <h3 className="chart-title">Waste Generation Trends</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-wet)' }} /> Wet Waste
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-dry)' }} /> Dry Waste
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-hazard)' }} strokeDasharray="4 2" /> Hazardous
                        </span>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '300px' }}>
                      <RenderWasteChart data={stats.chartData} />
                    </div>
                  </div>

                  <div className="glass-panel leaderboard-card">
                    <h3 className="chart-title">Ward Segregation Compliance</h3>
                    <div className="leaderboard-list">
                      {stats.leaderboard.map((item, idx) => (
                        <div key={item.id} className="leaderboard-item">
                          <span className={`leaderboard-rank rank-${idx + 1}`}>
                            {idx + 1}
                          </span>
                          <span className="leaderboard-name">{item.name}</span>
                          <span className="leaderboard-value" style={{ color: item.segregation_rate >= 80 ? 'var(--color-wet)' : 'var(--color-mixed)' }}>
                            {item.segregation_rate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alerts / Live Feeds */}
                <div className="alerts-panel">
                  <h3 style={{ marginBottom: '16px', fontWeight: 600, fontSize: '1.2rem' }}>Critical System Alerts</h3>
                  
                  {stats.leaderboard.filter(w => w.segregation_rate < 80).map(ward => (
                    <div key={ward.id} className="alert-item">
                      <AlertTriangle className="text-mixed" size={20} />
                      <div className="alert-content">
                        <p className="alert-message">Low Segregation Rate in {ward.name}</p>
                        <p className="alert-meta">Current compliance score is {ward.segregation_rate}%. Initiating compliance inspect check immediately.</p>
                      </div>
                    </div>
                  ))}

                  {trucks.filter(t => t.status === 'Maintenance').map(truck => (
                    <div key={truck.id} className="alert-item alert-warning">
                      <Settings className="text-hazard" size={20} />
                      <div className="alert-content">
                        <p className="alert-message">Truck {truck.truck_number} Offline</p>
                        <p className="alert-meta">Fleet truck driver {truck.driver_name} is in garage. Reroute backup collectors to ward route.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. WARDS STATUS VIEW */}
            {activeTab === 'wards' && (
              <div className="ward-grid">
                {wards.map(w => {
                  const percent = w.actual_segregation_rate;
                  const isTargetMet = percent >= w.target_segregation_rate;
                  
                  return (
                    <div key={w.id} className="glass-panel ward-card">
                      <div className="ward-header">
                        <span className="ward-name-title">{w.name}</span>
                        <span className={`status-badge ${isTargetMet ? 'badge-fully' : 'badge-mixed'}`}>
                          {isTargetMet ? 'Target Met' : 'Action Required'}
                        </span>
                      </div>

                      <div className="rate-meter-container">
                        <div className="rate-labels">
                          <span>Segregation Compliance</span>
                          <span style={{ fontWeight: 700 }}>{percent}%</span>
                        </div>
                        <div className="rate-bar-bg">
                          <div 
                            className="rate-bar-fill" 
                            style={{ 
                              width: `${percent}%`, 
                              background: percent >= 85 ? 'var(--color-wet)' : percent >= 70 ? 'var(--color-dry)' : 'var(--color-mixed)' 
                            }} 
                          />
                        </div>
                        <div className="rate-labels" style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>Target: {w.target_segregation_rate}%</span>
                          <span>Logs: {w.total_logs} logged</span>
                        </div>
                      </div>

                      <div className="ward-details-grid">
                        <div className="ward-detail-item">
                          <span className="ward-detail-label">Organic (Wet)</span>
                          <span className="ward-detail-val text-wet">{formatWeight(w.total_wet)}</span>
                        </div>
                        <div className="ward-detail-item">
                          <span className="ward-detail-label">Recyclable (Dry)</span>
                          <span className="ward-detail-val text-dry">{formatWeight(w.total_dry)}</span>
                        </div>
                        <div className="ward-detail-item">
                          <span className="ward-detail-label">Hazardous</span>
                          <span className="ward-detail-val text-hazard">{formatWeight(w.total_hazardous)}</span>
                        </div>
                        <div className="ward-detail-item">
                          <span className="ward-detail-label">Total Waste</span>
                          <span className="ward-detail-val">{formatWeight(w.total_wet + w.total_dry + w.total_hazardous)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. LOGS VIEW */}
            {activeTab === 'logs' && (
              <div className="glass-panel table-panel">
                <div className="table-header-row">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18} />
                      <input 
                        type="text" 
                        placeholder="Search supervisor or ward..." 
                        className="search-input"
                        style={{ paddingLeft: '38px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      style={{ padding: '8px' }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Fully Segregated">Fully Segregated</option>
                      <option value="Partially Segregated">Partially Segregated</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>

                  <button className="btn" onClick={() => setActiveTab('new-log')}>
                    <PlusCircle size={16} /> Log Entry
                  </button>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Ward</th>
                        <th>Supervisor</th>
                        <th>Wet (Organic)</th>
                        <th>Dry (Recycled)</th>
                        <th>Hazardous</th>
                        <th>Status</th>
                        <th>Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs
                        .filter(log => {
                          const matchSearch = log.supervisor_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                              log.ward_name.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchStatus = filterStatus === 'All' || log.status === filterStatus;
                          return matchSearch && matchStatus;
                        })
                        .map(log => (
                          <tr key={log.id}>
                            <td>{log.date}</td>
                            <td style={{ fontWeight: 600 }}>{log.ward_name}</td>
                            <td>{log.supervisor_name}</td>
                            <td className="text-wet">{formatWeight(log.wet_waste_kg)}</td>
                            <td className="text-dry">{formatWeight(log.dry_waste_kg)}</td>
                            <td className="text-hazard">{formatWeight(log.hazardous_waste_kg)}</td>
                            <td>
                              <span className={`status-badge ${
                                log.status === 'Fully Segregated' ? 'badge-fully' : 
                                log.status === 'Partially Segregated' ? 'badge-partially' : 'badge-mixed'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{log.notes || '-'}</td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. FLEET TRACKER */}
            {activeTab === 'fleet' && (
              <div>
                {/* Visual Route Mock Map */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Collection Vehicle Live Map (Simulated GPS)</h3>
                  <div className="map-mock">
                    <div className="map-mock-grid" />
                    {mapMarkers.map(marker => {
                      const associatedTrucks = trucks.filter(t => t.current_ward_id === marker.id && t.status === 'Active');
                      const hasActive = associatedTrucks.length > 0;
                      
                      return (
                        <div 
                          key={marker.id}
                          className={`map-dot ${hasActive ? 'active' : marker.state === 'maintenance' ? 'maintenance' : ''}`}
                          style={{ top: marker.top, left: marker.left }}
                          title={`${marker.name} (${associatedTrucks.length} trucks active)`}
                        >
                          <span className="map-label">
                            {marker.name.split(' - ')[0]}: {hasActive ? `${associatedTrucks.length} Active` : 'No Fleet'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="fleet-grid">
                  {trucks.map(truck => (
                    <div key={truck.id} className="glass-panel truck-card">
                      <div className="truck-header">
                        <span className="truck-id">
                          <Truck size={18} className="text-dry" />
                          {truck.truck_number}
                        </span>
                        <select 
                          className={`status-badge ${
                            truck.status === 'Active' ? 'truck-status-active' : 
                            truck.status === 'Idle' ? 'truck-status-idle' : 'truck-status-maintenance'
                          }`}
                          value={truck.status}
                          onChange={(e) => handleTruckUpdate(truck.id, e.target.value, truck.current_ward_id)}
                          style={{ padding: '2px 8px', border: 'none', cursor: 'pointer' }}
                        >
                          <option value="Active">Active</option>
                          <option value="Idle">Idle</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      </div>

                      <div className="truck-driver">
                        <User size={14} />
                        <span>Driver: {truck.driver_name}</span>
                      </div>

                      <div className="truck-ward">
                        <MapPin size={14} />
                        <span>Route Ward: </span>
                        <select 
                          value={truck.current_ward_id || ''} 
                          onChange={(e) => handleTruckUpdate(truck.id, truck.status, e.target.value ? parseInt(e.target.value) : null)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', marginLeft: '4px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0' }}
                        >
                          <option value="" style={{ color: 'black' }}>Unassigned</option>
                          {wards.map(w => (
                            <option key={w.id} value={w.id} style={{ color: 'black' }}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. NEW ENTRY LOG FORM */}
            {activeTab === 'new-log' && (
              <div className="glass-panel form-panel">
                <h2 className="form-title">Record Daily Collection Statistics</h2>
                
                <form onSubmit={handleLogSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="ward_id">Select Ward / Sector *</label>
                      <select 
                        id="ward_id"
                        value={logForm.ward_id} 
                        onChange={(e) => setLogForm(p => ({ ...p, ward_id: e.target.value }))}
                        required
                      >
                        <option value="">-- Choose Ward --</option>
                        {wards.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="date">Date of Collection *</label>
                      <input 
                        type="date" 
                        id="date" 
                        value={logForm.date}
                        onChange={(e) => setLogForm(p => ({ ...p, date: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="wet_waste_kg">Wet Waste Collected (kg) *</label>
                      <input 
                        type="number" 
                        id="wet_waste_kg" 
                        placeholder="e.g. 450"
                        value={logForm.wet_waste_kg}
                        onChange={(e) => setLogForm(p => ({ ...p, wet_waste_kg: e.target.value }))}
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="dry_waste_kg">Dry Waste Collected (kg) *</label>
                      <input 
                        type="number" 
                        id="dry_waste_kg" 
                        placeholder="e.g. 350"
                        value={logForm.dry_waste_kg}
                        onChange={(e) => setLogForm(p => ({ ...p, dry_waste_kg: e.target.value }))}
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="hazardous_waste_kg">Hazardous / Special Waste (kg) *</label>
                      <input 
                        type="number" 
                        id="hazardous_waste_kg" 
                        placeholder="e.g. 10"
                        value={logForm.hazardous_waste_kg}
                        onChange={(e) => setLogForm(p => ({ ...p, hazardous_waste_kg: e.target.value }))}
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="status">Segregation Rating *</label>
                      <select 
                        id="status"
                        value={logForm.status} 
                        onChange={(e) => setLogForm(p => ({ ...p, status: e.target.value }))}
                        required
                      >
                        <option value="Fully Segregated">Fully Segregated (High Compliance)</option>
                        <option value="Partially Segregated">Partially Segregated (Medium Compliance)</option>
                        <option value="Mixed">Mixed (Unacceptable Compliance)</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="supervisor_name">Supervisor Signature Name *</label>
                      <input 
                        type="text" 
                        id="supervisor_name" 
                        placeholder="Operator / Ward Supervisor Name"
                        value={logForm.supervisor_name}
                        onChange={(e) => setLogForm(p => ({ ...p, supervisor_name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="notes">Compliance Notes / Comments</label>
                      <textarea 
                        id="notes" 
                        rows="3" 
                        placeholder="Describe sorting issues, collection delays, safety violations, etc."
                        value={logForm.notes}
                        onChange={(e) => setLogForm(p => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-wet">
                      Submit Log Entry
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      {/* Notifications */}
      {toast && (
        <div className="toast">
          <Database size={18} style={{ color: toast.type === 'error' ? 'var(--color-mixed)' : 'var(--color-wet)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
