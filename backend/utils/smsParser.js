const parseSMS = (smsText) => {
  // Simple parser for Ethiopian bank SMS formats (Telebirr, CBE Birr, etc.)
  // This is a basic implementation; in a real app, use more robust parsing

  const lowerText = smsText.toLowerCase();

  let type = 'expense'; // Default to expense
  let amount = 0;
  let category = 'Other';
  let description = smsText;

  // Check for income keywords
  if (lowerText.includes('credit') || lowerText.includes('deposit') || lowerText.includes('received')) {
    type = 'income';
  }

  // Extract amount (assuming format like "ETB 100.00" or "100.00 ETB")
  const amountMatch = smsText.match(/(\d+(\.\d{2})?)/);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
  }

  // Determine category based on keywords
  if (lowerText.includes('food') || lowerText.includes('restaurant') || lowerText.includes('cafe')) {
    category = 'Food';
  } else if (lowerText.includes('transport') || lowerText.includes('taxi') || lowerText.includes('bus')) {
    category = 'Transportation';
  } else if (lowerText.includes('shopping') || lowerText.includes('store')) {
    category = 'Shopping';
  } else if (lowerText.includes('utility') || lowerText.includes('electricity') || lowerText.includes('water')) {
    category = 'Utilities';
  } else if (lowerText.includes('entertainment') || lowerText.includes('movie') || lowerText.includes('game')) {
    category = 'Entertainment';
  }

  if (amount === 0) {
    return null; // Could not parse
  }

  return {
    type,
    amount,
    category,
    description,
    source: 'sms',
  };
};

module.exports = { parseSMS };
