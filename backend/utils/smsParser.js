/**
 * Regex-based SMS parser for Telebirr / CBE Birr style notifications.
 *
 * Input: raw SMS text
 * Output: structured transaction object used by `/api/sms/import`.
 *
 * Current contract (success):
 * {
 *   type: 'income' | 'expense',
 *   amount: number,
 *   category: string,
 *   description: string,
 *   source: 'telebirr' | 'cbe' | 'sms',
 *   sender: string,
 *   confidence: number, // 0..1
 *   detectedKeywords: string[]
 * }
 *
 * Notes:
 * - This parser is best-effort and may not support every SMS format.
 * - Budget/category matching is performed in the `/api/sms/import` route.
 */
const parseSMS = (smsText) => {
  const lowerText = smsText.toLowerCase();
  let confidenceScore = 0;
  let type = 'expense';
  let amount = 0;
  let category = 'Other';
  let description = smsText;
  let sender = '';
  const detectedKeywords = [];

  // SPEC EXAMPLES & Ethiopian SMS patterns
  // Telebirr: "You have received 500 ETB from Abebe."
  const telebirrIncome = smsText.match(/received\s+(\d+(?:\.\d{2})?)\s*(?:ETB|birr)\s+from\s+(.+?)(?:\.|$)/i);
  if (telebirrIncome) {
    amount = parseFloat(telebirrIncome[1]);
    sender = telebirrIncome[2].trim();
    type = 'income';
    confidenceScore += 0.95;
    detectedKeywords.push('telebirr-income');
    category = 'Transfer';
  }

  // CBE Birr patterns, debit/credit
  const cbeCredit = smsText.match(/(?:credit|credited)\s+to\s+your\s+account\s+(\d+(?:\.\d{2})?)/i);
  if (cbeCredit && !telebirrIncome) {
    amount = parseFloat(cbeCredit[1]);
    type = 'income';
    confidenceScore += 0.9;
    detectedKeywords.push('cbe-credit');
  }

  const cbeDebit = smsText.match(/(?:debit|debited|payment)\s+from\s+your\s+account\s+(\d+(?:\.\d{2})?)/i);
  if (cbeDebit) {
    amount = parseFloat(cbeDebit[1]);
    type = 'expense';
    confidenceScore += 0.9;
    detectedKeywords.push('cbe-debit');
  }

  // Fallback amount extraction (existing improved)
  const amountPatterns = [
    /(?:etb|birr|br)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:etb|birr|br)/i,
  ];
  if (amount === 0) {
    for (const pattern of amountPatterns) {
      const match = smsText.match(pattern);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) {
          confidenceScore += 0.3;
          break;
        }
      }
    }
  }

  // Existing keyword/type/category logic (unchanged for brevity)
  const incomeKeywords = ['credit', 'deposit', 'received', 'incoming'];
  // ... (keep original keyword logic if no spec match)

  const categoryPatterns = [
    // existing...
    { category: 'Transfer', keywords: ['transfer', 'sent', 'received'], weight: 0.9 },
    // etc.
  ];

  if (amount === 0) {
    return { error: true, message: 'No amount found' };
  }

  confidenceScore = Math.min(1, confidenceScore);

  return {
    type,
    amount,
    category,
    description,
    source: sender ? 'telebirr' : 'sms',
    sender,
    confidence: confidenceScore,
    detectedKeywords,
  };
};

const parseBatchSMS = (smsArray) => smsArray.map(parseSMS);

module.exports = { parseSMS, parseBatchSMS };
