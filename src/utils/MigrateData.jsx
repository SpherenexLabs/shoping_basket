import React, { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { database } from '../firebase/firebase';

/**
 * Data Migration Utility Component
 * 
 * Instructions:
 * 1. Export your old Firebase data as JSON from Firebase Console:
 *    - Go to your OLD Firebase project
 *    - Realtime Database > Data tab
 *    - Click the three dots (...) on Shopping_Basket
 *    - Select "Export JSON"
 * 
 * 2. Paste the exported JSON in the textarea below
 * 3. Click "Import Data to New Firebase"
 * 
 * This will migrate:
 * - Products
 * - Users
 * - Orders
 * - Carts
 * - Customer ID Counter
 */

const MigrateData = ({ onClose }) => {
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleImport = async () => {
    setError('');
    setStatus('');
    setLoading(true);

    try {
      // Parse the JSON
      const data = JSON.parse(jsonData);
      
      if (!data) {
        throw new Error('Invalid JSON data');
      }

      setStatus('Starting migration...');

      // Import each section
      const sections = ['products', 'users', 'orders', 'carts', 'customerIdCounter'];
      let imported = 0;

      for (const section of sections) {
        if (data[section]) {
          setStatus(`Importing ${section}...`);
          const sectionRef = ref(database, `Shopping_Basket/${section}`);
          await set(sectionRef, data[section]);
          imported++;
          setStatus(`✓ Imported ${section} (${imported}/${sections.length})`);
        }
      }

      setStatus(`✅ Migration complete! Imported ${imported} sections.`);
      alert('Data migration successful!');

    } catch (err) {
      console.error('Migration error:', err);
      setError(`Migration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setStatus('Testing connection...');
    try {
      const testRef = ref(database, 'Shopping_Basket');
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        setStatus('✓ Connected! Current data found in new Firebase.');
      } else {
        setStatus('✓ Connected! New Firebase is ready (currently empty).');
      }
    } catch (err) {
      setError(`Connection failed: ${err.message}`);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2>🔄 Firebase Data Migration</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.content}>
          <div style={styles.instructions}>
            <h3>Instructions:</h3>
            <ol>
              <li>Go to your OLD Firebase Console</li>
              <li>Navigate to Realtime Database → Data</li>
              <li>Find "Shopping_Basket" node</li>
              <li>Click three dots (...) → Export JSON</li>
              <li>Copy the entire JSON content</li>
              <li>Paste it below and click Import</li>
            </ol>
          </div>

          <button onClick={handleTestConnection} style={styles.testBtn}>
            🔌 Test New Firebase Connection
          </button>

          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            placeholder='Paste your exported JSON here, e.g.:
{
  "products": { ... },
  "users": { ... },
  "orders": { ... }
}'
            style={styles.textarea}
          />

          {status && (
            <div style={styles.status}>{status}</div>
          )}

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <div style={styles.actions}>
            <button 
              onClick={handleImport} 
              disabled={loading || !jsonData.trim()}
              style={{
                ...styles.importBtn,
                opacity: loading || !jsonData.trim() ? 0.5 : 1
              }}
            >
              {loading ? '⏳ Importing...' : '📥 Import Data to New Firebase'}
            </button>
          </div>

          <div style={styles.warning}>
            ⚠️ Warning: This will overwrite existing data in the new Firebase!
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  container: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #e5e7eb',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '12px 12px 0 0'
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  content: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  },
  instructions: {
    background: '#f0f9ff',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #0ea5e9'
  },
  testBtn: {
    width: '100%',
    padding: '12px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '16px',
    fontWeight: '600'
  },
  textarea: {
    width: '100%',
    minHeight: '250px',
    padding: '12px',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    resize: 'vertical',
    marginBottom: '16px'
  },
  status: {
    padding: '12px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    marginBottom: '16px',
    fontWeight: '500'
  },
  error: {
    padding: '12px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '16px',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  },
  importBtn: {
    flex: 1,
    padding: '14px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  warning: {
    padding: '12px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '8px',
    fontSize: '0.875rem',
    textAlign: 'center',
    fontWeight: '500'
  }
};

export default MigrateData;
