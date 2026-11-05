# Đóng góp

Bạn có thể sửa lỗi, cải thiện giao diện, bổ sung bản dịch hoặc đóng góp bài kiến thức và dự án. Mở issue để mô tả vấn đề; với pull request, ghi rõ thay đổi và cách kiểm tra.

## Mã ứng dụng

- Giữ route trong `app/`, UI trong `components/`, logic/kiểu trong `lib/`, CSS trong `styles/` theo tính năng.
- Dùng component và bản dịch hiện có. Tính năng thông thường cần hỗ trợ điện thoại, bàn phím, sáng/tối và các ngôn ngữ UI đã có.
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

Bài viết thuộc module nội dung tương ứng. Trong module, đặt file theo ngôn ngữ, ví dụ `vi/new-note.md` và `en/new-note.md`; ảnh dùng đường dẫn tương đối tới `media/` của module.

```markdown
---
id: example-notes:new-note
title: Tiêu đề bài viết
description: Nội dung bài giúp người đọc hiểu điều gì?
date: 2026-01-01
status: draft
kind: note
level: beginner
---

## Ý chính

Nội dung, ví dụ và nguồn tham khảo.
```

- Giữ ID/slug ổn định; bản dịch dùng chung `id` hoặc `translationKey`.
- Ghi rõ nguồn, kiểm tra lệnh/code và quyền sử dụng hình ảnh. Không thêm dữ liệu nhạy cảm của cá nhân/tổ chức vào ví dụ.
- Các bài cùng chủ đề dùng topic đã có trong `module.json`. Khi đề xuất chủ đề mới, gửi manifest với `id`, `adapter`, nhãn/mô tả và `topic`; maintainer quyết định đăng ký nguồn.
- Bài độc lập không có trường `learning`. Bài thuộc lộ trình gán đúng `learning.path`, `learning.section`, `learning.step` đã được khai báo trong module.
- Có thể chú giải bằng `[thuật ngữ](glossary:term "Giải thích ngắn")`. Link web bình thường vẫn dùng URL như Markdown thông thường.
- Quiz dùng code fence `quiz`: mỗi câu có `id`, `question`, `options`, `answer` (chỉ số bắt đầu từ 0) và `explanation`. Câu hỏi phải bám vào nội dung bài.

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

Xem `CONTRIBUTING.md` trong module tương ứng để biết cấu trúc chương, gallery, bộ ảnh/video, bài nhạc hoặc ghi chép sách/phim/podcast. Dùng ảnh/nhạc/tư liệu có quyền sử dụng và giữ nguồn cần thiết.

## Pull request

1. Tạo nhánh có tên mô tả thay đổi.
2. Giữ PR tập trung vào một vấn đề; không đưa output sinh tự động hoặc credential vào commit.
3. Nêu cách kiểm tra. Thay UI kèm ảnh ở điện thoại/desktop khi hữu ích; thay nội dung kèm nguồn tham khảo.
4. Giữ tương thích URL/ID cũ và chờ maintainer review trước khi xuất bản.
