"use client";

import { useState } from "react";
import { Database, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function StorageSetupButton() {
  const [isSetup, setIsSetup] = useState(false);
  const [status, setStatus] = useState<string>("");

  const setupStorage = async () => {
    setIsSetup(true);
    setStatus("Setting up storage buckets...");

    try {
      const response = await fetch("/api/setup-storage", {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(`✓ Storage setup completed! Created buckets: ${result.buckets.join(", ")}`);
      } else {
        setStatus(`✗ Setup failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Storage setup failed:", error);
      setStatus("✗ Storage setup failed");
    } finally {
      setIsSetup(false);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  return (
    <div className="storage-setup">
      <button
        onClick={setupStorage}
        disabled={isSetup}
        className="setup-button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: isSetup ? '#f0f0f0' : '#28a745',
          color: isSetup ? '#666' : 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isSetup ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        {isSetup ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Database size={18} />
        )}
        {isSetup ? "Setting up..." : "Setup Supabase Storage"}
      </button>
      {status && (
        <div style={{ 
          marginTop: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          backgroundColor: status.startsWith('✓') ? '#d4edda' : '#f8d7da',
          color: status.startsWith('✓') ? '#155724' : '#721c24',
          border: status.startsWith('✓') ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        }}>
          {status.startsWith('✓') ? (
            <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
          ) : status.startsWith('✗') ? (
            <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
          ) : null}
          {status}
        </div>
      )}
    </div>
  );
}