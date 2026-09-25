const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DATA_FILE = path.join(__dirname, 'complete_attendance_t9.json');
const EXPORT_DIR = path.join(__dirname, 'tháng 09', 'trích xuất');
const EMPLOYEE_EXPORT_DIR = path.join(EXPORT_DIR, 'chi_tiet_nhan_vien');
const TEMP_DIR = path.join(__dirname, '_temp_html');

if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });
if (!fs.existsSync(EMPLOYEE_EXPORT_DIR)) fs.mkdirSync(EMPLOYEE_EXPORT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

let raw = fs.readFileSync(DATA_FILE, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

function captureHtml(htmlContent, outputPng, width, height) {
  const tempFile = path.join(TEMP_DIR, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempFile, htmlContent, 'utf8');
  const fileUrl = `file:///${tempFile.replace(/\\/g, '/')}`;
  const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=${width},${height} --screenshot="${outputPng}" "${fileUrl}"`;
  execSync(cmd, { stdio: 'ignore' });
  try { fs.unlinkSync(tempFile); } catch (e) {}
}

const cssBase = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #ffffff;
  font-family: Arial, sans-serif;
  padding: 10px;
  width: fit-content;
  display: inline-block;
}
.table-box {
  border: 1px solid #000;
  padding: 10px;
  background: #fff;
  width: 360px;
}
.title {
  text-align: center;
  font-weight: bold;
  font-size: 15px;
  line-height: 1.35;
  margin-bottom: 8px;
  color: #000;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  color: #000;
}
th {
  border: 1px solid #000;
  padding: 5px 6px;
  font-weight: bold;
  background: #fff;
}
td {
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  border-top: 1px dotted #888;
  border-bottom: 1px dotted #888;
  padding: 4px 8px;
}
tr:first-child td { border-top: 1px solid #000; }
tfoot td {
  border: 1px solid #000;
  padding: 6px 8px;
  font-weight: bold;
  font-size: 14px;
}
.bg-blue { background-color: #d9e1f2 !important; }
.bg-orange { background-color: #fce4d6 !important; }
`;

console.log('1. Rendering Table 1: TỔNG SỐ GIỜ THEO NHÂN VIÊN...');
let rowsAll = '';
data.summaryAll.forEach((e, idx) => {
  rowsAll += `<tr>
    <td style="width: 45px; text-align: center;">${idx + 1}</td>
    <td>${e.name}</td>
    <td style="width: 130px; text-align: right; font-weight: 500;">${e.totalHours.toFixed(1)}</td>
  </tr>`;
});

const htmlAll = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${cssBase}</style></head>
<body>
<div class="table-box">
  <div class="title">TỔNG SỐ GIỜ THEO NHÂN VIÊN<br>THÁNG 9.2026</div>
  <table>
    <thead><tr><th style="width: 45px; text-align: center;">STT</th><th>Tên NV</th><th style="width: 130px; text-align: right;">Tổng Số Giờ/Tháng</th></tr></thead>
    <tbody>${rowsAll}</tbody>
    <tfoot><tr class="bg-blue"><td colspan="2">Tổng giờ</td><td style="text-align: right;">${data.grandTotalHours.toFixed(1)}</td></tr></tfoot>
  </table>
</div>
</body></html>`;
captureHtml(htmlAll, path.join(EXPORT_DIR, 'TONG_SO_GIO_THEO_NHAN_VIEN_THANG_9_2026.png'), 400, 620);

console.log('2. Rendering Table 2: TỔNG SỐ GIỜ NHÂN VIÊN VÉ...');
let rowsVe = '';
data.departments['VÉ'].employees.forEach(e => {
  rowsVe += `<tr>
    <td style="width: 45px; text-align: center;">${e.stt}</td>
    <td>${e.name}</td>
    <td style="width: 140px; text-align: right; font-weight: 500;">${e.totalHours.toFixed(1)}</td>
  </tr>`;
});

const htmlVe = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${cssBase}</style></head>
<body>
<div class="table-box">
  <div class="title">TỔNG SỐ GIỜ NHÂN VIÊN VÉ<br>THÁNG 9.2026</div>
  <table>
    <thead><tr><th style="width: 45px; text-align: center;">STT</th><th>TÊN NHÂN VIÊN</th><th style="width: 140px; text-align: right;">TỔNG SỐ GIỜ/THÁNG</th></tr></thead>
    <tbody>${rowsVe}</tbody>
    <tfoot><tr class="bg-orange"><td colspan="2" style="text-align: center;">TỔNG</td><td style="text-align: right;">${data.departments['VÉ'].totalHours.toFixed(1)}</td></tr></tfoot>
  </table>
</div>
</body></html>`;
captureHtml(htmlVe, path.join(EXPORT_DIR, 'TONG_SO_GIO_NHAN_VIEN_VE_THANG_9_2026.png'), 400, 380);

console.log('3. Rendering Table 3: TỔNG SỐ GIỜ NHÂN VIÊN HÀNG...');
let rowsHang = '';
data.departments['HÀNG'].employees.forEach(e => {
  rowsHang += `<tr>
    <td style="width: 45px; text-align: center;">${e.stt}</td>
    <td>${e.name}</td>
    <td style="width: 140px; text-align: right; font-weight: 500;">${e.totalHours.toFixed(1)}</td>
  </tr>`;
});

const htmlHang = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${cssBase}</style></head>
<body>
<div class="table-box">
  <div class="title">TỔNG SỐ GIỜ NHÂN VIÊN HÀNG<br>THÁNG 9.2026</div>
  <table>
    <thead><tr><th style="width: 45px; text-align: center;">STT</th><th>TÊN NHÂN VIÊN</th><th style="width: 140px; text-align: right;">TỔNG SỐ GIỜ/THÁNG</th></tr></thead>
    <tbody>${rowsHang}</tbody>
    <tfoot><tr class="bg-blue"><td colspan="2" style="text-align: center;">TỔNG</td><td style="text-align: right;">${data.departments['HÀNG'].totalHours.toFixed(1)}</td></tr></tfoot>
  </table>
</div>
</body></html>`;
captureHtml(htmlHang, path.join(EXPORT_DIR, 'TONG_SO_GIO_NHAN_VIEN_HANG_THANG_9_2026.png'), 400, 430);

console.log('4. Rendering 14 Individual Employee Detail cards...');
const cssEmp = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #ffffff;
  font-family: Arial, sans-serif;
  padding: 10px;
  width: fit-content;
  display: inline-block;
}
.emp-box {
  border: 1px solid #000;
  padding: 14px;
  background: #fff;
  width: 650px;
}
.title {
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
  color: #000;
}
.subtitle {
  text-align: center;
  font-size: 13.5px;
  color: #333;
  margin-bottom: 12px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  color: #000;
}
th {
  border: 1px solid #000;
  padding: 5px 6px;
  font-weight: bold;
  background: #fafafa;
  text-align: center;
}
td {
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  border-top: 1px dotted #888;
  border-bottom: 1px dotted #888;
  padding: 3px 6px;
  text-align: center;
}
tr:first-child td { border-top: 1px solid #000; }
tfoot td {
  border: 1px solid #000;
  padding: 6px 8px;
  font-weight: bold;
  font-size: 13px;
  background-color: #d9e1f2 !important;
}
`;

Object.values(data.employeeSummary).forEach(emp => {
  let rows = '';
  emp.details.forEach(d => {
    const isOff = d.hours === 0 || d.status === 'OFF';
    rows += `<tr>
      <td style="font-weight: bold;">${d.date.slice(0, 5)}</td>
      <td>${d.dayOfWeek}</td>
      <td>${d.in1 || '—'}</td>
      <td>${d.out1 || '—'}</td>
      <td>${d.in2 || '—'}</td>
      <td>${d.out2 || '—'}</td>
      <td style="font-weight: bold; ${isOff ? 'color: #888;' : ''}">${d.hours > 0 ? d.hours.toFixed(1) : '0'}</td>
      <td style="${isOff ? 'color: #d9534f; font-weight: bold;' : 'color: #3c763d;'}">${d.status}</td>
    </tr>`;
  });

  const htmlEmp = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${cssEmp}</style></head>
<body>
<div class="emp-box">
  <div class="title">BẢNG CHI TIẾT CHẤM CÔNG THÁNG 9.2026</div>
  <div class="subtitle">
    Nhân viên: <b>${emp.name.toUpperCase()}</b> (Khối ${emp.dept}) &nbsp;|&nbsp; 
    Tổng giờ: <b>${emp.totalHours.toFixed(1)}h</b> &nbsp;|&nbsp; 
    Ngày làm: <b>${emp.workingDays}</b> &nbsp;|&nbsp; 
    Ngày nghỉ: <b>${emp.offDays}</b>
  </div>
  <table>
    <thead><tr>
      <th style="width: 45px;">Ngày</th>
      <th style="width: 75px;">Thứ</th>
      <th>Vào sáng</th>
      <th>Ra sáng</th>
      <th>Vào chiều</th>
      <th>Ra chiều</th>
      <th style="width: 55px;">Số giờ</th>
      <th style="width: 75px;">Trạng thái</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="6" style="text-align: right;">TỔNG CỘNG THÁNG 9.2026:</td>
      <td>${emp.totalHours.toFixed(1)}h</td>
      <td></td>
    </tr></tfoot>
  </table>
</div>
</body></html>`;

  const cleanName = emp.name.trim().replace(/\s+/g, '_');
  const empImgPath = path.join(EMPLOYEE_EXPORT_DIR, `Chi_tiet_${cleanName}_T9.2026.png`);
  captureHtml(htmlEmp, empImgPath, 690, 720);
});

// Cleanup temp folder
try {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
} catch (e) {}

console.log('✅ ALL IMAGES SUCCESSFULLY EXPORTED TO:', EXPORT_DIR);
