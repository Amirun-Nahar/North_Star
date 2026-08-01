import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  AlertTriangle,
  Info,
  Key,
  RefreshCw,
  HelpCircle,
  Send,
  Scale,
  Check,
  X,
  Flag,
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';

import { CONTRACTS, Contract } from './data/contracts';
import { PUBLIC_QUESTIONS, MISSING_INFO_CASES, PublicQuestion, MissingInfoCase } from './data/testCases';
import { analyzeContract, answerCustomQuestion, ClauseReview } from './services/gemini';

// Structure to store human review actions in state/localStorage
interface ReviewAction {
  status: 'Approved' | 'Rejected' | 'Flagged' | null;
  feedback: string;
}

export default function App() {
  // State for API Key
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gemini_api_key');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return saved;
        }
      }
    } catch (e) {
      console.error("Failed to parse gemini_api_key:", e);
    }
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);

  // State for Contracts
  const [selectedContractId, setSelectedContractId] = useState<string>('C-001');
  const [contractsList, setContractsList] = useState<Contract[]>(CONTRACTS);
  const [editedContractText, setEditedContractText] = useState<string>('');

  // Advanced Interactive States for Hackathon "Flawless Win"
  const [workspaceMode, setWorkspaceMode] = useState<'read' | 'edit'>('read');
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null);

  // Helper function to highlight the active evidence quote inside Read Mode
  const renderHighlightedText = (text: string, highlight: string | null) => {
    if (!highlight || !text) return <>{text}</>;
    try {
      // Normalize whitespace for comparison
      const escaped = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = text.split(regex);
      return (
        <>
          {parts.map((part, idx) => {
            if (regex.test(part)) {
              return (
                <mark key={idx} className="evidence-highlight-marker active">
                  {part}
                </mark>
              );
            }
            return part;
          })}
        </>
      );
    } catch (e) {
      return <>{text}</>;
    }
  };

  // Selected Contract computed
  const currentContract = contractsList.find(c => c.id === selectedContractId) || contractsList[0];

  // Update text when contract selection changes
  useEffect(() => {
    if (currentContract) {
      setEditedContractText(currentContract.text);
    }
  }, [selectedContractId, currentContract]);

  // Handle contract text modification
  const handleTextChange = (newText: string) => {
    setEditedContractText(newText);
    // Update local state copy of contracts so updates remain while switching
    setContractsList(prev => prev.map(c => c.id === selectedContractId ? { ...c, text: newText } : c));
  };

  // State for Analysis Results
  const [analysisResults, setAnalysisResults] = useState<Record<string, ClauseReview[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // State for Human Review Decisions (Keyed by contractId_clauseType)
  const [humanReviews, setHumanReviews] = useState<Record<string, ReviewAction>>(() => {
    try {
      const saved = localStorage.getItem('contract_human_reviews');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to parse contract_human_reviews from localStorage:", e);
      return {};
    }
  });

  // Save human reviews to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('contract_human_reviews', JSON.stringify(humanReviews));
  }, [humanReviews]);

  // State for Q&A Panel
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState<{
    question: string;
    answer: string;
    risk_level: string;
    clause_type: string;
    evidence: string | null;
  } | null>(null);

  // Run bulk analysis for the currently selected contract
  const handleAnalyze = async () => {
    if (!apiKey) {
      setAnalysisError("Please configure your Gemini API Key first.");
      setShowKeyInput(true);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const results = await analyzeContract(selectedContractId, editedContractText, apiKey);
      setAnalysisResults(prev => ({
        ...prev,
        [selectedContractId]: results
      }));
    } catch (err: any) {
      setAnalysisError(err?.message || "An error occurred during LLM analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export a professional markdown compliance report
  const exportReport = () => {
    if (currentReviews.length === 0) return;
    
    let md = `# Northstar Solutions - Compliance Audit Report\n`;
    md += `**Contract ID:** \`${selectedContractId}\`\n`;
    md += `**Document Title:** ${currentContract.title}\n`;
    md += `**Parties:** ${currentContract.parties}\n`;
    md += `**Date of Audit:** ${new Date().toLocaleDateString()}\n\n`;
    
    md += `## Executive Risk Summary\n`;
    const low = currentReviews.filter(r => r.risk_level === 'Low Risk').length;
    const med = currentReviews.filter(r => r.risk_level === 'Medium Risk').length;
    const high = currentReviews.filter(r => r.risk_level === 'High Risk').length;
    const info = currentReviews.filter(r => r.risk_level === 'Not Enough Information').length;
    
    md += `- **Low Risk (Compliant):** ${low} clauses\n`;
    md += `- **Medium Risk (Review Recommended):** ${med} clauses\n`;
    md += `- **High Risk (Action Required):** ${high} clauses\n`;
    md += `- **Not Enough Information (Omitted):** ${info} clauses\n\n`;
    
    md += `## Detailed Clause Review Table\n\n`;
    md += `| Clause ID | Category | Risk Level | Human Status | Variance Explanation |\n`;
    md += `| --- | --- | --- | --- | --- |\n`;
    
    currentReviews.forEach(r => {
      const key = `${selectedContractId}_${r.clause_type}`;
      const hReview = humanReviews[key] || { status: 'Pending Review', feedback: '' };
      const status = hReview.status || 'Pending Review';
      md += `| ${r.company_standard_id || 'N/A'} | ${r.clause_type} | ${r.risk_level} | ${status} | ${r.reason.replace(/\n/g, ' ')} |\n`;
    });
    
    md += `\n\n## Section Audits & Evidence\n\n`;
    
    currentReviews.forEach(r => {
      const key = `${selectedContractId}_${r.clause_type}`;
      const hReview = humanReviews[key] || { status: 'Pending Review', feedback: '' };
      md += `### ${r.clause_type} (${r.company_standard_id || 'STD-OMIT'})\n`;
      md += `- **Risk Rating:** ${r.risk_level}\n`;
      md += `- **Human Review Decision:** ${hReview.status || 'Pending Review'}\n`;
      if (hReview.feedback) {
        md += `- **Human Feedback:** ${hReview.feedback}\n`;
      }
      md += `\n**Company Standard:**\n> ${r.company_standard_text || 'No standard reference.'}\n\n`;
      md += `**Contract Evidence:**\n`;
      if (r.contract_clause_text) {
        md += `> "${r.contract_clause_text}"\n\n`;
      } else {
        md += `> *No matching clause found in the document.*\n\n`;
      }
      md += `**Auditor Reason & Variance:**\n${r.reason}\n\n`;
      md += `* * * \n\n`;
    });
    
    md += `\n*Disclaimer: This compliance report is generated automatically by AI and is designed for internal human-in-the-loop review. It does not constitute binding legal advice.*\n`;
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Compliance_Audit_${selectedContractId}.md`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform human action (Approve/Reject/Flag) on a reviewed clause
  const handleReviewAction = (clauseType: string, status: 'Approved' | 'Rejected' | 'Flagged') => {
    const key = `${selectedContractId}_${clauseType}`;
    setHumanReviews(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: prev[key]?.status === status ? null : status // Toggle off if clicked again
      }
    }));
  };

  // Handle feedback text update on a card
  const handleFeedbackChange = (clauseType: string, feedback: string) => {
    const key = `${selectedContractId}_${clauseType}`;
    setHumanReviews(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        feedback
      }
    }));
  };

  // Run analysis for a pre-loaded question
  const handleQuestionClick = async (q: PublicQuestion | MissingInfoCase) => {
    setSelectedQuestionId(q.id);
    setSelectedContractId(q.contract_id);
    setQaLoading(true);
    setQaResult(null);

    // Auto load current contract text
    const targetContract = contractsList.find(c => c.id === q.contract_id) || currentContract;
    const textToAnalyze = targetContract.text;

    try {
       const result = await answerCustomQuestion(q.contract_id, textToAnalyze, q.question, apiKey);
      setQaResult({
        question: q.question,
        answer: result.answer,
        risk_level: result.risk_level,
        clause_type: result.clause_type,
        evidence: result.evidence
      });
      if (result.evidence) {
        setActiveEvidence(result.evidence);
        setWorkspaceMode('read');
      } else {
        setActiveEvidence(null);
      }
    } catch (err: any) {
      setQaResult({
        question: q.question,
        answer: err?.message || "Error generating answer.",
        risk_level: "Not Enough Information",
        clause_type: "General",
        evidence: null
      });
    } finally {
      setQaLoading(false);
    }
  };

  // Handle custom question submission
  const handleCustomQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    if (!apiKey) {
      alert("Please configure your Gemini API Key first.");
      setShowKeyInput(true);
      return;
    }

    setQaLoading(true);
    setSelectedQuestionId(null);
    setQaResult(null);
    try {
      const result = await answerCustomQuestion(selectedContractId, editedContractText, customQuestion, apiKey);
      setQaResult({
        question: customQuestion,
        answer: result.answer,
        risk_level: result.risk_level,
        clause_type: result.clause_type,
        evidence: result.evidence
      });
      if (result.evidence) {
        setActiveEvidence(result.evidence);
        setWorkspaceMode('read');
      } else {
        setActiveEvidence(null);
      }
      setCustomQuestion('');
    } catch (err: any) {
      setQaResult({
        question: customQuestion,
        answer: err?.message || "Error generating answer.",
        risk_level: "Not Enough Information",
        clause_type: "General",
        evidence: null
      });
    } finally {
      setQaLoading(false);
    }
  };

  // Get current active reviews
  const currentReviews = analysisResults[selectedContractId] || [];

  // Helper to determine badge styling class based on risk level
  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'Low Risk': return 'badge-low';
      case 'Medium Risk': return 'badge-medium';
      case 'High Risk': return 'badge-high';
      default: return 'badge-info';
    }
  };

  const getRiskCardClass = (risk: string) => {
    switch (risk) {
      case 'Low Risk': return 'risk-low';
      case 'Medium Risk': return 'risk-medium';
      case 'High Risk': return 'risk-high';
      default: return 'risk-info';
    }
  };

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header className="app-header glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={28} className="glow-text-blue" style={{ color: 'var(--accent-blue)' }} />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>NORTHSTAR</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
              AI CONTRACT COMPLIANCE SUITE
            </span>
          </div>
        </div>

        {/* Disclaimer Statement */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Scale size={16} style={{ color: 'var(--accent-purple)' }} />
          <span><strong>Compliance Tool:</strong> Does not provide legal advice. Requires human review.</span>
        </div>

        {/* API Key Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {showKeyInput ? (
            <div className="api-key-config">
              <Key size={14} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="password"
                placeholder="Enter Gemini API Key"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  localStorage.setItem('gemini_api_key', JSON.stringify(e.target.value));
                }}
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.8rem', width: '180px', height: '28px' }}
              />
              <button 
                className="btn btn-primary" 
                style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px' }}
                onClick={() => setShowKeyInput(false)}
              >
                Save
              </button>
            </div>
          ) : (
            <div className="api-key-config" style={{ cursor: 'pointer' }} onClick={() => setShowKeyInput(true)}>
              <span className={`api-key-indicator ${apiKey ? 'valid' : 'invalid'}`}></span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {apiKey ? 'API Key Active' : 'API Key Missing'}
              </span>
              <RefreshCw size={12} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="app-content">
        
        {/* Left Panel: Contract Workspace */}
        <section className="panel-container glass-panel">
          <div className="panel-header">
            <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--accent-blue)' }} />
              Contract Workspace
            </h2>
            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{selectedContractId}</span>
          </div>

          <div className="panel-body">
            <div className="form-group">
              <label className="form-label">Select Active Document</label>
              <select
                value={selectedContractId}
                onChange={(e) => {
                  setSelectedContractId(e.target.value);
                  setQaResult(null);
                  setSelectedQuestionId(null);
                }}
                className="form-select"
              >
                {contractsList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.title.substring(0, 30)}...
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Parties:</strong> {currentContract.parties}
            </div>

            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label">Contract Document Text</label>
                <div className="workspace-tab-bar">
                  <button
                    onClick={() => setWorkspaceMode('read')}
                    className={`workspace-tab ${workspaceMode === 'read' ? 'active' : ''}`}
                  >
                    Read & Highlight
                  </button>
                  <button
                    onClick={() => setWorkspaceMode('edit')}
                    className={`workspace-tab ${workspaceMode === 'edit' ? 'active' : ''}`}
                  >
                    Edit Source
                  </button>
                </div>
              </div>
              
              {workspaceMode === 'read' ? (
                <div className="workspace-viewer">
                  {renderHighlightedText(editedContractText, activeEvidence)}
                </div>
              ) : (
                <textarea
                  value={editedContractText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="form-textarea"
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}
                  placeholder="Paste or edit contract excerpt here..."
                />
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={16} className="spinner" /> Analyzing compliance...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Run Compliance Review
                </>
              )}
            </button>
          </div>
        </section>

        {/* Center Panel: Clause Analysis Cards */}
        <section className="panel-container glass-panel">
          <div className="panel-header" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--accent-blue)' }} />
              Clause Review Dashboard
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {currentReviews.length > 0 && (
                <button
                  onClick={exportReport}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', height: '26px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Send size={12} /> Export Audit Report
                </button>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-low" style={{ fontSize: '0.6rem' }}>Low</span>
                <span className="badge badge-medium" style={{ fontSize: '0.6rem' }}>Med</span>
                <span className="badge badge-high" style={{ fontSize: '0.6rem' }}>High</span>
                <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>Missing</span>
              </div>
            </div>
          </div>

          <div className="panel-body">
            {/* Legal Disclaimer Banner */}
            <div className="disclaimer-banner">
              <Info size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong>Legal Compliance Disclaimer:</strong> This system uses automated intelligence to review terms and identify variance. It does not provide legal advice or create a binding assessment. Always consult a legal professional before execution.
              </div>
            </div>

            {/* Error Message */}
            {analysisError && (
              <div className="disclaimer-banner" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
                <AlertCircle size={20} />
                <div>{analysisError}</div>
              </div>
            )}

            {/* Loading / Placeholder */}
            {isAnalyzing && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600 }}>
                  Analyzing contract compliance against company standards...
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Extracting clauses, comparing variance, and assessing risk factors
                </span>
              </div>
            )}

            {currentReviews.length === 0 ? (
              <div style={{
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--text-muted)',
                gap: '12px',
                padding: '40px 20px',
                textAlign: 'center'
              }}>
                <Scale size={48} style={{ strokeWidth: 1 }} />
                <div>
                  <h3 style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>No Active Compliance Review</h3>
                  <p style={{ fontSize: '0.85rem' }}>
                    Select a contract on the left panel and click <strong>Run Compliance Review</strong> to analyze the clauses.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Visual Risk Distribution Summary Widget */}
                {(() => {
                  const low = currentReviews.filter(r => r.risk_level === 'Low Risk').length;
                  const med = currentReviews.filter(r => r.risk_level === 'Medium Risk').length;
                  const high = currentReviews.filter(r => r.risk_level === 'High Risk').length;
                  const info = currentReviews.filter(r => r.risk_level === 'Not Enough Information').length;
                  const total = currentReviews.length || 7;

                  const lowPct = (low / total) * 100;
                  const medPct = (med / total) * 100;
                  const highPct = (high / total) * 100;
                  const infoPct = (info / total) * 100;

                  return (
                    <div className="compliance-summary-container">
                      <div className="compliance-summary-header">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Contract Risk Profile Scorecard
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {high} High Risks Detected
                        </span>
                      </div>
                      
                      {/* Segmented Bar */}
                      <div className="progress-bar-segmented">
                        <div className="progress-segment segment-high" style={{ width: `${highPct}%` }}></div>
                        <div className="progress-segment segment-med" style={{ width: `${medPct}%` }}></div>
                        <div className="progress-segment segment-low" style={{ width: `${lowPct}%` }}></div>
                        <div className="progress-segment segment-info" style={{ width: `${infoPct}%` }}></div>
                      </div>

                      {/* Legend Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.75rem', textAlign: 'center', marginTop: '4px' }}>
                        <div style={{ color: 'var(--risk-high-text)' }}>
                          🔴 High: {high}
                        </div>
                        <div style={{ color: 'var(--risk-med-text)' }}>
                          🟡 Medium: {med}
                        </div>
                        <div style={{ color: 'var(--risk-low-text)' }}>
                          🟢 Low: {low}
                        </div>
                        <div style={{ color: 'var(--risk-none-text)' }}>
                          ⚪ Missing: {info}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {currentReviews.map((review, idx) => {
                  const key = `${selectedContractId}_${review.clause_type}`;
                  const hReview = humanReviews[key] || { status: null, feedback: '' };

                  return (
                    <div 
                      key={idx} 
                      className={`clause-card ${getRiskCardClass(review.risk_level)}`}
                      onClick={() => {
                        if (review.contract_clause_text) {
                          setActiveEvidence(review.contract_clause_text);
                          setWorkspaceMode('read');
                        }
                      }}
                      style={{
                        borderLeftWidth: '4px',
                        borderRight: hReview.status === 'Approved' ? '1px solid var(--risk-low-text)' :
                                     hReview.status === 'Rejected' ? '1px solid var(--risk-high-text)' :
                                     hReview.status === 'Flagged' ? '1px solid var(--risk-med-text)' : '1px solid var(--border-color)',
                        cursor: review.contract_clause_text ? 'pointer' : 'default',
                        boxShadow: activeEvidence === review.contract_clause_text ? '0 0 12px rgba(59, 130, 246, 0.25)' : '',
                        borderColor: activeEvidence === review.contract_clause_text ? 'var(--accent-blue)' : ''
                      }}
                    >
                      {/* Card Header */}
                      <div className="clause-card-header">
                        <div className="clause-card-title">
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {review.company_standard_id || 'STD-OMIT'}
                          </span>
                          <span>{review.clause_type}</span>
                        </div>
                        <span className={`badge ${getRiskBadgeClass(review.risk_level)}`}>
                          {review.risk_level}
                        </span>
                      </div>

                      {/* Contract Evidence Quote */}
                      <div>
                        <div className="clause-section-title">
                          <FileText size={12} /> Contract Evidence
                        </div>
                        {review.contract_clause_text ? (
                          <div className="clause-text-box evidence">
                            "{review.contract_clause_text}"
                          </div>
                        ) : (
                          <div className="clause-text-box" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No matching clause found in the document.
                          </div>
                        )}
                      </div>

                      {/* Company Standard Reference */}
                      {review.company_standard_text && (
                        <div>
                          <div className="clause-section-title">
                            <Shield size={12} /> Company Standard
                          </div>
                          <div className="clause-text-box standard">
                            {review.company_standard_text}
                          </div>
                        </div>
                      )}

                      {/* Explanation / Variance Reason */}
                      <div>
                        <div className="clause-section-title">
                          <AlertTriangle size={12} /> Compliance Assessment
                        </div>
                        <div className="clause-reason">
                          {review.reason}
                        </div>
                      </div>

                      {/* Human-in-the-loop actions */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px' }}>
                        <div className="review-banner">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={14} /> Human Review Required
                          </span>
                          
                          {/* Action Badge */}
                          {hReview.status && (
                            <span className={`badge ${
                              hReview.status === 'Approved' ? 'badge-low' : 
                              hReview.status === 'Rejected' ? 'badge-high' : 'badge-medium'
                            }`} style={{ textTransform: 'capitalize' }}>
                              {hReview.status}
                            </span>
                          )}
                        </div>

                        {/* Interactive Buttons */}
                        <div className="review-actions">
                          <button 
                            className={`btn action-btn ${hReview.status === 'Approved' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleReviewAction(review.clause_type, 'Approved')}
                            style={{
                              backgroundColor: hReview.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : '',
                              color: hReview.status === 'Approved' ? 'var(--risk-low-text)' : '',
                              borderColor: hReview.status === 'Approved' ? 'var(--risk-low-border)' : ''
                            }}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button 
                            className={`btn action-btn ${hReview.status === 'Rejected' ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => handleReviewAction(review.clause_type, 'Rejected')}
                            style={{
                              backgroundColor: hReview.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : '',
                              color: hReview.status === 'Rejected' ? 'var(--risk-high-text)' : '',
                              borderColor: hReview.status === 'Rejected' ? 'var(--risk-high-border)' : ''
                            }}
                          >
                            <X size={12} /> Reject
                          </button>
                          <button 
                            className={`btn action-btn ${hReview.status === 'Flagged' ? 'btn-secondary' : 'btn-secondary'}`}
                            onClick={() => handleReviewAction(review.clause_type, 'Flagged')}
                            style={{
                              backgroundColor: hReview.status === 'Flagged' ? 'rgba(245, 158, 11, 0.2)' : '',
                              color: hReview.status === 'Flagged' ? 'var(--risk-med-text)' : '',
                              borderColor: hReview.status === 'Flagged' ? 'var(--risk-med-border)' : ''
                            }}
                          >
                            <Flag size={12} /> Flag
                          </button>
                        </div>

                        {/* Feedback Note Input */}
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <MessageSquare size={14} style={{ color: 'var(--text-muted)' }} />
                          <input
                            type="text"
                            placeholder="Add compliance notes or feedback..."
                            value={hReview.feedback}
                            onChange={(e) => handleFeedbackChange(review.clause_type, e.target.value)}
                            className="form-input"
                            style={{ flex: 1, padding: '4px 8px', fontSize: '0.8rem', height: '28px' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Interactive Q&A Engine */}
        <section className="panel-container glass-panel">
          <div className="panel-header">
            <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} style={{ color: 'var(--accent-purple)' }} />
              Test Suite & QA
            </h2>
          </div>

          <div className="panel-body">
            
            {/* Safe-Abstention Test Cases (High Importance for Hackathon) */}
            <div>
              <div className="form-label" style={{ marginBottom: '8px' }}>Missing Information Cases</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MISSING_INFO_CASES.map(tc => (
                  <button
                    key={tc.id}
                    onClick={() => handleQuestionClick(tc)}
                    className={`qa-item ${selectedQuestionId === tc.id ? 'active' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong>{tc.id}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--risk-med-text)' }}>{tc.contract_id}</span>
                    </div>
                    <div>{tc.question}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Public Test Questions */}
            <div>
              <div className="form-label" style={{ marginBottom: '8px' }}>Public Compliance Questions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {PUBLIC_QUESTIONS.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionClick(q)}
                    className={`qa-item ${selectedQuestionId === q.id ? 'active' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong>{q.id}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)' }}>{q.contract_id}</span>
                    </div>
                    <div>{q.question}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Answer Display */}
            {(qaLoading || qaResult) && (
              <div className="clause-card" style={{ borderLeft: '3px solid var(--accent-purple)', background: 'rgba(31, 41, 55, 0.5)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  QA Analysis Output
                </div>
                
                {qaLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0' }}>
                    <div className="loading-shimmer" style={{ width: '80%' }}></div>
                    <div className="loading-shimmer" style={{ width: '100%' }}></div>
                    <div className="loading-shimmer" style={{ width: '60%' }}></div>
                  </div>
                ) : (
                  qaResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{qaResult.clause_type}</span>
                        <span className={`badge ${getRiskBadgeClass(qaResult.risk_level)}`}>
                          {qaResult.risk_level}
                        </span>
                      </div>
                      
                      <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        <strong>A:</strong> {qaResult.answer}
                      </div>

                      {qaResult.evidence && (
                        <div>
                          <div className="clause-section-title" style={{ fontSize: '0.7rem' }}>Evidence Quote</div>
                          <div className="clause-text-box evidence" style={{ fontSize: '0.75rem', padding: '6px' }}>
                            "{qaResult.evidence}"
                          </div>
                        </div>
                      )}

                      <div className="review-banner" style={{ fontSize: '0.75rem', padding: '6px 10px' }}>
                        <span>Human Review: Required</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Custom Question input */}
            <form onSubmit={handleCustomQuestionSubmit} className="form-group" style={{ marginTop: 'auto' }}>
              <label className="form-label">Ask Custom Compliance Query</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. Is encryption required for storage?"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                  <Send size={16} />
                </button>
              </div>
            </form>

          </div>
        </section>

      </main>
    </div>
  );
}
