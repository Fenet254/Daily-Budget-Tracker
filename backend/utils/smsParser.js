const parseSMS = (smsText) => {
  // Enhanced parser for Ethiopian bank SMS formats (Telebirr, CBE Birr, etc.)
  // Includes AI-like pattern matching and confidence scoring

  const lowerText = smsText.toLowerCase();
  let confidenceScore = 0;
  let type = 'expense'; // Default to expense
  let amount = 0;
  let category = 'Other';
  let description = smsText;
  const detectedKeywords = [];

  // Check for income keywords (higher confidence for income)
  const incomeKeywords = [
    { keyword: 'credit', weight: 0.9 },
    { keyword: 'deposit', weight: 0.9 },
    { keyword: 'received', weight: 0.85 },
    { keyword: 'incoming', weight: 0.8 },
    { keyword: 'transfer received', weight: 0.95 },
    { keyword: 'payment received', weight: 0.9 },
    { keyword: 'salary', weight: 0.85 },
    { keyword: 'airtime top-up', weight: -0.5 } // This is actually an expense
  ];

  // Check for expense keywords
  const expenseKeywords = [
    { keyword: 'debit', weight: 0.9 },
    { keyword: 'paid', weight: 0.8 },
    { keyword: 'purchase', weight: 0.75 },
    { keyword: 'payment', weight: 0.7 },
    { keyword: 'withdrawn', weight: 0.85 },
    { keyword: 'transfer', weight: 0.6 },
    { keyword: 'airtime', weight: 0.7 },
    { keyword: 'electricity', weight: 0.8 },
    { keyword: 'water', weight: 0.8 }
  ];

  // Check income first
  for (const item of incomeKeywords) {
    if (lowerText.includes(item.keyword)) {
      if (item.weight > 0) {
        type = 'income';
        confidenceScore += item.weight;
        detectedKeywords.push(item.keyword);
      } else {
        type = 'expense';
        confidenceScore += Math.abs(item.weight);
        detectedKeywords.push(item.keyword);
      }
    }
  }

  // If not determined by income, check expenses
  if (type === 'expense') {
    for (const item of expenseKeywords) {
      if (lowerText.includes(item.keyword)) {
        confidenceScore += item.weight;
        detectedKeywords.push(item.keyword);
      }
    }
  }

  // Extract amount - improved regex for multiple formats
  // Supports: ETB 100.00, 100.00 ETB, ETB100, 100ETB, etc.
  const amountPatterns = [
    /(?:etb|birr|br)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:etb|birr|br)/i,
    /(?:amount|value|transferred|paid|credited)[\s:]*(\d+(?:\.\d{2})?)/i
  ];

  for (const pattern of amountPatterns) {
    const match = smsText.match(pattern);
    if (match && match[1]) {
      // Remove commas and parse
      const parsedAmount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        amount = parsedAmount;
        confidenceScore += 0.3;
        break;
      }
    }
  }

  // Determine category using AI-like pattern matching
  const categoryPatterns = [
    { category: 'Food', keywords: ['food', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'kitchen', 'lunch', 'dinner', 'breakfast', 'ethiopian'], weight: 0.9 },
    { category: 'Transportation', keywords: ['transport', 'taxi', 'bus', 'uber', 'ride', 'fuel', 'gas', 'petrol', 'driver'], weight: 0.85 },
    { category: 'Shopping', keywords: ['shopping', 'store', 'market', 'mall', 'clothes', 'shoes', 'amazon'], weight: 0.8 },
    { category: 'Utilities', keywords: ['utility', 'electricity', 'water', 'bill', 'power', 'ethio'], weight: 0.85 },
    { category: 'Entertainment', keywords: ['entertainment', 'movie', 'cinema', 'game', 'netflix', 'spotify', 'music'], weight: 0.8 },
    { category: 'Health', keywords: ['health', 'hospital', 'pharmacy', 'medicine', 'doctor', 'medical'], weight: 0.9 },
    { category: 'Salary', keywords: ['salary', 'payroll', 'monthly salary', 'allowance'], weight: 0.95 },
    { category: 'Investment', keywords: ['investment', 'savings', 'stock', 'bond'], weight: 0.85 }
  ];

  let bestMatch = { category: 'Other', score: 0 };
  for (const pattern of categoryPatterns) {
    let matchScore = 0;
    for (const keyword of pattern.keywords) {
      if (lowerText.includes(keyword)) {
        matchScore += pattern.weight / pattern.keywords.length;
        detectedKeywords.push(keyword);
      }
    }
    if (matchScore > bestMatch.score) {
      bestMatch = { category: pattern.category, score: matchScore };
    }
  }

  if (bestScore > 0.3) {
    category = bestMatch.category;
    confidenceScore += bestMatch.score;
  }

  // Final validation
  if (amount === 0) {
    return {
      error: true,
      message: 'Could not parse amount from SMS',
      rawData: smsText
    };
  }

  // Normalize confidence score to 0-1 range
  confidenceScore = Math.min(confidenceScore, 1);

  return {
    type,
    amount,
    category,
    description,
    source: 'sms',
    confidence: confidenceScore,
    detectedKeywords: [...new Set(detectedKeywords)],
    parsedAt: new Date().toISOString()
  };
};

// Batch parse multiple SMS messages
const parseBatchSMS = (smsArray) => {
  return smsArray.map((sms, index) => ({
    index,
    ...parseSMS(sms)
  }));
};

module.exports = { parseSMS, parseBatchSMS };
