import React, { useState, useRef } from 'react';
import { submitNameChange, NameChangeResponse } from '../services/nameChangeService';

interface NameChangeFormProps {
  onComplete: (requestId: string) => void;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

const DOCUMENT_TYPES = [
  { value: '', label: 'Select document type…' },
  { value: 'MARRIAGE_CERTIFICATE', label: 'Marriage Certificate' },
  { value: 'DIVORCE_DECREE', label: 'Divorce Decree' },
  { value: 'COURT_ORDER', label: 'Court Order' },
  { value: 'GOVERNMENT_ID', label: 'Updated Government ID' },
  { value: 'SOCIAL_SECURITY_CARD', label: 'Social Security Card' },
];

// POC defaults — in production these would come from the authenticated user session
const DEFAULT_EMPLOYEE_ID = 'emp-001';
const DEFAULT_PREVIOUS_NAME = 'Jane Smith';

export const NameChangeForm: React.FC<NameChangeFormProps> = ({ onComplete }) => {
  const [newLastName, setNewLastName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>('idle');
  const [result, setResult] = useState<NameChangeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected && selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLastName.trim() || !documentType || !file) return;

    setFormState('loading');
    setErrorMessage('');

    try {
      const response = await submitNameChange({
        employeeId: DEFAULT_EMPLOYEE_ID,
        previousName: DEFAULT_PREVIOUS_NAME,
        newLastName: newLastName.trim(),
        documentType,
        file,
      });

      setResult(response);
      setFormState('success');

      // Notify the shell after a short delay so user can read the success state
      setTimeout(() => onComplete(response.requestId), 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setFormState('error');
    }
  };

  const handleReset = () => {
    setNewLastName('');
    setDocumentType('');
    setFile(null);
    setFilePreview(null);
    setFormState('idle');
    setResult(null);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (formState === 'success' && result) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
        <h3 style={{ margin: '0 0 0.5rem', color: '#065f46', fontSize: '1.1rem' }}>
          Request Submitted!
        </h3>
        <p style={{ margin: '0 0 1.25rem', color: '#374151', fontSize: '0.88rem', lineHeight: 1.6 }}>
          {result.message}
        </p>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 10,
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
            Request Details
          </div>
          <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
            <strong>Request ID:</strong> {result.requestId}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
            <strong>Status:</strong> {result.status}
          </div>
          {result.confirmationCode && (
            <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
              <strong>Confirmation:</strong> {result.confirmationCode}
            </div>
          )}
        </div>
        <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0 }}>
          This panel will close automatically…
        </p>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.88rem',
    color: '#111827',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.35rem',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '1rem',
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Current name — read-only */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Current Legal Name</label>
        <input
          type="text"
          value={DEFAULT_PREVIOUS_NAME}
          readOnly
          style={{ ...inputStyle, background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
        />
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem' }}>
          Employee ID: {DEFAULT_EMPLOYEE_ID}
        </div>
      </div>

      {/* New last name */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="newLastName">
          New Last Name <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          id="newLastName"
          type="text"
          value={newLastName}
          onChange={e => setNewLastName(e.target.value)}
          placeholder="Enter your new last name"
          required
          disabled={formState === 'loading'}
          style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db'; }}
        />
        {newLastName && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Name will become: <strong>{`Jane ${newLastName}`}</strong>
          </div>
        )}
      </div>

      {/* Document type */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="documentType">
          Supporting Document Type <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <select
          id="documentType"
          value={documentType}
          onChange={e => setDocumentType(e.target.value)}
          required
          disabled={formState === 'loading'}
          style={{ ...inputStyle, cursor: 'pointer' }}
          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db'; }}
        >
          {DOCUMENT_TYPES.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* File upload */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="document">
          Upload Document <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${file ? '#6366f1' : '#d1d5db'}`,
            borderRadius: 10,
            padding: '1.25rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: file ? '#eef2ff' : '#f9fafb',
            transition: 'all 0.15s',
          }}
        >
          {file ? (
            <div>
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Document preview"
                  style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6, marginBottom: '0.5rem', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📄</div>
              )}
              <div style={{ fontSize: '0.82rem', color: '#4338ca', fontWeight: 600 }}>{file.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.15rem' }}>
                {(file.size / 1024).toFixed(1)} KB · Click to change
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📎</div>
              <div style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                Click to upload document
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                JPEG, PNG, or PDF · Max 10 MB
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          id="document"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
          required
          disabled={formState === 'loading'}
          style={{ display: 'none' }}
        />
      </div>

      {/* Error message */}
      {formState === 'error' && errorMessage && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            color: '#dc2626',
          }}
        >
          <strong>Error:</strong> {errorMessage}
          <button
            type="button"
            onClick={handleReset}
            style={{ marginLeft: '0.5rem', color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={formState === 'loading' || !newLastName.trim() || !documentType || !file}
        style={{
          width: '100%',
          padding: '0.7rem',
          background:
            formState === 'loading' || !newLastName.trim() || !documentType || !file
              ? '#d1d5db'
              : 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor:
            formState === 'loading' || !newLastName.trim() || !documentType || !file
              ? 'not-allowed'
              : 'pointer',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
        }}
      >
        {formState === 'loading' ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            Submitting & Verifying with AI…
          </>
        ) : (
          <>Submit Name Change Request</>
        )}
      </button>

      <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.75rem', textAlign: 'center', lineHeight: 1.5 }}>
        Your document will be verified using AI. HR will update your records within 5 business days.
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};
