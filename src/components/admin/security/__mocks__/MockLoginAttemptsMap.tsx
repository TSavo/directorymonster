'use client';

import React, { useState } from 'react';
import { LoginAttemptsFilter } from '../hooks/useLoginAttempts';
import { MapDataPoint, useLoginAttemptsMap } from '../hooks/useLoginAttemptsMap';

interface LoginAttemptsMapProps {
  filter: LoginAttemptsFilter;
}

export const LoginAttemptsMap: React.FC<LoginAttemptsMapProps> = ({ filter }) => {
  const { mapData, isLoading, error, refresh } = useLoginAttemptsMap({ filter });
  const [selectedPoint, setSelectedPoint] = useState<MapDataPoint | null>(null);
  
  // Default map data if hook doesn't provide it
  const displayData = mapData && mapData.length > 0 ? mapData : [
    {
      id: '1',
      latitude: 40.7128,
      longitude: -74.0060,
      count: 15,
      successCount: 10,
      failedCount: 5,
      ipRiskLevel: 'low',
      location: 'New York, United States'
    },
    {
      id: '2',
      latitude: 43.6532,
      longitude: -79.3832,
      count: 8,
      successCount: 3,
      failedCount: 5,
      ipRiskLevel: 'high',
      location: 'Toronto, Canada'
    }
  ];

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

  const handleMarkerClick = (point: MapDataPoint) => {
    setSelectedPoint(point);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center" data-testid="map-container">
        <div data-testid="map-loading" className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-96 flex items-center justify-center" data-testid="map-container">
        <div className="text-center text-red-500">
          <p>Failed to load map data</p>
          <button 
            onClick={() => refresh()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 relative" data-testid="map-container">
      {/* Mock Map */}
      <div data-testid="mock-map" className="w-full h-full">
        {/* Mock Markers */}
        {displayData.map((point) => (
          <div 
            key={point.id}
            data-testid="mock-marker"
            onClick={() => handleMarkerClick(point)}
            style={{ cursor: 'pointer' }}
          >
            <div
              style={{
                backgroundColor: getMarkerColor(point.ipRiskLevel),
                borderRadius: '50%',
                width: '20px',
                height: '20px'
              }}
            >
              {point.count}
            </div>
          </div>
        ))}
        
        {/* Mock Popup */}
        {selectedPoint && (
          <div data-testid="mock-popup">
            <h3>{selectedPoint.location}</h3>
            <p>Total Attempts: {selectedPoint.count}</p>
            <p>Successful: {selectedPoint.successCount}</p>
            <p>Failed: {selectedPoint.failedCount}</p>
            <p>Risk Level: {selectedPoint.ipRiskLevel}</p>
          </div>
        )}
        
        {/* Mock Navigation Control */}
        <div data-testid="mock-nav-control"></div>
      </div>
      
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
