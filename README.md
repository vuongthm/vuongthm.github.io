# vuongthm.github.io

Website cá nhân chia sẻ kiến thức công nghệ, dự án và những câu chuyện. Giao diện hỗ trợ Việt, Anh, Nhật, Trung; có chế độ sáng/tối và bố cục cho điện thoại.

Ứng dụng dùng Next.js, React và TypeScript. Nội dung Markdown được đọc từ các module độc lập rồi biên dịch thành website tĩnh.

## Phát triển và đóng góp

Yêu cầu Node.js 22, Corepack và pnpm.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm test
```

Các bài test tạo dữ liệu mẫu độc lập. Để chạy toàn bộ website, cần bộ nguồn nội dung mà bạn có quyền sử dụng theo `content.sources.json`; sau khi có nguồn phù hợp, chạy `pnpm dev`.

- `app/`, `components/`: trang và giao diện.
- `lib/`, `styles/`: logic, bản dịch, tests và CSS.
- `site/`, `public/`: cấu hình công khai và tài nguyên nguồn.
- `scripts/`, `services/`: biên dịch nội dung và tích hợp dịch vụ.

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để sửa giao diện, thêm kiến thức, chủ đề hoặc dự án. Giấy phép project: [LICENSE](LICENSE).
