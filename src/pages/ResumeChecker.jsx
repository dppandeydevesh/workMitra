import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../services/apiClient';

const ResumeChecker = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Stop polling if the user navigates away mid-analysis (prevents a runaway
  // interval + setState-after-unmount warnings).
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === 'application/pdf' ||
        droppedFile.name.endsWith('.pdf')
      ) {
        setFile(droppedFile);
        setError('');
      } else {
        setError(t('Please upload a valid PDF file.'));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (
        selectedFile.type === 'application/pdf' ||
        selectedFile.name.endsWith('.pdf')
      ) {
        setFile(selectedFile);
        setError('');
      } else {
        setError(t('Please upload a valid PDF file.'));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError(t('Please upload a resume (PDF).'));
      return;
    }
    if (!jobRole) {
      setError(t('Please enter a target job role.'));
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobRole', jobRole);

    try {
      const response = await fetchWithAuth('/api/ai/resume-check', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t('Failed to analyze resume'));
      }

      const data = await response.json();

      if (data.jobId) {
        // Give up after ~60s (30 × 2s) so a stuck/dead worker doesn't poll forever.
        const MAX_POLL_ATTEMPTS = 30;
        let attempts = 0;
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(async () => {
          attempts++;
          try {
            if (attempts > MAX_POLL_ATTEMPTS) {
              clearInterval(pollIntervalRef.current);
              setError(t('Analysis timed out. Please try again in a moment.'));
              setIsLoading(false);
              return;
            }
            const statusRes = await fetchWithAuth(
              `/api/ai/resume-check/${data.jobId}`
            );
            if (!statusRes.ok) throw new Error(t('Failed to check job status'));
            const statusData = await statusRes.json();

            if (statusData.status === 'completed') {
              clearInterval(pollIntervalRef.current);
              setResult(statusData.result);
              setIsLoading(false);
            } else if (statusData.status === 'failed') {
              clearInterval(pollIntervalRef.current);
              setError(
                t('AI Job failed: ') + (statusData.error || 'Unknown error')
              );
              setIsLoading(false);
            }
          } catch (e) {
            clearInterval(pollIntervalRef.current);
            setError(e.message);
            setIsLoading(false);
          }
        }, 2000);
      } else {
        setResult(data);
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message || t('Something went wrong'));
      setIsLoading(false);
    }
  };

  return (
    <div className="resume-checker-container">
      <style>{`.resume-checker-container {min-height: 100vh;
 width: 100%;
 display: flex;
 justify-content: center;
 align-items: center;
 background: linear-gradient(135deg, #0f172a 0%, #1e1e2f 100%);
 padding: 2rem;
 font-family:'Inter', system-ui, -apple-system, sans-serif;
 color: #fff;
 box-sizing: border-box;
}
 
 .wm-panel {background: rgba(255, 255, 255, 0.03);
 : blur(20px);
 -webkit-: blur(20px);
 border: 1px solid rgba(255, 255, 255, 0.08);
 box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
 border-radius: 24px;
 padding: 3rem;
 width: 100%;
 max-width: 700px;
}
 

 .title {font-size: 2.2rem;
 font-weight: 800;
 margin-bottom: 0.5rem;
 text-align: center;
 background: linear-gradient(90deg, #f59e0b, #d97706);
 -webkit-background-clip: text;
 -webkit-text-fill-color: transparent;
}

 .subtitle {text-align: center;
 color: #475569;
 margin-bottom: 2.5rem;
 font-size: 1.1rem;
}
 

 .form-group {margin-bottom: 1.5rem;
}

 .label {display: block;
 margin-bottom: 0.75rem;
 font-weight: 500;
 color: #334155;
 font-size: 0.95rem;
}
 

 .input-field {width: 100%;
 background: rgba(0, 0, 0, 0.03);
 border: 1px solid rgba(0, 0, 0, 0.1);
 border-radius: 14px;
 padding: 1.2rem;
 color: #1e293b;
 font-size: 1rem;
 outline: none;
 transition: all 0.3s ease;
 box-sizing: border-box;
}
 

 .input-field:focus {border-color: #f59e0b;
 background: rgba(255, 255, 255, 0.08);
}

 .dropzone {border: 2px dashed #cbd5e1;
 border-radius: 16px;
 padding: 3.5rem 2rem;
 text-align: center;
 cursor: pointer;
 transition: all 0.3s ease;
 background: rgba(0, 0, 0, 0.02);
}
 

 .dropzone:hover {border-color: #f59e0b;
}

 .dropzone-icon {font-size: 3.5rem;
 margin-bottom: 1rem;
 opacity: 0.8;
}
 
 .file-info {display: flex;
 align-items: center;
 justify-content: center;
 gap: 1rem;
 margin-top: 1rem;
 padding: 1rem;
 background: rgba(245, 158, 11, 0.1);
 border: 1px solid rgba(245, 158, 11, 0.2);
 border-radius: 12px;
}

 .submit-btn {width: 100%;
 padding: 1.2rem;
 background: #f59e0b;
 color: white;
 border: none;
 border-radius: 14px;
 font-size: 1.1rem;
 font-weight: 600;
 cursor: pointer;
 transition: transform 0.2s ease, box-shadow 0.2s ease;
 margin-top: 1.5rem;
}

 .submit-btn:hover:not(:disabled) {transform: translateY(-2px);
 box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4);
}
 
 .submit-btn:disabled {opacity: 0.5;
 cursor: not-allowed;
}

 .error-msg {color: #dc2626;
 margin-bottom: 1.5rem;
 text-align: center;
 background: rgba(220, 38, 38, 0.1);
 border: 1px solid rgba(220, 38, 38, 0.2);
 padding: 1rem;
 border-radius: 12px;
 font-size: 0.95rem;
}

 .results-dashboard {animation: slideUp 0.5s ease;
}

 @keyframes slideUp {from { opacity: 0; transform: translateY(20px);}
 to { opacity: 1; transform: translateY(0);}
}

 .score-container {display: flex;
 justify-content: center;
 align-items: center;
 margin: 3rem 0;
}

 .score-circle {width: 180px;
 height: 180px;
 border-radius: 50%;
 background: conic-gradient(#10b981 var(--score), #e2e8f0 0deg);
 display: flex;
 justify-content: center;
 align-items: center;
 position: relative;
}
 
 
 .score-inner {width: 156px;
 height: 156px;
 border-radius: 50%;
 background: #ffffff;
 display: flex;
 flex-direction: column;
 justify-content: center;
 align-items: center;
 z-index: 10;
}
 

 .score-value {font-size: 3.5rem;
 font-weight: 800;
 color: #10b981;
 line-height: 1;
}

 .score-label {font-size: 0.95rem;
 color: #475569;
 margin-top: 0.5rem;
 text-transform: uppercase;
 letter-spacing: 1px;
}
 

 .feedback-section {background: rgba(0, 0, 0, 0.03);
 border: 1px solid rgba(0, 0, 0, 0.05);
 border-radius: 16px;
 padding: 1.5rem;
 margin-bottom: 1.5rem;
}
 
 
 .feedback-title {font-size: 1.1rem;
 font-weight: 600;
 margin-bottom: 1.2rem;
 color: #1e293b;
 display: flex;
 align-items: center;
 gap: 0.5rem;
}
 

 .keywords-list {display: flex;
 flex-wrap: wrap;
 gap: 0.75rem;
}

 .keyword-tag {background: rgba(239, 68, 68, 0.1);
 color: #dc2626;
 padding: 0.5rem 1rem;
 border-radius: 8px;
 font-size: 0.9rem;
 border: 1px solid rgba(239, 68, 68, 0.2);
 font-weight: 500;
}

 .feedback-text {font-size: 0.95rem;
 line-height: 1.6;
 color: #475569;
 margin-bottom: 1rem;
}
 
 
 .feedback-list li {position: relative;
 color: #475569;
 line-height: 1.5;
}
 
 
 .back-btn {background: transparent;
 border: 1px solid #cbd5e1;
 color: #475569;
 padding: 1rem 2rem;
 border-radius: 12px;
 cursor: pointer;
 transition: all 0.2s;
 margin-top: 2rem;
 width: 100%;
 font-size: 1rem;
 font-weight: 500;
}
 
 .back-btn:hover {background: rgba(255, 255, 255, 0.05);
 color: white;
}

 .loader {border: 3px solid rgba(255, 255, 255, 0.1);
 border-top: 3px solid #c084fc;
 border-radius: 50%;
 width: 48px;
 height: 48px;
 animation: spin 1s linear infinite;
 margin: 3rem auto;
}

 @keyframes spin {0% { transform: rotate(0deg);}
 100% { transform: rotate(360deg);}
}
`}</style>

      <div className="wm-panel">
        {!result ? (
          <>
            <h1 className="title">{t('Resume Matcher')}</h1>
            <p className="subtitle">
              {t('Upload your resume to see how well it fits your target role')}
            </p>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">{t('Target Job Role')}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t('e.g. Senior Frontend Developer')}
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="label">{t('Resume Upload (PDF)')}</label>
                <div
                  className="dropzone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="dropzone-icon">📄</div>
                  {file ? (
                    <div className="file-info">
                      <span style={{ fontWeight: 500, color: '#e2e8f0' }}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fca5a5',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p
                        style={{
                          marginBottom: '0.5rem',
                          color: '#e2e8f0',
                          fontSize: '1.1rem',
                          fontWeight: 500,
                        }}
                      >
                        {t('Drag & Drop your PDF here')}
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        {t('or click to browse files')}
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="loader"></div>
              ) : (
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!file || !jobRole}
                >
                  {t('Analyze Resume Match')}
                </button>
              )}
            </form>
          </>
        ) : (
          <div className="results-dashboard">
            <h1 className="title">{t('Analysis Complete')}</h1>
            <p className="subtitle">
              {t("Here's your ATS compatibility for")}{' '}
              <strong>{jobRole}</strong>
            </p>

            <div className="score-container">
              <div
                className="score-circle"
                style={{ '--score': `${(result.score || 0) * 3.6}deg` }}
              >
                <div className="score-inner">
                  <span className="score-value">{result.score || 0}</span>
                  <span className="score-label">{t('Match Score')}</span>
                </div>
              </div>
            </div>

            <div className="feedback-section">
              <h3 className="feedback-title">
                <span>⚠️</span> {t('Missing Keywords')}
              </h3>
              {result.missingKeywords && result.missingKeywords.length > 0 ? (
                <div className="keywords-list">
                  {result.missingKeywords.map((kw, i) => (
                    <span key={i} className="keyword-tag">
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="feedback-text" style={{ color: '#34d399' }}>
                  {t('Great job! You hit all the major keywords.')}
                </p>
              )}
            </div>

            <div className="feedback-section">
              <h3 className="feedback-title">
                <span>💡</span> {t('Detailed Feedback')}
              </h3>
              <p className="feedback-text">
                {result.feedback || t('No additional feedback provided.')}
              </p>
            </div>

            <button className="back-btn" onClick={() => setResult(null)}>
              {t('Check Another Resume')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeChecker;
