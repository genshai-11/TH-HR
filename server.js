const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const XLSX = require('xlsx');

const PORT = 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const DEPT_MAP = {
  'Chi': 'VÉ', 'Phấn': 'VÉ', 'Phấn ': 'VÉ', 'Sung': 'VÉ', 'Trân': 'VÉ', 'Lệ': 'VÉ', 'Phước': 'VÉ',
  'Tiến': 'HÀNG', 'Chẩn': 'HÀNG', 'Tý': 'HÀNG', 'Quý': 'HÀNG', 'Hoàng': 'HÀNG', 'Gia': 'HÀNG', 'Phúc': 'HÀNG'
};
const ALL_EMPLOYEES = ['Chi', 'Phấn', 'Sung', 'Trân', 'Lệ', 'Phước', 'Tiến', 'Chẩn', 'Tý', 'Quý', 'Hoàng', 'Gia', 'Phúc'];

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      let raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      return JSON.parse(raw);
    } catch (e) {}
  }
  return { activeMonth: 'tháng 09', geminiApiKey: '', autoExtract: true };
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

let config = loadConfig();

function getMonthDir(monthName) {
  return path.join(__dirname, monthName);
}

function getExportDir(monthName) {
  return path.join(__dirname, monthName, 'trích xuất');
}

function getDataFile(monthName) {
  // If month 9, check complete_attendance_t9.json first for backward compatibility
  const t9File = path.join(__dirname, 'complete_attendance_t9.json');
  const monthDataFile = path.join(getMonthDir(monthName), 'attendance_data.json');
  if (monthName === 'tháng 09' && fs.existsSync(t9File) && !fs.existsSync(monthDataFile)) {
    return t9File;
  }
  return monthDataFile;
}

function ensureMonthStructure(monthName) {
  const mDir = getMonthDir(monthName);
  const expDir = getExportDir(monthName);
  const empExpDir = path.join(expDir, 'chi_tiet_nhan_vien');
  const veExpDir = path.join(empExpDir, 'nhan_vien_ve');
  const hangExpDir = path.join(empExpDir, 'nhan_vien_hang');
  if (!fs.existsSync(mDir)) fs.mkdirSync(mDir, { recursive: true });
  if (!fs.existsSync(expDir)) fs.mkdirSync(expDir, { recursive: true });
  if (!fs.existsSync(empExpDir)) fs.mkdirSync(empExpDir, { recursive: true });
  if (!fs.existsSync(veExpDir)) fs.mkdirSync(veExpDir, { recursive: true });
  if (!fs.existsSync(hangExpDir)) fs.mkdirSync(hangExpDir, { recursive: true });
}

function loadMonthData(monthName) {
  ensureMonthStructure(monthName);
  const dataFile = getDataFile(monthName);
  if (fs.existsSync(dataFile)) {
    try {
      let raw = fs.readFileSync(dataFile, 'utf8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error parsing data file:', e);
    }
  }

  // Initialize empty month dataset
  const monthMatch = monthName.match(/\d+/);
  const mNum = monthMatch ? monthMatch[0] : '10';
  const mFormatted = `${mNum.padStart(2, '0')}/2026`;

  const empSum = {};
  ALL_EMPLOYEES.forEach(n => {
    empSum[n] = {
      name: n,
      dept: DEPT_MAP[n] || 'HÀNG',
      totalHours: 0,
      workingDays: 0,
      offDays: 0,
      details: []
    };
  });

  const emptyData = {
    month: mFormatted,
    totalDays: 0,
    grandTotalHours: 0,
    departments: {
      'VÉ': {
        title: `TỔNG SỐ GIỜ NHÂN VIÊN VÉ THÁNG ${mNum}.2026`,
        totalHours: 0,
        employees: ['Chi', 'Phấn', 'Sung', 'Trân', 'Lệ', 'Phước'].map((n, i) => ({ stt: i + 1, name: n.toUpperCase(), totalHours: 0 }))
      },
      'HÀNG': {
        title: `TỔNG SỐ GIỜ NHÂN VIÊN HÀNG THÁNG ${mNum}.2026`,
        totalHours: 0,
        employees: ['Tiến', 'Chẩn', 'Tý', 'Quý', 'Hoàng', 'Gia', 'Phúc'].map((n, i) => ({ stt: i + 1, name: n.toUpperCase(), totalHours: 0 }))
      }
    },
    summaryAll: Object.values(empSum).map((e, idx) => ({
      stt: idx + 1,
      name: e.name,
      dept: e.dept,
      totalHours: 0,
      workingDays: 0,
      offDays: 0
    })),
    employeeSummary: empSum,
    dailyDays: []
  };

  fs.writeFileSync(dataFile, JSON.stringify(emptyData, null, 2), 'utf8');
  return emptyData;
}

function saveMonthData(monthName, data) {
  ensureMonthStructure(monthName);
  const empSum = {};
  ALL_EMPLOYEES.forEach(n => {
    empSum[n] = {
      name: n,
      dept: DEPT_MAP[n] || 'HÀNG',
      totalHours: 0,
      workingDays: 0,
      offDays: 0,
      details: []
    };
  });

  // Sort dailyDays by day
  data.dailyDays.sort((a, b) => a.day - b.day);

  data.dailyDays.forEach(d => {
    ALL_EMPLOYEES.forEach(name => {
      const rec = d.records.find(r => r.name.toLowerCase() === name.toLowerCase()) || {
        stt: 0, name, dept: DEPT_MAP[name] || 'HÀNG', in1: '', out1: '', in2: '', out2: '', hours: 0, status: 'OFF'
      };
      const isWorking = rec.hours > 0;
      empSum[name].totalHours += rec.hours;
      if (isWorking) empSum[name].workingDays += 1;
      else empSum[name].offDays += 1;
      empSum[name].details.push({
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

  ALL_EMPLOYEES.forEach(n => {
    empSum[n].totalHours = parseFloat(empSum[n].totalHours.toFixed(1));
  });

  const monthMatch = monthName.match(/\d+/);
  const mNum = monthMatch ? monthMatch[0] : '09';

  const veEmployees = ['Chi', 'Phấn', 'Sung', 'Trân', 'Lệ', 'Phước'].map((n, idx) => ({
    stt: idx + 1,
    name: n.toUpperCase(),
    totalHours: empSum[n].totalHours
  }));
  const totalVeHours = parseFloat(veEmployees.reduce((s, e) => s + e.totalHours, 0).toFixed(1));

  const hangEmployees = ['Tiến', 'Chẩn', 'Tý', 'Quý', 'Hoàng', 'Gia', 'Phúc'].map((n, idx) => ({
    stt: idx + 1,
    name: n.toUpperCase(),
    totalHours: empSum[n].totalHours
  }));
  const totalHangHours = parseFloat(hangEmployees.reduce((s, e) => s + e.totalHours, 0).toFixed(1));

  data.totalDays = data.dailyDays.length;
  data.grandTotalHours = parseFloat((totalVeHours + totalHangHours).toFixed(1));
  data.departments['VÉ'] = {
    title: `TỔNG SỐ GIỜ NHÂN VIÊN VÉ THÁNG ${mNum}.2026`,
    totalHours: totalVeHours,
    employees: veEmployees
  };
  data.departments['HÀNG'] = {
    title: `TỔNG SỐ GIỜ NHÂN VIÊN HÀNG THÁNG ${mNum}.2026`,
    totalHours: totalHangHours,
    employees: hangEmployees
  };
  data.summaryAll = Object.values(empSum).map((e, idx) => ({
    stt: idx + 1,
    name: e.name,
    dept: e.dept,
    totalHours: e.totalHours,
    workingDays: e.workingDays,
    offDays: e.offDays
  }));
  data.employeeSummary = empSum;

  const dataFile = getDataFile(monthName);
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');

  // Also keep complete_attendance_t9.json in sync if month is tháng 09
  if (monthName === 'tháng 09') {
    const t9File = path.join(__dirname, 'complete_attendance_t9.json');
    fs.writeFileSync(t9File, JSON.stringify(data, null, 2), 'utf8');
  }

  return data;
}

function getAvailableMonths() {
  const dirs = fs.readdirSync(__dirname, { withFileTypes: true })
    .filter(d => d.isDirectory() && (d.name.toLowerCase().startsWith('tháng') || d.name.toLowerCase().startsWith('thang')))
    .map(d => d.name)
    .sort();
  if (!dirs.includes(config.activeMonth)) {
    dirs.push(config.activeMonth);
  }
  return dirs;
}

function generateExcelForMonth(monthName) {
  const data = loadMonthData(monthName);
  const expDir = getExportDir(monthName);
  ensureMonthStructure(monthName);

  const wb = XLSX.utils.book_new();

  // 1. Sheet: TimeSheet
  const tsRows = [
    ['STT', 'Ngày', 'Thứ', 'Tên NV', 'Bộ phận', 'Vào sáng', 'Ra sáng', 'Vào chiều', 'Ra chiều', 'Số Giờ', 'Trạng thái']
  ];
  let sttCount = 1;
  data.dailyDays.forEach(day => {
    day.records.forEach(r => {
      tsRows.push([
        sttCount++,
        day.date,
        day.dayOfWeek,
        r.name,
        r.dept,
        r.in1 || '',
        r.out1 || '',
        r.in2 || '',
        r.out2 || '',
        r.hours,
        r.status
      ]);
    });
  });
  const wsTimeSheet = XLSX.utils.aoa_to_sheet(tsRows);
  XLSX.utils.book_append_sheet(wb, wsTimeSheet, 'TimeSheet');

  // 2. Sheet: Tổng NV
  const mMatch = monthName.match(/\d+/);
  const mNum = mMatch ? mMatch[0] : '09';
  const sumRows = [
    [`TỔNG SỐ GIỜ THEO NHÂN VIÊN THÁNG ${mNum}.2026`, '', '', '', ''],
    ['STT', 'Tên NV', 'Bộ phận', 'Số ngày làm', 'Số ngày nghỉ', 'Tổng Số Giờ/Tháng']
  ];
  data.summaryAll.forEach((e, idx) => {
    sumRows.push([idx + 1, e.name, e.dept, e.workingDays, e.offDays, e.totalHours]);
  });
  sumRows.push(['', '', '', '', 'Tổng giờ', data.grandTotalHours]);
  sumRows.push([]);
  sumRows.push([`TỔNG SỐ GIỜ NHÂN VIÊN VÉ THÁNG ${mNum}.2026`, '', '', `TỔNG SỐ GIỜ NHÂN VIÊN HÀNG THÁNG ${mNum}.2026`, '']);
  sumRows.push(['STT', 'TÊN NHÂN VIÊN', 'TỔNG SỐ GIỜ/THÁNG', 'STT', 'TÊN NHÂN VIÊN', 'TỔNG SỐ GIỜ/THÁNG']);
  
  const veList = data.departments['VÉ'].employees;
  const hangList = data.departments['HÀNG'].employees;
  const maxRows = Math.max(veList.length, hangList.length);
  for (let i = 0; i < maxRows; i++) {
    const v = veList[i] || { stt: '', name: '', totalHours: '' };
    const h = hangList[i] || { stt: '', name: '', totalHours: '' };
    sumRows.push([v.stt, v.name, v.totalHours, h.stt, h.name, h.totalHours]);
  }
  sumRows.push(['', 'TỔNG VÉ', data.departments['VÉ'].totalHours, '', 'TỔNG HÀNG', data.departments['HÀNG'].totalHours]);

  const wsTongNV = XLSX.utils.aoa_to_sheet(sumRows);
  XLSX.utils.book_append_sheet(wb, wsTongNV, 'Tổng NV');

  // 3. Sheet: Chi tiết từng NV
  const detailRows = [
    [`BẢNG CHI TIẾT CHẤM CÔNG TỪNG NHÂN VIÊN THÁNG ${mNum}.2026`],
    ['Tên NV', 'Bộ phận', 'Ngày', 'Thứ', 'Vào sáng', 'Ra sáng', 'Vào chiều', 'Ra chiều', 'Tổng Giờ', 'Trạng thái']
  ];
  Object.values(data.employeeSummary).forEach(emp => {
    emp.details.forEach(d => {
      detailRows.push([
        emp.name, emp.dept, d.date, d.dayOfWeek, d.in1, d.out1, d.in2, d.out2, d.hours, d.status
      ]);
    });
  });
  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Chi Tiết Từng NV');

  const exportExcelPath = path.join(expDir, `Bangchamcong_T${mNum}_2026_Trích_Xuất_Full.xlsx`);
  XLSX.writeFile(wb, exportExcelPath);
  return exportExcelPath;
}

// AI Extraction via Google Gemini Flash
async function callGeminiVision(imageBase64, mimeType, apiKey, monthNum = '09') {
  const prompt = `You are an expert OCR AI for handwritten Vietnamese attendance sheets (BẢNG CHẤM CÔNG).
The company has two departments:
1. KHỐI VÉ: CHI, PHẤN, SUNG, TRÂN, LỆ, PHƯỚC
2. KHỐI HÀNG: TIẾN, CHẨN, TÝ, QUÝ, HOÀNG, GIA, PHÚC, VŨ

Analyze the image carefully. Notice:
- Ngày/Tháng (e.g. 18/9, 22/9). Assume month is ${monthNum} and year 2026 if not specified.
- Thứ (Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6, Thứ 7, Chủ Nhật).
- Employees table with columns: STT, Nhân viên, Giờ lên ca, Giờ xuống ca, Tổng thời gian.
- Handle split shifts (ca gãy) like Tiến (e.g. '4 - 10 - 14 - 20h30' means in1: 04:00, out1: 10:00, in2: 14:00, out2: 20:30).
- Handle off/leaves (OFF, /, gạch chéo).
- Handle blue-pen additions at the bottom (like Phước).
- If the image contains TWO tables (two separate days), extract both tables into an array.

Return ONLY a valid JSON array of day objects (no markdown, no backticks):
[
  {
    "day": 22,
    "date": "22/${monthNum}/2026",
    "dayOfWeek": "Thứ 3",
    "records": [
      { "stt": 1, "name": "Sung", "dept": "VÉ", "in1": "06:00", "out1": "18:00", "in2": "", "out2": "", "hours": 12.0, "status": "Làm việc" },
      { "stt": 2, "name": "Phấn", "dept": "VÉ", "in1": "11:00", "out1": "19:00", "in2": "", "out2": "", "hours": 8.0, "status": "Làm việc" }
    ]
  }
]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const textOutput = json.candidates[0].content.parts[0].text;
  let parsed;
  try {
    parsed = JSON.parse(textOutput);
  } catch (e) {
    const clean = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(clean);
  }
  return Array.isArray(parsed) ? parsed : [parsed];
}

// Background Folder Watcher
let currentWatcher = null;
let watcherDebounce = null;

function setupWatcher(monthName) {
  if (currentWatcher) {
    try { currentWatcher.close(); } catch (e) {}
    currentWatcher = null;
  }

  const mDir = getMonthDir(monthName);
  if (!fs.existsSync(mDir)) return;

  console.log(`👀 Watching folder [${monthName}] for new attendance images...`);
  currentWatcher = fs.watch(mDir, (eventType, filename) => {
    if (!filename) return;
    const ext = path.extname(filename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;
    if (filename.includes('trích xuất') || filename.includes('temp')) return;

    clearTimeout(watcherDebounce);
    watcherDebounce = setTimeout(async () => {
      console.log(`📸 New image detected in [${monthName}]: ${filename}`);
      if (config.autoExtract && config.geminiApiKey) {
        try {
          console.log(`🤖 Auto-extracting ${filename} with Gemini AI...`);
          const imgPath = path.join(mDir, filename);
          const buffer = fs.readFileSync(imgPath);
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          const monthNum = (monthName.match(/\d+/) || ['09'])[0];
          const extractedDays = await callGeminiVision(buffer.toString('base64'), mimeType, config.geminiApiKey, monthNum);

          const data = loadMonthData(monthName);
          extractedDays.forEach(extDay => {
            extDay.image = filename;
            const existingIdx = data.dailyDays.findIndex(d => d.day === extDay.day);
            if (existingIdx !== -1) {
              data.dailyDays[existingIdx] = extDay;
            } else {
              data.dailyDays.push(extDay);
            }
          });

          saveMonthData(monthName, data);
          generateExcelForMonth(monthName);
          console.log(`✅ Successfully extracted & saved ${filename}!`);
        } catch (err) {
          console.error(`❌ Auto-extraction failed for ${filename}:`, err.message);
        }
      }
    }, 2000); // 2 second debounce
  });
}

// Start watcher for current active month
setupWatcher(config.activeMonth);

// Static mime types
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(reqUrl.pathname);

  // Month APIs
  if (pathname === '/api/months' && req.method === 'GET') {
    const months = getAvailableMonths();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      months,
      activeMonth: config.activeMonth
    }));
  }

  if (pathname === '/api/set-month' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { monthName } = JSON.parse(body);
        if (!monthName) throw new Error('Missing monthName');
        config.activeMonth = monthName;
        saveConfig(config);
        ensureMonthStructure(monthName);
        setupWatcher(monthName);
        const data = loadMonthData(monthName);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, activeMonth: monthName, data }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Config APIs
  if (pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      activeMonth: config.activeMonth,
      hasApiKey: !!config.geminiApiKey,
      autoExtract: config.autoExtract
    }));
  }

  if (pathname === '/api/config' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.geminiApiKey !== undefined) config.geminiApiKey = payload.geminiApiKey;
        if (payload.autoExtract !== undefined) config.autoExtract = payload.autoExtract;
        saveConfig(config);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, config: { activeMonth: config.activeMonth, hasApiKey: !!config.geminiApiKey, autoExtract: config.autoExtract } }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Attendance Data APIs
  if (pathname === '/api/data' && req.method === 'GET') {
    const data = loadMonthData(config.activeMonth);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(data));
  }

  // Check unprocessed images in active month
  if (pathname === '/api/unprocessed-images' && req.method === 'GET') {
    const mDir = getMonthDir(config.activeMonth);
    const data = loadMonthData(config.activeMonth);
    const existingImages = new Set(data.dailyDays.map(d => d.image));

    let allImages = [];
    if (fs.existsSync(mDir)) {
      allImages = fs.readdirSync(mDir)
        .filter(f => ['.jpg', '.jpeg', '.png'].includes(path.extname(f).toLowerCase()))
        .map(f => ({
          filename: f,
          isProcessed: existingImages.has(f)
        }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ allImages, total: allImages.length, processed: existingImages.size }));
  }

  // Manual trigger AI extract for an image
  if (pathname === '/api/extract-image' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { filename } = JSON.parse(body);
        if (!config.geminiApiKey) {
          throw new Error('Chưa cấu hình Gemini API Key. Vui lòng nhập API Key trong phần Cài đặt.');
        }
        const mDir = getMonthDir(config.activeMonth);
        const imgPath = path.join(mDir, filename);
        if (!fs.existsSync(imgPath)) throw new Error('File ảnh không tồn tại');

        const ext = path.extname(filename).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        const buffer = fs.readFileSync(imgPath);
        const monthNum = (config.activeMonth.match(/\d+/) || ['09'])[0];
        const extractedDays = await callGeminiVision(buffer.toString('base64'), mimeType, config.geminiApiKey, monthNum);

        const data = loadMonthData(config.activeMonth);
        extractedDays.forEach(extDay => {
          extDay.image = filename;
          const idx = data.dailyDays.findIndex(d => d.day === extDay.day);
          if (idx !== -1) data.dailyDays[idx] = extDay;
          else data.dailyDays.push(extDay);
        });

        const updated = saveMonthData(config.activeMonth, data);
        generateExcelForMonth(config.activeMonth);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, data: updated, extractedDays }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname === '/api/save-day' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const data = loadMonthData(config.activeMonth);
        const dayIdx = data.dailyDays.findIndex(d => d.day === payload.day);
        if (dayIdx !== -1) {
          data.dailyDays[dayIdx].records = payload.records;
          const updated = saveMonthData(config.activeMonth, data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, data: updated }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Day not found' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/save-image' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filename, base64Data, subfolder } = JSON.parse(body);
        const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Clean, 'base64');
        const expDir = getExportDir(config.activeMonth);
        const targetDir = subfolder ? path.join(expDir, subfolder) : expDir;
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        const filePath = path.join(targetDir, filename);
        fs.writeFileSync(filePath, buffer);

        // Auto-classify employee detail images into nhan_vien_ve or nhan_vien_hang
        if (filename.startsWith('Chi_tiet_')) {
          const match = filename.match(/^Chi_tiet_([^_]+)_/);
          if (match) {
            const rawEmpName = match[1];
            const dept = DEPT_MAP[rawEmpName] || 'HÀNG';
            const subDeptFolder = dept === 'VÉ' ? 'nhan_vien_ve' : 'nhan_vien_hang';
            const deptDir = path.join(expDir, 'chi_tiet_nhan_vien', subDeptFolder);
            if (!fs.existsSync(deptDir)) fs.mkdirSync(deptDir, { recursive: true });
            fs.writeFileSync(path.join(deptDir, filename), buffer);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, path: filePath }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/export-excel' && req.method === 'POST') {
    try {
      const excelPath = generateExcelForMonth(config.activeMonth);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, path: excelPath }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (pathname === '/api/open-folder' && req.method === 'POST') {
    const expDir = getExportDir(config.activeMonth);
    ensureMonthStructure(config.activeMonth);
    exec(`explorer.exe "${expDir}"`, (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  // Image serving from active month directory
  if (pathname.startsWith('/image/')) {
    const imgName = pathname.replace('/image/', '');
    let imgPath = path.join(getMonthDir(config.activeMonth), imgName);
    if (!fs.existsSync(imgPath)) {
      imgPath = path.join(__dirname, imgName);
    }
    if (fs.existsSync(imgPath)) {
      const ext = path.extname(imgPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'image/jpeg' });
      return fs.createReadStream(imgPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Image Not Found');
    }
  }

  // Static files in /public
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('File Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`🚀 Attendance Management Web Server running at: http://localhost:${PORT}`);
  console.log(`📁 Active Month: [${config.activeMonth}]`);
});
