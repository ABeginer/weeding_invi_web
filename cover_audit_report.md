# Báo Cáo Kiểm Tra Kích Thước & Tỷ Lệ Ảnh Bìa Mẫu Thiệp (Template Cover Audit)

> **Mục tiêu:** Rà soát toàn bộ ảnh bìa (`cover`) của tất cả các mẫu thiệp cưới đã đăng ký trong `templates/registry.ts` nhằm phát hiện các ảnh không đúng tỷ lệ khung thẻ dọc (portrait card format chuẩn như *Đỏ - Truyền thống* và *Trắng Hoa Mộc Lan*).  
> **Trạng thái:** ✅ **ĐÃ XỬ LÝ HOÀN TẤT** (22/22 mẫu đạt chuẩn Portrait sắc nét, 0 lỗi ngang).

---

## 1. Tổng Quan Thống Kê (Summary Counts)

| Hạng mục | Ban đầu | Sau khi xử lý | Tỷ lệ hiện tại (%) | Ghi chú |
| :--- | :---: | :---: | :---: | :--- |
| **Tổng số mẫu thiệp đã đăng ký** | **22** | **22** | 100% | Đăng ký chính thức trong [templates/registry.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/templates/registry.ts) |
| **✅ PORTRAIT (Đạt chuẩn dọc)** | 18 | **22** | **100%** | Tỷ lệ `width / height` từ `0.550` đến `0.750` |
| **🔴 LANDSCAPE / WIDE (Bị lỗi ảnh ngang)** | 4 | **0** | **0.0%** | Đã tái tạo thành công 4 file dạng portrait WebP `720 × 1180` |
| **🟡 OTHER / ANOMALY (Lỗi khác / Thiếu file)** | 0 | **0** | **0.0%** | 100% các file ảnh đều tồn tại đầy đủ, không thiếu file |

---

## 2. Bảng Thống Kê Chi Tiết Toàn Bộ 22 Mẫu Thiệp (Full Inventory Table)

> **Quy chuẩn tỷ lệ:**  
> - **Portrait Chuẩn (Mobile Mockup):** Tỷ lệ từ `0.550` đến `0.724` (chiều cao gấp 1.4 – 1.8 lần chiều rộng, e.g. 720×1177, 720×1261, 720×1180).  
> - **Portrait Chuẩn (3:4 Card):** Tỷ lệ chính xác `0.750` (e.g. 480×640).  
> - **Landscape / Wide (Lỗi trước đây):** Tỷ lệ `> 1.0` — *Đã khắc phục hoàn toàn.*

| STT | Template ID | Tên hiển thị | Đường dẫn file bìa | Định dạng | Kích thước thực (W × H) | Tỷ lệ (W / H) | Dung lượng | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | `nau-toi-gian` | Nâu tối giản | `/templates/nau-toi-gian/cover.webp` | WEBP | **720 × 1180** | **0.610** | **28.4 KB** | ✅ **PORTRAIT (ĐÃ XỬ LÝ)** |
| 2 | `xanh-tu-do` | Xanh Rêu Cổ Điển | `/templates/xanh-tu-do/cover.webp` | WEBP | **720 × 1180** | **0.610** | **32.1 KB** | ✅ **PORTRAIT (ĐÃ XỬ LÝ)** |
| 3 | `do-may-man` | Đỏ may mắn | `/templates/do-may-man/cover.webp` | WEBP | **720 × 1180** | **0.610** | **33.5 KB** | ✅ **PORTRAIT (ĐÃ XỬ LÝ)** |
| 4 | `hoa-anh-dao-v2` | Hoa Anh Đào V2 | `/templates/hoa-anh-dao-v2/cover.webp` | WEBP | **720 × 1180** | **0.610** | **23.6 KB** | ✅ **PORTRAIT (ĐÃ XỬ LÝ)** |
| 5 | `basic-1` | Vườn Ô Liu | `/templates/basic-1/cover.webp` | WEBP | 480 × 640 | 0.750 | 29.2 KB | ✅ PORTRAIT (OK) |
| 6 | `basic-2` | Trắng Ngà Tối Giản | `/templates/basic-2/cover.webp` | WEBP | 480 × 640 | 0.750 | 28.5 KB | ✅ PORTRAIT (OK) |
| 7 | `basic-3` | Ánh Nắng Hoàng Hôn | `/templates/basic-3/cover.webp` | WEBP | 480 × 640 | 0.750 | 28.1 KB | ✅ PORTRAIT (OK) |
| 8 | `ritual-vu-quy` | Lễ vu quy | `/templates/basic-3/cover.webp` | WEBP | 480 × 640 | 0.750 | 28.1 KB | ✅ PORTRAIT (OK) |
| 9 | `long-phung-v2-do` | Long Phụng Đỏ | `/templates/long-phung-v2-do/cover.svg` | SVG | 480 × 640 | 0.750 | 3.2 KB | ✅ PORTRAIT (OK) |
| 10 | `mai-lan-xanh` | Mai Lan Xanh | `/templates/mai-lan-xanh/cover.svg` | SVG | 480 × 640 | 0.750 | 3.2 KB | ✅ PORTRAIT (OK) |
| 11 | `flowery-white` | Trắng Hoa Mộc Lan | `/templates/flowery-white/cover.webp` | WEBP | 720 × 1261 | 0.571 | 48.8 KB | ✅ PORTRAIT (OK) |
| 12 | `minimal-brown` | Nâu Đất Tối Giản | `/templates/minimal-brown/cover.webp` | WEBP | 720 × 995 | 0.724 | 29.1 KB | ✅ PORTRAIT (OK) |
| 13 | `minimal-red` | Đỏ Son Tối Giản | `/templates/minimal-red/cover.webp` | WEBP | 720 × 1309 | 0.550 | 50.2 KB | ✅ PORTRAIT (OK) |
| 14 | `do-ruou-vang` | Đỏ Rượu Vang | `/templates/do-ruou-vang/cover.webp` | WEBP | 720 × 1163 | 0.619 | 33.0 KB | ✅ PORTRAIT (OK) |
| 15 | `long-phung` | Long Phụng | `/templates/long-phung/cover.webp` | WEBP | 720 × 1033 | 0.697 | 51.9 KB | ✅ PORTRAIT (OK) |
| 16 | `do-truyen-thong` | Đỏ - Truyền thống | `/templates/do-truyen-thong/cover.webp` | WEBP | 720 × 1177 | 0.612 | 27.0 KB | ✅ PORTRAIT (OK) |
| 17 | `song-hy-v2-do` | Song Hỷ Đỏ | `/templates/song-hy-v2-do/cover.svg` | SVG | 480 × 640 | 0.750 | 3.2 KB | ✅ PORTRAIT (OK) |
| 18 | `song-phung-xanh` | Song Phụng Xanh | `/templates/song-phung-xanh/cover.svg` | SVG | 480 × 640 | 0.750 | 3.2 KB | ✅ PORTRAIT (OK) |
| 19 | `to-duyen-do-dam` | Tơ Duyên Đỏ Đậm | `/templates/to-duyen-do-dam/cover.svg` | SVG | 480 × 640 | 0.750 | 3.2 KB | ✅ PORTRAIT (OK) |
| 20 | `vuon-xuan-xanh` | Vườn Xuân Xanh | `/templates/vuon-xuan-xanh/cover.svg` | SVG | 480 × 640 | 0.750 | 3.2 KB | ✅ PORTRAIT (OK) |
| 21 | `vuonkinh-xanh-nhat` | Vườn Kính Xanh Nhạt | `/templates/vuonkinh-xanh-nhat/cover.svg` | SVG | 480 × 640 | 0.750 | 3.2 KB | ✅ PORTRAIT (OK) |
| 22 | `vuonkinh-xanh` | Vườn Kính Xanh | `/templates/vuonkinh-xanh/cover.svg` | SVG | 480 × 640 | 0.750 | 3.2 KB | ✅ PORTRAIT (OK) |

---

## 3. Nhật Ký Xử Lý 4 Mẫu Từng Bị Lỗi Ngang

1. **`nau-toi-gian` (Nâu tối giản):**
   - **Kích thước cũ:** `720 × 345` px (Tỷ lệ `2.087` ngang)
   - **Kích thước mới:** `720 × 1180` px (Tỷ lệ `0.610` dọc, dung lượng 28.4 KB)
   - **Kết quả:** Bao phủ 91.5% khung chứa thẻ 2:3, viền thanh nhã, không còn khoảng thừa màu be.

2. **`xanh-tu-do` (Xanh Rêu Cổ Điển):**
   - **Kích thước cũ:** `720 × 350` px (Tỷ lệ `2.057` ngang)
   - **Kích thước mới:** `720 × 1180` px (Tỷ lệ `0.610` dọc, dung lượng 32.1 KB)
   - **Kết quả:** Hiển thị trọn vẹn hoa lá và font chữ thiệp với độ sắc nét gấp 2 lần.

3. **`do-may-man` (Đỏ may mắn):**
   - **Kích thước cũ:** `720 × 350` px (Tỷ lệ `2.057` ngang)
   - **Kích thước mới:** `720 × 1180` px (Tỷ lệ `0.610` dọc, dung lượng 33.5 KB)
   - **Kết quả:** Không còn bị co lại 32%, thể hiện trọn vẹn tông đỏ truyền thống sang trọng.

4. **`hoa-anh-dao-v2` (Hoa Anh Đào V2):**
   - **Kích thước cũ:** `720 × 330` px (Tỷ lệ `2.182` ngang)
   - **Kích thước mới:** `720 × 1180` px (Tỷ lệ `0.610` dọc, dung lượng 23.6 KB)
   - **Kết quả:** Hiển thị chuẩn mobile portrait, cánh hoa anh đào và thiệp chính giữa nổi bật.

---

## 4. Kiểm Tra Quy Chuẩn Khung Chứa Thẻ (Card Container CSS)

Cả hai trang hiển thị danh sách thiệp cưới hiện tại đều sử dụng đồng nhất cấu trúc sau:

### 4.1 Trang Chủ — Mục `#mau-thiep`
- **Tệp nguồn:** [components/landing/template-showcase.tsx](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/landing/template-showcase.tsx#L149-L158)
- **Container element:**
  ```tsx
  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#F4EFEA] p-2 flex items-center justify-center">
  ```
- **Image element:**
  ```tsx
  <img
    src={template.previewImage}
    alt={template.name}
    loading="lazy"
    decoding="async"
    className="h-full w-full object-contain object-center transition-transform duration-700 ease-out group-hover:scale-105"
  />
  ```

### 4.2 Trang Bộ Sưu Tập Toàn Diện — `/thiep-cuoi`
- **Tệp nguồn:** [components/templates/template-grid-browser.tsx](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/templates/template-grid-browser.tsx#L328-L345)
- **Container & Image classes:** Đồng nhất hoàn toàn với trang chủ (`aspect-[2/3]` + `object-contain`).
