'use client';

import React, { useState, useRef, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { useLoginAttemptsMap } from './hooks/useLoginAttemptsMap';
import { LoginAttemptsFilter } from './hooks/useLoginAttempts';
import { MapDataPoint } from './hooks/useLoginAttemptsMap';

interface LoginAttemptsMapProps {
  filter: LoginAttemptsFilter;
}

export const LoginAttemptsMap: React.FC<LoginAttemptsMapProps> = ({ filter }) => {
  const { mapData, isLoading, error, refresh } = useLoginAttemptsMap({ filter });
  const [selectedPoint, setSelectedPoint] = useState<MapDataPoint | null>(null);
  
  // Default viewport centered on world map
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.5
  });

  const mapRef = useRef(null);

  const getMarkerSize = (count: number) => {
    if (count < 5) return 15;
    if (count < 20) return 20;
    if (count < 50) return 25;
    return 30;
  };

  const getMarkerColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return '#10B981'; // green
      case 'medium':
        return '#F59E0B'; // yellow
      case 'high':
        return '#F97316'; // orange
      case 'critical':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  };

  const handleMarkerClick = useCallback((event: React.MouseEvent, point: MapDataPoint) => {
    event.stopPropagation();
    setSelectedPoint(point);
  }, []);

  if (isLoading && mapData.length === 0) {
    return (
      <div className="animate-pulse h-96" data-testid="map-loading">
        <div className="h-full bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error.message}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-96 relative">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}
        ref={mapRef}
        style={{ width: '100%', height: '100%', borderRadius: '0.375rem' }}
      >
        <NavigationControl position="top-right" />
        
        {mapData.map((point) => (
          <Marker
            key={point.id}
            longitude={point.longitude}
            latitude={point.latitude}
            anchor="center"
            onClick={(e) => handleMarkerClick(e, point)}
          >
            <div
              style={{
                width: getMarkerSize(point.count),
                height: getMarkerSize(point.count),
                backgroundColor: getMarkerColor(point.ipRiskLevel),
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: point.count < 10 ? '10px' : '12px',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer'
              }}
            >
              {point.count}
            </div>
          </Marker>
        ))}
        
        {selectedPoint && (
          <Popup
            longitude={selectedPoint.longitude}
            latitude={selectedPoint.latitude}
            anchor="bottom"
            onClose={() => setSelectedPoint(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-1">{selectedPoint.location}</h3>
              <p className="text-xs text-gray-600 mb-1">Total Attempts: {selectedPoint.count}</p>
              <p className="text-xs text-gray-600 mb-1">Successful: {selectedPoint.successCount}</p>
              <p className="text-xs text-gray-600 mb-1">Failed: {selectedPoint.failedCount}</p>
              <p className="text-xs text-gray-600">
                Risk Level: 
                <span 
                  className="ml-1 font-semibold"
                  style={{ color: getMarkerColor(selectedPoint.ipRiskLevel) }}
                >
                  {selectedPoint.ipRiskLevel.charAt(0).toUpperCase() + selectedPoint.ipRiskLevel.slice(1)}
                </span>
              </p>
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Map Legend */}
      <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow-md text-xs">
        <div className="font-semibold mb-1">Risk Level</div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getMarkerColor('low') }}></div>
          <span>Low</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getMarkerColor('medium') }}></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getMarkerColor('high') }}></div>
          <span>High</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getMarkerColor('critical') }}></div>
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
};
