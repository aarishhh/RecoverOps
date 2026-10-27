import React, { useState } from 'react';
import { X, Globe, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ExternalLink } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, testApiConnection } from '../services/api';

export default function ApiConfigModal({ isOpen, onClose, onConfigSaved }) {
  const currentUrl = getApiBaseUrl();
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testApiConnection(urlInput.trim());
      setTestResult(res);
    } catch (err) {
      setTestResult({
        connected: false,
        mode: 'error',
        message: err.message || 'Failed to connect',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setApiBaseUrl(urlInput.trim());
    onConfigSaved(urlInput.trim());
    onClose();
  };

  const handleClear = () => {
    setUrlInput('');
    setApiBaseUrl('');
    setTestResult(null);
    onConfigSaved('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">API Connection Settings</h3>
              <p className="text-xs text-slate-400">Configure AWS API Gateway or Local Dev Endpoint</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              API Base URL
            </label>
            <input
              type="text"
              placeholder="https://xyz123.execute-api.us-east-1.amazonaws.com/prod"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            />
            <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
              Enter the AWS API Gateway endpoint URL output by the SAM/CloudFormation template, or <code className="text-indigo-300 bg-slate-800 px-1 rounded">http://localhost:4000/api</code> for local testing. Leave blank for simulated client storage.
            </p>
          </div>

          {/* Test connection button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Health Check...' : 'Test Connection (/health)'}</span>
            </button>

            {urlInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 transition-colors"
              >
                Clear (Use Local Mode)
              </button>
            )}
          </div>

          {/* Test results banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                testResult.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.connected ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.details && (
                    <pre className="mt-1.5 text-[10px] bg-slate-950/70 p-2 rounded overflow-x-auto text-slate-300">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security note */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300 block mb-0.5">Zero-Credential Browser Architecture</span>
              <span>
                All DynamoDB access is securely encapsulated in AWS Lambda with IAM least-privilege policies. No AWS credentials or secrets are ever exposed to the client.
              </span>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
