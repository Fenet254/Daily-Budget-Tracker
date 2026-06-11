import React, { useState } from 'react';
import API from '../api';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import './SMSImport.css';

const SMSImport = () => {
  const [smsText, setSmsText] = useState('');
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [importedTransaction, setImportedTransaction] = useState(null);

  // Client-side SMS preview parser (mirror backend)
  const previewParse = (text) => {
    if (!text.trim()) {
      setPreview(null);
      return;
    }

    // Simplified version of backend parser
    const lowerText = text.toLowerCase();
    let type = 'expense';
    let amount = 0;
    let category = 'Other';
    let sender = '';

    // Telebirr spec example
    const telebirrMatch = text.match(/received\s+(\d+(?:\.\d{2})?)\s*(?:ETB|birr)\s+from\s+(.+?)(?:\.|$)/i);
    const cbeCredit = text.match(/(?:credit|credited)\s+to\s+your\s+account\s+(\d+(?:\.\d{2})?)/i);
    const cbeDebit = text.match(/(?:debit|debited|payment)\s+from\s+your\s+account\s+(\d+(?:\.\d{2})?)/i);

    if (telebirrMatch) {
      amount = parseFloat(telebirrMatch[1]);
      sender = telebirrMatch[2].trim();
      type = 'income';
      category = 'Transfer';
    } else if (cbeCredit) {
      amount = parseFloat(cbeCredit[1]);
      type = 'income';
      category = 'Transfer';
    } else if (cbeDebit) {
      amount = parseFloat(cbeDebit[1]);
      type = 'expense';
      category = 'Other';
    } else {
      // Fallback amount
      const amountMatch = text.match(/(\d+(?:\.\d{2})?)\s*(?:etb|birr)/i);
      if (amountMatch) amount = parseFloat(amountMatch[1]);
    }

    // Simple category keywords
    if (lowerText.includes('food') || lowerText.includes('restaurant')) category = 'Food';
    else if (lowerText.includes('transport') || lowerText.includes('taxi')) category = 'Transportation';

    if (amount > 0) {
      setPreview({ type, amount, category, sender, confidence: 0.9 });
    } else {
      setPreview({ error: 'Could not parse amount. Please check SMS format.' });
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    previewParse(smsText);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!preview || preview.error) {
      setMessage('Please preview first and ensure parsing is successful.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await API.post('/sms/import', { smsText });
      setMessage('Transaction imported successfully!');
      setImportedTransaction(res.data.transaction);
      setSmsText('');
      setPreview(null);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const exampleSMS = "You have received 500 ETB from Abebe.";

  return (
    <div className="sms-import-container">
      <div className="sms-header">
        <h1>SMS Transaction Import</h1>
        <p>Automatically parse Telebirr, CBE Birr SMS. Preview before import.</p>
      </div>

      <div className="sms-form-card">
        <form onSubmit={handlePreview}>
          <div className="input-group">
            <label>SMS Text</label>
            <textarea
              value={smsText}
              onChange={(e) => {
                setSmsText(e.target.value);
                setPreview(null);
                setMessage('');
              }}
              placeholder={`Paste SMS here e.g. "${exampleSMS}"`}
              rows="4"
            />
            <button type="submit" className="preview-btn" disabled={!smsText.trim()}>
              Preview Parse
            </button>
          </div>
        </form>

        {preview && (
          <div className={`preview-card ${preview.error ? 'error' : 'success'}`}>
            <h3>{preview.error ? 'Parse Error' : 'Parsed Data'}</h3>
            {!preview.error ? (
              <>
                <div className="preview-row">
                  <span className="label">Type:</span>
                  <span className={`value ${preview.type}`}>{preview.type.toUpperCase()}</span>
                </div>
                <div className="preview-row">
                  <span className="label">Amount:</span>
                  <span className="value">{preview.amount} ETB</span>
                </div>
                {preview.sender && (
                  <div className="preview-row">
                    <span className="label">From:</span>
                    <span className="value">{preview.sender}</span>
                  </div>
                )}
                <div className="preview-row">
                  <span className="label">Category:</span>
                  <span className="value">{preview.category}</span>
                </div>
                <div className="preview-row">
                  <span className="label">Confidence:</span>
                  <span className="value confidence">{(preview.confidence * 100).toFixed(0)}%</span>
                </div>
              </>
            ) : (
              <p>{preview.error}</p>
            )}
          </div>
        )}

        {preview && !preview.error && (
          <form onSubmit={handleImport}>
            <button type="submit" className="import-btn" disabled={loading}>
              {loading ? 'Importing...' : 'Import Transaction'}
            </button>
          </form>
        )}
      </div>

      {message && (
        <div className={`global-message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message.includes('successfully') ? <FiCheckCircle /> : <FiAlertTriangle />}
          {message}
        </div>
      )}

      {importedTransaction && (
        <div className="result-card">
          <h3>✅ Successfully Imported</h3>
          <div className="transaction-details">
            <p><strong>Type:</strong> {importedTransaction.type.toUpperCase()}</p>
            <p><strong>Amount:</strong> {importedTransaction.amount.toLocaleString()} ETB</p>
            <p><strong>Category:</strong> {importedTransaction.category}</p>
            {importedTransaction.sender && <p><strong>Sender:</strong> {importedTransaction.sender}</p>}
            <p><strong>Date:</strong> {new Date(importedTransaction.date).toLocaleString()}</p>
            <p><strong>Source:</strong> {importedTransaction.source}</p>
          </div>
        </div>
      )}

      <div className="examples">
        <h4>Example SMS:</h4>
        <code>{exampleSMS}</code>
      </div>
    </div>
  );
};

export default SMSImport;
