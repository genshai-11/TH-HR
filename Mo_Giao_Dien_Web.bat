@echo off
chcp 65001 > nul
title HỆ THỐNG TRÍCH XUẤT & QUẢN LÝ CHẤM CÔNG - THÁNG 9/2026

echo =========================================================================
echo    HỆ THỐNG TRÍCH XUẤT & QUẢN LÝ CHẤM CÔNG - THÁNG 09/2026
echo =========================================================================
echo  * Đang khởi động máy chủ Web nội bộ...
echo  * Trình duyệt sẽ tự động mở tại địa chỉ: http://localhost:3000
echo.
echo  [Lưu ý: Không tắt cửa sổ này khi đang dùng giao diện web]
echo =========================================================================

start "" http://localhost:3000
node server.js
pause
