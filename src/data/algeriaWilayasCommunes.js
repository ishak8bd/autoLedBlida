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
