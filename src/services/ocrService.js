/**
 * OCR Service - Google Vision API integration for invoice text extraction
 */

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Read a file as base64-encoded string
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Call Google Vision API for text detection
 */
async function callVisionAPI(base64Image) {
  const apiKey = process.env.REACT_APP_GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('Google Vision API key not configured. Add REACT_APP_GOOGLE_VISION_API_KEY to .env');
  }

  const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const annotations = data.responses?.[0]?.textAnnotations;

  if (!annotations || annotations.length === 0) {
    throw new Error('No text found in the image. Please try a clearer image.');
  }

  // First annotation contains the full extracted text
  return annotations[0].description;
}

/**
 * Parse raw OCR text to extract structured invoice data
 * Handles common Indian invoice formats
 */
function parseInvoiceText(rawText) {
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const result = {
    invoiceNumber: '',
    vendorName: '',
    invoiceDate: '',
    invoiceAmount: '',
    receivedAmount: '',
    packingMaterial: '',
  };

  // --- Invoice Number ---
  // Patterns: "Invoice No: XXX", "Invoice #XXX", "Bill No: XXX", "Inv No. XXX"
  const invoiceNumPatterns = [
    /(?:invoice|inv|bill|receipt)\s*(?:no|number|#|num)[\s.:_#-]*([A-Za-z0-9\-/]+)/i,
    /(?:invoice|inv|bill)\s*:\s*([A-Za-z0-9\-/]+)/i,
    /\b([A-Z]{2,4}[-/]\d{3,})\b/, // Pattern like TRN-001, INV/2024/001
  ];
  for (const pattern of invoiceNumPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.invoiceNumber = match[1].trim();
      break;
    }
  }

  // --- Vendor Name ---
  // Usually the first prominent line or after "From:", "Vendor:", "Company:"
  const vendorPatterns = [
    /(?:vendor|supplier|from|company|firm|billed?\s*by)[\s.:_-]*([A-Za-z\s&.]+)/i,
  ];
  for (const pattern of vendorPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.vendorName = match[1].trim();
      break;
    }
  }
  // Fallback: use first line if it looks like a name (not a number/date)
  if (!result.vendorName && lines.length > 0) {
    const firstLine = lines[0];
    if (/^[A-Za-z\s&.]+$/.test(firstLine) && firstLine.length > 2 && firstLine.length < 60) {
      result.vendorName = firstLine;
    }
  }

  // --- Date ---
  // Patterns: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, "Date: ..."
  const datePatterns = [
    /(?:date|dated|invoice\s*date|bill\s*date)[\s.:_-]*(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/i,
    /(?:date|dated|invoice\s*date|bill\s*date)[\s.:_-]*(\d{4}[\s/.-]\d{1,2}[\s/.-]\d{1,2})/i,
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.invoiceDate = normalizeDate(match[1].trim());
      break;
    }
  }
  // Fallback: find any date-like pattern
  if (!result.invoiceDate) {
    const dateMatch = text.match(/\b(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})\b/);
    if (dateMatch) {
      result.invoiceDate = normalizeDate(dateMatch[1]);
    }
  }

  // --- Amounts ---
  // Look for total/grand total/net amount patterns with Indian currency
  const amountPatterns = [
    { key: 'invoiceAmount', patterns: [
      /(?:total|grand\s*total|net\s*(?:amount|total|payable)|amount\s*(?:due|payable))[\s.:_₹Rs]*[₹Rs.]*\s*([\d,]+\.?\d*)/i,
      /(?:total|grand\s*total)[\s.:]*(?:₹|Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
    ]},
  ];

  for (const { key, patterns } of amountPatterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        result[key] = parseIndianAmount(match[1]);
        break;
      }
    }
  }

  // If no specific total found, look for the largest amount in the text
  if (!result.invoiceAmount) {
    const allAmounts = [];
    const amountRegex = /(?:₹|Rs\.?|INR)?\s*([\d,]+\.\d{2})\b/g;
    let amountMatch;
    while ((amountMatch = amountRegex.exec(text)) !== null) {
      const val = parseIndianAmount(amountMatch[1]);
      if (val > 0) allAmounts.push(val);
    }
    if (allAmounts.length > 0) {
      result.invoiceAmount = Math.max(...allAmounts).toString();
    }
  }

  return result;
}

/**
 * Normalize various date formats to YYYY-MM-DD for <input type="date">
 */
function normalizeDate(dateStr) {
  // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let match = dateStr.match(/^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{2,4})$/);
  if (match) {
    let [, day, month, year] = match;
    if (year.length === 2) year = '20' + year;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try YYYY-MM-DD
  match = dateStr.match(/^(\d{4})[/.\-\s](\d{1,2})[/.\-\s](\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return dateStr;
}

/**
 * Parse Indian-formatted amounts (e.g., "1,23,456.78")
 */
function parseIndianAmount(amountStr) {
  return amountStr.replace(/,/g, '');
}

/**
 * Main function: extract invoice data from an image/PDF file
 * @param {File} file - Image or PDF file
 * @returns {Promise<object>} Extracted invoice fields
 */
export async function extractInvoiceData(file) {
  const base64 = await readFileAsBase64(file);
  const rawText = await callVisionAPI(base64);
  const parsed = parseInvoiceText(rawText);

  return {
    ...parsed,
    rawText, // Include raw text for debugging / user review
  };
}
