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

/**
 * Calculates standard default delivery prices (Home & Bureau) for Algerian wilayas.
 */
export function getDefaultDeliveryFee(wilayaKey) {
  if (!wilayaKey) return { home: 700, desk: 450, active: true };
  const num = parseInt(wilayaKey.split(" - ")[0], 10);

  if (num === 9) {
    // 09 - Blida (Wilaya atelier)
    return { home: 350, desk: 200, active: true };
  }
  if ([16, 42, 35, 26].includes(num)) {
    // Alger, Tipaza, Boumerdès, Médéa
    return { home: 500, desk: 300, active: true };
  }
  if ([2, 10, 15, 44].includes(num)) {
    // Chlef, Bouira, Tizi Ouzou, Aïn Defla
    return { home: 600, desk: 350, active: true };
  }
  if ([6, 13, 18, 19, 21, 23, 25, 27, 31].includes(num)) {
    // Béjaïa, Tlemcen, Jijel, Sétif, Skikda, Annaba, Constantine, Mostaganem, Oran
    return { home: 650, desk: 400, active: true };
  }
  if ([1, 11, 33, 37, 49, 50, 52, 53, 54, 56].includes(num)) {
    // Grand Sud / Sahara : Adrar, Tamanrasset, Illizi, Tindouf, Timimoun, Bordj Badji Mokhtar, Béni Abbès, In Salah, In Guezzam, Djanet
    return { home: 1300, desk: 850, active: true };
  }
  if ([3, 7, 8, 17, 30, 32, 39, 45, 47, 51, 55, 57, 58, 59, 60, 61, 62, 63, 64, 65, 67, 68].includes(num)) {
    // Sud & Hauts Plateaux Sud : Laghouat, Biskra, Béchar, Djelfa, Ouargla, El Bayadh, El Oued, Naâma, Ghardaïa, etc.
    return { home: 900, desk: 550, active: true };
  }
  // Standard wilayas
  return { home: 700, desk: 450, active: true };
}

/**
 * Returns a complete map of all 69 wilayas with default delivery rates.
 */
export function generateInitialDeliveryFees() {
  const fees = {};
  ALGERIA_WILAYAS.forEach((w) => {
    fees[w] = getDefaultDeliveryFee(w);
  });
  return fees;
}
