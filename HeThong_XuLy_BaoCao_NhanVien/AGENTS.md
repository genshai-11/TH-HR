# AGENTS.md — Hướng Dẫn Vận Hành & Kiến Trúc Dữ Liệu

Tài liệu này là bản hợp đồng vận hành chuẩn hóa và kiến trúc bắt buộc dành cho **AI Assistant (Antigravity / Gemini / Claude / GPT)** và người vận hành khi làm việc với hệ thống trích xuất báo cáo nhân viên nhận khách nhà xe Tâm Hạnh.

---

## 🏛️ 1. Cấu Trúc Thư Mục Phân Tháng (Folder Taxonomy by Month)

Hệ thống được tổ chức phân tầng rõ ràng, lưu trữ dữ liệu đầu vào và kết quả đầu ra theo **từng tháng riêng biệt** (`Thang_MM_YYYY`):

```text
HeThong_XuLy_BaoCao_NhanVien/
├── AGENTS.md                                # Bản hợp đồng quy tắc & kiến trúc (File này)
├── HUONG_DAN_SU_DUNG.md                     # Hướng dẫn nhanh cho người dùng cuối
├── CHAY_BAO_CAO.bat                         # Trình khởi chạy 1-Click tự động (Windows Batch)
├── pipeline.py                              # Mã nguồn xử lý dữ liệu và sinh báo cáo tự động
│
├── BaoCao_NhanVien_NhanKhach.html           # Shortcut mở nhanh Dashboard tháng mới nhất
├── BaoCao_NhanVien_Mobile_T09_2026.png      # Ảnh báo cáo xuất sẵn xem trên điện thoại
│
├── data/                                    # TẤT CẢ DỮ LIỆU ĐƯỢC QUẢN LÝ THEO THÁNG
│   ├── raw/                                 # [FILE GỐC BẤT BIẾN] Phân theo thư mục từng tháng
│   │   ├── Thang_08_2026/
│   │   │   └── BAO_CAO_CHI_TIET_VE_HANH_KHACH_T8_T9_2026.xlsx
│   │   └── Thang_09_2026/
│   │       ├── BAO_CAO_CHI_TIET_VE_HANH_KHACH_09.xlsx
│   │       └── BAO_CAO_CHI_TIET_VE_HANH_KHACH_T9_2026.xlsx
│   │
│   └── output/                              # [KẾT QUẢ XUẤT BÁO CÁO] Phân theo thư mục từng tháng
│       ├── Thang_08_2026/
│       │   └── TONG_HOP_NHAN_VIEN_082026_092026.xlsx
│       └── Thang_09_2026/
│           ├── TONG_HOP_NHAN_VIEN_092026_102026.xlsx     # File Excel tổng hợp
│           ├── BaoCao_NhanVien_Mobile_T09_2026.png       # Ảnh xuất khổ dọc cho điện thoại
│           ├── BaoCao_NhanVien_NhanKhach.html            # Dashboard lưu trữ của tháng 9
│           └── data_nhanvien.json                        # Dữ liệu JSON chuẩn
│
└── dashboard/                               # GIAO DIỆN WEB DASHBOARD TƯƠNG TÁC
    ├── index.html                           # Trang Dashboard Web tương tác & xuất ảnh
    └── assets/
        └── html2canvas.min.js               # Thư viện render canvas offline chất lượng cao
```

---

## 📐 2. Các Quy Tắc Nghiệp Vụ Bất Biến (Immutable Business Rules)

Mọi thay đổi hoặc lần xử lý file dữ liệu mới đều **BẮT BUỘC** tuân thủ 6 quy tắc nghiệp vụ sau:

### 1. Quy tắc Lọc Trạng Thái Vé:
- **Chỉ lấy vé đã thanh toán thành công**: Lọc `Trạng thái vé == 'Đã thanh toán'`.
- **Loại bỏ dòng tổng cộng cuối file**: Dòng có `Mã vé == 'Tổng cộng'` phải bị loại bỏ ngay sau khi đọc file.
- **Không áp dụng cho vé giữ chỗ/hết hạn**: Các trạng thái `Giữ chỗ ưu tiên`, `Hết hạn giữ chỗ` không được tính vào số lượng khách nhận.

### 2. Quy tắc Gộp Tài Khoản:
- Vé mang tên nhân viên **`ADMIN TÂM HẠNH`** được **cộng dồn toàn bộ vào nhân viên `Mỹ Lệ`**.
- Sau khi gộp, không để dòng riêng cho `ADMIN TÂM HẠNH`.

### 3. Quy tắc Lọc Tài Khoản Hệ Thống:
- Bỏ hàng nhân viên **`AnVui Anonymous User`** (đây là user hệ thống đặt vé tự động trên web/app AnVui, không phải nhân sự nhận khách).

### 4. Quy tắc Phân Bổ Văn Phòng:
Cột **Văn phòng** phải nằm ngay sát bên trái cột **Nhân viên**. Quy định gán cố định ban đầu:
- **VPSG (Văn phòng Sài Gòn)**:
  - *Minh Chi, PHẤN, TRÂN, Mỹ Lệ, Phước, Nguyễn Hữu Sung, QUÝ, Nguyễn Ngọc Thi, NGỌC PHÚC.*
- **VPPT (Văn phòng Phan Thiết)**:
  - *Lê Thị Mỹ Trang, HUYỀN, Đặng Ngọc Thông, HƯNG, Đỗ Văn Nhé, Trần Tuấn Phương, Nguyễn Khắc Duy.*
- **VPDK (Văn phòng Diên Khánh)**:
  - *Đông Nguyễn, Hồng Liên, Ngọc Trang, Hồng Lệ, TRUNG* (và các nhân sự mới phát sinh nếu chưa rõ văn phòng).
- **Đại lý**:
  - *ĐL RedBus* (được xếp nhóm Đại lý riêng).

### 5. Quy tắc Nhận Diện Vé Xe Rẻ (VeXeRe) vs Tổng Đài / Tại Quầy:
- Nguồn xác định: Cột **`Đại lý == 'VEXERE'`**.
- Tách thành 2 nhóm rõ ràng:
  - **`Tổng Đài / Tại Quầy`**: Khách mua trực tiếp hoặc gọi tổng đài (không qua VeXeRe).
  - **`Khách Vé Xe Rẻ (Vexere)`**: Đặt qua VeXeRe.
  - Tỷ lệ phần trăm Vé Xe Rẻ: `ve_vxr / tong_khach * 100`.

### 6. Quy tắc Xử Lý Thời Gian Động & Phân Nhóm Thư Mục:
- Quét các tháng có trong cột **`Ngày đi`** (định dạng `DD/MM/YYYY HH:MM:SS`) và cột **`Ngày tạo`**.
- Xác định tháng chính của đợt báo cáo để tự động tạo và lưu trữ đúng thư mục `Thang_MM_YYYY`.
- Tự động sinh cột khách nhận cho từng tháng có trong dữ liệu (ví dụ T8, T9 hoặc T9, T10...), không hardcode số tháng cố định.

---

## 🛠️ 3. Tính Năng Giao Diện Web Dashboard

Giao diện Web tuân thủ thiết kế tối giản, hiện đại, hỗ trợ tương tác sâu:
1. **Điều khiển Cỡ chữ linh hoạt (`[-A] [Cỡ chữ] [+A]`)**:
   - Tăng/giảm cỡ chữ toàn bộ bảng từ **11px lên đến 26px** (mặc định 15px).
   - **Tất cả các thành phần bảng tăng đều**: Tên nhân viên, badge văn phòng, cột Vé Xe Rẻ (`.vxr-pill`) và Hàng tổng cộng (`tfoot td`) đều phóng to đồng tỷ lệ.
   - Lưu cấu hình cỡ chữ vào `localStorage`.
2. **Điều chỉnh Độ dãn cột (`Chữ gần hơn ↔ Thoáng`)**:
   - **`[Gần hơn]`**: Thu gọn padding ô dữ liệu (`5px 8px`), kéo chữ và số lại gần nhau nhất.
   - **`[Chuẩn]`**: Khoảng cách cân đối chuẩn (`9px 14px`).
   - **`[Thoáng]`**: Khoảng cách rộng rãi (`12px 20px`).
3. **Kéo viền cột trực tiếp (Interactive Drag Resizer)**:
   - Rê chuột vào vách ngăn giữa các cột (xuất hiện biểu tượng `↔`), kéo chuột sang trái để thu hẹp cột, kéo sang phải để dãn rộng cột.
   - Nhấp đúp chuột vào vách ngăn để đưa độ rộng cột về tự động.
4. **Modal `⚙️ Tùy chỉnh Cột`**:
   - Ẩn/hiện cột tùy ý.
   - Đổi tên tiêu đề hiển thị của từng cột.
   - Nhập độ rộng cụ thể tính theo pixel (`Rộng: [...] px`).
5. **Gán lại văn phòng trực tiếp**: Thẻ `<select>` tại từng dòng cho phép người quản lý đổi văn phòng ngay trên trình duyệt mà không cần can thiệp code.

---

## 📱 4. Tiêu Chuẩn Xuất Ảnh Mobile Xem Điện Thoại (`📸 Xuất Ảnh HD`)

Khi bấm nút **`📸 Xuất Ảnh HD (PNG)`**, hệ thống tự động xuất ảnh theo tiêu chuẩn xem trên điện thoại:
1. **Chỉ giữ 6 cột cốt lõi**:
   - `STT | Văn phòng | Nhân viên | Tổng khách nhận | Tổng Đài / Tại Quầy | Vé Xe Rẻ (Vexere)`
   - Ẩn các cột chi tiết tháng và tỷ lệ % để ảnh tập trung, không bị loãng.
2. **Kích thước khổ dọc chuẩn Smartphone (Khổ cao)**:
   - Chiều rộng cố định: **880 px** (Scale 2x = **1760 px** Retina sắc nét).
   - Chiều cao dọc: **~3530 px** (Tỷ lệ chiều cao / rộng xấp xỉ **2.0 : 1**).
   - Khi gửi qua Zalo / Telegram, ảnh hiển thị tràn dọc màn hình điện thoại, không cần phóng to.
3. **Chữ số lớn gấp đôi, rõ ràng**:
   - Cỡ chữ dữ liệu: **17px - 18px**.
   - Số lượng khách nhận & Vé Xe Rẻ in đậm to rõ: **20px - 21px**.
   - Thẻ KPI bố trí theo dạng **lưới 2 × 2** vuông vức phía trên, số liệu to **26px**.
4. **Lọc theo văn phòng**:
   - Nếu người dùng bấm lọc 1 văn phòng (ví dụ `VPSG`), ảnh xuất sẽ tự động chỉ chứa nhân sự văn phòng đó kèm nhãn `• Bộ lọc: VP VPSG (9 nhân sự)`.
5. **Tự động khôi phục bảng**: Ngay khi hoàn tất xuất ảnh, giao diện web tự động khôi phục lại toàn bộ 11 cột để người dùng tiếp tục tra cứu trên máy tính.

---

## 🤖 5. Quy Trình Chuẩn (SOP) Dành Cho AI Agent Khi Nhận File Mới

Khi người dùng gửi file Excel tháng mới (ví dụ: `BAO_CAO_CHI_TIET_VE_HANH_KHACH_10.xlsx`):

1. **Bước 1: Lưu trữ vào thư mục tháng**:
   - Đặt file Excel vào `data/raw/Thang_[Thang]_[Nam]/` (ví dụ `data/raw/Thang_10_2026/`).
   - Nếu người dùng để file ngoài thư mục gốc, hệ thống `pipeline.py` sẽ tự động phát hiện và sao lưu vào đúng thư mục tháng.

2. **Bước 2: Chạy pipeline xử lý**:
   - Chạy lệnh:
     ```bash
     python pipeline.py
     ```
     *(hoặc chỉ định đường dẫn: `python pipeline.py "data/raw/Thang_10_2026/ten_file.xlsx"`)*.

3. **Bước 3: Kiểm tra chất lượng dữ liệu (Quality Gate)**:
   - Tổng số khách trong output có bằng tổng số vé `Đã thanh toán` (trừ AnVui) không?
   - `ADMIN TÂM HẠNH` đã được gộp vào `Mỹ Lệ` chưa?
   - Tên cột đã là `Tổng Đài / Tại Quầy` chưa?
   - Cột `Khách Vé Xe Rẻ (Vexere)` có khớp với `Đại lý == 'VEXERE'` không?
   - Thẻ KPI "Văn phòng dẫn đầu" có hiển thị đúng văn phòng có sản lượng cao nhất không?

4. **Bước 4: Bàn giao cho người dùng**:
   - Cung cấp clickable link dẫn tới:
     - File Excel kết quả: `data/output/Thang_[MM]_[YYYY]/TONG_HOP_NHAN_VIEN_*.xlsx`.
     - File ảnh xuất điện thoại: `data/output/Thang_[MM]_[YYYY]/BaoCao_NhanVien_Mobile_*.png`.
     - File Dashboard HTML: `dashboard/index.html` hoặc `BaoCao_NhanVien_NhanKhach.html`.
