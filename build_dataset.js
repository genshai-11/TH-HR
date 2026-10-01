const fs = require('fs');
const path = require('path');

// Departments
const DEPT_MAP = {
  'Chi': 'VÉ',
  'Phấn': 'VÉ',
  'Phấn ': 'VÉ',
  'Sung': 'VÉ',
  'Trân': 'VÉ',
  'Lệ': 'VÉ',
  'Phước': 'VÉ',
  'Tiến': 'HÀNG',
  'Chẩn': 'HÀNG',
  'Tý': 'HÀNG',
  'Quý': 'HÀNG',
  'Hoàng': 'HÀNG',
  'Gia': 'HÀNG',
  'Phúc': 'HÀNG'
};

// Days 1 to 6 from existing excel file
let rawExisting = fs.readFileSync(path.join(__dirname, 'existing_days_1_to_6.json'), 'utf8');
if (rawExisting.charCodeAt(0) === 0xFEFF) {
  rawExisting = rawExisting.slice(1);
}
const existingDays = JSON.parse(rawExisting);

// Convert excel time serial to "HH:mm" string

function parseTimeToMinutes(t) {
  if (!t || typeof t !== 'string' || t === 'OFF') return null;
  const parts = t.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function calculateRowHours(in1, out1, in2, out2, fallbackHours) {
  const mIn1 = parseTimeToMinutes(in1);
  const mOut1 = parseTimeToMinutes(out1);
  const mIn2 = parseTimeToMinutes(in2);
  const mOut2 = parseTimeToMinutes(out2);

  let totalMinutes = 0;
  let hasShiftTime = false;

  if (mIn1 !== null && mOut1 !== null && mOut1 >= mIn1) {
    totalMinutes += (mOut1 - mIn1);
    hasShiftTime = true;
  }
  if (mIn2 !== null && mOut2 !== null && mOut2 >= mIn2) {
    totalMinutes += (mOut2 - mIn2);
    hasShiftTime = true;
  }

  if (hasShiftTime) {
    return Math.floor(totalMinutes / 30) * 0.5;
  }

  const rawH = typeof fallbackHours === 'number' ? fallbackHours : parseFloat(fallbackHours || 0);
  if (isNaN(rawH) || rawH <= 0) return 0;
  return Math.floor(rawH * 2) / 2;
}

function serialToTime(val) {
  if (!val || val === 'OFF') return val || '';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  const totalMinutes = Math.round(num * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

const allDays = [];

// Group days 1 to 6
const dMap = {};
existingDays.forEach(r => {
  const ds = parseInt(r.DateSerial);
  if (!dMap[ds]) dMap[ds] = [];
  dMap[ds].push(r);
});

const dayWeekNames = {
  46266: 'Thứ 3',
  46267: 'Thứ 4',
  46268: 'Thứ 5',
  46269: 'Thứ 6',
  46270: 'Thứ 7',
  46271: 'Chủ Nhật'
};

const dayImages = {
  46266: '1788336026506_192523427731101477_g650336099157832072_h.jpg',
  46267: '1788423277374_6771352507305188214_g650336099157832072_h.jpg',
  46268: '1788529691443_6771352507305188214_g650336099157832072_h.jpg',
  46269: '1788593061591_6771352507305188214_g650336099157832072_h.jpg',
  46270: '1788687024441_6771352507305188214_g650336099157832072_h.jpg',
  46271: '1788766529079_6771352507305188214_g650336099157832072_h.jpg'
};

for (let ds = 46266; ds <= 46271; ds++) {
  const dayNum = ds - 46266 + 1;
  const dateStr = `${String(dayNum).padStart(2, '0')}/09/2026`;
  const records = (dMap[ds] || []).map((r, idx) => {
    const rawName = (r.Name || '').trim();
    const in1 = serialToTime(r.In1);
    const out1 = serialToTime(r.Out1);
    const in2 = serialToTime(r.In2);
    const out2 = serialToTime(r.Out2);
    const calculatedHours = calculateRowHours(in1, out1, in2, out2, r.Hours);
    const isOff = r.In1 === 'OFF' || calculatedHours === 0;
    return {
      stt: idx + 1,
      name: rawName,
      dept: DEPT_MAP[rawName] || 'KHÁC',
      in1,
      out1,
      in2,
      out2,
      hours: calculatedHours,
      status: isOff ? 'OFF' : 'Làm việc'
    };
  });

  allDays.push({
    dateSerial: ds,
    day: dayNum,
    date: dateStr,
    dayOfWeek: dayWeekNames[ds],
    image: dayImages[ds],
    records
  });
}

// Days 7 to 21 extracted data
const manualDays = [
  {
    day: 7,
    dateSerial: 46272,
    dayOfWeek: 'Thứ 2',
    image: '1788848823185_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Phấn', in1: '11:00', out1: '18:00', in2: '', out2: '', hours: 7.0 },
      { name: 'Chi', in1: '07:30', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:00', out2: '20:30', hours: 13.0 },
      { name: 'Chẩn', in1: '10:15', out1: '22:30', in2: '', out2: '', hours: 12.0 },
      { name: 'Gia', in1: '07:30', out1: '17:30', in2: '', out2: '', hours: 10.0 },
      { name: 'Phúc', in1: '08:00', out1: '19:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Tý', in1: '10:00', out1: '21:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 8,
    dateSerial: 46273,
    dayOfWeek: 'Thứ 3',
    image: '1788942498319_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '17:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Phấn', in1: '10:00', out1: '18:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Chi', in1: '07:00', out1: '15:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:30', out2: '20:30', hours: 12.5 },
      { name: 'Chẩn', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '07:45', out1: '17:30', in2: '', out2: '', hours: 9.5 },
      { name: 'Phúc', in1: '08:05', out1: '18:45', in2: '', out2: '', hours: 10.5 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '18:50', in2: '', out2: '', hours: 9.5 },
      { name: 'Tý', in1: '10:10', out1: '21:00', in2: '', out2: '', hours: 10.5 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 9,
    dateSerial: 46274,
    dayOfWeek: 'Thứ 4',
    image: '1789113516023_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '16:30', in2: '', out2: '', hours: 10.5 },
      { name: 'Phấn', in1: '11:00', out1: '18:30', in2: '', out2: '', hours: 7.5 },
      { name: 'Chi', in1: '07:30', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:00', in2: '14:00', out2: '20:30', hours: 12.5 },
      { name: 'Chẩn', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '08:00', out1: '18:30', in2: '', out2: '', hours: 10.5 },
      { name: 'Phúc', in1: '08:03', out1: '20:10', in2: '', out2: '', hours: 12.0 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '19:30', in2: '', out2: '', hours: 10.5 },
      { name: 'Tý', in1: '10:10', out1: '21:10', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 10,
    dateSerial: 46275,
    dayOfWeek: 'Thứ 5',
    image: '1789113516023_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Phấn', in1: '10:00', out1: '19:00', in2: '', out2: '', hours: 9.0 },
      { name: 'Chi', in1: '07:00', out1: '15:20', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:00', in2: '14:00', out2: '20:30', hours: 12.5 },
      { name: 'Chẩn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Gia', in1: '08:00', out1: '21:10', in2: '', out2: '', hours: 13.0 },
      { name: 'Phúc', in1: '08:00', out1: '21:00', in2: '', out2: '', hours: 13.0 },
      { name: 'Quý', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Hoàng', in1: '09:00', out1: '22:30', in2: '', out2: '', hours: 13.5 },
      { name: 'Tý', in1: '10:00', out1: '21:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '17:30', in2: '19:30', out2: '22:00', hours: 6.0 }
    ]
  },
  {
    day: 11,
    dateSerial: 46276,
    dayOfWeek: 'Thứ 6',
    image: '1789197624841_6771352507305188214_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '17:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Phấn', in1: '11:00', out1: '18:30', in2: '', out2: '', hours: 7.5 },
      { name: 'Chi', in1: '07:30', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:00', in2: '14:00', out2: '20:00', hours: 12.0 },
      { name: 'Chẩn', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '08:00', out1: '19:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Phúc', in1: '10:00', out1: '22:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '21:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Tý', in1: '10:00', out1: '21:10', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '22:30', in2: '', out2: '', hours: 8.5 }
    ]
  },
  {
    day: 12,
    dateSerial: 46277,
    dayOfWeek: 'Thứ 7',
    image: '1789282146792_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '17:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Phấn', in1: '10:00', out1: '18:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Chi', in1: '07:00', out1: '15:30', in2: '', out2: '', hours: 8.5 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:00', out2: '20:30', hours: 13.0 },
      { name: 'Chẩn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Gia', in1: '08:00', out1: '18:50', in2: '', out2: '', hours: 10.5 },
      { name: 'Phúc', in1: '10:00', out1: '20:40', in2: '', out2: '', hours: 10.5 },
      { name: 'Quý', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Hoàng', in1: '09:00', out1: '22:30', in2: '', out2: '', hours: 13.5 },
      { name: 'Tý', in1: '10:10', out1: '21:25', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '21:45', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 13,
    dateSerial: 46278,
    dayOfWeek: 'Chủ Nhật',
    image: '1789374690120_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '16:00', in2: '', out2: '', hours: 10.0 },
      { name: 'Phấn', in1: '11:00', out1: '18:30', in2: '', out2: '', hours: 7.5 },
      { name: 'Chi', in1: '07:00', out1: '15:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '', out2: '', hours: 6.5 },
      { name: 'Chẩn', in1: '09:00', out1: '20:10', in2: '', out2: '', hours: 11.0 },
      { name: 'Gia', in1: '08:00', out1: '19:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Phúc', in1: '09:00', out1: '17:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Quý', in1: '13:00', out1: '22:45', in2: '', out2: '', hours: 9.5 },
      { name: 'Hoàng', in1: '12:00', out1: '22:45', in2: '', out2: '', hours: 10.5 },
      { name: 'Tý', in1: '10:00', out1: '21:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 14,
    dateSerial: 46279,
    dayOfWeek: 'Thứ 2',
    image: '1789456501409_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '17:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Phấn', in1: '11:00', out1: '18:30', in2: '', out2: '', hours: 7.5 },
      { name: 'Chi', in1: '07:30', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:00', out2: '19:30', hours: 12.0 },
      { name: 'Chẩn', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '07:45', out1: '17:45', in2: '', out2: '', hours: 10.0 },
      { name: 'Phúc', in1: '10:00', out1: '21:40', in2: '', out2: '', hours: 11.5 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:00', out1: '21:20', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '21:45', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 15,
    dateSerial: 46280,
    dayOfWeek: 'Thứ 3',
    image: '1789713611677_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Phấn', in1: '10:00', out1: '18:30', in2: '', out2: '', hours: 8.5 },
      { name: 'Chi', in1: '07:05', out1: '15:20', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:00', in2: '14:00', out2: '20:00', hours: 12.0 },
      { name: 'Chẩn', in1: '10:05', out1: '22:30', in2: '', out2: '', hours: 12.0 },
      { name: 'Gia', in1: '08:00', out1: '17:30', in2: '', out2: '', hours: 9.5 },
      { name: 'Phúc', in1: '10:00', out1: '20:30', in2: '', out2: '', hours: 10.5 },
      { name: 'Quý', in1: '12:00', out1: '22:30', in2: '', out2: '', hours: 10.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:00', out1: '21:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 16,
    dateSerial: 46281,
    dayOfWeek: 'Thứ 4',
    image: '1789713611677_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Phấn', in1: '11:00', out1: '18:30', in2: '', out2: '', hours: 7.5 },
      { name: 'Chi', in1: '07:30', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '11:00', in2: '14:00', out2: '20:30', hours: 13.5 },
      { name: 'Chẩn', in1: '10:00', out1: '22:40', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '08:10', out1: '17:30', in2: '', out2: '', hours: 9.0 },
      { name: 'Phúc', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Quý', in1: '11:00', out1: '22:40', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:30', out1: '20:30', in2: '', out2: '', hours: 11.0 },
      { name: 'Tý', in1: '10:45', out1: '21:15', in2: '', out2: '', hours: 10.5 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '21:45', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 17,
    dateSerial: 46282,
    dayOfWeek: 'Thứ 5',
    image: '1789890658267_192523427731101477_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Phấn', in1: '10:00', out1: '18:30', in2: '', out2: '', hours: 8.5 },
      { name: 'Chi', in1: '07:00', out1: '15:15', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '11:00', in2: '14:30', out2: '20:30', hours: 13.0 },
      { name: 'Chẩn', in1: '10:00', out1: '22:45', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '08:00', out1: '18:00', in2: '', out2: '', hours: 10.0 },
      { name: 'Phúc', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Quý', in1: '11:00', out1: '22:45', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:45', out1: '21:15', in2: '', out2: '', hours: 10.5 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '12:00', out1: '21:45', in2: '', out2: '', hours: 9.5 }
    ]
  },
  {
    day: 18,
    dateSerial: 46283,
    dayOfWeek: 'Thứ 6',
    image: '1789890696294_192523427731101477_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Phấn', in1: '11:00', out1: '19:30', in2: '', out2: '', hours: 8.5 },
      { name: 'Chi', in1: '07:30', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '11:00', in2: '14:30', out2: '20:30', hours: 13.0 },
      { name: 'Chẩn', in1: '10:00', out1: '23:00', in2: '', out2: '', hours: 13.0 },
      { name: 'Gia', in1: '08:00', out1: '19:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Phúc', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Quý', in1: '11:00', out1: '23:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:00', out1: '21:15', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '22:00', in2: '', out2: '', hours: 8.0 }
    ]
  },
  {
    day: 19,
    dateSerial: 46284,
    dayOfWeek: 'Thứ 7',
    image: '1789890696294_192523427731101477_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Phấn', in1: '10:00', out1: '15:00', in2: '', out2: '', hours: 5.0 },
      { name: 'Chi', in1: '07:00', out1: '15:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:00', out2: '20:30', hours: 13.0 },
      { name: 'Chẩn', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '07:40', out1: '18:50', in2: '', out2: '', hours: 11.0 },
      { name: 'Phúc', in1: '10:03', out1: '21:20', in2: '', out2: '', hours: 11.0 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:00', out1: '21:25', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '22:00', in2: '', out2: '', hours: 8.0 }
    ]
  },
  {
    day: 20,
    dateSerial: 46285,
    dayOfWeek: 'Chủ Nhật',
    image: '1790129148770_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '16:00', in2: '', out2: '', hours: 10.0 },
      { name: 'Phấn', in1: '11:00', out1: '19:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Chi', in1: '07:00', out1: '15:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:00', in2: '', out2: '', hours: 6.0 },
      { name: 'Chẩn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Gia', in1: '07:30', out1: '18:00', in2: '', out2: '', hours: 10.5 },
      { name: 'Phúc', in1: '09:00', out1: '20:45', in2: '', out2: '', hours: 11.5 },
      { name: 'Quý', in1: '12:00', out1: '22:30', in2: '', out2: '', hours: 10.5 },
      { name: 'Hoàng', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Tý', in1: '10:00', out1: '21:10', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 21,
    dateSerial: 46286,
    dayOfWeek: 'Thứ 2',
    image: '1790129177458_4038253213440625796_g650336099157832072_h.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Phấn', in1: '11:00', out1: '19:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Chi', in1: '07:30', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:00', in2: '14:00', out2: '20:30', hours: 12.5 },
      { name: 'Chẩn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Gia', in1: '07:30', out1: '17:45', in2: '', out2: '', hours: 10.0 },
      { name: 'Phúc', in1: '09:00', out1: '21:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Quý', in1: '10:00', out1: '23:00', in2: '', out2: '', hours: 13.0 },
      { name: 'Hoàng', in1: '09:00', out1: '23:00', in2: '', out2: '', hours: 14.0 },
      { name: 'Tý', in1: '10:00', out1: '21:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '22:00', in2: '', out2: '', hours: 8.0 }
    ]
  },
  {
    day: 22,
    dateSerial: 46287,
    dayOfWeek: 'Thứ 3',
    image: '2209.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Phấn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Chi', in1: '07:08', out1: '15:23', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:00', out2: '20:00', hours: 12.5 },
      { name: 'Chẩn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Gia', in1: '08:00', out1: '17:30', in2: '', out2: '', hours: 9.5 },
      { name: 'Phúc', in1: '09:00', out1: '21:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Quý', in1: '10:00', out1: '22:45', in2: '', out2: '', hours: 12.5 },
      { name: 'Hoàng', in1: '09:00', out1: '22:45', in2: '', out2: '', hours: 13.5 },
      { name: 'Tý', in1: '10:05', out1: '21:15', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 23,
    dateSerial: 46288,
    dayOfWeek: 'Thứ 4',
    image: '2309.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Phấn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Chi', in1: '07:30', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:30', out2: '20:30', hours: 12.5 },
      { name: 'Chẩn', in1: '10:10', out1: '22:30', in2: '', out2: '', hours: 12.0 },
      { name: 'Gia', in1: '08:00', out1: '18:00', in2: '', out2: '', hours: 10.0 },
      { name: 'Phúc', in1: '10:00', out1: '21:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:00', out1: '21:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: '06:30', out1: '14:00', in2: '', out2: '', hours: 7.5 },
      { name: 'Phước', in1: '14:00', out1: '22:00', in2: '', out2: '', hours: 8.0 }
    ]
  },
  {
    day: 24,
    dateSerial: 46289,
    dayOfWeek: 'Thứ 5',
    image: '2409.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Phấn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Chi', in1: '07:00', out1: '15:15', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:00', out2: '20:30', hours: 13.0 },
      { name: 'Chẩn', in1: '10:00', out1: '22:40', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '07:30', out1: '17:45', in2: '', out2: '', hours: 10.0 },
      { name: 'Phúc', in1: '10:00', out1: '21:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Quý', in1: '11:00', out1: '22:40', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:00', out1: '21:15', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '22:00', in2: '', out2: '', hours: 8.0 }
    ]
  },
  {
    day: 25,
    dateSerial: 46290,
    dayOfWeek: 'Thứ 6',
    image: '2509.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Phấn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Chi', in1: '07:30', out1: '15:15', in2: '', out2: '', hours: 7.5 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:00', out2: '20:30', hours: 13.0 },
      { name: 'Chẩn', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '08:00', out1: '17:30', in2: '', out2: '', hours: 9.5 },
      { name: 'Phúc', in1: '10:00', out1: '21:45', in2: '', out2: '', hours: 11.5 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:45', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:10', out1: '21:10', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '22:30', in2: '', out2: '', hours: 8.5 }
    ]
  },
  {
    day: 26,
    dateSerial: 46291,
    dayOfWeek: 'Thứ 7',
    image: '2609.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '17:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Phấn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Chi', in1: '07:02', out1: '15:02', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:00', out2: '20:30', hours: 13.0 },
      { name: 'Chẩn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Gia', in1: '07:45', out1: '17:45', in2: '', out2: '', hours: 10.0 },
      { name: 'Phúc', in1: '09:00', out1: '22:00', in2: '', out2: '', hours: 13.0 },
      { name: 'Quý', in1: '10:00', out1: '22:45', in2: '', out2: '', hours: 12.5 },
      { name: 'Hoàng', in1: '09:00', out1: '22:45', in2: '', out2: '', hours: 13.5 },
      { name: 'Tý', in1: '10:00', out1: '21:20', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 27,
    dateSerial: 46292,
    dayOfWeek: 'Chủ Nhật',
    image: '272809.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '16:30', in2: '', out2: '', hours: 10.5 },
      { name: 'Phấn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Chi', in1: '07:00', out1: '15:15', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:00', in2: '', out2: '', hours: 6.0 },
      { name: 'Chẩn', in1: '10:00', out1: '22:40', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '08:00', out1: '18:00', in2: '', out2: '', hours: 10.0 },
      { name: 'Phúc', in1: '09:00', out1: '17:00', in2: '', out2: '', hours: 8.0 },
      { name: 'Quý', in1: '13:00', out1: '22:40', in2: '', out2: '', hours: 9.5 },
      { name: 'Hoàng', in1: '12:00', out1: '20:30', in2: '', out2: '', hours: 8.5 },
      { name: 'Tý', in1: '10:00', out1: '21:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 28,
    dateSerial: 46293,
    dayOfWeek: 'Thứ 2',
    image: '272809.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Phấn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Chi', in1: '07:20', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '15:00', out2: '19:30', hours: 11.0 },
      { name: 'Chẩn', in1: '10:00', out1: '22:30', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '08:00', out1: '17:40', in2: '', out2: '', hours: 9.5 },
      { name: 'Phúc', in1: '10:00', out1: '13:30', in2: '18:15', out2: '20:30', hours: 5.5 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:05', out1: '21:05', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '21:30', in2: '', out2: '', hours: 7.5 }
    ]
  },
  {
    day: 29,
    dateSerial: 46294,
    dayOfWeek: 'Thứ 3',
    image: '2909.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '18:00', in2: '', out2: '', hours: 12.0 },
      { name: 'Phấn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Chi', in1: '07:00', out1: '15:15', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '11:30', in2: '14:00', out2: '19:30', hours: 13.0 },
      { name: 'Chẩn', in1: '10:00', out1: '22:40', in2: '', out2: '', hours: 12.5 },
      { name: 'Gia', in1: '07:00', out1: '21:15', in2: '', out2: '', hours: 14.0 },
      { name: 'Phúc', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Quý', in1: '11:00', out1: '22:40', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:15', out1: '21:15', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Phước', in1: '14:00', out1: '21:00', in2: '', out2: '', hours: 7.0 }
    ]
  },
  {
    day: 30,
    dateSerial: 46295,
    dayOfWeek: 'Thứ 4',
    image: '3009.jpg',
    rows: [
      { name: 'Sung', in1: '06:00', out1: '17:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Phấn', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Chi', in1: '07:30', out1: '15:30', in2: '', out2: '', hours: 8.0 },
      { name: 'Trân', in1: 'OFF', out1: '', in2: '', out2: '', hours: 0.0 },
      { name: 'Tiến', in1: '04:00', out1: '10:30', in2: '14:00', out2: '20:00', hours: 12.5 },
      { name: 'Chẩn', in1: '10:05', out1: '22:30', in2: '', out2: '', hours: 12.0 },
      { name: 'Gia', in1: '08:30', out1: '19:00', in2: '', out2: '', hours: 10.5 },
      { name: 'Phúc', in1: '11:02', out1: '20:45', in2: '', out2: '', hours: 9.5 },
      { name: 'Quý', in1: '11:00', out1: '22:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Hoàng', in1: '09:00', out1: '20:30', in2: '', out2: '', hours: 11.5 },
      { name: 'Tý', in1: '10:00', out1: '21:00', in2: '', out2: '', hours: 11.0 },
      { name: 'Lệ', in1: '06:30', out1: '13:30', in2: '', out2: '', hours: 7.0 },
      { name: 'Phước', in1: '14:00', out1: '21:15', in2: '', out2: '', hours: 7.0 }
    ]
  }
];

manualDays.forEach(md => {
  const dateStr = `${String(md.day).padStart(2, '0')}/09/2026`;
  const records = md.rows.map((r, idx) => {
    const calculatedHours = calculateRowHours(r.in1, r.out1, r.in2, r.out2, r.hours);
    return {
      stt: idx + 1,
      name: r.name,
      dept: DEPT_MAP[r.name] || 'KHÁC',
      in1: r.in1,
      out1: r.out1,
      in2: r.in2,
      out2: r.out2,
      hours: calculatedHours,
      status: r.in1 === 'OFF' || calculatedHours === 0 ? 'OFF' : 'Làm việc'
    };
  });

  allDays.push({
    dateSerial: md.dateSerial,
    day: md.day,
    date: dateStr,
    dayOfWeek: md.dayOfWeek,
    image: md.image,
    records
  });
});

// Calculate employee totals
const employeeSummary = {};
// List of all employees to track (excluding Vũ since no attendance record)
const allEmployeeNames = ['Chi', 'Phấn', 'Sung', 'Trân', 'Lệ', 'Phước', 'Tiến', 'Chẩn', 'Tý', 'Quý', 'Hoàng', 'Gia', 'Phúc'];

allEmployeeNames.forEach(name => {
  employeeSummary[name] = {
    name,
    dept: DEPT_MAP[name] || 'HÀNG',
    totalHours: 0,
    workingDays: 0,
    offDays: 0,
    details: []
  };
});

allDays.forEach(d => {
  allEmployeeNames.forEach(name => {
    const rec = d.records.find(r => r.name.toLowerCase() === name.toLowerCase()) || {
      stt: 0,
      name,
      dept: DEPT_MAP[name] || 'HÀNG',
      in1: '',
      out1: '',
      in2: '',
      out2: '',
      hours: 0,
      status: 'OFF'
    };

    const isWorking = rec.hours > 0;
    employeeSummary[name].totalHours += rec.hours;
    if (isWorking) {
      employeeSummary[name].workingDays += 1;
    } else {
      employeeSummary[name].offDays += 1;
    }

    employeeSummary[name].details.push({
      day: d.day,
      date: d.date,
      dayOfWeek: d.dayOfWeek,
      in1: rec.in1,
      out1: rec.out1,
      in2: rec.in2,
      out2: rec.out2,
      hours: rec.hours,
      status: isWorking ? 'Làm việc' : 'OFF'
    });
  });
});

Object.keys(employeeSummary).forEach(k => {
  employeeSummary[k].totalHours = Math.round(employeeSummary[k].totalHours * 10) / 10;
});

// Department summaries
const veEmployees = ['Chi', 'Phấn', 'Sung', 'Trân', 'Lệ', 'Phước'];
const hangEmployees = ['Tiến', 'Chẩn', 'Tý', 'Quý', 'Hoàng', 'Gia', 'Phúc'];

const summaryVe = veEmployees.map((name, idx) => ({
  stt: idx + 1,
  name: name.toUpperCase(),
  totalHours: employeeSummary[name].totalHours
}));
const totalVeHours = Math.round(summaryVe.reduce((sum, e) => sum + e.totalHours, 0) * 10) / 10;

const summaryHang = hangEmployees.map((name, idx) => ({
  stt: idx + 1,
  name: name.toUpperCase(),
  totalHours: employeeSummary[name].totalHours
}));
const totalHangHours = Math.round(summaryHang.reduce((sum, e) => sum + e.totalHours, 0) * 10) / 10;

// Overall summary (sorted by total hours or template order)
const summaryAll = Object.values(employeeSummary).map((e, idx) => ({
  stt: idx + 1,
  name: e.name,
  dept: e.dept,
  totalHours: e.totalHours,
  workingDays: e.workingDays,
  offDays: e.offDays
}));
const grandTotalHours = Math.round((totalVeHours + totalHangHours) * 10) / 10;

const completeData = {
  month: '09/2026',
  totalDays: allDays.length,
  grandTotalHours,
  departments: {
    'VÉ': {
      title: 'TỔNG SỐ GIỜ NHÂN VIÊN VÉ THÁNG 9.2026',
      totalHours: totalVeHours,
      employees: summaryVe
    },
    'HÀNG': {
      title: 'TỔNG SỐ GIỜ NHÂN VIÊN HÀNG THÁNG 9.2026',
      totalHours: totalHangHours,
      employees: summaryHang
    }
  },
  summaryAll,
  employeeSummary,
  dailyDays: allDays
};

fs.writeFileSync(path.join(__dirname, 'complete_attendance_t9.json'), JSON.stringify(completeData, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'tháng 09', 'attendance_data.json'), JSON.stringify(completeData, null, 2), 'utf8');
console.log('✅ Generated complete_attendance_t9.json successfully!');
console.log(`Total Days: ${allDays.length}`);
console.log(`Total Vé Hours: ${totalVeHours}`);
console.log(`Total Hàng Hours: ${totalHangHours}`);
console.log(`Grand Total Hours: ${grandTotalHours}`);
