'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Technician {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  color: string;
}

interface MapViewProps {
  technicians: Technician[];
}

export default function MapView({ technicians }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Initialize map centered on Ho Chi Minh City
    const map = L.map(mapContainer.current).setView([10.7769, 106.7009], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    // Add markers for technicians
    technicians.forEach((tech) => {
      const markerColor = tech.status === 'critical' ? '#ef4444' : 
                          tech.status === 'available' ? '#22c55e' : '#3b82f6';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background-color: ${markerColor};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <span style="color: white; font-weight: bold; font-size: 12px;">${tech.id}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([tech.lat, tech.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${tech.name}</strong><br/>
          <span style="color: ${markerColor}; font-weight: 600; text-transform: uppercase;">
            ${tech.status}
          </span>
        </div>
      `);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [technicians]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}
