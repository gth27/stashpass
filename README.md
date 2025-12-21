# StashPass – Hệ Thống Vé Sự Kiện Phi Tập Trung

Repository này chứa **smart contract Sui Move** (Backend) và các công cụ giả lập Client (Frontend/Scanner) cho ứng dụng phát hành vé on-chain StashPass.

Dự án sử dụng mô hình **Factory Pattern**, cho phép bất kỳ ai cũng có thể tạo sự kiện riêng, phát hành vé và quản lý cổng soát vé (Booth) của mình.

## 1. Cấu trúc Dự án

* **/contracts**: Mã nguồn Sui Move (V2 - Factory Edition).
* **/client**: Mã nguồn TypeScript để tương tác với blockchain.
    * `setup.ts`: **(Mới)** Script giả lập toàn bộ luồng: Tạo sự kiện -> Mua vé -> Tạo Booth.
    * `scanner.ts`: Ứng dụng soát vé dành cho nhân viên (Staff).
    * `index.ts`: Công cụ xem chi tiết vé (Ticket Viewer).
    * `config.ts`: Quản lý cấu hình mạng và biến môi trường.

## 2. Cài đặt & Bắt đầu

### Bước 1: Cài đặt Dependencies

```bash
# Cài đặt cho client
cd client && npm install

```

### Bước 2: Cấu hình Môi trường (.env)

Tạo file `.env` trong thư mục `client/` và điền các thông tin cấu hình (Nhắn riêng):

```env
# Mạng lưới (Testnet)
SUI_NETWORK=testnet

# 1. Địa chỉ Contract (Package ID)
SUI_PACKAGE_ID=0x94436468e63898d357da62908afd46698156fd6b9a3cf849e40983bc3f5c56bc

# 2. Kho bạc giao thức (Nơi nhận phí 1%)
SUI_PROTOCOL_TREASURY_ID=0x95f8a9de71689f1bce56cfe9c3161f634ef89a612e255fe41a5003dfb20d3c0a

# 3. Private Key (Chỉ dùng cho Admin/Dev để chạy script test)
# Hỗ trợ định dạng: 'suiprivkey...', '0x...', hoặc Base64
SUI_PRIVATE_KEY=suiprivkey...

```

---

## 3. Hướng dẫn Sử dụng (Client Scripts)

Chúng tôi đã chuẩn bị sẵn các script để giả lập các vai trò người dùng khác nhau:

### A. Vai trò: Organizer & User (Giả lập luồng chính)

Chạy script này để khởi tạo một sự kiện mới, tự mua một vé và tạo cổng soát vé. Đây là cách nhanh nhất để lấy các ID mới cho Frontend test.

```bash
cd client
npx ts-node setup.ts

```

*Output sẽ cung cấp: `Machine ID` (Sự kiện), `Ticket ID` (Vé mẫu), và `Booth ID` (Cổng soát vé).*

### B. Vai trò: Nhân viên soát vé

Giả lập việc nhân viên sử dụng camera để quét mã QR của khách.

1. Mở `client/scanner.ts`.
2. Cập nhật `TICKET_TO_SCAN` bằng ID vé bạn vừa mua được từ bước setup.
3. Chạy lệnh:

```bash
npx ts-node scanner.ts

```

### AB. Vai trò: Kiểm tra vé

Xem chi tiết metadata của vé và lịch sử đóng dấu (Badges).

1. Mở `client/index.ts`.
2. Cập nhật `TICKET_ID`.
3. Chạy lệnh:

```bash
npx ts-node index.ts

```

---

## 4. Thông tin Smart Contract

* **Ngôn ngữ:** Sui Move
* **Mạng:** Testnet
* **Tính năng chính:**
* `create_event(price)`: Tạo máy bán vé (TicketMachine) và quyền quản trị (OrganizerCap).
* `buy_ticket(machine, treasury, coin)`: Mua vé. Phí 1% chuyển về Treasury, còn lại chuyển vào Machine.
* `create_booth(org_cap, name)`: Tạo quyền soát vé (BoothCap) cho nhân viên.
* `stamp_ticket(booth_cap, ticket)`: Đóng dấu tham dự lên vé (On-chain Verification).



## 5. Lưu ý Quan trọng

* **Bảo mật:** Không bao giờ commit file `.env` lên GitHub.
* **Frontend:** Team Frontend chỉ cần quan tâm đến `PACKAGE_ID`, `TREASURY_ID` và `Machine ID` (để test nút mua vé). Không cần dùng Private Key.
