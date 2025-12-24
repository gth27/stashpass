# StashPass – Hệ Thống Vé Sự Kiện "Living Asset" trên Sui

Repository này chứa toàn bộ mã nguồn của dự án **StashPass**:

1. **Smart Contract (Backend):** Viết bằng Sui Move, sử dụng mô hình **Shared Objects** để tối ưu hóa khả năng mở rộng.
2. **Web Frontend:** Ứng dụng React/Vite kết nối ví, phục vụ Admin, Nhân viên (Staff) và Người dùng (User).
3. **Admin Scripts:** Bộ công cụ TypeScript để deploy, cài đặt metadata và kiểm thử nhanh.

## Tính năng Nổi bật

* **Soulbound Tickets:** Vé vào cửa gắn liền với ví (không thể chuyển nhượng/bán lại), chống vé chợ đen (Scalping).
* **Dynamic Evolution:** Vé "tiến hóa" metadata theo thời gian thực khi người dùng tham gia các hoạt động (quét mã tại Booth).
* **Shared Object Booths:** Cổng soát vé là đối tượng chia sẻ, cho phép hàng nghìn người check-in cùng lúc mà không tắc nghẽn.
* **Burn-to-Mint:** Đốt vé đã hoàn thành nhiệm vụ để đổi lấy **Souvenir NFT** (có thể giao dịch) và nhận đặc quyền.
* **Staff Dashboard:** Tự động đồng bộ hóa các Booth từ blockchain mà không cần cấu hình thủ công.

---

## 1. Cấu trúc Dự án

* `contracts/`: Mã nguồn Sui Move.
* `stashpass.move`: Module chính quản lý sự kiện, vé và booth.


* `web/`: Giao diện người dùng (React + Vite + dApp Kit).
* `admin-scripts/`: Công cụ dành cho Deployer/Admin.
* `setup.ts`: Khởi tạo Sự kiện, tạo Booth và **tự động ghi file cấu hình cho Frontend**.
* `setup-display.ts`: Cài đặt hiển thị hình ảnh NFT (Sui Object Display).
* `make-me-admin.ts`: Chuyển quyền Admin (OrganizerCap) cho ví khác.
* `test-evolve.ts`, `test-refund.ts`: Các script kiểm thử luồng nghiệp vụ.



---

## 2. Cài đặt & Triển khai

### Bước 1: Deploy Smart Contract (Backend)

Đảm bảo bạn đã cài đặt **Sui CLI** và có số dư SUI (Testnet).

```bash
cd contracts
sui client publish --gas-budget 100000000 --skip-dependency-verification

```

*Sau khi chạy xong, hãy copy **Package ID** từ terminal.*

### Bước 2: Cấu hình Script Quản trị

```bash
cd ../admin-scripts
npm install

```

Tạo file `.env` trong thư mục `admin-scripts/` và điền thông tin:

```env
# Mạng lưới
SUI_NETWORK=testnet

# 1. Package ID vừa deploy ở Bước 1
SUI_PACKAGE_ID=0x... (Dán ID của bạn vào đây)

# 2. Private Key của ví deployer (để chạy script setup)
SUI_PRIVATE_KEY=suiprivkey... (hoặc 0x...)

# 3. Địa chỉ kho bạc (nơi nhận phí 1%) - Có thể dùng địa chỉ ví của bạn
SUI_PROTOCOL_TREASURY_ID=0x...

```

### Bước 3: Chạy Script Khởi tạo (Quan trọng)

Script này sẽ tạo Sự kiện, tạo các Booth mẫu, và **tự động tạo file `deployment.json**` cho Frontend.

```bash
npx ts-node setup.ts

```

*(Tùy chọn)* Cài đặt hiển thị ảnh đẹp cho NFT:

```bash
npx ts-node setup-display.ts

```

### Bước 4: Khởi chạy Frontend (Web)

```bash
cd ../web
npm install
npm run dev

```

Truy cập: `http://localhost:5173`

---

## 3. Hướng dẫn Sử dụng

### A. Dành cho Admin (Organizer)

1. Kết nối ví Deployer vào Web App.
2. Truy cập trang `/admin`.
3. **Tạo Booth mới:** Nhập tên booth, chọn chế độ (Có huy hiệu hoặc Chỉ kiểm tra). Booth sẽ xuất hiện ngay lập tức trên toàn mạng lưới (Shared Object).
4. **Cấu hình Phần thưởng:** Thêm quy tắc đổi quà (Ví dụ: Có huy hiệu "VIP" -> Giảm giá 50%).
5. **Rút tiền (Cash Out):** Rút doanh thu bán vé về ví.

### B. Dành cho Nhân viên (Staff Dashboard)

1. Truy cập trang `/staff`.
2. Kết nối ví bất kỳ (Không cần quyền đặc biệt vì Booth là Shared Object).
3. Hệ thống tự động tải danh sách các Booth hiện có.
4. Chọn một Booth để hiện mã QR Check-in.

### C. Dành cho Người dùng (User Flow)

1. **Mua vé:** Tại trang chủ, mua vé "General Admission".
2. **Check-in:** Vào "My Tickets", bấm nút "Scan QR" và quét mã trên màn hình của Staff.
3. **Tiến hóa:** Khi thu thập đủ huy hiệu, bấm "Evolve" để đốt vé và nhận Souvenir NFT.

---

## 4. Các Script Tiện ích (CLI)

Ngoài giao diện Web, bạn có thể dùng CLI để test nhanh:

* **Chuyển quyền Admin:**
```bash
npx ts-node admin-scripts/make-me-admin.ts <DIA_CHI_VI_MOI>

```


* **Test luồng Tiến hóa (Evolve) không cần UI:**
```bash
npx ts-node admin-scripts/test-evolve.ts

```


* **Test luồng Hoàn tiền (Refund):**
```bash
npx ts-node admin-scripts/test-refund.ts

```



---

## 5. Lưu ý Bảo mật

1. **Private Key:** Chỉ dùng Private Key trong `admin-scripts/.env` để chạy lệnh setup. **Frontend không bao giờ yêu cầu Private Key.**
2. **Git:** File `.env` đã được thêm vào `.gitignore`. Tuyệt đối không commit file này lên GitHub.
3. **Mạng:** Dự án mặc định chạy trên **Sui Testnet**. Hãy đảm bảo ví của bạn đang ở đúng mạng.
