import wilayasCommunesData from './wilayasCommunes.json';

export const ALGERIA_WILAYAS_COMMUNES = wilayasCommunesData;

export const ALGERIA_WILAYAS = Object.keys(ALGERIA_WILAYAS_COMMUNES);

export function getCommunesByWilaya(wilayaName) {
  if (!wilayaName) return [];
  if (ALGERIA_WILAYAS_COMMUNES[wilayaName]) {
    return ALGERIA_WILAYAS_COMMUNES[wilayaName];
  }
  const match = Object.keys(ALGERIA_WILAYAS_COMMUNES).find(
    (k) => wilayaName.includes(k) || k.includes(wilayaName)
  );
  return match ? ALGERIA_WILAYAS_COMMUNES[match] : [];
}

export function cleanAlgerianPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[\s\-\.]/g, '');
}

export function isValidAlgerianPhone(phone) {
  const cleaned = cleanAlgerianPhone(phone);
  return /^0[567][0-9]{8}$/.test(cleaned);
}

/**
 * Returns the primary phone number configured by the admin.
 * Fallbacks gracefully if not explicitly set.
 */
export function getPrimaryPhone(settings) {
  const phones = settings?.phoneNumbers || [];
  const primary = phones.find((p) => p && p.isPrimary);
  if (primary && primary.number) return primary.number;
  if (settings?.whatsappMain) return settings.whatsappMain;
  if (phones[0] && phones[0].number) return phones[0].number;
  return '0561147039';
}

/**
 * Formats any Algerian phone number into a valid WhatsApp wa.me URL
 * with optional encoded message.
 */
export function getWhatsAppUrl(phone, message = '') {
  if (!phone) phone = '0561147039';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00213')) {
    digits = digits.slice(5);
    digits = '213' + digits;
  } else if (digits.startsWith('213')) {
    // already has 213
  } else if (digits.startsWith('0')) {
    digits = '213' + digits.slice(1);
  } else {
    digits = '213' + digits;
  }
  const baseUrl = `https://wa.me/${digits}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}

