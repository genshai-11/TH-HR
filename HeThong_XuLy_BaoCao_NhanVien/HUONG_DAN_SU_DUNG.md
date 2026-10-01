# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG TRÍCH XUẤT BÁO CÁO ĐỊNH KỲ

Thư mục này chứa toàn bộ quy trình tự động hóa để trích xuất dữ liệu vé hành khách theo nhân viên và văn phòng cho Xe Khách Tâm Hạnh. Dữ liệu được tổ chức khoa học, tự động phân nhóm và lưu trữ theo từng tháng.

---

## 🚀 Cách chạy báo cáo hàng tháng (Chỉ 1 click)

### Cách 1 (Đơn giản nhất):
1. Tải file Excel chi tiết vé tháng mới về máy (thường có tên `BAO_CAO_CHI_TIET_VE_HANH_KHACH_*.xlsx`).
2. Copy file đó bỏ vào thư mục này: `C:\Users\gensh\Downloads\HeThong_XuLy_BaoCao_NhanVien\`
3. Nhấp đúp chuột vào file **`CHAY_BAO_CAO.bat`**.
*(Hệ thống sẽ tự động nhận diện tháng, tạo thư mục tháng tương ứng trong `data/raw/` và `data/output/`, xử lý và mở Dashboard báo cáo ngay lập tức!)*

### Cách 2 (Kéo - Thả):
- Nắm file Excel mới và **kéo thả trực tiếp** vào biểu tượng file **`CHAY_BAO_CAO.bat`**.

### Cách 3 (Dòng lệnh):
```bash
python pipeline.py "duong_dan_den_file_excel_thang_moi.xlsx"
```

---

## 📁 Cấu trúc thư mục dữ liệu phân theo tháng

```text
HeThong_XuLy_BaoCao_NhanVien/
├── CHAY_BAO_CAO.bat                         # Nút bấm 1-Click tự động
├── pipeline.py                              # Mã nguồn tự động hóa
├── BaoCao_NhanVien_NhanKhach.html           # Xem nhanh Dashboard tháng mới nhất
├── BaoCao_NhanVien_Mobile_T09_2026.png      # Ảnh báo cáo khổ dọc cho điện thoại
│
├── data/
│   ├── raw/                                 # File gốc tải về (phân theo tháng)
│   │   ├── Thang_08_2026/
│   │   └── Thang_09_2026/
│   │
│   └── output/                              # Kết quả xuất (phân theo tháng)
│       ├── Thang_08_2026/
│       │   └── TONG_HOP_NHAN_VIEN_082026_092026.xlsx
│       └── Thang_09_2026/
│           ├── TONG_HOP_NHAN_VIEN_092026_102026.xlsx
│           ├── BaoCao_NhanVien_Mobile_T09_2026.png
│           ├── BaoCao_NhanVien_NhanKhach.html
│           └── data_nhanvien.json
│
└── dashboard/
    └── index.html                           # Giao diện web tương tác đầy đủ
```

---

## ⚙️ Các quy tắc nghiệp vụ hệ thống tự động xử lý

1. **Lọc trạng thái vé**:
   - Chỉ tính các vé có trạng thái `Đã thanh toán`.
   - Tự động bỏ dòng `Tổng cộng` cuối bảng của phần mềm xuất ra.
   - Loại trừ các vé giữ chỗ ưu tiên, hết hạn hoặc chưa thanh toán.

2. **Xử lý tài khoản đặc biệt**:
   - Gộp số lượng của **`ADMIN TÂM HẠNH`** vào nhân viên **`Mỹ Lệ`**.
   - Tự động lọc bỏ tài khoản hệ thống **`AnVui Anonymous User`**.

3. **Phân bổ văn phòng**:
   - **VPSG**: Phước, Chi (Minh Chi), Phấn, Trân, Mỹ Lệ, Sung (Nguyễn Hữu Sung), Ngọc Phúc, Ngọc Thi, Quý.
   - **VPPT**: Mỹ Trang (Lê Thị Mỹ Trang), Huyền, Thông (Đặng Ngọc Thông), Hưng, Nhé (Đỗ Văn Nhé), Phương (Trần Tuấn Phương), Khắc Duy (Nguyễn Khắc Duy).
   - **VPDK**: Các nhân sự còn lại (Đông Nguyễn, Hồng Liên, Ngọc Trang, Hồng Lệ, TRUNG...).
   - **Đại lý**: ĐL RedBus.

4. **Tách dữ liệu Vé Xe Rẻ (Vexere) & Tổng Đài / Tại Quầy**:
   - Tự động nhận diện vé từ đại lý `VEXERE`.
   - Tách riêng cột **`Tổng Đài / Tại Quầy`** và cột **`Khách Vé Xe Rẻ (Vexere)`** kèm tỷ lệ %.

5. **Nhận diện tháng động**:
   - Tự động quét toàn bộ ngày tạo và ngày đi trong file để chia theo từng tháng (ví dụ: Tháng 08/2026, Tháng 09/2026, Tháng 10/2026...).

---

## 🖥️ Các tính năng hữu ích trên Web Dashboard

1. **Phóng to / Thu nhỏ cỡ chữ (`-A` / `+A`)**:
   - Nằm ngay thanh công cụ: Nhấn **`[+A]`** để chữ và số to rõ ràng hơn, nhấn **`[-A]`** để thu nhỏ.
   - Khi tăng cỡ chữ, **toàn bộ bảng tăng đều** (cả tên nhân viên, cột Vé Xe Rẻ và Hàng Tổng cộng).
2. **Tùy chỉnh khoảng cách chữ (`Gần hơn` ↔ `Thoáng`)**:
   - Bấm nút **`[Gần hơn]`** để thu gọn khoảng cách các cột, kéo chữ và số lại gần nhau nhất.
3. **Kéo viền cột trực tiếp bằng chuột**:
   - Rê chuột vào vách ngăn giữa 2 cột bất kỳ trên tiêu đề bảng (xuất hiện biểu tượng `↔`), kéo chuột sang trái hoặc sang phải để thu hẹp/mở rộng cột tùy ý.
   - Nhấp đúp chuột vào vách ngăn để đưa độ rộng cột về tự động.
4. **Nút `📸 Xuất Ảnh HD (PNG)`**:
   - Tự động kết xuất ảnh **khổ dọc chuyên biệt cho điện thoại** (tỷ lệ 2:1), chữ số to gấp đôi rõ nét, chỉ giữ lại 6 cột quan trọng nhất để xem ngay trên điện thoại hoặc gửi qua Zalo/Telegram.
