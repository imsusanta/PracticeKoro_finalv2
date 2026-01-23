/**
 * Utility functions for formatting user display information
 * Handles WhatsApp pseudo-email masking
 */

const WHATSAPP_PSEUDO_DOMAIN = "@whatsapp.practicekoro.local";

/**
 * Check if an email is a WhatsApp pseudo-email
 */
export const isWhatsAppPseudoEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email.includes(WHATSAPP_PSEUDO_DOMAIN);
};

/**
 * Extract WhatsApp number from pseudo-email
 */
export const extractWhatsAppNumber = (email: string | null | undefined): string | null => {
  if (!email || !isWhatsAppPseudoEmail(email)) return null;
  return email.split("@")[0];
};

/**
 * Get display identifier for a user
 * Returns WhatsApp number if pseudo-email, otherwise returns email
 * Falls back to whatsapp_number field if available
 */
export const getUserDisplayIdentifier = (
  email: string | null | undefined,
  whatsappNumber?: string | null
): { type: "whatsapp" | "email"; value: string } | null => {
  // First check if whatsapp_number field is available
  if (whatsappNumber) {
    return { type: "whatsapp", value: whatsappNumber };
  }

  // Then check if email is a pseudo-email
  if (email && isWhatsAppPseudoEmail(email)) {
    const number = extractWhatsAppNumber(email);
    if (number) {
      return { type: "whatsapp", value: number };
    }
  }

  // Finally, if it's a real email, return it
  if (email && !isWhatsAppPseudoEmail(email)) {
    return { type: "email", value: email };
  }

  return null;
};

/**
 * Format user identifier for display
 * Masks WhatsApp pseudo-email and shows only the number
 */
export const formatUserIdentifier = (
  email: string | null | undefined,
  whatsappNumber?: string | null
): string => {
  const identifier = getUserDisplayIdentifier(email, whatsappNumber);
  
  if (!identifier) return "Not set";
  
  if (identifier.type === "whatsapp") {
    return `📱 ${identifier.value}`;
  }
  
  return identifier.value;
};

/**
 * Get clean display value without emoji
 */
export const getCleanDisplayValue = (
  email: string | null | undefined,
  whatsappNumber?: string | null
): string => {
  const identifier = getUserDisplayIdentifier(email, whatsappNumber);
  return identifier?.value || "Not set";
};
