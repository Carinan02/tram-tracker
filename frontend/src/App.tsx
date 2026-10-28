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
   { lat: 14.61083, lng: 121.0804626 },
  { lat: 14.6108578, lng: 121.0804339 },
  { lat: 14.6108855, lng: 121.0804005 },
  { lat: 14.6109224, lng: 121.0803671 },
  { lat: 14.6109609, lng: 121.0803099 },
  { lat: 14.6110024, lng: 121.0802463 },
  { lat: 14.6110347, lng: 121.080189 },
  { lat: 14.6110671, lng: 121.0801254 },
  { lat: 14.6111025, lng: 121.0800315 },
  { lat: 14.6111179, lng: 121.0799552 },
  { lat: 14.6111317, lng: 121.0798693 },
  { lat: 14.6111302, lng: 121.0798121 },
  { lat: 14.6111286, lng: 121.0797437 },
  { lat: 14.6111179, lng: 121.0796753 },
  { lat: 14.6111055, lng: 121.0796037 },
  { lat: 14.6110917, lng: 121.0795417 },
  { lat: 14.6110578, lng: 121.0794383 },
  { lat: 14.6110271, lng: 121.0793826 },
  { lat: 14.6109855, lng: 121.079311 },
  { lat: 14.6109347, lng: 121.0792363 },
  { lat: 14.6108793, lng: 121.0791695 },
  { lat: 14.6108162, lng: 121.079109 },
  { lat: 14.6107485, lng: 121.0790407 },
  { lat: 14.6106992, lng: 121.0789866 },
  { lat: 14.6106271, lng: 121.0789091 },
  { lat: 14.6105502, lng: 121.0788248 },
  { lat: 14.6104917, lng: 121.0787612 },
  { lat: 14.6104409, lng: 121.0787087 },
  { lat: 14.6103855, lng: 121.0786514 },
  { lat: 14.6103362, lng: 121.078591 },
  { lat: 14.6102977, lng: 121.078556 },
  { lat: 14.6102808, lng: 121.0785369 },
  { lat: 14.6102608, lng: 121.0785226 },
  { lat: 14.6102439, lng: 121.0785337 },
  { lat: 14.6102331, lng: 121.0785608 },
  { lat: 14.6102116, lng: 121.0785989 },
  { lat: 14.61017, lng: 121.078661 },
  { lat: 14.6101346, lng: 121.0787198 },
  { lat: 14.6100884, lng: 121.0787898 },
  { lat: 14.6100253, lng: 121.0788662 },
  { lat: 14.6099745, lng: 121.0789266 },
  { lat: 14.6099099, lng: 121.0789839 },
  { lat: 14.6098052, lng: 121.0790809 },
  { lat: 14.6097498, lng: 121.0791111 },
  { lat: 14.6096775, lng: 121.0791556 },
  { lat: 14.6095975, lng: 121.0791938 },
  { lat: 14.609522, lng: 121.0792256 },
  { lat: 14.6094482, lng: 121.0792511 },
  { lat: 14.6093943, lng: 121.0792845 },
  { lat: 14.609322, lng: 121.0793417 },
  { lat: 14.6092558, lng: 121.0794069 },
  { lat: 14.6091465, lng: 121.0795024 },
  { lat: 14.6090542, lng: 121.0795978 },
  { lat: 14.6090188, lng: 121.0796344 },
  { lat: 14.6089757, lng: 121.0796646 },
  { lat: 14.6089172, lng: 121.0797091 },
  { lat: 14.6088618, lng: 121.0797616 },
  { lat: 14.6088248, lng: 121.0798109 },
  { lat: 14.6087617, lng: 121.0798889 },
  { lat: 14.6086909, lng: 121.07997 },
  { lat: 14.6086494, lng: 121.0800256 },
  { lat: 14.6086124, lng: 121.0800718 },
  { lat: 14.6085786, lng: 121.0801147 },
  { lat: 14.6085386, lng: 121.0801577 },
  { lat: 14.6085016, lng: 121.080199 },
  { lat: 14.608457, lng: 121.080234 },
  { lat: 14.6084, lng: 121.0802547 },
  { lat: 14.6083308, lng: 121.0802595 },
  { lat: 14.6082554, lng: 121.0802547 },
  { lat: 14.6081923, lng: 121.0802372 },
  { lat: 14.6081646, lng: 121.0802181 },
  { lat: 14.6081369, lng: 121.080199 },
  { lat: 14.6081107, lng: 121.0801736 },
  { lat: 14.6080768, lng: 121.0801115 },
  { lat: 14.6080085, lng: 121.0799688 },
  { lat: 14.6079715, lng: 121.0798893 },
  { lat: 14.6078976, lng: 121.0797414 },
  { lat: 14.6078592, lng: 121.0796555 },
  { lat: 14.6078222, lng: 121.0795871 },
  { lat: 14.6078084, lng: 121.0795585 },
  { lat: 14.607793, lng: 121.079533 },
  { lat: 14.6077637, lng: 121.0795346 },
  { lat: 14.6077376, lng: 121.0795474 },
  { lat: 14.6077114, lng: 121.0795633 },
  { lat: 14.6077145, lng: 121.0795919 },
  { lat: 14.6077468, lng: 121.0796714 },
  { lat: 14.6077791, lng: 121.0797255 },
  { lat: 14.607893, lng: 121.0799609 },
  { lat: 14.6079207, lng: 121.0800197 },
  { lat: 14.607953, lng: 121.0800786 },
  { lat: 14.6079684, lng: 121.0801136 },
  { lat: 14.6079854, lng: 121.0801374 },
  { lat: 14.6080331, lng: 121.0802249 },
  { lat: 14.6080469, lng: 121.080252 },
  { lat: 14.6080392, lng: 121.0802933 },
  { lat: 14.6080285, lng: 121.0803378 },
  { lat: 14.6080285, lng: 121.0803808 },
  { lat: 14.6080454, lng: 121.0804349 },
  { lat: 14.6080731, lng: 121.0805096 },
  { lat: 14.6081023, lng: 121.0805653 },
  { lat: 14.6081377, lng: 121.0806225 },
  { lat: 14.6081793, lng: 121.0806734 },
  { lat: 14.6082239, lng: 121.0807323 },
  { lat: 14.6082809, lng: 121.0807927 },
  { lat: 14.6083317, lng: 121.0808436 },
  { lat: 14.6083963, lng: 121.0809168 },
  { lat: 14.6084594, lng: 121.0809709 },
  { lat: 14.608484, lng: 121.0809979 },
  { lat: 14.6084979, lng: 121.0810218 },
  { lat: 14.6085317, lng: 121.0810806 },
  { lat: 14.6085487, lng: 121.0811077 },
  { lat: 14.6085702, lng: 121.0811442 },
  { lat: 14.6086025, lng: 121.0811808 },
  { lat: 14.6086333, lng: 121.0812142 },
  { lat: 14.6086749, lng: 121.0812556 },
  { lat: 14.6087688, lng: 121.0813558 },
  { lat: 14.6088134, lng: 121.0813987 },
  { lat: 14.6088473, lng: 121.0814321 },
  { lat: 14.6088888, lng: 121.0814814 },
  { lat: 14.6089119, lng: 121.0815037 },
  { lat: 14.6089334, lng: 121.0815323 },
  { lat: 14.608955, lng: 121.0815498 },
  { lat: 14.6089642, lng: 121.0815689 },
  { lat: 14.6089688, lng: 121.0815832 },
  { lat: 14.6089535, lng: 121.0816055 },
  { lat: 14.6089104, lng: 121.0816484 },
  { lat: 14.6088673, lng: 121.0816993 },
  { lat: 14.6088088, lng: 121.0817693 },
  { lat: 14.6087303, lng: 121.0818616 },
  { lat: 14.6086949, lng: 121.0819029 },
  { lat: 14.6086749, lng: 121.081922 },
  { lat: 14.6086641, lng: 121.0819252 },
  { lat: 14.6086379, lng: 121.0819029 },
  { lat: 14.6085702, lng: 121.0818313 },
  { lat: 14.6085164, lng: 121.0817757 },
  { lat: 14.6084748, lng: 121.0817359 },
  { lat: 14.6084255, lng: 121.0816818 },
  { lat: 14.6084086, lng: 121.0816675 },
  { lat: 14.6083886, lng: 121.081658 },
  { lat: 14.6083686, lng: 121.0816739 },
  { lat: 14.608304, lng: 121.0817423 },
  { lat: 14.6082593, lng: 121.0817948 },
  { lat: 14.6081824, lng: 121.0818822 },
  { lat: 14.6081316, lng: 121.0819315 },
  { lat: 14.6080946, lng: 121.0819793 },
  { lat: 14.6080531, lng: 121.082027 },
  { lat: 14.6079992, lng: 121.0820826 },
  { lat: 14.6079592, lng: 121.0821304 },
  { lat: 14.607913, lng: 121.082159 },
  { lat: 14.6078622, lng: 121.082159 },
  { lat: 14.6077991, lng: 121.0821463 },
  { lat: 14.6077114, lng: 121.0821256 },
  { lat: 14.6076144, lng: 121.0821033 },
  { lat: 14.6074528, lng: 121.0820636 },
  { lat: 14.6073574, lng: 121.0820365 },
  { lat: 14.6072897, lng: 121.0820063 },
  { lat: 14.6072712, lng: 121.0819697 },
  { lat: 14.6072805, lng: 121.0819379 },
  { lat: 14.6073143, lng: 121.0819093 },
  { lat: 14.6073759, lng: 121.0818472 },
  { lat: 14.6075375, lng: 121.081693 },
  { lat: 14.6077406, lng: 121.0814894 },
  { lat: 14.6078299, lng: 121.0814003 },
  { lat: 14.6079146, lng: 121.0813319 },
  { lat: 14.60807, lng: 121.0812604 },
  { lat: 14.6081993, lng: 121.0812079 },
  { lat: 14.6083147, lng: 121.0811252 },
  { lat: 14.6083932, lng: 121.0810536 },
  { lat: 14.6084702, lng: 121.0809566 },
  { lat: 14.6085902, lng: 121.0808389 },
  { lat: 14.6086487, lng: 121.080788 },
  { lat: 14.6086964, lng: 121.0807418 },
  { lat: 14.6087149, lng: 121.0807228 },
  { lat: 14.6087149, lng: 121.0806878 },
  { lat: 14.6086995, lng: 121.0806687 },
  { lat: 14.6086426, lng: 121.0805844 },
  { lat: 14.608581, lng: 121.0804842 },
  { lat: 14.608501, lng: 121.080376 },
  { lat: 14.6084871, lng: 121.080349 },
  { lat: 14.6084748, lng: 121.0803156 },
  { lat: 14.6084948, lng: 121.080287 },
  { lat: 14.6085641, lng: 121.0802456 },
  { lat: 14.6086056, lng: 121.0801931 },
  { lat: 14.6087103, lng: 121.0800563 },
  { lat: 14.6087703, lng: 121.0799848 },
  { lat: 14.6088195, lng: 121.0799195 },
  { lat: 14.6088426, lng: 121.0798893 },
  { lat: 14.6088827, lng: 121.0798782 },
  { lat: 14.6089488, lng: 121.0798702 },
  { lat: 14.6090042, lng: 121.0798861 },
  { lat: 14.6090535, lng: 121.0799116 },
  { lat: 14.6091043, lng: 121.0799641 },
  { lat: 14.6092105, lng: 121.0800627 },
  { lat: 14.609289, lng: 121.080139 },
  { lat: 14.6093521, lng: 121.080209 },
  { lat: 14.6094752, lng: 121.0803506 },
  { lat: 14.6095383, lng: 121.0804174 },
  { lat: 14.6095891, lng: 121.0804603 },
  { lat: 14.6096533, lng: 121.0805155 },
  { lat: 14.6097471, lng: 121.0805791 },
  { lat: 14.6098195, lng: 121.0806252 },
  { lat: 14.6098995, lng: 121.0806666 },
  { lat: 14.6100026, lng: 121.0806889 },
  { lat: 14.6101073, lng: 121.0807064 },
  { lat: 14.610215, lng: 121.0807191 },
  { lat: 14.6103305, lng: 121.0807032 },
  { lat: 14.6104613, lng: 121.0806761 },
  { lat: 14.6105459, lng: 121.0806459 },
  { lat: 14.6106506, lng: 121.080595 },
  { lat: 14.6107352, lng: 121.0805489 },
  { lat: 14.610806, lng: 121.08049 },
  { lat: 14.6108291, lng: 121.080463 }
  
];

const stops: Stop[] = [ 
  { id: 'mall', name: 'Eastwood Mall', point: { lat: 14.610888851729573, lng: 121.08040434520468 }, order: 1 },
  { id: 'icite', name: 'ICite', point: { lat: 14.611093712112242, lng: 121.08008957101995 }, order: 2 },
  { id: 'oneorchardroad', name: 'One Orchard Road', point: { lat: 14.610715234693878, lng: 121.07896362425085 }, order: 3 },
  { id: 'grandeastwoodpalazzo', name: 'Grand Eastwood Palazzo', point: { lat: 14.610028312059972, lng: 121.07882523245505 }, order: 4 },
  { id: 'lafayette', name: 'The Eastwood Lafayette', point: { lat: 14.609173153090268, lng: 121.07946425703243 }, order: 5},
  { id: 'oneeastwoodavetower', name: 'One Eastwood Ave. Tower', point: { lat: 14.60768079979356, lng: 121.07930646614234 }, order: 6},
  { id: 'ibmplaza', name: 'IBM Plaza', point: { lat: 14.607761263732801, lng: 121.07966178121687 }, order: 7},
  { id: 'globalone', name: 'Global One', point: { lat: 14.608603164198367, lng: 121.08116521756972 }, order: 8},
  { id: 'legrand1', name: 'Le Grand 1', point: { lat: 14.608245219268778, lng: 121.08178987938021 }, order: 9},
  { id: 'legrand2', name: 'Le Grand 2', point: { lat: 14.60755122322992, lng: 121.08207073588305 }, order: 10},
  { id: 'barkpark', name: 'Bark Park', point: { lat:  14.60805772446907, lng: 121.0812887473711 }, order: 11},
  { id: 'mcdonalds', name: 'McDonalds', point: { lat:  14.608787496292907, lng: 121.07998101366094 }, order: 12},
  { id: 'showroom', name: 'Citywalk Showroow', point: { lat:  14.60975242680383, lng: 121.08058831667678 }, order: 13},

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
