// Attendance Web App Client Logic (Enhanced Multi-Month & AI)
let appData = null;
let currentEmployeeName = 'Sung';
let currentAuditDay = 1;
let currentZoom = 1.0;
let activeMonth = 'tháng 09';
let appConfig = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadConfigAndMonths();
  bindGlobalEvents();
});

// Toast notification helper
function showToast(message, duration = 3500) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Tab navigation
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      document.getElementById(target).classList.add('active');

      if (target === 'tab-audit') {
        renderAuditView();
      }
    });
  });
}

// Load month list and system config
async function loadConfigAndMonths() {
  try {
    const [cfgRes, mRes] = await Promise.all([
      fetch('/api/config'),
      fetch('/api/months')
    ]);
    appConfig = await cfgRes.json();
    const monthsData = await mRes.json();

    activeMonth = monthsData.activeMonth || 'tháng 09';
    document.getElementById('lblActiveFolder').textContent = activeMonth;

    const select = document.getElementById('selectActiveMonth');
    select.innerHTML = '';
    monthsData.months.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m.toUpperCase();
      if (m === activeMonth) opt.selected = true;
      select.appendChild(opt);
    });

    select.onchange = async (e) => {
      await switchMonth(e.target.value);
    };

    await loadData();
  } catch (e) {
    showToast('Lỗi khi tải cấu hình: ' + e.message);
  }
}

async function switchMonth(monthName) {
  try {
    showToast(`⏳ Đang chuyển sang ${monthName}...`);
    const res = await fetch('/api/set-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthName })
    });
    const result = await res.json();
    if (result.success) {
      activeMonth = monthName;
      document.getElementById('lblActiveFolder').textContent = activeMonth;
      appData = result.data;
      currentAuditDay = appData.dailyDays.length > 0 ? appData.dailyDays[0].day : 1;
      updateUI();
      showToast(`✅ Đã chuyển sang kỳ chấm công: ${monthName.toUpperCase()}`);
    }
  } catch (err) {
    showToast('Lỗi khi đổi tháng: ' + err.message);
  }
}

// Fetch data from backend for active month
async function loadData() {
  try {
    const res = await fetch('/api/data');
    appData = await res.json();
    updateUI();
  } catch (err) {
    showToast('Lỗi khi tải dữ liệu: ' + err.message);
  }
}

function updateUI() {
  if (!appData) return;
  const mMatch = activeMonth.match(/\d+/);
  const mNum = mMatch ? mMatch[0] : '09';

  document.getElementById('mockTitleAll').innerHTML = `TỔNG SỐ GIỜ THEO NHÂN VIÊN<br>THÁNG ${mNum}.2026`;
  document.getElementById('mockTitleVe').innerHTML = `TỔNG SỐ GIỜ NHÂN VIÊN VÉ<br>THÁNG ${mNum}.2026`;
  document.getElementById('mockTitleHang').innerHTML = `TỔNG SỐ GIỜ NHÂN VIÊN HÀNG<br>THÁNG ${mNum}.2026`;

  renderKPIs();
  renderTabOverview();
  renderTabEmployee();
  setupAuditDaySelect();
  renderAuditView();
}

// Render top KPIs
function renderKPIs() {
  if (!appData) return;
  document.getElementById('kpiGrandTotal').innerHTML = `${appData.grandTotalHours.toLocaleString()} <span class="unit">giờ</span>`;
  document.getElementById('kpiVeTotal').innerHTML = `${appData.departments['VÉ'].totalHours.toLocaleString()} <span class="unit">giờ</span>`;
  document.getElementById('kpiHangTotal').innerHTML = `${appData.departments['HÀNG'].totalHours.toLocaleString()} <span class="unit">giờ</span>`;
  document.getElementById('kpiDaysProgress').innerHTML = `${appData.totalDays} <span class="unit">ngày</span>`;
  document.getElementById('kpiImagesCount').textContent = `${appData.dailyDays.length} Ngày có ảnh đối soát`;
}

// TAB 1: Render Overview Tables
function renderTabOverview() {
  if (!appData) return;

  // 1. All Employees Table
  const tbodyAll = document.getElementById('tbody-overview-all');
  tbodyAll.innerHTML = '';
  appData.summaryAll.forEach((emp, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">${idx + 1}</td>
      <td>${emp.name}</td>
      <td style="text-align: right; font-weight: 500;">${emp.totalHours.toFixed(1)}</td>
    `;
    tbodyAll.appendChild(tr);
  });
  document.getElementById('tfoot-all-total').textContent = appData.grandTotalHours.toFixed(1);

  // 2. Vé Department Table
  const tbodyVe = document.getElementById('tbody-overview-ve');
  tbodyVe.innerHTML = '';
  appData.departments['VÉ'].employees.forEach(emp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">${emp.stt}</td>
      <td>${emp.name}</td>
      <td style="text-align: right; font-weight: 500;">${emp.totalHours.toFixed(1)}</td>
    `;
    tbodyVe.appendChild(tr);
  });
  document.getElementById('tfoot-ve-total').textContent = appData.departments['VÉ'].totalHours.toFixed(1);

  // 3. Hàng Department Table
  const tbodyHang = document.getElementById('tbody-overview-hang');
  tbodyHang.innerHTML = '';
  appData.departments['HÀNG'].employees.forEach(emp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">${emp.stt}</td>
      <td>${emp.name}</td>
      <td style="text-align: right; font-weight: 500;">${emp.totalHours.toFixed(1)}</td>
    `;
    tbodyHang.appendChild(tr);
  });
  document.getElementById('tfoot-hang-total').textContent = appData.departments['HÀNG'].totalHours.toFixed(1);
}

// TAB 2: Render Employee Tab
function renderTabEmployee() {
  if (!appData) return;

  const listVe = document.getElementById('emp-list-ve');
  const listHang = document.getElementById('emp-list-hang');
  listVe.innerHTML = '';
  listHang.innerHTML = '';

  const veNames = ['Chi', 'Phấn', 'Sung', 'Trân', 'Lệ', 'Phước'];
  const hangNames = ['Tiến', 'Chẩn', 'Tý', 'Quý', 'Hoàng', 'Gia', 'Phúc'];

  veNames.forEach(name => {
    const emp = appData.employeeSummary[name] || { name, totalHours: 0 };
    const btn = document.createElement('button');
    btn.className = `emp-item-btn ${name.toLowerCase() === currentEmployeeName.toLowerCase() ? 'active' : ''}`;
    btn.innerHTML = `<span>${name}</span> <span class="emp-hours-badge">${emp.totalHours}h</span>`;
    btn.onclick = () => selectEmployee(name);
    listVe.appendChild(btn);
  });

  hangNames.forEach(name => {
    const emp = appData.employeeSummary[name] || { name, totalHours: 0 };
    const btn = document.createElement('button');
    btn.className = `emp-item-btn ${name.toLowerCase() === currentEmployeeName.toLowerCase() ? 'active' : ''}`;
    btn.innerHTML = `<span>${name}</span> <span class="emp-hours-badge">${emp.totalHours}h</span>`;
    btn.onclick = () => selectEmployee(name);
    listHang.appendChild(btn);
  });

  renderEmployeeDetails(currentEmployeeName);
}

function selectEmployee(name) {
  currentEmployeeName = name;
  renderTabEmployee();
}

function renderEmployeeDetails(name) {
  const emp = appData.employeeSummary[name];
  if (!emp) return;

  document.getElementById('curEmpName').textContent = emp.name.toUpperCase();
  document.getElementById('curEmpDept').textContent = `Khối ${emp.dept}`;
  document.getElementById('curEmpDept').className = `badge ${emp.dept === 'VÉ' ? 'badge-orange' : 'badge-blue'}`;
  document.getElementById('curEmpHours').textContent = `${emp.totalHours.toFixed(1)}h`;
  document.getElementById('curEmpWorkDays').textContent = emp.workingDays;
  document.getElementById('curEmpOffDays').textContent = emp.offDays;

  const avg = emp.workingDays > 0 ? (emp.totalHours / emp.workingDays).toFixed(1) : '0';
  document.getElementById('curEmpAvgHours').textContent = `${avg}h`;

  const tbody = document.getElementById('tbody-emp-details');
  tbody.innerHTML = '';
  if (emp.details && emp.details.length > 0) {
    emp.details.forEach(d => {
      const tr = document.createElement('tr');
      const isOff = d.hours === 0 || d.status === 'OFF';
      tr.innerHTML = `
        <td style="font-weight: 600;">${d.date.slice(0, 5)}</td>
        <td style="color: #64748b;">${d.dayOfWeek}</td>
        <td>${d.in1 || '—'}</td>
        <td>${d.out1 || '—'}</td>
        <td>${d.in2 || '—'}</td>
        <td>${d.out2 || '—'}</td>
        <td style="text-align: right; font-weight: 700; ${isOff ? 'color: #94a3b8;' : 'color: #1e293b;'}">${d.hours > 0 ? d.hours.toFixed(1) : '0'}</td>
        <td style="text-align: center;">
          <span class="status-badge ${isOff ? 'status-off' : 'status-working'}">
            ${isOff ? 'OFF' : 'Làm việc'}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 20px;">Chưa có dữ liệu chấm công cho tháng này</td></tr>`;
  }
  document.getElementById('tfoot-emp-total').textContent = emp.totalHours.toFixed(1);
}

// TAB 3: Audit View
function setupAuditDaySelect() {
  if (!appData) return;
  const select = document.getElementById('selectDay');
  select.innerHTML = '';

  if (appData.dailyDays.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = '(Chưa có ngày nào trong tháng này)';
    select.appendChild(opt);
    return;
  }

  appData.dailyDays.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.day;
    opt.textContent = `Ngày ${d.date} (${d.dayOfWeek})`;
    if (d.day === currentAuditDay) opt.selected = true;
    select.appendChild(opt);
  });

  select.onchange = (e) => {
    currentAuditDay = parseInt(e.target.value);
    renderAuditView();
  };
}

function renderAuditView() {
  if (!appData || appData.dailyDays.length === 0) {
    document.getElementById('auditDayInfo').textContent = 'Chưa có ảnh/dữ liệu chấm công trong tháng này';
    document.getElementById('auditImg').src = '';
    document.getElementById('tbody-audit-records').innerHTML = '';
    document.getElementById('audit-day-total').textContent = '0.0';
    return;
  }

  const dayData = appData.dailyDays.find(d => d.day === currentAuditDay) || appData.dailyDays[0];
  if (!dayData) return;
  currentAuditDay = dayData.day;

  document.getElementById('auditDayInfo').textContent = `Ngày ${dayData.date} (${dayData.dayOfWeek}) • ${dayData.records.length} Nhân viên`;

  // Image setup
  const auditImg = document.getElementById('auditImg');
  const auditImgError = document.getElementById('auditImgError');
  const auditImgErrorText = document.getElementById('auditImgErrorText');
  const auditImgName = document.getElementById('auditImgName');
  const btnOpen = document.getElementById('btnOpenOriginalImage');

  if (auditImgName) {
    auditImgName.textContent = dayData.image ? `📸 Ảnh gốc: ${dayData.image}` : '(Chưa có thông tin ảnh gốc)';
  }

  if (dayData.image) {
    const imgUrl = `/image/${encodeURIComponent(dayData.image)}`;
    btnOpen.href = imgUrl;
    btnOpen.style.display = 'inline-flex';

    auditImg.onload = () => {
      auditImg.style.display = 'block';
      if (auditImgError) auditImgError.style.display = 'none';
    };
    auditImg.onerror = () => {
      auditImg.style.display = 'none';
      if (auditImgError) {
        auditImgError.style.display = 'block';
        if (auditImgErrorText) auditImgErrorText.textContent = `File: ${dayData.image}`;
      }
    };
    auditImg.src = imgUrl;
  } else {
    auditImg.style.display = 'none';
    btnOpen.style.display = 'none';
    if (auditImgError) {
      auditImgError.style.display = 'block';
      if (auditImgErrorText) auditImgErrorText.textContent = 'Ngày này chưa có file ảnh gốc đính kèm';
    }
  }

  resetZoom();

  // Records table
  const tbody = document.getElementById('tbody-audit-records');
  tbody.innerHTML = '';
  let dayTotal = 0;

  dayData.records.forEach((r, idx) => {
    dayTotal += (parseFloat(r.hours) || 0);
    const tr = document.createElement('tr');
    tr.dataset.idx = idx;
    tr.innerHTML = `
      <td style="text-align: center;">${r.stt}</td>
      <td style="font-weight: 600;">${r.name}</td>
      <td><input class="edit-input" data-field="in1" value="${r.in1 || ''}" onchange="onRecordChange(${idx})"></td>
      <td><input class="edit-input" data-field="out1" value="${r.out1 || ''}" onchange="onRecordChange(${idx})"></td>
      <td><input class="edit-input" data-field="in2" value="${r.in2 || ''}" onchange="onRecordChange(${idx})"></td>
      <td><input class="edit-input" data-field="out2" value="${r.out2 || ''}" onchange="onRecordChange(${idx})"></td>
      <td><input class="edit-input" data-field="hours" style="text-align: right; font-weight: 700;" value="${r.hours}" onchange="onRecordHoursChange(${idx})"></td>
      <td>
        <select class="edit-input" data-field="status" onchange="onRecordStatusChange(${idx})">
          <option value="Làm việc" ${r.status !== 'OFF' ? 'selected' : ''}>Làm việc</option>
          <option value="OFF" ${r.status === 'OFF' ? 'selected' : ''}>OFF</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('audit-day-total').textContent = dayTotal.toFixed(1);
}

// Convert "HH:mm" to decimal hours
function parseTimeToHours(tStr) {
  if (!tStr || !tStr.includes(':')) return null;
  const parts = tStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
}

function onRecordChange(idx) {
  const dayData = appData.dailyDays.find(d => d.day === currentAuditDay);
  if (!dayData) return;

  const row = document.querySelector(`#tbody-audit-records tr[data-idx="${idx}"]`);
  const in1 = row.querySelector('[data-field="in1"]').value.trim();
  const out1 = row.querySelector('[data-field="out1"]').value.trim();
  const in2 = row.querySelector('[data-field="in2"]').value.trim();
  const out2 = row.querySelector('[data-field="out2"]').value.trim();
  const hoursInput = row.querySelector('[data-field="hours"]');
  const statusSelect = row.querySelector('[data-field="status"]');

  if (in1 === 'OFF' || out1 === 'OFF') {
    hoursInput.value = '0';
    statusSelect.value = 'OFF';
  } else {
    const tIn1 = parseTimeToHours(in1);
    const tOut1 = parseTimeToHours(out1);
    const tIn2 = parseTimeToHours(in2);
    const tOut2 = parseTimeToHours(out2);

    let total = 0;
    if (tIn1 !== null && tOut1 !== null && tOut1 >= tIn1) total += (tOut1 - tIn1);
    if (tIn2 !== null && tOut2 !== null && tOut2 >= tIn2) total += (tOut2 - tIn2);

    if (total > 0) {
      hoursInput.value = total.toFixed(1);
      statusSelect.value = 'Làm việc';
    }
  }
  recalcAuditDayTotal();
}

function onRecordHoursChange(idx) {
  recalcAuditDayTotal();
}

function onRecordStatusChange(idx) {
  const row = document.querySelector(`#tbody-audit-records tr[data-idx="${idx}"]`);
  const status = row.querySelector('[data-field="status"]').value;
  if (status === 'OFF') {
    row.querySelector('[data-field="hours"]').value = '0';
  }
  recalcAuditDayTotal();
}

function recalcAuditDayTotal() {
  const rows = document.querySelectorAll('#tbody-audit-records tr');
  let sum = 0;
  rows.forEach(r => {
    sum += parseFloat(r.querySelector('[data-field="hours"]').value) || 0;
  });
  document.getElementById('audit-day-total').textContent = sum.toFixed(1);
}

// Save day edits
async function saveDayEdits() {
  const dayData = appData.dailyDays.find(d => d.day === currentAuditDay);
  if (!dayData) return;

  const rows = document.querySelectorAll('#tbody-audit-records tr');
  const updatedRecords = [];
  rows.forEach((row, idx) => {
    const orig = dayData.records[idx];
    updatedRecords.push({
      stt: orig.stt,
      name: orig.name,
      dept: orig.dept,
      in1: row.querySelector('[data-field="in1"]').value.trim(),
      out1: row.querySelector('[data-field="out1"]').value.trim(),
      in2: row.querySelector('[data-field="in2"]').value.trim(),
      out2: row.querySelector('[data-field="out2"]').value.trim(),
      hours: parseFloat(row.querySelector('[data-field="hours"]').value) || 0,
      status: row.querySelector('[data-field="status"]').value
    });
  });

  try {
    const res = await fetch('/api/save-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day: currentAuditDay, records: updatedRecords })
    });
    const result = await res.json();
    if (result.success) {
      appData = result.data;
      updateUI();
      showToast(`✅ Đã lưu cập nhật Ngày ${dayData.date}!`);
    } else {
      showToast('❌ Lỗi khi lưu: ' + result.error);
    }
  } catch (err) {
    showToast('Lỗi kết nối: ' + err.message);
  }
}

// Image Zoom Controls
function zoomImage(delta) {
  currentZoom = Math.max(0.5, Math.min(3.0, currentZoom + delta));
  document.getElementById('auditImg').style.transform = `scale(${currentZoom})`;
}

function resetZoom() {
  currentZoom = 1.0;
  document.getElementById('auditImg').style.transform = `scale(1.0)`;
}

// ==========================================
// HIGH-RESOLUTION CANVAS EXPORT (2X DPI)
// ==========================================
function setupCanvas(canvas, width, height) {
  const dpr = 2;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

function drawOverviewAllCanvas(canvas) {
  const list = appData.summaryAll;
  const mMatch = activeMonth.match(/\d+/);
  const mNum = mMatch ? mMatch[0] : '09';

  const width = 360;
  const rowHeight = 24;
  const headerHeight = 70;
  const footerHeight = 28;
  const height = headerHeight + list.length * rowHeight + footerHeight + 20;

  const ctx = setupCanvas(canvas, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TỔNG SỐ GIỜ THEO NHÂN VIÊN', width / 2, 34);
  ctx.fillText(`THÁNG ${mNum}.2026`, width / 2, 52);

  const tableY = 64;
  const tableX = 10;
  const tableW = width - 20;

  ctx.strokeRect(tableX, tableY, tableW, 26);
  ctx.font = 'bold 12.5px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('STT', tableX + 25, tableY + 18);
  ctx.textAlign = 'left';
  ctx.fillText('Tên NV', tableX + 60, tableY + 18);
  ctx.textAlign = 'right';
  ctx.fillText('Tổng Số Giờ/Tháng', tableX + tableW - 12, tableY + 18);

  ctx.beginPath();
  ctx.moveTo(tableX + 48, tableY);
  ctx.lineTo(tableX + 48, tableY + 26);
  ctx.moveTo(tableX + 175, tableY);
  ctx.lineTo(tableX + 175, tableY + 26);
  ctx.stroke();

  let curY = tableY + 26;
  list.forEach((emp, i) => {
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#888888';
    ctx.beginPath();
    ctx.moveTo(tableX, curY + rowHeight);
    ctx.lineTo(tableX + tableW, curY + rowHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(tableX + 48, curY);
    ctx.lineTo(tableX + 48, curY + rowHeight);
    ctx.moveTo(tableX + 175, curY);
    ctx.lineTo(tableX + 175, curY + rowHeight);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = '12.5px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), tableX + 25, curY + 17);
    ctx.textAlign = 'left';
    ctx.fillText(emp.name, tableX + 60, curY + 17);
    ctx.textAlign = 'right';
    ctx.fillText(emp.totalHours.toFixed(1), tableX + tableW - 12, curY + 17);

    curY += rowHeight;
  });

  ctx.fillStyle = '#d9e1f2';
  ctx.fillRect(tableX, curY, tableW, footerHeight);
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(tableX, curY, tableW, footerHeight);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Tổng giờ', tableX + 60, curY + 19);
  ctx.textAlign = 'right';
  ctx.fillText(appData.grandTotalHours.toFixed(1), tableX + tableW - 12, curY + 19);

  return canvas;
}

function drawOverviewVeCanvas(canvas) {
  const list = appData.departments['VÉ'].employees;
  const mMatch = activeMonth.match(/\d+/);
  const mNum = mMatch ? mMatch[0] : '09';

  const width = 360;
  const rowHeight = 26;
  const headerHeight = 70;
  const footerHeight = 28;
  const height = headerHeight + list.length * rowHeight + footerHeight + 20;

  const ctx = setupCanvas(canvas, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TỔNG SỐ GIỜ NHÂN VIÊN VÉ', width / 2, 34);
  ctx.fillText(`THÁNG ${mNum}.2026`, width / 2, 52);

  const tableY = 64;
  const tableX = 10;
  const tableW = width - 20;

  ctx.strokeRect(tableX, tableY, tableW, 26);
  ctx.font = 'bold 12.5px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('STT', tableX + 25, tableY + 18);
  ctx.textAlign = 'left';
  ctx.fillText('TÊN NHÂN VIÊN', tableX + 60, tableY + 18);
  ctx.textAlign = 'right';
  ctx.fillText('TỔNG SỐ GIỜ/THÁNG', tableX + tableW - 12, tableY + 18);

  ctx.beginPath();
  ctx.moveTo(tableX + 48, tableY);
  ctx.lineTo(tableX + 48, tableY + 26);
  ctx.moveTo(tableX + 185, tableY);
  ctx.lineTo(tableX + 185, tableY + 26);
  ctx.stroke();

  let curY = tableY + 26;
  list.forEach(emp => {
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#888888';
    ctx.beginPath();
    ctx.moveTo(tableX, curY + rowHeight);
    ctx.lineTo(tableX + tableW, curY + rowHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(tableX + 48, curY);
    ctx.lineTo(tableX + 48, curY + rowHeight);
    ctx.moveTo(tableX + 185, curY);
    ctx.lineTo(tableX + 185, curY + rowHeight);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(String(emp.stt), tableX + 25, curY + 18);
    ctx.textAlign = 'left';
    ctx.fillText(emp.name, tableX + 60, curY + 18);
    ctx.textAlign = 'right';
    ctx.fillText(emp.totalHours.toFixed(1), tableX + tableW - 12, curY + 18);

    curY += rowHeight;
  });

  ctx.fillStyle = '#fce4d6';
  ctx.fillRect(tableX, curY, tableW, footerHeight);
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(tableX, curY, tableW, footerHeight);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TỔNG', tableX + 115, curY + 19);
  ctx.textAlign = 'right';
  ctx.fillText(appData.departments['VÉ'].totalHours.toFixed(1), tableX + tableW - 12, curY + 19);

  return canvas;
}

function drawOverviewHangCanvas(canvas) {
  const list = appData.departments['HÀNG'].employees;
  const mMatch = activeMonth.match(/\d+/);
  const mNum = mMatch ? mMatch[0] : '09';

  const width = 360;
  const rowHeight = 26;
  const headerHeight = 70;
  const footerHeight = 28;
  const height = headerHeight + list.length * rowHeight + footerHeight + 20;

  const ctx = setupCanvas(canvas, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TỔNG SỐ GIỜ NHÂN VIÊN HÀNG', width / 2, 34);
  ctx.fillText(`THÁNG ${mNum}.2026`, width / 2, 52);

  const tableY = 64;
  const tableX = 10;
  const tableW = width - 20;

  ctx.strokeRect(tableX, tableY, tableW, 26);
  ctx.font = 'bold 12.5px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('STT', tableX + 25, tableY + 18);
  ctx.textAlign = 'left';
  ctx.fillText('TÊN NHÂN VIÊN', tableX + 60, tableY + 18);
  ctx.textAlign = 'right';
  ctx.fillText('TỔNG SỐ GIỜ/THÁNG', tableX + tableW - 12, tableY + 18);

  ctx.beginPath();
  ctx.moveTo(tableX + 48, tableY);
  ctx.lineTo(tableX + 48, tableY + 26);
  ctx.moveTo(tableX + 185, tableY);
  ctx.lineTo(tableX + 185, tableY + 26);
  ctx.stroke();

  let curY = tableY + 26;
  list.forEach(emp => {
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#888888';
    ctx.beginPath();
    ctx.moveTo(tableX, curY + rowHeight);
    ctx.lineTo(tableX + tableW, curY + rowHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(tableX + 48, curY);
    ctx.lineTo(tableX + 48, curY + rowHeight);
    ctx.moveTo(tableX + 185, curY);
    ctx.lineTo(tableX + 185, curY + rowHeight);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(String(emp.stt), tableX + 25, curY + 18);
    ctx.textAlign = 'left';
    ctx.fillText(emp.name, tableX + 60, curY + 18);
    ctx.textAlign = 'right';
    ctx.fillText(emp.totalHours.toFixed(1), tableX + tableW - 12, curY + 18);

    curY += rowHeight;
  });

  ctx.fillStyle = '#d9e1f2';
  ctx.fillRect(tableX, curY, tableW, footerHeight);
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(tableX, curY, tableW, footerHeight);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TỔNG', tableX + 115, curY + 19);
  ctx.textAlign = 'right';
  ctx.fillText(appData.departments['HÀNG'].totalHours.toFixed(1), tableX + tableW - 12, curY + 19);

  return canvas;
}

function drawEmployeeDetailCanvas(canvas, emp) {
  const mMatch = activeMonth.match(/\d+/);
  const mNum = mMatch ? mMatch[0] : '09';

  const width = 640;
  const rowHeight = 22;
  const headerHeight = 100;
  const footerHeight = 28;
  const height = headerHeight + (emp.details ? emp.details.length : 0) * rowHeight + footerHeight + 20;

  const ctx = setupCanvas(canvas, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`BẢNG CHI TIẾT CHẤM CÔNG THÁNG ${mNum}.2026`, width / 2, 32);

  ctx.font = 'bold 14px Arial';
  ctx.fillText(`NHÂN VIÊN: ${emp.name.toUpperCase()} (Khối ${emp.dept})`, width / 2, 52);

  ctx.font = '12px Arial';
  ctx.fillText(`Tổng giờ: ${emp.totalHours.toFixed(1)}h  |  Số ngày làm: ${emp.workingDays}  |  Số ngày nghỉ: ${emp.offDays}`, width / 2, 70);

  const tableY = 82;
  const tableX = 10;
  const tableW = width - 20;

  ctx.strokeRect(tableX, tableY, tableW, 24);
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Ngày', tableX + 30, tableY + 16);
  ctx.fillText('Thứ', tableX + 80, tableY + 16);
  ctx.fillText('Vào sáng', tableX + 150, tableY + 16);
  ctx.fillText('Ra sáng', tableX + 230, tableY + 16);
  ctx.fillText('Vào chiều', tableX + 320, tableY + 16);
  ctx.fillText('Ra chiều', tableX + 410, tableY + 16);
  ctx.fillText('Số giờ', tableX + 490, tableY + 16);
  ctx.fillText('Trạng thái', tableX + 570, tableY + 16);

  let curY = tableY + 24;
  if (emp.details) {
    emp.details.forEach(d => {
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = '#888888';
      ctx.beginPath();
      ctx.moveTo(tableX, curY + rowHeight);
      ctx.lineTo(tableX + tableW, curY + rowHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(d.date.slice(0, 5), tableX + 30, curY + 15);
      ctx.fillText(d.dayOfWeek, tableX + 80, curY + 15);
      ctx.fillText(d.in1 || '—', tableX + 150, curY + 15);
      ctx.fillText(d.out1 || '—', tableX + 230, curY + 15);
      ctx.fillText(d.in2 || '—', tableX + 320, curY + 15);
      ctx.fillText(d.out2 || '—', tableX + 410, curY + 15);
      ctx.fillText(d.hours > 0 ? d.hours.toFixed(1) : '0', tableX + 490, curY + 15);
      ctx.fillText(d.status, tableX + 570, curY + 15);

      curY += rowHeight;
    });
  }

  ctx.fillStyle = '#d9e1f2';
  ctx.fillRect(tableX, curY, tableW, footerHeight);
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(tableX, curY, tableW, footerHeight);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12.5px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`TỔNG CỘNG THÁNG ${mNum}.2026:  `, tableX + 450, curY + 18);
  ctx.textAlign = 'center';
  ctx.fillText(`${emp.totalHours.toFixed(1)}h`, tableX + 490, curY + 18);

  return canvas;
}

async function exportTableToImage(canvasId, filename) {
  const canvas = document.getElementById(canvasId);
  if (canvasId === 'canvas-all') drawOverviewAllCanvas(canvas);
  if (canvasId === 'canvas-ve') drawOverviewVeCanvas(canvas);
  if (canvasId === 'canvas-hang') drawOverviewHangCanvas(canvas);

  const base64Data = canvas.toDataURL('image/jpeg', 0.95);

  try {
    await fetch('/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64Data })
    });
  } catch (e) {
    console.error(e);
  }

  const a = document.createElement('a');
  a.href = base64Data;
  a.download = filename;
  a.click();
  showToast(`✅ Đã xuất ảnh: ${filename}`);
}

// Global button events
function bindGlobalEvents() {
  document.getElementById('btnSaveDayEdits').addEventListener('click', saveDayEdits);

  document.getElementById('btnOpenFolder').addEventListener('click', async () => {
    try {
      await fetch('/api/open-folder', { method: 'POST' });
      showToast('📁 Đã mở thư mục trên máy tính!');
    } catch (err) {
      showToast('Lỗi: ' + err.message);
    }
  });

  // Create new month
  document.getElementById('btnCreateMonth').addEventListener('click', async () => {
    const nextMonth = prompt('Nhập tên folder tháng mới (VD: tháng 10):', 'tháng 10');
    if (!nextMonth) return;
    const clean = nextMonth.trim().toLowerCase();
    await switchMonth(clean);
    await loadConfigAndMonths();
  });

  // Settings Modal
  document.getElementById('btnOpenSettings').addEventListener('click', () => {
    document.getElementById('txtApiKey').value = appConfig.hasApiKey ? '••••••••••••••••' : '';
    document.getElementById('chkAutoExtract').checked = !!appConfig.autoExtract;
    document.getElementById('settingsModal').classList.add('show');
  });

  // Scan new images with AI
  document.getElementById('btnScanNewImages').addEventListener('click', async () => {
    try {
      showToast('⏳ Đang kiểm tra ảnh mới trong folder...');
      const res = await fetch('/api/unprocessed-images');
      const info = await res.json();

      const unproc = info.allImages.filter(img => !img.isProcessed);
      if (unproc.length === 0) {
        showToast('ℹ️ Tất cả ảnh trong folder hiện tại đều đã được trích xuất!');
        return;
      }

      if (!appConfig.hasApiKey) {
        showToast('⚠️ Vui lòng vào Cài đặt để nhập Google Gemini API Key trước khi quét AI!');
        document.getElementById('settingsModal').classList.add('show');
        return;
      }

      if (!confirm(`Tìm thấy ${unproc.length} ảnh chưa trích xuất:\n${unproc.map(u => u.filename).join('\n')}\n\nBạn có muốn dùng AI để tự động trích xuất các ảnh này không?`)) {
        return;
      }

      showToast(`🤖 Đang dùng Gemini Vision AI xử lý ${unproc.length} ảnh...`);
      for (const img of unproc) {
        showToast(`⏳ Đang đọc chữ viết tay: ${img.filename}...`);
        const extRes = await fetch('/api/extract-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: img.filename })
        });
        const extData = await extRes.json();
        if (extData.success) {
          appData = extData.data;
          updateUI();
        }
      }
      showToast(`🎉 Đã trích xuất xong toàn bộ ảnh mới!`);
    } catch (err) {
      showToast('Lỗi quét ảnh: ' + err.message);
    }
  });

  // Export current employee
  document.getElementById('btnExportCurrentEmp').addEventListener('click', async () => {
    const emp = appData.employeeSummary[currentEmployeeName];
    if (!emp) return;
    const canvas = document.getElementById('canvas-emp');
    drawEmployeeDetailCanvas(canvas, emp);
    const mMatch = activeMonth.match(/\d+/);
    const mNum = mMatch ? mMatch[0] : '09';
    const filename = `Chi_tiet_${emp.name.replace(/\s+/g, '_')}_T${mNum}.2026.jpg`;
    const base64Data = canvas.toDataURL('image/jpeg', 0.95);

    await fetch('/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64Data, subfolder: 'chi_tiet_nhan_vien' })
    });

    const a = document.createElement('a');
    a.href = base64Data;
    a.download = filename;
    a.click();
    showToast(`✅ Đã xuất phiếu chấm công: ${emp.name}`);
  });

  // Export all 14 employees
  document.getElementById('btnExportAllEmps').addEventListener('click', async () => {
    showToast('⏳ Đang xuất ảnh chi tiết 14 nhân viên...');
    const canvas = document.getElementById('canvas-emp');
    const allEmps = Object.values(appData.employeeSummary);
    const mMatch = activeMonth.match(/\d+/);
    const mNum = mMatch ? mMatch[0] : '09';

    for (const emp of allEmps) {
      drawEmployeeDetailCanvas(canvas, emp);
      const filename = `Chi_tiet_${emp.name.replace(/\s+/g, '_')}_T${mNum}.2026.jpg`;
      const base64Data = canvas.toDataURL('image/jpeg', 0.95);

      await fetch('/api/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, base64Data, subfolder: 'chi_tiet_nhan_vien' })
      });
    }
    showToast(`✅ Hoàn thành xuất 14 phiếu chi tiết vào thư mục!`);
  });

  // Export all images (3 Overview + 14 Employee details + Excel)
  document.getElementById('btnExportAll').addEventListener('click', async () => {
    showToast('⏳ Đang xuất toàn bộ ảnh và file Excel...');
    const mMatch = activeMonth.match(/\d+/);
    const mNum = mMatch ? mMatch[0] : '09';

    // 1. Table All
    const cAll = document.getElementById('canvas-all');
    drawOverviewAllCanvas(cAll);
    await fetch('/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `TONG_SO_GIO_THEO_NHAN_VIEN_THANG_${mNum}_2026.jpg`,
        base64Data: cAll.toDataURL('image/jpeg', 0.95)
      })
    });

    // 2. Table Vé
    const cVe = document.getElementById('canvas-ve');
    drawOverviewVeCanvas(cVe);
    await fetch('/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `TONG_SO_GIO_NHAN_VIEN_VE_THANG_${mNum}_2026.jpg`,
        base64Data: cVe.toDataURL('image/jpeg', 0.95)
      })
    });

    // 3. Table Hàng
    const cHang = document.getElementById('canvas-hang');
    drawOverviewHangCanvas(cHang);
    await fetch('/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `TONG_SO_GIO_NHAN_VIEN_HANG_THANG_${mNum}_2026.jpg`,
        base64Data: cHang.toDataURL('image/jpeg', 0.95)
      })
    });

    // 4. All 14 Employees
    const cEmp = document.getElementById('canvas-emp');
    for (const emp of Object.values(appData.employeeSummary)) {
      drawEmployeeDetailCanvas(cEmp, emp);
      await fetch('/api/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `Chi_tiet_${emp.name.replace(/\s+/g, '_')}_T${mNum}.2026.jpg`,
          base64Data: cEmp.toDataURL('image/jpeg', 0.95),
          subfolder: 'chi_tiet_nhan_vien'
        })
      });
    }

    // 5. Excel
    await fetch('/api/export-excel', { method: 'POST' });

    showToast('🎉 Đã xuất thành công toàn bộ 17 file ảnh + 1 file Excel!');
  });
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('show');
}

async function saveSettings() {
  const apiKey = document.getElementById('txtApiKey').value.trim();
  const autoExtract = document.getElementById('chkAutoExtract').checked;
  const payload = { autoExtract };
  if (apiKey && !apiKey.includes('••••')) {
    payload.geminiApiKey = apiKey;
  }

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      appConfig = result.config;
      closeSettings();
      showToast('✅ Đã lưu cài đặt AI & Tự động!');
    }
  } catch (err) {
    showToast('Lỗi khi lưu cài đặt: ' + err.message);
  }
}
