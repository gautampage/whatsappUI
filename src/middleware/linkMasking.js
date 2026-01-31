// Utility function to mask payment links for display purposes
export const maskPaymentLinks = (text) => {
  if (!text || typeof text !== 'string') return text;

  // Regex to find payment links (rzp.io pattern)
  const linkRegex = /(https?:\/\/rzp\.io\/rzp\/[a-zA-Z0-9_-]+)/g;
  
  return text.replace(linkRegex, (match) => {
    console.log('Found payment link to mask in message:', match);
    
    try {
      // Extract the token part from the URL
      const parts = match.split('/');
      if (parts.length >= 5) {
        const token = parts[4]; // The token part
        
        if (token && token.length > 4) {
          // Always mask at least 4 characters
          const visibleChars = Math.max(1, Math.floor((token.length - 4) / 2));
          const firstPart = token.substring(0, visibleChars);
          const lastPart = token.substring(token.length - visibleChars);
          const maskedPart = "*".repeat(Math.max(4, token.length - (2 * visibleChars)));
          
          const maskedToken = firstPart + maskedPart + lastPart;
          const maskedUrl = `${parts[0]}//${parts[2]}/${parts[3]}/${maskedToken}`;
          
          console.log('Masked payment link:', maskedUrl);
          return maskedUrl;
        }
      }
    } catch (error) {
      console.error('Error masking payment link:', error);
    }
    
    // Return original if masking fails
    return match;
  });
};

// Function to check if a message contains payment links
export const containsPaymentLink = (text) => {
  if (!text || typeof text !== 'string') return false;
  const linkRegex = /(https?:\/\/rzp\.io\/rzp\/[a-zA-Z0-9_-]+)/g;
  return linkRegex.test(text);
};