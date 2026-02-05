import React, { useState } from 'react';
import axios from 'axios';
import './SMSImport.css';

const SMSImport = () => {
  const [smsText, setSmsText] = useState('');
  const [message, setMessage] = useState('');
  const [importedTransaction, setImportedTransaction] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setImportedTransaction(null);

    try {
      const res = await axios.post('http://localhost:5000/sms/import', { smsText });
      setMessage('Transaction imported successfully!');
      setImportedTransaction(res.data.transaction);
      setSmsText('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error importing SMS');
    }
  };

  return (
    <div className="sms-import">
      <h1>SMS Import</h1>
      <form onSubmit={handleSubmit} className="sms-form">
        <textarea
          value={smsText}
          onChange={(e) => setSmsText(e.target.value)}
          placeholder="Paste your SMS text here..."
          rows="4"
          required
        />
        <button type="submit">Import Transaction</button>
      </form>
      {message && <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</div>}
      {importedTransaction && (
        <div className="imported-transaction">
          <h2>Imported Transaction</h2>
          <p><strong>Type:</strong> {importedTransaction.type}</p>
          <p><strong>Amount:</strong> {importedTransaction.amount} ETB</p>
          <p><strong>Category:</strong> {importedTransaction.category}</p>
          <p><strong>Description:</strong> {importedTransaction.description}</p>
          <p><strong>Date:</strong> {new Date(importedTransaction.date).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default SMSImport;
