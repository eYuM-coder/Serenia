// utils/parseAmount.js

// Map of suffix strings to their multiplier (power of 10)
const SUFFIX_MAP = {
  k: 1e3, // Thousand
  m: 1e6, // Million
  b: 1e9, // Billion
  t: 1e12, // Trillion
  qa: 1e15, // Quadrillion
  qi: 1e18, // Quintillion
  sx: 1e21, // Sextillion
  sp: 1e24, // Septillion
  oc: 1e27, // Octillion
  no: 1e30, // Nonillion
};

// Helper to find the longest matching suffix
function getSuffixMultiplier(str) {
  // Check suffixes from longest to shortest (e.g., 'qa' before 'q' if we had one)
  const sortedSuffixes = Object.keys(SUFFIX_MAP).sort(
    (a, b) => b.length - a.length,
  );
  for (const suffix of sortedSuffixes) {
    if (str.endsWith(suffix)) {
      return { multiplier: SUFFIX_MAP[suffix], suffixLength: suffix.length };
    }
  }
  return null;
}

function parseAmount(input, maxAmount) {
  if (!input || typeof input !== "string") return 0;

  const str = input.trim().toLowerCase();

  // Handle word shortcuts
  if (str === "all" || str === "max" || str === "full")
    return parseInt(maxAmount);
  if (str === "half") return Math.floor(maxAmount / 2);
  if (str.endsWith("%")) {
    const percent = parseFloat(str.slice(0, -1));
    if (isNaN(percent) || percent <= 0 || percent > 100) return 0;
    return Math.floor((percent / 100) * maxAmount);
  }

  // Find numeric part and suffix
  let numericPart = str;
  let multiplier = 1;
  const suffixMatch = getSuffixMultiplier(str);
  if (suffixMatch) {
    numericPart = str.slice(0, -suffixMatch.suffixLength);
    multiplier = suffixMatch.multiplier;
  }

  // Parse the number (allow commas and dots)
  const match = numericPart.match(/^([\d.,]+)$/);
  if (!match) return 0;

  let num = parseFloat(numericPart.replace(/,/g, ""));
  if (isNaN(num)) return 0;

  let result = num * multiplier;
  return Math.floor(result);
}

function isValidAmount(amount, maxAmount) {
  return Number.isFinite(amount) && amount > 0 && amount <= maxAmount;
}

function abbreviateNumber(number) {
  // Go through suffixes from largest to smallest
  const sortedSuffixes = Object.entries(SUFFIX_MAP).sort((a, b) => b[1] - a[1]);
  for (const [suffix, multiplier] of sortedSuffixes) {
    if (number >= multiplier) {
      // For "Qa" and similar, ensure consistent formatting (first letter caps, rest lower)
      const formattedSuffix =
        suffix.length === 2
          ? suffix[0].toUpperCase() + suffix[1].toLowerCase()
          : suffix.toUpperCase();
      return `${(number / multiplier).toFixed(2)}${formattedSuffix}`;
    }
  }
  return number.toString();
}

module.exports = {
  parseAmount,
  isValidAmount,
  abbreviateNumber,
  SUFFIX_MAP, // Export if needed elsewhere
};
