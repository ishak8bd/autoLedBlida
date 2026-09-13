import { ALGERIA_WILAYAS, getDefaultDeliveryFee } from "../data/algeriaWilayasCommunes";

// Comprehensive Arabic aliases and transliterations for Algerian wilayas
export const ARABIC_WILAYAS = {
  1: ["ادرار", "أدرار"],
  2: ["الشلف", "شلف"],
  3: ["الاغواط", "الأغواط"],
  4: ["ام البواقي", "أم البواقي"],
  5: ["باتنة", "باتنه"],
  6: ["بجاية", "بجايه"],
  7: ["بسكرة", "بسكرة"],
  8: ["بشار"],
  9: ["البليدة", "البليده", "بليدة", "بليده"],
  10: ["البويرة", "البويره", "بويرة", "بويره"],
  11: ["تمنراست", "تمنغست"],
  12: ["تبسة", "تبسه"],
  13: ["تلمسان"],
  14: ["تيارت"],
  15: ["تيزي وزو", "تيزي"],
  16: ["الجزائر", "العاصمة", "الجزائر العاصمة"],
  17: ["الجلفة", "الجلفه", "جلفة", "جلفه"],
  18: ["جيجل"],
  19: ["سطيف"],
  20: ["سعيدة", "سعيده"],
  21: ["سكيكدة", "سكيكده"],
  22: ["سيدي بلعباس", "بلعباس"],
  23: ["عنابة", "عنابه"],
  24: ["قالمة", "قالمه"],
  25: ["قسنطينة", "قسنطينه"],
  26: ["المدية", "المديه", "مدية", "مديه"],
  27: ["مستغانم"],
  28: ["المسيلة", "المسيله", "مسيلة", "مسيله"],
  29: ["معسكر"],
  30: ["ورقلة", "ورقله"],
  31: ["وهران"],
  32: ["البيض"],
  33: ["اليزي", "إليزي"],
  34: ["برج بوعريريج", "البرج"],
  35: ["بومرداس"],
  36: ["الطارف"],
  37: ["تندوف"],
  38: ["تيسمسيلت"],
  39: ["الوادي", "وادي سوف"],
  40: ["خنشلة", "خنشله"],
  41: ["سوق اهراس", "سوق أهراس"],
  42: ["تيبازة", "تيبازه"],
  43: ["ميلة", "ميله"],
  44: ["عين الدفلى", "عين الدفله"],
  45: ["النعامة", "النعامه"],
  46: ["عين تموشنت"],
  47: ["غرداية", "غردايه"],
  48: ["غليزان"],
  49: ["تيميمون"],
  50: ["برج باجي مختار"],
  51: ["اولاد جلال", "أولاد جلال"],
  52: ["بني عباس"],
  53: ["عين صالح"],
  54: ["عين قزام"],
  55: ["تقرت"],
  56: ["جانت"],
  57: ["المغير"],
  58: ["المنيعة", "المنيعه"],
  59: ["افلو", "أفلو"],
  60: ["بريكة", "بريكه"],
  61: ["قصر الشلالة", "قصر الشلاله"],
  62: ["مسعد"],
  63: ["عين وسارة", "عين وساره"],
  64: ["بوسعادة", "بوسعاده"],
  65: ["الابيض سيدي الشيخ", "الأبيض سيدي الشيخ"],
  66: ["العلمة", "العلمه"],
  67: ["تقرت جنوب", "تقرت الجنوبية"],
  68: ["الدبيلة", "الدبيله"],
  69: ["مغنية", "مغنيه"]
};

function normalizeStr(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function findWilayaMatch(input) {
  if (!input) return null;
  const str = String(input).trim();

  // 1. Direct match with official keys (e.g. "09 - Blida")
  if (ALGERIA_WILAYAS.includes(str)) return str;

  // 2. Match by wilaya code number (1 to 69)
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1 && num <= 69) {
    const padCode = String(num).padStart(2, "0");
    const found = ALGERIA_WILAYAS.find((w) => w.startsWith(padCode + " - "));
    if (found) return found;
  }

  // 3. Match by Arabic name
  for (const [code, names] of Object.entries(ARABIC_WILAYAS)) {
    if (names.some((n) => str.includes(n) || n.includes(str))) {
      const padCode = String(code).padStart(2, "0");
      const found = ALGERIA_WILAYAS.find((w) => w.startsWith(padCode + " - "));
      if (found) return found;
    }
  }

  // 4. Match by Latin name (normalized, case & accent insensitive)
  const normInput = normalizeStr(str);
  if (normInput) {
    const found = ALGERIA_WILAYAS.find((w) => {
      const wName = normalizeStr(w.split(" - ")[1]);
      return wName === normInput || (normInput.length >= 4 && (wName.includes(normInput) || normInput.includes(wName)));
    });
    if (found) return found;
  }

  return null;
}

export function findWilayaInLine(line) {
  // Check for wilaya code (e.g. "09 - Blida", "9, Blida", "Wilaya 16", "09:")
  const codeMatch = line.match(/(?:^|\b)(?:wilaya\s*)?(\d{1,2})\b/i);
  if (codeMatch) {
    const num = parseInt(codeMatch[1], 10);
    if (num >= 1 && num <= 69) {
      const padCode = String(num).padStart(2, "0");
      const found = ALGERIA_WILAYAS.find((w) => w.startsWith(padCode + " - "));
      if (found) return found;
    }
  }

  // Check for Arabic names in the line
  for (const [code, names] of Object.entries(ARABIC_WILAYAS)) {
    if (names.some((n) => line.includes(n))) {
      const padCode = String(code).padStart(2, "0");
      const found = ALGERIA_WILAYAS.find((w) => w.startsWith(padCode + " - "));
      if (found) return found;
    }
  }

  // Check for French names in the line
  const normLine = normalizeStr(line);
  for (const w of ALGERIA_WILAYAS) {
    const wName = normalizeStr(w.split(" - ")[1]);
    if (wName.length >= 4 && normLine.includes(wName)) {
      return w;
    }
  }

  return null;
}

export function extractPricesFromLine(line, wilayaMatch) {
  // 1. Explicit keyword checks
  const deskLabel = line.match(/(?:desk|bureau|stop\s*desk|مكتب)\s*[:=]?\s*(\d+)/i);
  const homeLabel = line.match(/(?:home|domicile|maison|منزل|دار)\s*[:=]?\s*(\d+)/i);

  if (deskLabel || homeLabel) {
    let d = deskLabel ? parseInt(deskLabel[1], 10) : null;
    let h = homeLabel ? parseInt(homeLabel[1], 10) : null;
    return { desk: d, home: h };
  }

  // 2. Remove wilaya code and name to isolate price numbers
  const wilayaCode = parseInt(wilayaMatch.split(" - ")[0], 10);
  const wilayaName = wilayaMatch.split(" - ")[1];

  let cleaned = line
    .replace(new RegExp(`\\b0?${wilayaCode}\\b`, "g"), " ")
    .replace(new RegExp(wilayaName, "gi"), " ")
    .replace(/wilaya|ولاية/gi, " ")
    .replace(/dzd|da|dinars?|د\.ج|دينار/gi, " ");

  const nums = cleaned.match(/\b\d+\b/g);
  if (!nums || nums.length === 0) return { desk: null, home: null };

  const parsedNums = nums.map((n) => parseInt(n, 10)).filter((n) => n > 0 && n < 50000);

  if (parsedNums.length >= 2) {
    // In Algeria, Bureau/Stop Desk is almost universally cheaper than or equal to Domicile
    const n1 = parsedNums[0];
    const n2 = parsedNums[1];
    if (n1 <= n2) {
      return { desk: n1, home: n2 };
    } else {
      return { desk: n2, home: n1 };
    }
  }

  if (parsedNums.length === 1) {
    // Only 1 price found: assigned to home delivery
    return { desk: null, home: parsedNums[0] };
  }

  return { desk: null, home: null };
}

/**
 * Parses raw text (CSV, TSV, JSON, WhatsApp list, lines) and extracts delivery rates per wilaya.
 */
export function parseDeliveryInput(text, existingFees = {}) {
  const result = {
    detected: {}, // wilayaKey -> { desk, home, active, originalLine }
    errors: [],
    totalDetected: 0
  };

  if (!text || typeof text !== "string") return result;
  const trimmed = text.trim();
  if (!trimmed) return result;

  // 1. Try parsing as JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (!item) return;
          const wilayaMatch = findWilayaMatch(item.wilaya || item.name || item.code);
          if (wilayaMatch) {
            const desk = Number(item.desk ?? item.bureau ?? item.stopDesk ?? item.deskPrice ?? 450);
            const home = Number(item.home ?? item.domicile ?? item.maison ?? item.homePrice ?? 700);
            result.detected[wilayaMatch] = {
              desk: Math.max(0, isNaN(desk) ? 450 : desk),
              home: Math.max(0, isNaN(home) ? 700 : home),
              active: item.active !== undefined ? Boolean(item.active) : (existingFees[wilayaMatch]?.active ?? true),
              originalLine: JSON.stringify(item)
            };
          }
        });
      } else if (typeof parsed === "object") {
        Object.entries(parsed).forEach(([key, val]) => {
          const wilayaMatch = findWilayaMatch(key);
          if (wilayaMatch && val) {
            let desk = 450;
            let home = 700;
            if (typeof val === "number") {
              home = val;
              desk = Math.round(val * 0.65 / 50) * 50;
            } else if (Array.isArray(val)) {
              desk = Number(val[0]) || 450;
              home = Number(val[1]) || (desk > 0 ? Math.round(desk * 1.5 / 50) * 50 : 700);
            } else if (typeof val === "object") {
              desk = Number(val.desk ?? val.bureau ?? val.stopDesk ?? 450);
              home = Number(val.home ?? val.domicile ?? val.maison ?? 700);
            }
            result.detected[wilayaMatch] = {
              desk: Math.max(0, isNaN(desk) ? 450 : desk),
              home: Math.max(0, isNaN(home) ? 700 : home),
              active: val.active !== undefined ? Boolean(val.active) : (existingFees[wilayaMatch]?.active ?? true),
              originalLine: `${key}: ${JSON.stringify(val)}`
            };
          }
        });
      }
      result.totalDetected = Object.keys(result.detected).length;
      if (result.totalDetected > 0) return result;
    } catch {
      // Fall through to line-by-line parsing
    }
  }

  // 2. Line-by-line parsing (CSV, TSV, space-separated, colon-separated, bullet list)
  const lines = trimmed.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith("#") || rawLine.startsWith("//")) continue;

    // Skip pure table headers (e.g. "Code, Wilaya, Bureau, Domicile")
    const lowerLine = rawLine.toLowerCase();
    const hasPrices = /\b\d{3,5}\b/.test(rawLine);
    if (!hasPrices && (lowerLine.includes("wilaya") || lowerLine.includes("code")) && (lowerLine.includes("bureau") || lowerLine.includes("domicile") || lowerLine.includes("desk") || lowerLine.includes("prix") || lowerLine.includes("tarif"))) {
      continue;
    }

    const wilayaMatch = findWilayaInLine(rawLine);
    if (!wilayaMatch) {
      result.errors.push({ lineIndex: i + 1, line: rawLine, reason: "Wilaya non reconnue" });
      continue;
    }

    const { desk, home } = extractPricesFromLine(rawLine, wilayaMatch);
    if (desk === null && home === null) {
      result.errors.push({ lineIndex: i + 1, line: rawLine, reason: "Aucun prix détecté" });
      continue;
    }

    const currentFee = existingFees[wilayaMatch] || getDefaultDeliveryFee(wilayaMatch);
    const finalDesk = desk !== null ? desk : (currentFee.desk ?? 450);
    const finalHome = home !== null ? home : (currentFee.home ?? 700);

    result.detected[wilayaMatch] = {
      desk: finalDesk,
      home: finalHome,
      active: currentFee.active ?? true,
      originalLine: rawLine
    };
  }

  result.totalDetected = Object.keys(result.detected).length;
  return result;
}

/**
 * Exports delivery rates to downloadable CSV string.
 */
export function exportDeliveryFeesToCsv(fees = {}, wilayas = ALGERIA_WILAYAS) {
  const headers = ["Code Wilaya", "Nom Wilaya", "Tarif Bureau Stop Desk (DZD)", "Tarif Domicile Maison (DZD)", "Statut"];
  const rows = wilayas.map((w) => {
    const fee = fees[w] || getDefaultDeliveryFee(w);
    const code = w.split(" - ")[0];
    const name = w.split(" - ")[1] || w;
    return [
      `"${code}"`,
      `"${name}"`,
      fee.desk ?? 450,
      fee.home ?? 700,
      fee.active ? "Actif" : "Suspendu"
    ];
  });
  return "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
