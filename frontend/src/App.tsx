import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import L, { type Map as LeafletMap } from 'leaflet';
import {
  Activity, AlertCircle, BusFront, ChevronRight, CircleHelp, Clock3,
  LocateFixed, Map as MapIcon, MapPin, Menu, Navigation, Search,
  Settings2, TramFront, X,
} from 'lucide-react';

type Point = { lat: number; lng: number };
type Stop = { id: string; name: string; point: Point; order: number };
type Tram = { id: string; name: string; color: string; offset: number; status: 'live' | 'delayed' };
type TramPosition = Tram & { point: Point; updatedSeconds: number; nearestStop: string };

// DEMO DATA ONLY: verify the real route and stops with the tram operator before launch.
const route: Point[] = [
  { lat: 14.60965, lng: 121.07825 },
  { lat: 14.61035, lng: 121.0792 },
  { lat: 14.61005, lng: 121.0805 },
  { lat: 14.60925, lng: 121.08135 },
  { lat: 14.60815, lng: 121.0810 },
  { lat: 14.60745, lng: 121.0800 },
  { lat: 14.6076, lng: 121.0788 },
  { lat: 14.60835, lng: 121.07805 },
  { lat: 14.60915, lng: 121.0778 },
];

const stops: Stop[] = [
  { id: 'mall', name: 'Eastwood Mall', point: { lat: 14.6099, lng: 121.07935 }, order: 1 },
  { id: 'cyberpark', name: 'Cyberpark', point: { lat: 14.60855, lng: 121.08085 }, order: 2 },
  { id: 'one-eastwood', name: 'One Eastwood', point: { lat: 14.60785, lng: 121.07905 }, order: 3 },
  { id: 'corporate', name: 'Corporate Center', point: { lat: 14.60905, lng: 121.07805 }, order: 4 },
];

const seedTrams: Tram[] = [
  { id: 'T01', name: 'Tram 01', color: '#2563eb', offset: 0.16, status: 'live' },
  { id: 'T02', name: 'Tram 02', color: '#059669', offset: 0.48, status: 'live' },
  { id: 'T03', name: 'Tram 03', color: '#7c3aed', offset: 0.77, status: 'delayed' },
];

function pointAt(progress: number): Point {
  const normalized = ((progress % 1) + 1) % 1;
  const segment = normalized * route.length;
  const index = Math.floor(segment) % route.length;
  const next = (index + 1) % route.length;
  const ratio = segment - Math.floor(segment);
  return {
    lat: route[index].lat + (route[next].lat - route[index].lat) * ratio,
    lng: route[index].lng + (route[next].lng - route[index].lng) * ratio,
  };
}

function distanceMeters(a: Point, b: Point): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function nearestStopName(point: Point): string {
  return stops.reduce((nearest, stop) =>
    distanceMeters(point, stop.point) < distanceMeters(point, nearest.point) ? stop : nearest,
  stops[0]).name;
}

function makePositions(tick: number): TramPosition[] {
  return seedTrams.map((tram, index) => {
    const point = pointAt(tram.offset + tick * (index === 1 ? 0.0014 : 0.0011));
    return { ...tram, point, updatedSeconds: tram.status === 'delayed' ? 34 : 4 + index * 3, nearestStop: nearestStopName(point) };
  });
}

function createTramIcon(color: string, label: string, selected: boolean) {
  return L.divIcon({
    className: 'tram-marker-wrap',
    html: `<div class="tram-marker ${selected ? 'tram-marker-selected' : ''}" style="--tram-color:${color}"><span class="tram-marker-glyph">▰</span><span class="tram-marker-label">${label}</span></div>`,
    iconSize: [94, 38],
    iconAnchor: [17, 19],
  });
}

function createStopIcon() {
  return L.divIcon({ className: 'stop-marker-wrap', html: '<div class="stop-marker"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
}

export default function App() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [tick, setTick] = useState(0);
  const [selectedTram, setSelectedTram] = useState('T01');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'map' | 'stops' | 'fleet'>('map');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStops, setShowStops] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  const trams = useMemo(() => makePositions(tick), [tick]);
  const selected = trams.find((tram) => tram.id === selectedTram) ?? trams[0];
  const filteredStops = stops.filter((stop) => stop.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const timer = window.setInterval(() => setTick((current) => current + 1), 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    const map = L.map(mapElement.current, { zoomControl: false, attributionControl: true }).setView([14.60905, 121.07955], 16);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);
// L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
//   attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Style: &copy; OpenTopoMap (CC-BY-SA)',
//   subdomains: 'abc',
//   maxZoom: 17
// }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    const layer = layerRef.current;
    layer.clearLayers();
    if (showRoute) {
      L.polyline([...route, route[0]], { color: '#2563eb', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
    }
    if (showStops) {
      stops.forEach((stop) => {
        L.marker([stop.point.lat, stop.point.lng], { icon: createStopIcon() })
          .bindTooltip(stop.name, { direction: 'top', offset: [0, -8] })
          .addTo(layer);
      });
    }
    trams.forEach((tram) => {
      L.marker([tram.point.lat, tram.point.lng], { icon: createTramIcon(tram.color, tram.name, tram.id === selectedTram), zIndexOffset: tram.id === selectedTram ? 1000 : 500 })
        .on('click', () => setSelectedTram(tram.id))
        .bindPopup(`<strong>${tram.name}</strong><br>${tram.status === 'live' ? 'Simulated live location' : 'Simulated delayed location'}<br>Near ${tram.nearestStop}`)
        .addTo(layer);
    });
  }, [trams, selectedTram, showStops, showRoute]);

  function focusTram(tram: TramPosition) {
    setSelectedTram(tram.id);
    setActiveTab('map');
    mapRef.current?.flyTo([tram.point.lat, tram.point.lng], 17, { duration: 0.6 });
    setMobileMenuOpen(false);
  }

  function focusStop(stop: Stop) {
    setActiveTab('map');
    mapRef.current?.flyTo([stop.point.lat, stop.point.lng], 17, { duration: 0.6 });
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-icon"><TramFront size={23} /></div><div><strong>Eastwood City</strong><span>Tram Tracker</span></div><button className="mobile-close icon-button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeTab === 'map' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveTab('map'); setMobileMenuOpen(false); }}><MapIcon size={18}/>Map</button>
          <button className={activeTab === 'stops' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveTab('stops'); setMobileMenuOpen(false); }}><MapPin size={18}/>Stops</button>
          <button className={activeTab === 'fleet' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveTab('fleet'); setMobileMenuOpen(false); }}><BusFront size={18}/>Tram fleet</button>
          <button className="nav-item" onClick={() => setShowAbout(true)}><CircleHelp size={18}/>About this demo</button>
        </nav>
        <div className="sidebar-bottom"><div className="live-dot-row"><span className="live-dot"/>Simulation running</div><p>Demo locations only</p><span className="sidebar-version">Prototype · v0.1</span></div>
      </aside>

      {mobileMenuOpen && <button className="sidebar-scrim" aria-label="Close menu overlay" onClick={() => setMobileMenuOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu"><Menu size={21}/></button>
          <div className="page-heading"><span className="eyebrow">EASTWOOD CITY · TRANSPORT</span><h1>{activeTab === 'map' ? 'Live tram map' : activeTab === 'stops' ? 'Tram stops' : 'Tram fleet'}</h1></div>
          <div className="topbar-actions"><div className="search-box"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stops" aria-label="Search stops"/><kbd>/</kbd></div><span className="prototype-pill"><span/>Prototype</span></div>
        </header>

        <div className="prototype-notice"><AlertCircle size={17}/><span><strong>Demo mode:</strong> tram positions and stop coordinates are simulated placeholders, not real-time Eastwood transit data.</span></div>

        <section className={`workspace ${activeTab !== 'map' ? 'workspace-secondary' : ''}`}>
          <div className="map-card panel">
            <div className="map-overlay-top"><div className="map-title-chip"><span className="map-pulse"/>Route preview <span className="chip-divider"/> Loop route</div><button className="map-location-button" onClick={() => mapRef.current?.flyTo([14.60905, 121.07955], 16)} title="Reset map view"><LocateFixed size={17}/></button></div>
            <div ref={mapElement} className="map-canvas" aria-label="Map with simulated tram locations" />
            <div className="map-legend"><span><i className="legend-line"/>Route</span><span><i className="legend-stop"/>Stop</span><span><i className="legend-tram"/>Simulated tram</span></div>
            <div className="map-controls"><label><input type="checkbox" checked={showRoute} onChange={(event) => setShowRoute(event.target.checked)}/> Route</label><label><input type="checkbox" checked={showStops} onChange={(event) => setShowStops(event.target.checked)}/> Stops</label></div>
          </div>

          <aside className="right-column">
            <section className="panel fleet-panel">
              <div className="panel-heading"><div><span className="eyebrow">FLEET OVERVIEW</span><h2>Trams on route</h2></div><span className="count-badge">{trams.length} vehicles</span></div>
              <div className="tram-list">{trams.map((tram) => <button key={tram.id} className={`tram-row ${selectedTram === tram.id ? 'tram-row-selected' : ''}`} onClick={() => focusTram(tram)}>
                <span className="tram-avatar" style={{ '--tram-color': tram.color } as CSSProperties}><TramFront size={23}/></span>
                <span className="tram-details"><span className="tram-name-line"><strong>{tram.name}</strong><span className={`status-pill ${tram.status}`}>{tram.status === 'live' ? 'Simulated live' : 'Delayed demo'}</span></span><span className="tram-subline"><Clock3 size={13}/> Updated {tram.updatedSeconds}s ago</span><span className="tram-subline"><MapPin size={13}/> Near {tram.nearestStop}</span></span>
                <ChevronRight className="row-chevron" size={17}/>
              </button>)}</div>
              <div className="fleet-footnote"><Activity size={16}/><span>Locations move automatically every 5 seconds in this demo.</span></div>
            </section>

            <section className="panel selected-panel">
              <div className="selected-heading"><div><span className="eyebrow">SELECTED VEHICLE</span><h2>{selected.name}</h2></div><span className="selected-icon" style={{ '--tram-color': selected.color } as CSSProperties}><TramFront size={25}/></span></div>
              <div className="detail-grid"><div><span>Current status</span><strong className={selected.status === 'live' ? 'text-green' : 'text-amber'}>{selected.status === 'live' ? 'Moving (simulated)' : 'Delayed (simulated)'}</strong></div><div><span>Nearest stop</span><strong>{selected.nearestStop}</strong></div><div><span>Latitude</span><strong>{selected.point.lat.toFixed(5)}</strong></div><div><span>Longitude</span><strong>{selected.point.lng.toFixed(5)}</strong></div></div>
              <button className="secondary-button full-button" onClick={() => mapRef.current?.flyTo([selected.point.lat, selected.point.lng], 18, { duration: 0.6 })}><Navigation size={16}/> Center map on {selected.name}</button>
            </section>
          </aside>
        </section>

        <section className="bottom-grid">
          <section className="panel stops-panel">
            <div className="panel-heading"><div><span className="eyebrow">ROUTE DIRECTORY</span><h2>Stops along the loop</h2></div><button className="text-button" onClick={() => setActiveTab('stops')}>View all <ChevronRight size={15}/></button></div>
            {filteredStops.length === 0 ? <div className="empty-state">No stops match “{search}”.</div> : <div className="stop-list">{filteredStops.slice(0, 4).map((stop) => <button className="stop-row" key={stop.id} onClick={() => focusStop(stop)}><span className="stop-number">{String(stop.order).padStart(2, '0')}</span><span className="stop-info"><strong>{stop.name}</strong><span>Stop location is illustrative</span></span><span className="stop-action"><MapPin size={16}/></span></button>)}</div>}
          </section>
          <section className="panel system-panel">
            <div className="panel-heading"><div><span className="eyebrow">SYSTEM STATUS</span><h2>Prototype health</h2></div><span className="healthy-pill"><span/> Running</span></div>
            <div className="health-row"><span>Location source</span><strong>Local simulator</strong></div><div className="health-row"><span>Refresh interval</span><strong>5 seconds</strong></div><div className="health-row"><span>Backend API</span><strong className="text-muted">Not connected yet</strong></div>
            <div className="integration-note"><Settings2 size={17}/><span>Next step: connect this interface to a Laravel API when the backend is ready.</span></div>
          </section>
        </section>
        <footer className="footer"><span>Eastwood City Tram Tracker <span className="footer-dot">·</span> Early prototype</span><span>Map data © OpenStreetMap contributors</span></footer>
      </main>

      {activeTab === 'stops' && <div className="view-switcher"><div className="switcher-card"><div className="switcher-title"><div><span className="eyebrow">DIRECTORY</span><h2>All stops</h2></div><button className="icon-button" onClick={() => setActiveTab('map')} aria-label="Close stops"><X size={18}/></button></div>{filteredStops.map((stop) => <button key={stop.id} className="switcher-row" onClick={() => focusStop(stop)}><span className="stop-number">{String(stop.order).padStart(2, '0')}</span><span><strong>{stop.name}</strong><small>Placeholder stop · tap to view on map</small></span><ChevronRight size={17}/></button>)}</div></div>}
      {activeTab === 'fleet' && <div className="view-switcher"><div className="switcher-card"><div className="switcher-title"><div><span className="eyebrow">VEHICLES</span><h2>All trams</h2></div><button className="icon-button" onClick={() => setActiveTab('map')} aria-label="Close fleet"><X size={18}/></button></div>{trams.map((tram) => <button key={tram.id} className="switcher-row" onClick={() => focusTram(tram)}><span className="tram-avatar small-avatar" style={{ '--tram-color': tram.color } as CSSProperties}><TramFront size={19}/></span><span><strong>{tram.name}</strong><small>{tram.status === 'live' ? 'Simulated live' : 'Delayed demo'} · Near {tram.nearestStop}</small></span><ChevronRight size={17}/></button>)}</div></div>}
      {showAbout && <div className="modal-backdrop" onClick={() => setShowAbout(false)}><section className="about-modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div className="brand-icon light-brand"><TramFront size={22}/></div><button className="icon-button" onClick={() => setShowAbout(false)} aria-label="Close about dialog"><X size={18}/></button></div><span className="eyebrow">ABOUT THIS PROJECT</span><h2>Built to make shuttle locations easier to find.</h2><p>This is an early front-end prototype for a possible public tram tracking service. It currently uses simulated positions and illustrative stops. It is not affiliated with or endorsed by Eastwood City management.</p><div className="modal-info"><AlertCircle size={17}/><span>Real tracking requires permission and an approved GPS data source from the operator.</span></div><button className="primary-button full-button" onClick={() => setShowAbout(false)}>Got it</button></section></div>}
    </div>
  );
}
