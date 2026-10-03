# Vận hành OneBee HybridXD

## Hiện tại (từ 03/10/2026): lưu trên Vercel

- Website: https://onebee-hybridxd.vercel.app
- Danh sách đăng ký: https://onebee-hybridxd.vercel.app/admin, nhập mã quản trị trong file `.admin-key.txt` (chỉ nằm trên máy này, không upload).
- Dữ liệu: Vercel Blob store `onebee-hybridxd-leads` (riêng tư, vùng Singapore). Mỗi đăng ký là 1 file `leads/<thời gian>-<mã>.json`.
- Trang /admin: đếm theo giải pháp, lọc theo nhu cầu / gói, nút **Xuất Excel (CSV)**.
- Đổi mã quản trị: Vercel → Project onebee-hybridxd → Settings → Environment Variables → `ADMIN_KEY`, rồi redeploy.
- Cập nhật website: sửa file trong thư mục này, chạy `npx vercel deploy --prod` tại thư mục `hybrid-construction-web`.

Code ghi Lark Base trước đây đã được thay bằng Vercel Blob. Phần dưới giữ lại để chuyển sang Lark Base sau này (cần thêm lại hàm ghi Lark vào `api/lead.js`, có thể chạy song song với Blob).

---

# (Sau này) Lưu đăng ký tư vấn vào Lark Base

Website gửi đăng ký → hàm `api/lead.js` (chạy trên Vercel) → tạo 1 bản ghi trong Lark Base.
Cột **Giải pháp quan tâm** được website tự điền theo nút "Demo giải pháp …" mà khách bấm.
Bảng Lark nên có thêm 3 cột mới: **Gói quan tâm**, **Nhu cầu**, **Ghi chú** (thông số ROI khách đã nhập).

## 1. Tạo bảng trong Lark Base (5 phút)

1. Lark → Base → **Tạo mới → Nhập dữ liệu → CSV**, chọn file `lark-base-template.csv`. Đặt tên bảng: `Đăng ký tư vấn`.
2. Đổi kiểu cột cho đúng (bấm vào tiêu đề cột → Sửa trường):

| Cột | Kiểu trường | Tùy chọn |
|---|---|---|
| Họ và tên | Văn bản (cột chính) | |
| Số điện thoại | Số điện thoại | |
| Tên công ty | Văn bản | |
| Vai trò | Chọn một | Chủ đầu tư · Nhà thầu · Tư vấn |
| **Giải pháp quan tâm** | **Chọn một** | Quản lý dự án · Dự toán & Dự thầu · Thẩm tra thiết kế · Thanh quyết toán · Kiểm thử & Nghiệm thu · Hồ sơ & Cấp phép · Chưa xác định |
| Giải pháp đã xem | Văn bản | |
| Nguồn đăng ký | Chọn một | Demo giải pháp · Thanh menu · Đầu trang · Đăng ký tư vấn |
| Trạng thái | Chọn một | Mới · Đã liên hệ · Đã demo · Đã ký |
| Ngày đăng ký | **Thời gian tạo** (thêm mới) | Lark tự điền |

3. Xóa dòng "Khách mẫu".
4. Gợi ý view: **Kanban nhóm theo "Giải pháp quan tâm"** để mỗi chuyên gia nhận đúng nhóm khách; thêm Automation "Khi có bản ghi mới → gửi tin nhắn vào group Sales".

> Tên cột phải viết đúng y hệt bảng trên (kể cả dấu và ký tự `&`), nếu không API sẽ báo lỗi `FieldNameNotFound`.

## 2. Tạo Custom App để website ghi được vào Base

1. Vào https://open.larksuite.com/app → **Create Custom App**.
2. **Permissions & Scopes** → thêm quyền `bitable:app` (Đọc/ghi Base). Tạo phiên bản và phát hành app.
3. Lấy **App ID** và **App Secret** ở mục Credentials.
4. Mở Base vừa tạo → `…` → **Thêm ứng dụng / Add document app** → chọn app vừa tạo, cấp quyền **Có thể chỉnh sửa**.
5. Lấy 2 mã từ URL của Base:
   `https://xxx.larksuite.com/base/`**`bascnXXXXXXXX`**`?table=`**`tblYYYYYYYY`**`&view=...`
   → `LARK_BASE_TOKEN = bascnXXXXXXXX`, `LARK_TABLE_ID = tblYYYYYYYY`

## 3. Đưa website lên Vercel

1. Đẩy cả thư mục `hybrid-construction-web/` lên Vercel (kéo thả hoặc `vercel deploy`).
2. Vercel → Project → **Settings → Environment Variables**, thêm:

| Tên | Giá trị |
|---|---|
| `LARK_APP_ID` | App ID |
| `LARK_APP_SECRET` | App Secret |
| `LARK_BASE_TOKEN` | mã `bascn…` |
| `LARK_TABLE_ID` | mã `tbl…` |
| `LARK_DOMAIN` | bỏ trống (Lark quốc tế). Nếu dùng Feishu: `https://open.feishu.cn` |

3. Redeploy. Mở website, bấm tab **Thanh quyết toán → Demo giải pháp Thanh quyết toán**, điền form → kiểm tra Base có dòng mới với "Giải pháp quan tâm = Thanh quyết toán".

App Secret chỉ nằm trên Vercel, không lộ ra trình duyệt.

## 4. (Tùy chọn) Form Lark dự phòng

Nếu API lỗi, website hiện nút "Gửi qua form Lark" với dữ liệu điền sẵn.
Bật bằng cách: trong Base tạo **Form view** → Chia sẻ → copy link → dán vào `LARK_FORM_URL` trong `index.html` (gần cuối file).
Link được nối thêm `prefill_<Tên cột>=<giá trị>`; kiểm tra một lần xem bản Lark của bạn có hỗ trợ điền sẵn không.

## Cách website phân loại khách

| Khách bấm | "Giải pháp quan tâm" | "Nguồn đăng ký" |
|---|---|---|
| Nút **Demo giải pháp X** trong tab nghiệp vụ | X | Demo giải pháp |
| Mở link sâu, ví dụ `…/#thanh-toan`, rồi bấm Đăng ký | Thanh quyết toán | Đầu trang / Thanh menu |
| Đăng ký chung, chưa xem tab nào | Chưa xác định | Đầu trang / Thanh menu |

Khách vẫn đổi được lựa chọn trước khi gửi. Cột "Giải pháp đã xem" ghi lại mọi tab khách đã mở, giúp sales biết khách đã tìm hiểu gì.

Link sâu cho từng giải pháp: `#qlda` · `#du-toan` · `#tham-tra` · `#thanh-toan` · `#kiem-thu` · `#cap-phep`.
