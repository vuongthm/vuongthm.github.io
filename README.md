# vuongthm.github.io

Website cá nhân chia sẻ kiến thức công nghệ, dự án và những câu chuyện. Giao diện hỗ trợ Việt, Anh, Nhật, Trung; chế độ sáng/tối và bốn bảng màu Xuân, Hạ, Thu, Đông.

Ứng dụng dùng Next.js, React và TypeScript, xuất website tĩnh để triển khai trên GitHub Pages. Nội dung Markdown được đọc từ các repo độc lập. Phần Kiến thức có ba trang riêng: bài viết, chủ đề và lộ trình; Góc nhỏ gồm truyện, ảnh, âm nhạc, đọc sách, hành trình và bạn bè.

## Phát triển và đóng góp

Yêu cầu Node.js 22, Corepack và pnpm.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm test
```

Các bài test tạo fixture độc lập. Để chạy toàn bộ website, cần các repo nội dung theo `content.sources.json`. Đường dẫn local được tính từ thư mục website; cấu hình hiện tại dùng các repo trong `../content/`.

```bash
corepack pnpm dev       # Biên dịch nội dung rồi chạy Next.js
corepack pnpm build     # Biên dịch, xuất out/ và kiểm tra artifact
corepack pnpm preview   # Xem bản đã build
```

`pnpm dev` mặc định dùng cổng 3001; dùng `pnpm dev:stop` để dừng phiên phát triển. `pnpm typecheck` kiểm tra TypeScript; `pnpm verify` chạy typecheck, lint và tests.

- `app/`, `components/`: trang và giao diện.
- `lib/`, `styles/`: logic, bản dịch, tests và CSS.
- `site/`: hồ sơ, điều hướng, chủ đề, lộ trình, cấu hình khóa và preload font.
- `public/`: tài nguyên nguồn; `public/media/` và `public/vault-data/` do pipeline sinh.
- `scripts/`, `services/`: biên dịch nội dung và tích hợp dịch vụ.

Không chỉnh trực tiếp `generated/`, `.next/` hoặc `out/`; chúng được tạo lại từ source. Giữ ảnh gốc còn được nội dung hoặc bản nháp tham chiếu. Thứ tự CSS được khai báo tại `styles/site-styles.ts`; font tự lưu trữ có hướng dẫn tại [public/fonts/README.md](public/fonts/README.md).

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để sửa giao diện, thêm kiến thức, chủ đề hoặc dự án; [CONTENT.md](CONTENT.md) hướng dẫn cấu trúc module, metadata, lộ trình và lệnh tạo bài. Giấy phép project: [LICENSE](LICENSE).
