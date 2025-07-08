import React, { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, Minus, RefreshCw, AlertCircle } from 'lucide-react';
import { Expand } from "@theme-toggles/react"
import "@theme-toggles/react/css/Expand.css"
import './App.css';
import './colors.css';

const GuestListApp = () => {
  // Hardcoded configuration for multiple sheets
  const config = {
    apiKey: 'AIzaSyBznPdPx9WzYgsQshVm4CYcmWwNklrM4s8',
    spreadsheetId: '1A75oXM5vcQWCVNgohoLETsICqEvwWtzGGxCu1rUBCtc',
    sheets: [
      { name: 'Muresan', range: 'Muresan!A:H' },
      { name: 'Pop', range: 'Pop!A:H' },
      { name: 'Comun', range: 'Comun!A:H' }
    ]
  };

  // Data and loading states
  const [allData, setAllData] = useState({}); // Store data for each sheet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All'); // Current filter
  const [darkMode, setDarkMode] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
  function updateCountdown() {
    const targetDate = new Date('August 10, 2025').getTime();
    const now = new Date().getTime();
    const days = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
    
    setDaysLeft(days > 0 ? days : 0);
  }

  updateCountdown();
  const interval = setInterval(updateCountdown, 60000);
  
  return () => clearInterval(interval);
}, []);

  const toggleDarkMode = () => {
  setDarkMode(prev => !prev);
};

  // Sample data for each sheet (fallback when no Google Sheets connection)
  const sampleData = [
    
  ];

  // Sorting states: 0 = none, 1 = ascending, 2 = descending
  const [sortStates, setSortStates] = useState({
    nume: 0,
    prenume: 0,
    invitati: 0,
    confirmare: 0
  });

  // Initialize with sample data
  useEffect(() => {
    if (Object.keys(allData).length === 0) {
      setAllData(sampleData);
    }
  }, []);

  // Function to parse Google Sheets data
  const parseSheetData = (values, sheetName) => {
    if (!values || values.length <= 1) return [];
    
    const [headers, ...rows] = values;
    return rows
      .filter(row => row[0] || row[1]) // Filter out rows where BOTH Nume AND Prenume are missing/empty
      .map((row, index) => ({
        id: `${sheetName}_${index + 1}`,
        nume: row[0] || '',
        prenume: row[1] || '',
        invitati: row[2] === 'TRUE' || row[2] === true,
        confirmare: row[3] || '',
        provenienta: row[4] || '',
        sheet: sheetName
      }));
  };

  // Function to fetch data from all Google Sheets
  const fetchAllSheetsData = async () => {
    setLoading(true);
    setError('');

    try {
      const promises = config.sheets.map(async (sheet) => {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${sheet.range}?key=${config.apiKey}`;
        console.log(`Fetching ${sheet.name} from URL:`, url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`API Error Response for ${sheet.name}:`, errorData);
          
          let errorMessage = `HTTP ${response.status} pentru ${sheet.name}`;
          if (errorData.error?.message) {
            errorMessage += `: ${errorData.error.message}`;
          }
          
          // Specific error messages for common issues
          if (response.status === 400) {
            if (errorData.error?.message?.includes('Unable to parse range')) {
              errorMessage = `Range-ul pentru ${sheet.name} este invalid. Verifică că sheet-ul există și range-ul A:H este corect.`;
            } else if (errorData.error?.message?.includes('API key not valid')) {
              errorMessage = 'API Key invalid. Verifică că ai introdus API Key-ul corect.';
            } else {
              errorMessage = `Cerere invalidă pentru ${sheet.name}. Verifică API Key-ul, Spreadsheet ID-ul și că sheet-ul este public.`;
            }
          } else if (response.status === 403) {
            errorMessage = `Acces interzis pentru ${sheet.name}. Verifică că Google Sheets API este activat și sheet-ul este public.`;
          } else if (response.status === 404) {
            errorMessage = `Sheet-ul ${sheet.name} nu a fost găsit. Verifică numele sheet-ului.`;
          }
          
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log(`API Response for ${sheet.name}:`, result);
        
        return {
          sheetName: sheet.name,
          data: parseSheetData(result.values, sheet.name)
        };
      });

      const results = await Promise.all(promises);
      
      // Organize data by sheet
      const newAllData = {};
      results.forEach(result => {
        newAllData[result.sheetName] = result.data;
      });
      
      setAllData(newAllData);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError('Eroare: ' + err.message);
      console.error('Error fetching sheets data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered data based on active filter
  const getFilteredData = () => {
    if (activeFilter === 'All') {
      // Combine all sheets data
      return Object.values(allData).flat();
    } else {
      // Return data for specific sheet
      return allData[activeFilter] || [];
    }
  };

  const getSortIcon = (column) => {
    const state = sortStates[column];
    
    if (state === 1) {
      return (
        <ChevronUp 
          className="sort-icon chevron-up" 
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'center'
          }}
        />
      );
    }
    
    if (state === 2) {
      return (
        <ChevronDown 
          className="sort-icon chevron-down"
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'center'
          }}
        />
      );
    }
    
    return (
      <Minus 
        className="sort-icon minus"
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'center'
        }}
      />
    );
  };

  // Enhanced handleSort with smoother state transitions
  const handleSort = (column) => {
    setSortStates(prev => {
      const newState = (prev[column] + 1) % 3;
      
      // Add a brief delay for visual feedback
      const button = document.querySelector(`[data-sort="${column}"]`);
      if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
          button.style.transform = '';
        }, 100);
      }
      
      return {
        ...prev,
        [column]: newState
      };
    });
  };

  const sortedData = useMemo(() => {
    let result = [...getFilteredData()];
    
    // Apply sorting for each column that has an active sort
    Object.entries(sortStates).forEach(([column, state]) => {
      if (state === 0) return; // No sorting
      
      result.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        // Special handling for different column types
        if (column === 'invitati') {
          aVal = aVal ? 1 : 0;
          bVal = bVal ? 1 : 0;
        } else if (column === 'confirmare') {
          const order = { 'Confirmat': 1, 'In asteptare': 2, 'Nu participa': 3 };
          aVal = order[aVal] || 999;
          bVal = order[bVal] || 999;
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        
        return state === 1 ? comparison : -comparison;
      });
    });
    
    return result;
  }, [allData, activeFilter, sortStates]);

  // Calculate totals for current filter
  const currentData = getFilteredData();
  const totalGuests = currentData.length;
  const confirmedGuests = currentData.filter(p => p.confirmare === 'Confirmat').length;

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="content-wrapper">
        {/* Main Table */}
        <div className="table-container">
          <div className="table-header">
            <div>
              <h1 className="table-title">
                Nunta Anului
                <div className="theme-toggle-container">
                  <Expand 
                    duration={750} 
                    toggled={darkMode}
                    toggle={toggleDarkMode}
                    className='dark-mode-toggle'
                  />
                  <span className="tooltip">Toggle Theme</span>
                </div>
              </h1>
              <p className="table-subtitle">Sortare invitați</p>
            </div>
            <div className="header-controls">

              {lastUpdated && (
                <span className="last-updated">
                  Ultima actualizare: {lastUpdated.toLocaleTimeString()}
                </span>
              )}

              <button
                onClick={fetchAllSheetsData}
                disabled={loading}
                className={`refresh-button ${loading ? 'loading' : ''}`}
              >
                <RefreshCw className={`refresh-icon ${loading ? 'spinning' : ''}`} />
                {loading ? 'Se încarcă...' : 'Actualizează Date'}
              </button>

            </div>
          </div>

          {/* Filter Buttons */}
          <div className="filter-buttons">
            <div className="filter-buttons-left">
              {['All', 'Muresan', 'Pop', 'Comun'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              <AlertCircle className="error-icon" />
              {error}
            </div>
          )}
          
          <div className="table-stats">
            <div className="stats-row">
              <span>Total invitați ({activeFilter}): {totalGuests}</span>
              <span>Confirmați: {confirmedGuests}</span>
            </div>
          </div>
          
          <div className="table-wrapper">
            <table className="guest-table">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell">
                    Nr
                  </th>
                  <th className="table-header-cell sortable">
                    <button
                      onClick={() => handleSort('nume')}
                      className={`sort-button ${sortStates.nume > 0 ? 'active' : ''}`}
                    >
                      Nume
                      {getSortIcon('nume')}
                    </button>
                  </th>
                  <th className="table-header-cell sortable">
                    <button
                      onClick={() => handleSort('prenume')}
                      className={`sort-button ${sortStates.prenume > 0 ? 'active' : ''}`}
                    >
                      Prenume
                      {getSortIcon('prenume')}
                    </button>
                  </th>
                  <th className="table-header-cell sortable">
                    <button
                      onClick={() => handleSort('invitati')}
                      className={`sort-button ${sortStates.invitati > 0 ? 'active' : ''}`}
                    >
                      Invitați
                      {getSortIcon('invitati')}
                    </button>
                  </th>
                  <th className="table-header-cell sortable">
                    <button
                      onClick={() => handleSort('confirmare')}
                      className={`sort-button ${sortStates.confirmare > 0 ? 'active' : ''}`}
                    >
                      Confirmare
                      {getSortIcon('confirmare')}
                    </button>
                  </th>
                  <th className="table-header-cell">
                    Proveniența
                  </th>
                  <th className="table-header-cell last">
                    Sheet
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((person, index) => (
                  <tr key={person.id} className={index % 2 === 0 ? 'table-row' : 'table-row alternate'}>
                    <td className="table-cell number-cell">
                      {index + 1}
                    </td>
                    <td className="table-cell name-cell">
                      {person.nume}
                    </td>
                    <td className="table-cell">
                      {person.prenume}
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${person.invitati ? 'invited' : 'not-invited'}`}>
                        {person.invitati ? 'Da' : 'Nu'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${
                        person.confirmare === 'Confirmat' ? 'confirmed' :
                        person.confirmare === 'In asteptare' ? 'pending' : 'declined'
                      }`}>
                        {person.confirmare}
                      </span>
                    </td>
                    <td className="table-cell">
                      {person.provenienta}
                    </td>
                    <td className="table-cell">
                      <span className={`sheet-badge sheet-${person.sheet.toLowerCase()}`}>
                        {person.sheet}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <footer>
              <div className="countdown-display">{daysLeft}</div>
              <div className="countdown-label">days left</div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestListApp;