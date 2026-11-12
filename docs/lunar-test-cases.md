# Bảng đối chiếu Âm Dương lịch Việt Nam (Chuẩn hóa múi giờ `Asia/Ho_Chi_Minh`, UTC+7)

Tài liệu này lưu trữ **28 mốc ngày** đối chiếu độc lập từ hai nhóm nguồn lịch Việt Nam chính thống & tra cứu phổ biến (`lichngaytot.com`, `xemlicham.com`, `lichviet.app`, `lichamviet.com`, `thientue.vn`, `thuvienphapluat.vn`) dùng để kiểm thử tự động trong [`tests/lunar.test.ts`](../tests/lunar.test.ts).

Quy ước cột:
- `Dương lịch`: định dạng `YYYY-MM-DD`
- `Âm lịch`: định dạng `DD/MM/YYYY`
- `Nhuận`: `Có` nếu là tháng nhuận âm lịch, `Không` nếu là tháng thường
- `Can Chi năm`: Can Chi của năm âm lịch
- `Ghi chú & Nguồn đối chiếu`: Ý nghĩa mốc ngày & nguồn kiểm tra

| Dương lịch | Âm lịch | Nhuận | Can Chi năm | Ghi chú & Nguồn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| 1945-09-02 | 26/07/1945 | Không | Ất Dậu | Quốc khánh 1945 (`lichviet.app`) |
| 1975-04-30 | 20/03/1975 | Không | Ất Mão | Ngày 30/04/1975 (`kabala.vn`) |
| 1985-01-21 | 01/01/1985 | Không | Ất Sửu | Mùng 1 Tết Ất Sửu Việt Nam UTC+7 — khác lịch UTC+8 (`lichviet.app`, `baonghean.vn`) |
| 1995-09-09 | 15/08/1995 | Không | Ất Hợi | Rằm tháng 8 thường 1995 (`xemlicham.com`) |
| 1995-09-25 | 02/08/1995 | Có | Ất Hợi | Tháng 8 nhuận 1995 (`lichngaytot.com`, `xemlicham.com`) |
| 1995-10-08 | 15/08/1995 | Có | Ất Hợi | Rằm tháng 8 nhuận 1995 (`thientue.vn`, `cohoc.net`) |
| 2000-01-01 | 25/11/1999 | Không | Kỷ Mão | Giao thừa thiên niên kỷ 2000 (`thientue.vn`, `xemlicham.com`) |
| 2001-05-23 | 01/04/2001 | Có | Tân Tỵ | Mùng 1 tháng 4 nhuận 2001 (`thientue.vn`) |
| 2004-03-21 | 01/02/2004 | Có | Giáp Thân | Mùng 1 tháng 2 nhuận 2004 (`thientue.vn`, `lichviet.app`) |
| 2012-05-21 | 01/04/2012 | Có | Nhâm Thìn | Mùng 1 tháng 4 nhuận 2012 (`thientue.vn`, `lichviet.app`) |
| 2014-10-24 | 01/09/2014 | Có | Giáp Ngọ | Mùng 1 tháng 9 nhuận 2014 (`thientue.vn`, `lichviet.app`) |
| 2017-07-23 | 01/06/2017 | Có | Đinh Dậu | Mùng 1 tháng 6 nhuận 2017 (`thientue.vn`, `taimienphi.vn`) |
| 2020-01-25 | 01/01/2020 | Không | Canh Tý | Mùng 1 Tết Canh Tý (`vietnamnet.vn`, `lichviet.app`) |
| 2020-05-23 | 01/04/2020 | Có | Canh Tý | Mùng 1 tháng 4 nhuận 2020 (`lichngaytot.com`, `mathvn.com`) |
| 2021-02-12 | 01/01/2021 | Không | Tân Sửu | Mùng 1 Tết Tân Sửu (`vtcnews.vn`, `lichviet.app`) |
| 2022-02-01 | 01/01/2022 | Không | Nhâm Dần | Mùng 1 Tết Nhâm Dần (`vietnamnet.vn`, `lichviet.app`) |
| 2023-01-22 | 01/01/2023 | Không | Quý Mão | Mùng 1 Tết Quý Mão (`mediamart.vn`) |
| 2023-03-22 | 01/02/2023 | Có | Quý Mão | Mùng 1 tháng 2 nhuận 2023 (`cellphones.com.vn`, `lichngaytot.com`) |
| 2023-04-05 | 15/02/2023 | Có | Quý Mão | Rằm tháng 2 nhuận 2023 (`lichngaytot.com`) |
| 2024-02-10 | 01/01/2024 | Không | Giáp Thìn | Mùng 1 Tết Giáp Thìn (`thuvienphapluat.vn`) |
| 2024-09-17 | 15/08/2024 | Không | Giáp Thìn | Tết Trung thu 2024 (`lichviet.app`) |
| 2025-01-29 | 01/01/2025 | Không | Ất Tỵ | Mùng 1 Tết Ất Tỵ (`thuvienphapluat.vn`, `watchstore.vn`) |
| 2025-04-07 | 10/03/2025 | Không | Ất Tỵ | Giỗ Tổ Hùng Vương 2025 (`wikipedia.org`) |
| 2025-07-25 | 01/06/2025 | Có | Ất Tỵ | Mùng 1 tháng 6 nhuận 2025 (`lichngaytot.com`, `lichamviet.com`) |
| 2025-08-08 | 15/06/2025 | Có | Ất Tỵ | Rằm tháng 6 nhuận 2025 (`xemlicham.com`, `lichngaytot.com`) |
| 2025-10-06 | 15/08/2025 | Không | Ất Tỵ | Tết Trung thu 2025 (`pico.vn`) |
| 2026-02-14 | 27/12/2025 | Không | Ất Tỵ | Tất niên cuối năm Ất Tỵ (`suckhoedoisong.vn`) |
| 2026-02-17 | 01/01/2026 | Không | Bính Ngọ | Mùng 1 Tết Bính Ngọ (`phongvu.vn`, `actgold.com.vn`) |
| 2026-04-26 | 10/03/2026 | Không | Bính Ngọ | Giỗ Tổ Hùng Vương 2026 (`wikipedia.org`) |
| 2026-04-30 | 14/03/2026 | Không | Bính Ngọ | Ngày 30/04/2026 (`giaoducthoidai.vn`) |
| 2026-09-02 | 21/07/2026 | Không | Bính Ngọ | Ngày 02/09/2026 (`baomoi.com`) |
| 2026-11-20 | 12/10/2026 | Không | Bính Ngọ | Ngày 20/11/2026 (`thientue.vn`) |
| 2027-02-06 | 01/01/2027 | Không | Đinh Mùi | Mùng 1 Tết Đinh Mùi (`lichamviet.com`) |
| 2027-04-16 | 10/03/2027 | Không | Đinh Mùi | Giỗ Tổ Hùng Vương 2027 (`penci.vn`) |
| 2028-01-26 | 01/01/2028 | Không | Mậu Thân | Mùng 1 Tết Mậu Thân (`lichviet.app`) |
| 2028-06-23 | 01/05/2028 | Có | Mậu Thân | Mùng 1 tháng 5 nhuận 2028 (`lichamviet.com`) |
| 2028-07-07 | 15/05/2028 | Có | Mậu Thân | Rằm tháng 5 nhuận 2028 (`lichamviet.com`) |
| 2029-02-13 | 01/01/2029 | Không | Kỷ Dậu | Mùng 1 Tết Kỷ Dậu (`thientue.vn`) |
| 2030-02-02 | 01/01/2030 | Không | Canh Tuất | Mùng 1 Tết Canh Tuất (`lichviet.app`) |
