const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_FILE = path.join(__dirname, 'complete_attendance_t9.json');
const EXPORT_DIR = path.join(__dirname, 'tháng 09', 'trích xuất');
const EMPLOYEE_EXPORT_DIR = path.join(EXPORT_DIR, 'chi_tiet_nhan_vien');

if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });
if (!fs.existsSync(EMPLOYEE_EXPORT_DIR)) fs.mkdirSync(EMPLOYEE_EXPORT_DIR, { recursive: true });

let raw = fs.readFileSync(DATA_FILE, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

console.log('Generating Excel file...');
const wb = XLSX.utils.book_new();

// 1. TimeSheet
const tsRows = [
  ['STT', 'Ngày', 'Thứ', 'Tên NV', 'Bộ phận', 'Vào sáng', 'Ra sáng', 'Vào chiều', 'Ra chiều', 'Số Giờ', 'Trạng thái']
];
let count = 1;
data.dailyDays.forEach(day => {
  day.records.forEach(r => {
    tsRows.push([
      count++,
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

// 2. Sheet Tổng NV
const sumRows = [
  ['TỔNG SỐ GIỜ THEO NHÂN VIÊN THÁNG 9.2026', '', '', '', ''],
  ['STT', 'Tên NV', 'Bộ phận', 'Số ngày làm', 'Số ngày nghỉ', 'Tổng Số Giờ/Tháng']
];
data.summaryAll.forEach((e, idx) => {
  sumRows.push([idx + 1, e.name, e.dept, e.workingDays, e.offDays, e.totalHours]);
});
sumRows.push(['', '', '', '', 'Tổng giờ', data.grandTotalHours]);
sumRows.push([]);
sumRows.push(['TỔNG SỐ GIỜ NHÂN VIÊN VÉ THÁNG 9.2026', '', '', 'TỔNG SỐ GIỜ NHÂN VIÊN HÀNG THÁNG 9.2026', '']);
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

// 3. Sheet Chi Tiết Từng NV
const detailRows = [
  ['BẢNG CHI TIẾT CHẤM CÔNG TỪNG NHÂN VIÊN THÁNG 9.2026'],
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

const excelPath = path.join(EXPORT_DIR, 'Bangchamcong_T9_2026_Trích_Xuất_Full.xlsx');
XLSX.writeFile(wb, excelPath);
console.log('✅ Created Excel file:', excelPath);
