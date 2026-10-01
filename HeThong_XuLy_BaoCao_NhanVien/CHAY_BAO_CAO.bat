@echo off
chcp 65001 > nul
title Hệ Thống Xử Lý Báo Cáo Nhân Viên Nhận Khách - Xe Khách Tâm Hạnh
cls

echo ====================================================================
echo   HỆ THỐNG XỬ LÝ & TRÍCH XUẤT BÁO CÁO NHÂN VIÊN NHẬN KHÁCH
echo                   XE KHÁCH TÂM HẠNH
echo ====================================================================
echo.

if "%~1"=="" (
    echo Đang tự động quét tìm file Excel trong data/raw/ ...
    python "%~dp0pipeline.py"
) else (
    echo Đang xử lý file được chỉ định: %~1
    python "%~dp0pipeline.py" "%~1"
)

echo.
if %errorlevel% neq 0 (
    echo [LỖI] Quá trình xử lý gặp lỗi. Vui lòng kiểm tra lại file Excel đầu vào!
) else (
    echo [THÀNH CÔNG] Đã xuất file Excel vào data/output/ và mở Dashboard trên trình duyệt!
)
echo.
pause
