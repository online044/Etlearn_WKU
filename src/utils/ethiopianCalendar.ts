/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A high-fidelity Gregorian to Ethiopian Calendar Converter
// Reference points are adjusted for modern years (2020-2030)
export function getEthiopianDate(date: Date): { day: number; monthName: string; year: number; monthIndex: number; formatted: string } {
  // Extract local date fields
  const gYear = date.getFullYear();
  const gMonth = date.getMonth();
  const gDay = date.getDate();

  const ethMonths = [
    "መስከረም", // Meskerem (1) - Sep
    "ጥቅምት",  // Tikimt (2) - Oct
    "ህዳር",    // Hidar (3) - Nov
    "ታህሳስ",  // Tahsas (4) - Dec
    "ጥር",     // Tir (5) - Jan
    "የካቲት",  // Yekatit (6) - Feb
    "መጋቢት",  // Megabit (7) - Mar
    "ሚያዝያ",  // Miyazya (8) - Apr
    "ግንቦት",  // Ginbot (9) - May
    "ሰኔ",     // Sene (10) - Jun
    "ሐምሌ",    // Hamle (11) - Jul
    "ነሐሴ",    // Nehase (12) - Aug
    "ጳጉሜ"    // Pagume (13) - Sep (Short month)
  ];

  // In the modern era (1900-2100), Ethiopian New Year (Meskerem 1) falls on Sep 12 if the previous Gregorian year % 4 === 3. Otherwise, it falls on Sep 11.
  const isPrecursor = (gYear % 4 === 3);
  const meskerem1 = new Date(gYear, 8, isPrecursor ? 12 : 11);

  // Use uniform local dates to calculate exact elapsed day count, bypassing timezone shifts
  const currentLocalDate = new Date(gYear, gMonth, gDay);

  let ethYear = 2000;
  let diffDays = 0;

  if (currentLocalDate.getTime() >= meskerem1.getTime()) {
    ethYear = gYear - 7;
    diffDays = Math.round((currentLocalDate.getTime() - meskerem1.getTime()) / (24 * 60 * 60 * 1000));
  } else {
    ethYear = gYear - 8;
    const prevYear = gYear - 1;
    const prevIsPrecursor = (prevYear % 4 === 3);
    const prevMeskerem1 = new Date(prevYear, 8, prevIsPrecursor ? 12 : 11);
    diffDays = Math.round((currentLocalDate.getTime() - prevMeskerem1.getTime()) / (24 * 60 * 60 * 1000));
  }

  const ethMonthIndex = Math.floor(diffDays / 30);
  const ethDay = (diffDays % 30) + 1;
  const monthName = ethMonths[ethMonthIndex] || "ጳጉሜ";

  return {
    day: ethDay,
    monthName,
    year: ethYear,
    monthIndex: ethMonthIndex,
    formatted: `${monthName} ${ethDay} ቀን ${ethYear} ዓ.ም.`
  };
}

// Convert numbers to Ge'ez numerals
export function toGeezNumeral(num: number): string {
  const geezNumerals: { [key: number]: string } = {
    1: '፩', 2: '፪', 3: '፫', 4: '፬', 5: '፭', 6: '፮', 7: '፯', 8: '፰', 9: '፱',
    10: '፲', 20: '፳', 30: '፴', 40: '四十', // Ge'ez does not have Chinese characters! Let's write them properly:
  };
  // Ge'ez numbers exact mapping:
  // 1=፩, 2=፪, 3=፫, 4=፬, 5=፭, 6=፮, 7=፯, 8=፰, 9=፱
  // 10=፲, 20=፳, 30=፴, 40=፵, 50=፶, 60=፷, 75=፸, 80=፹, 90=፺, 100=፻
  const baseGeez: { [key: number]: string } = {
    1: '፩', 2: '፪', 3: '፫', 4: '፬', 5: '፭', 6: '፮', 7: '፯', 8: '፰', 9: '፱',
    10: '፲', 20: '፳', 30: '፴', 40: '፵', 50: '፶', 60: '፷', 70: '፸', 80: '፹', 90: '፺',
    100: '፻'
  };

  if (num <= 0) return num.toString();
  if (num in baseGeez) return baseGeez[num];

  let result = '';
  const hundreds = Math.floor(num / 100);
  const tens = num % 100;

  if (hundreds > 0) {
    if (hundreds > 1) {
      result += toGeezNumeral(hundreds);
    }
    result += '፻';
  }

  if (tens > 0) {
    if (tens in baseGeez) {
      result += baseGeez[tens];
    } else {
      const tenDigit = Math.floor(tens / 10) * 10;
      const unitDigit = tens % 10;
      if (tenDigit > 0) result += baseGeez[tenDigit];
      if (unitDigit > 0) result += baseGeez[unitDigit];
    }
  }

  return result;
}

// Check Ethiopian public holidays
export interface EthHoliday {
  day: number;
  monthIndex: number;
  nameEn: string;
  nameAm: string;
}

export const ETHIOPIAN_HOLIDAYS: EthHoliday[] = [
  { day: 1, monthIndex: 0, nameEn: "Enkutatash (Ethiopian New Year)", nameAm: "እንቁጣጣሽ (አዲስ ዓመት)" },
  { day: 17, monthIndex: 0, nameEn: "Meskel (Finding of the True Cross)", nameAm: "መስቀል (የደመራ በዓል)" },
  { day: 29, monthIndex: 3, nameEn: "Genna (Ethiopian Christmas)", nameAm: "ገና (የልደት በዓል)" },
  { day: 11, monthIndex: 4, nameEn: "Timkat (Ethiopian Epiphany)", nameAm: "ጥምቀት (የአስተርእዮ በዓል)" },
  { day: 23, monthIndex: 6, nameEn: "Adwa Victory Day", nameAm: "የአድዋ ድል መታሰቢያ" },
  { day: 27, monthIndex: 7, nameEn: "Siklet (Good Friday)", nameAm: "ስቅለት" },
  { day: 29, monthIndex: 7, nameEn: "Fasika (Ethiopian Easter)", nameAm: "ፋሲካ (ትንሣኤ)" },
  { day: 5, monthIndex: 8, nameEn: "Patriots' Victory Day", nameAm: "የአርበኞች ድል መታሰቢያ ቀን" },
];
