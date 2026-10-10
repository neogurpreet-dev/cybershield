import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
}

interface Props {
  center: { lat: number; lng: number } | null;
  accuracy?: number | null;
  markers?: MapMarker[];
  height?: number;
  zoom?: number;
}

/** OpenStreetMap via Leaflet. Free, no API key. Uses vector circles (no image assets). */
export const LeafletMap: React.FC<Props> = ({ center, accuracy, markers = [], height = 280, zoom = 15 }) => {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const centred = useRef(false);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([20.59, 78.96], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    markers.forEach((mk) =>
      L.circleMarker([mk.lat, mk.lng], { radius: 7, color: '#fff', weight: 2, fillColor: mk.color, fillOpacity: 1 }).bindPopup(mk.label).addTo(g)
    );
    if (center) {
      if (accuracy && accuracy > 30) L.circle([center.lat, center.lng], { radius: accuracy, color: '#0284c7', weight: 1, fillOpacity: 0.08 }).addTo(g);
      L.circleMarker([center.lat, center.lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#0284c7', fillOpacity: 1 }).bindPopup('You are here').addTo(g);
      if (!centred.current) {
        m.setView([center.lat, center.lng], accuracy && accuracy > 2000 ? 12 : zoom);
        centred.current = true;
      } else {
        m.panTo([center.lat, center.lng]);
      }
    }
  }, [center?.lat, center?.lng, accuracy, markers, zoom]);

  return <div ref={el} style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 z-0" role="region" aria-label="Map" />;
};
