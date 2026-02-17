import React, { useState, useEffect } from 'react';
import { fetchEnvironmentStatus as fetchStatus } from '../services/environmentService';
import './components.css';

/**
 * EnvironmentStatus Component
 * 
 * Displays the operational status of API environments.
 * Fetches status from API on mount and auto-refreshes every 60 seconds.
 * 
 * Requirements: 5.2, 5.4, 5.5
 */
function EnvironmentStatus() {
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch environment status from API
  const fetchEnvironmentStatus = async () => {
    try {
      const data = await fetchStatus();
      setEnvironments(data.environments || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching environment status:', err);
      
      // Handle network errors specifically
      if (!err.response) {
        setError('Unable to connect to server. Please check your connection and ensure the backend is running.');
      } else if (err.response.status >= 500) {
        setError('Server error occurred. Please try again later.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch environment status');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchEnvironmentStatus();

    // Set up auto-refresh every 60 seconds
    const intervalId = setInterval(() => {
      fetchEnvironmentStatus();
    }, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) {
      return `${diffSecs} seconds ago`;
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading environment status...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="alert alert-error">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  // No environments configured
  if (environments.length === 0) {
    return (
      <div className="alert alert-info">
        No environments configured for monitoring.
      </div>
    );
  }

  // Display environments
  return (
    <div className="environment-status">
      <div className="environment-list">
        {environments.map((env, index) => (
          <div key={index} className="environment-item">
            <div className="environment-header">
              <h3 className="environment-name">{env.name}</h3>
              <span className={`status-badge ${env.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                {env.status === 'active' ? '● Active' : '● Inactive'}
              </span>
            </div>
            <div className="environment-footer">
              <span className="environment-timestamp">
                Last checked: {formatTimestamp(env.lastChecked)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EnvironmentStatus;
