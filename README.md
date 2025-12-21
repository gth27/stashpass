# Stashpass – Tài liệu Bàn giao Dự án

Repository này bao gồm **smart contract Sui Move** và **logic client viết bằng TypeScript** cho ứng dụng phát hành vé on-chain.

## 1. Cấu trúc Dự án

* **/contracts**: Mã nguồn Sui Move và các bài test.
* **/client**: Logic scanner và cấu hình mạng viết bằng TypeScript.
* **.gitignore**: Đã cấu hình để bỏ qua `build/`, `node_modules/` và file `.env`.

## 2. Bắt đầu (Cài đặt)

### Bước 1: Cài đặt Dependencies

Cần cài Node modules cho cả hai thư mục chính:

```bash
# Cài dependencies cho client
cd client && npm install

# Cài dependencies cho contracts (nếu chạy test JS)
cd ../contracts && npm install
```

### Bước 2: Thiết lập biến môi trường

Ứng dụng sử dụng các biến môi trường để tìm hợp đồng và đối tượng Ticket Machine.

1. Trong folder `client/`, tạo file tên `.env`.
2. Thêm các ID sau (sẽ gửi riêng):

```env
# Network (mặc định là testnet)
SUI_NETWORK=testnet

# Package ID của hợp đồng Move đã triển khai
SUI_PACKAGE_ID=0x...

# ID của đối tượng Ticket Machine dùng chung
SUI_TICKET_MACHINE_ID=0x...

# (Không bắt buộc) Private key cho scanner/backend test
SUI_PRIVATE_KEY=suiprivkey...
```

## 3. Làm việc với Smart Contract

Yêu cầu đã cài **Sui CLI**:

* **Build contract**

  ```bash
  cd contracts && sui move build
  ```

* **Chạy test**

  ```bash
  sui move test
  ```

* **Deploy**

  ```bash
  sui client publish --gas-budget 100000000
  ```

## 4. Làm việc với Client

* **Scanner:** Logic theo dõi / xử lý nằm trong `client/scanner.ts`
* **Cấu hình:** Thiết lập mạng và environment trong `client/config.ts`
* **Chạy ứng dụng:**

  ```bash
  npm start
  ```

  hoặc

  ```bash
  ts-node index.ts
  ```

  (chạy trong thư mục `client/`)

## 5. Lưu ý Quan trọng

* **KHÔNG** commit file `.env` (đã được ignore nhưng vẫn cần cẩn trọng).
* **KHÔNG** commit thư mục `build/` trong `contracts`; thư mục này sẽ được tạo lại khi build.
* **Ví (Wallet):** Frontend cần sử dụng **Sui Wallet Adapter**.
  `PACKAGE_ID` trong `.env` xác định contract mà ứng dụng sẽ tương tác.
