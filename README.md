# TH-HR: HỆ THỐNG TRÍCH XUẤT & QUẢN LÝ CHẤM CÔNG TỰ ĐỘNG

> Hệ thống tự động hóa trích xuất dữ liệu chấm công từ hình ảnh bảng chấm công viết tay hàng ngày, tổng hợp số giờ làm việc theo nhân viên và phòng ban (Khối Vé & Khối Hàng), xuất bảng tính Excel và đồ họa báo cáo độ phân giải cao.

---

## 🌟 Tính Năng Chính

1. **Nhận diện Bảng Chấm Công Viết Tay (AI Vision OCR):**
   - Tự động nhận diện chữ viết tay: Giờ lên ca, giờ xuống ca, ca gãy (*split-shifts*), ngày nghỉ (OFF), dòng bổ sung mực xanh.
   - Hỗ trợ ảnh chụp 1 ngày hoặc 2 ngày/ảnh.
   - Tích hợp trực tiếp Google Gemini Vision API (Gemini 2.5 Flash).

2. **Giám Sát Thư Mục Tự Động (Folder Watcher):**
   - Khi có ảnh mới được lưu vào thư mục tháng (ví dụ `tháng 09`, `tháng 10`), hệ thống tự động phát hiện, gửi AI trích xuất và cộng dồn vào bảng tổng.

3. **Giao Diện Web Dashboard Nội Bộ (`http://localhost:3000`):**
   - **Tab Báo Cáo Tổng Quan:** KPI tổng giờ, phân tích Khối Vé & Khối Hàng, bảng tổng hợp toàn bộ nhân viên.
   - **Tab Chi Tiết Từng Nhân Viên:** Thống kê số ngày làm, ngày nghỉ, trung bình giờ/ngày và lịch sử chi tiết 30 ngày cho từng nhân viên.
   - **Tab Kiểm Tra & Đối Soát Hàng Ngày:** Chia đôi màn hình — bên trái hiển thị ảnh chụp chấm công gốc kèm công cụ phóng to/thu nhỏ, bên phải cho phép sửa trực tiếp vào các ô và lưu cập nhật tức thì.

4. **Xuất Báo Cáo Đa Định Dạng (Export):**
   - **File Excel Full:** Gồm 3 Sheet chuyên nghiệp: `TimeSheet`, `Tổng NV`, `Chi Tiết Từng NV`.
   - **Ảnh Báo Cáo 2x DPI:** 3 bảng tổng quan văn phòng theo đúng mẫu chuẩn và 14 phiếu cá nhân cho toàn bộ nhân viên.

---

## 🏢 Cơ Cấu Phòng Ban

- **Khối VÉ (6 Nhân Viên):** CHI, PHẤN, SUNG, TRÂN, LỆ, PHƯỚC.
- **Khối HÀNG (8 Nhân Viên):** TIẾN, CHẨN, TÝ, QUÝ, HOÀNG, GIA, PHÚC, VŨ.

---

## 📁 Cấu Trúc Thư Mục

```text
TH-HR/
├── public/                     # Giao diện Web (SPA)
│   ├── index.html              # HTML giao diện quản lý
│   ├── style.css               # Giao diện responsive & styling bảng biểu
│   └── app.js                  # Logic điều khiển, render canvas 2x DPI, đối soát
├── tháng 09/                   # Dữ liệu chấm công Tháng 09/2026
│   ├── *.jpg                   # Các ảnh chụp bảng chấm công gốc hàng ngày
│   ├── attendance_data.json    # Cơ sở dữ liệu JSON tháng 09
│   └── trích xuất/             # Kết quả xuất ra
│       ├── Bangchamcong_T09_2026_Trích_Xuất_Full.xlsx
│       ├── TONG_SO_GIO_THEO_NHAN_VIEN_THANG_9_2026.png
│       ├── TONG_SO_GIO_NHAN_VIEN_VE_THANG_9_2026.png
│       ├── TONG_SO_GIO_NHAN_VIEN_HANG_THANG_9_2026.png
│       └── chi_tiet_nhan_vien/ # 14 ảnh phiếu chi tiết từng nhân viên
├── config.json                 # Cấu hình hệ thống & API Key
├── server.js                   # Web server Node.js & Folder Watcher
├── Mo_Giao_Dien_Web.bat        # File chạy nhanh hệ thống chỉ với 1 click
├── package.json
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

### 1. Yêu cầu hệ thống
- Đã cài đặt [Node.js](https://nodejs.org/) (khuyến nghị phiên bản 18+ trở lên).

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Khởi chạy hệ thống
* **Cách 1 (Khuyên dùng trên Windows):** Nháy đúp chuột vào file `Mo_Giao_Dien_Web.bat`. Trình duyệt sẽ tự động mở trang web quản trị tại `http://localhost:3000`.
* **Cách 2:** Chạy lệnh terminal:
  ```bash
  npm start
  ```
  Sau đó mở trình duyệt truy cập: `http://localhost:3000`.

---

## 🔄 Quy Trình Chấm Công Các Tháng Mới (Tháng 10, Tháng 11...)

1. **Bước 1:** Tạo thư mục mới (ví dụ `tháng 10`) ngay cạnh thư mục `tháng 09` và chép các ảnh chụp chấm công vào đó.
2. **Bước 2:** Mở giao diện Web, chọn kỳ chấm công `THÁNG 10` từ thanh menu trên cùng (hoặc bấm `➕ Thêm tháng`).
3. **Bước 3:** Nhấn nút **"🤖 Quét ảnh mới"** để AI tự động nhận diện và xuất toàn bộ kết quả Excel & ảnh báo cáo vào thư mục `tháng 10/trích xuất/`.
