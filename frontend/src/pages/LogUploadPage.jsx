import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle,
  FileCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import TopBar from '../components/TopBar';
import DatabaseBanner from '../components/DatabaseBanner';

export default function LogUploadPage({ triggerRefresh }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'file'
  const [logsText, setLogsText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [scenarios, setScenarios] = useState([]);
  const [defaultSample, setDefaultSample] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);

  // Load sample scenarios
  useEffect(() => {
    async function loadSamples() {
      try {
        const res = await api.getSampleScenarios();
        if (res.success) {
          setDefaultSample(res.defaultSample);
          setScenarios(res.scenarios || []);
        }
      } catch (err) {
        console.warn('Could not pre-load sample scenarios:', err.message);
      }
    }
    loadSamples();
  }, []);

  // Handle Scenario Selection
  const handleScenarioChange = (e) => {
    const val = e.target.value;
    setSelectedScenarioId(val);
    setValidationError('');
    setAnalysisResult(null);

    if (val === 'default') {
      setLogsText(defaultSample);
    } else if (val) {
      const found = scenarios.find((s) => s.id.toString() === val);
      if (found) {
        setLogsText(found.logs);
      }
    }
  };

  // Load default sample logs
  const handleLoadSample = () => {
    setLogsText(defaultSample);
    setSelectedScenarioId('default');
    setValidationError('');
    setAnalysisResult(null);
  };

  // Clear inputs
  const handleClearInput = () => {
    setLogsText('');
    setSelectedFile(null);
    setSelectedScenarioId('');
    setValidationError('');
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // File drop / select validation
  const validateFile = (file) => {
    if (!file) return false;

    const validExtensions = ['.txt', '.log'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setValidationError(`Unsupported file type: '${file.name}'. Please upload a plain text file (.txt or .log).`);
      setSelectedFile(null);
      return false;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setValidationError(`File is oversized (${(file.size / (1024 * 1024)).toFixed(2)}MB). Max allowed size is 2MB.`);
      setSelectedFile(null);
      return false;
    }

    if (file.size === 0) {
      setValidationError('Uploaded file is completely empty. Please select a valid log file.');
      setSelectedFile(null);
      return false;
    }

    setValidationError('');
    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateFile(file);
  };

  // Submit and analyze logs
  const handleAnalyze = async () => {
    setValidationError('');
    setAnalysisResult(null);

    if (activeTab === 'file') {
      if (!selectedFile) {
        setValidationError('Please choose a .txt or .log file to upload.');
        return;
      }
    } else {
      if (!logsText || !logsText.trim()) {
        setValidationError('Log input textarea is empty. Please enter log lines or click "Sample Logs".');
        return;
      }
    }

    try {
      setLoading(true);
      let res;
      if (activeTab === 'file') {
        res = await api.analyzeLogs(selectedFile, true);
      } else {
        res = await api.analyzeLogs(logsText, false);
      }

      if (res.success) {
        setAnalysisResult(res);
        setDbStatus(res.dbStatus);
        triggerRefresh(); // Refresh global counts
      }
    } catch (err) {
      console.error('Log analysis failed:', err);
      const errMsg = err.response?.data?.error || err.message || 'Analysis failed. Please check log formats.';
      setValidationError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const lineCount = logsText ? logsText.split(/\r?\n/).filter((l) => l.trim()).length : 0;

  return (
    <div className="main-wrapper">
      <TopBar
        title="Log Ingestion & Parsing Engine"
        subtitle="Upload network log streams for Regular Expression validation and FSM sequence evaluation"
        dbStatus={dbStatus}
      />

      <div className="page-content">
        <DatabaseBanner dbStatus={dbStatus} />

        {/* Action Header Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            {/* Tab switch */}
            <div style={{ display: 'flex', gap: '8px', background: '#090e1c', padding: '4px', borderRadius: '8px', border: '1px solid #1e3a5f' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('manual'); setValidationError(''); }}
                style={{
                  background: activeTab === 'manual' ? '#2563eb' : 'transparent',
                  color: activeTab === 'manual' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <FileText size={15} />
                <span>Manual Entry Textarea</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('file'); setValidationError(''); }}
                style={{
                  background: activeTab === 'file' ? '#2563eb' : 'transparent',
                  color: activeTab === 'file' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <UploadCloud size={15} />
                <span>Upload File (.txt, .log)</span>
              </button>
            </div>

            {/* Academic Presets dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                Test Scenarios:
              </label>
              <select
                className="form-control"
                value={selectedScenarioId}
                onChange={handleScenarioChange}
                style={{ width: '260px', padding: '8px 12px', fontSize: '13px' }}
              >
                <option value="">-- Choose Academic Test Preset --</option>
                <option value="default">Sample Logs (Default 5 logs)</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="card" style={{ marginBottom: '24px' }}>
          {activeTab === 'manual' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                  Paste or Enter Network Event Logs:
                </label>
                <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  {lineCount} log line{lineCount === 1 ? '' : 's'}
                </span>
              </div>

              <textarea
                className="form-control"
                rows={10}
                placeholder={`Format:\nYYYY-MM-DD HH:MM:SS IP=IPv4 USER=username STATUS=SUCCESS/FAILED\n\nExample:\n2026-11-13 10:00:01 IP=192.168.1.10 USER=admin STATUS=SUCCESS\n2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED`}
                value={logsText}
                onChange={(e) => {
                  setLogsText(e.target.value);
                  setValidationError('');
                }}
              />
            </div>
          ) : (
            <div>
              <div
                className={`dropzone ${isDragging ? 'active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".txt,.log"
                  onChange={handleFileChange}
                />
                <UploadCloud size={48} color="#3b82f6" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '6px' }}>
                  {selectedFile ? selectedFile.name : 'Click to select or drag and drop a log file'}
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Supported extensions: <code>.txt</code> or <code>.log</code> (Max file size: 2MB)
                </p>
                {selectedFile && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '12px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px'
                    }}
                  >
                    <FileCheck size={14} />
                    <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <AlertCircle size={18} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="btn btn-primary"
            >
              <Play size={16} />
              <span>{loading ? 'Analyzing with Regex & FSM...' : 'Analyze Logs'}</span>
            </button>

            <button
              onClick={handleLoadSample}
              disabled={loading}
              className="btn btn-secondary"
            >
              <Sparkles size={16} />
              <span>Sample Logs</span>
            </button>

            <button
              onClick={handleClearInput}
              disabled={loading}
              className="btn btn-secondary"
            >
              <RotateCcw size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Post-Analysis Summary Banner & Cards */}
        {analysisResult && (
          <div className="card" style={{ border: '1px solid #2563eb', background: '#0e1834' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={22} color="#10b981" />
                <h3 style={{ fontSize: '16px', color: '#fff' }}>Analysis Completed Successfully</h3>
              </div>
              <button
                onClick={() => navigate('/logs')}
                className="btn btn-primary btn-sm"
              >
                <span>View In Log Analysis Table</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="metrics-grid" style={{ marginBottom: 0 }}>
              <div className="metric-card" style={{ padding: '16px' }}>
                <div>
                  <div className="metric-label">Valid Logs Parsed</div>
                  <div className="metric-value" style={{ color: '#10b981', fontSize: '24px' }}>
                    {analysisResult.summary.validCount}
                  </div>
                </div>
              </div>

              <div className="metric-card" style={{ padding: '16px' }}>
                <div>
                  <div className="metric-label">Malformed Rejected</div>
                  <div className="metric-value" style={{ color: analysisResult.summary.invalidCount > 0 ? '#ef4444' : '#94a3b8', fontSize: '24px' }}>
                    {analysisResult.summary.invalidCount}
                  </div>
                </div>
              </div>

              <div className="metric-card" style={{ padding: '16px' }}>
                <div>
                  <div className="metric-label">Security Alerts Triggered</div>
                  <div className="metric-value" style={{ color: analysisResult.summary.alertCount > 0 ? '#ef4444' : '#94a3b8', fontSize: '24px' }}>
                    {analysisResult.summary.alertCount}
                  </div>
                </div>
              </div>

              <div className="metric-card" style={{ padding: '16px' }}>
                <div>
                  <div className="metric-label">Unique IP Addresses</div>
                  <div className="metric-value" style={{ color: '#06b6d4', fontSize: '24px' }}>
                    {analysisResult.summary.uniqueIps}
                  </div>
                </div>
              </div>
            </div>

            {/* If there were invalid logs, highlight them */}
            {analysisResult.invalidLogs && analysisResult.invalidLogs.length > 0 && (
              <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <h4 style={{ color: '#f87171', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>
                  Rejected Malformed Log Entries ({analysisResult.invalidLogs.length}):
                </h4>
                <ul style={{ fontSize: '12px', color: '#fca5a5', paddingLeft: '18px' }}>
                  {analysisResult.invalidLogs.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      <strong>Line {item.lineNumber}:</strong> <code>{item.rawLine}</code> — {item.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
