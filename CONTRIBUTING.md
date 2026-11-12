# Đóng góp

Bạn có thể sửa lỗi, cải thiện giao diện, bổ sung bản dịch hoặc đóng góp bài kiến thức và dự án. Mở issue để mô tả vấn đề; với pull request, ghi rõ thay đổi và cách kiểm tra.

## Mã ứng dụng

- Giữ route trong `app/`, UI trong `components/`, logic/kiểu trong `lib/`, CSS trong `styles/` theo tính năng.
- Giữ thứ tự cascade trong `styles/site-styles.ts`. Ưu tiên sửa quy tắc hiện có thay vì thêm lớp ghi đè; khi bỏ UI, kiểm tra cả selector được ghép động, media query, keyframe và tài nguyên liên quan.
- Font và thang chữ dùng chung nằm trong `styles/typography.css`: chữ giao diện dùng `--font-ui`, tiêu đề dùng `--font-heading`, đoạn mã/phím tắt dùng `--font-mono`. Dùng các biến `--type-*` theo vai trò; không thêm bộ font riêng cho từng trang.
- Dùng component và bản dịch hiện có. Tính năng thông thường cần hỗ trợ điện thoại, bàn phím, sáng/tối và các ngôn ngữ UI đã có.
- Màu giao diện lấy từ biến trong `styles/palettes.css`; kiểm tra cả bốn mùa và hai chế độ. Nội dung đọc dài, form và trạng thái focus dùng quy tắc chung.
- Kiểm tra dữ liệu ở phía compiler trước khi xuất bản. Không đưa body của tài liệu riêng vào danh sách/tìm kiếm phía trình duyệt.
- Chỉ commit source và tài nguyên cần thiết. Không gửi dependencies, build output, credential, dữ liệu cá nhân chưa được phép công khai hoặc bản gốc riêng tư.

## Thiết lập kiểm tra

Node.js 22 và pnpm:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm test
```

Tests dùng fixture riêng; không cần yêu cầu mật khẩu hoặc dữ liệu cá nhân của maintainer. Với bộ nguồn nội dung được phép sử dụng đã cấu hình trong `content.sources.json`, kiểm tra đầy đủ:

```bash
corepack pnpm content
corepack pnpm verify
corepack pnpm build
```

Nếu bạn không có quyền truy cập một nguồn riêng, ghi rõ giới hạn kiểm tra trong PR; maintainer kiểm tra tích hợp với bộ nguồn đó. Không gửi khóa truy cập qua issue hoặc PR.

## Ghi chép kiến thức

Xem [CONTENT.md](CONTENT.md) để biết cấu trúc module, bộ khung SOC Level 1, metadata và các lệnh tạo nội dung.

- Bài thuộc một module lưu trữ và có thể mang nhiều chủ đề. Mỗi module có `vi/`, `en/`, `media/`.
- Viết nháp ngay trong module phù hợp với `status: draft`; không cần viết theo thứ tự lộ trình.
- Path tham chiếu module hoặc định danh bài; một module có thể được dùng trong SOC L1, SOC L2, Cyber Security 101 mà không chép hoặc chuyển file. Không thêm `learning` vào bài mới.
- Giữ chung ID/translationKey/slug, module, order và topics giữa các bản dịch. Ảnh dùng đường dẫn tương đối `../media/`.
- Bài mới giữ `status: draft`. Chỉ thêm `outline: true` khi chủ động muốn công bố tên bài trong đề cương; thân bài/mô tả/media nháp vẫn không được công bố.
- Kiểm tra ngày đăng thực tế trước khi đổi sang published. Ngày dự kiến không tự kích hoạt xuất bản.
- SOC L1, Pre Security và Cyber Security 101 chọn từng bài theo ID; thêm bài mới vào module không tự thay đổi ba đề cương này. Ngày đăng, thứ tự trong module và thứ tự trong path là ba việc độc lập.
- Có thể chú giải bằng `[thuật ngữ](glossary:term "Giải thích ngắn")`; quiz dùng fence `quiz` như các thành phần hiện có.
- Kiểm tra nguồn kỹ thuật, ví dụ và quyền sử dụng tài nguyên; không đưa dữ liệu riêng tư vào PR.

## Giới thiệu dự án

Trong module dự án, mỗi dự án có thư mục riêng:

```text
new-project/
  vi/index.md
  en/index.md
  media/cover.jpg
```

```markdown
---
id: new-project
title: Tên dự án
description: Bài toán và kết quả chính.
status: draft
category: Software
stack: [TypeScript]
repository: https://example.com/source
cover: ../media/cover.jpg
---

## Giới thiệu

Mục tiêu, tính năng, ảnh minh họa, quyết định thiết kế và cách dùng.
```

File `README.md` có frontmatter cũng có thể là nội dung giới thiệu dự án. Không bỏ những file nội dung đó chỉ vì chúng có tên README. Trạng thái draft được giữ tới khi nội dung sẵn sàng để maintainer xuất bản.

## Truyện, album và Góc nhỏ

Xem `CONTRIBUTING.md` hoặc `README.md` trong repo nội dung tương ứng để biết cấu trúc chương, bộ ảnh/video, nhạc và sách. Trang Đọc sách hiện chỉ hiển thị sách; metadata của kệ tương tác được mô tả trong `my-corner/books/README.md`. Hành trình và Đọc sách đang công khai; cấu hình khóa nằm trong `site/journey.md` và `site/shelf.md`. Dùng tư liệu có quyền sử dụng và giữ nguồn cần thiết.

## Dọn mã và tài nguyên

Không xóa Markdown chỉ vì bài chưa xuất bản, chưa xuất hiện trong menu hoặc tên file là README. Giữ ID bài, bước học và URL cũ; các route chuyển tiếp vẫn có thể phục vụ liên kết đã chia sẻ. Ảnh của bài nháp và ảnh gốc dùng để sinh WebP cũng là nguồn cần giữ.

Trước khi bỏ component, xác nhận không còn import trực tiếp, import động hoặc điểm vào từ Next.js/script. Trước khi bỏ CSS/font/ảnh, kiểm tra cả mã ứng dụng, cấu hình và các repo nội dung. Sau thay đổi, chạy typecheck, tests và build; với CSS, đối chiếu giao diện ở điện thoại/desktop, sáng/tối và các trạng thái mở menu, tìm kiếm, form khóa.

`generated/`, `.next/`, `out/`, `.cache/` là dữ liệu sinh lại; không dùng chúng làm nguồn nội dung. File mật khẩu và bản gốc riêng tư không phải cache.

## Pull request

1. Tạo nhánh có tên mô tả thay đổi.
2. Giữ PR tập trung vào một vấn đề; không đưa output sinh tự động hoặc credential vào commit.
3. Nêu cách kiểm tra. Thay UI kèm ảnh ở điện thoại/desktop khi hữu ích; thay nội dung kèm nguồn tham khảo.
4. Giữ tương thích URL/ID cũ và chờ maintainer review trước khi xuất bản.
