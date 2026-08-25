import { useRef, useState } from 'react';
import L from 'leaflet';

const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/* 일반지도 ↔ 항공지도 전환. getMap()으로 Leaflet map 인스턴스를 받아
   페이지가 초기화한 OSM 타일을 일반지도로 삼고, 위성 타일과 교체한다. */
export default function MapTypeToggle({ getMap }) {
  const [mode, setMode] = useState('normal');
  const layersRef = useRef(null);

  const apply = (m) => {
    const map = getMap();
    if (!map) return;
    if (!layersRef.current) {
      let normal = null;
      map.eachLayer((l) => { if (!normal && l instanceof L.TileLayer) normal = l; });
      layersRef.current = {
        normal,
        satellite: L.tileLayer(SATELLITE_URL, { maxZoom: 19, attribution: 'Tiles &copy; Esri' }),
      };
    }
    const { normal, satellite } = layersRef.current;
    const show = m === 'satellite' ? satellite : normal;
    const hide = m === 'satellite' ? normal : satellite;
    if (hide && map.hasLayer(hide)) map.removeLayer(hide);
    if (show && !map.hasLayer(show)) { show.addTo(map); show.bringToBack(); }
    setMode(m);
  };

  return (
    <div className="map-type">
      <button type="button" className={mode === 'normal' ? 'is-active' : ''} onClick={() => apply('normal')}>일반지도</button>
      <button type="button" className={mode === 'satellite' ? 'is-active' : ''} onClick={() => apply('satellite')}>항공지도</button>
    </div>
  );
}
