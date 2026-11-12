# Viết bài và quản lý lộ trình

Mỗi mảng lớn có repo riêng. Bạn viết theo điều đang học; ngày xuất bản, chủ đề và thứ tự trong lộ trình độc lập với nhau.

## Cấu trúc đã chốt

```text
content/
  security-notes/
    module.json
    pre-security/
      learning-path.json
      introduction-to-cyber-security/{vi,en,media}/
      computer-fundamentals/{vi,en,media}/
      operating-systems-basics/{vi,en,media}/
      software-basics/{vi,en,media}/
      network-fundamentals/{vi,en,media}/
      how-the-web-works/{vi,en,media}/
      attacks-and-defenses/{vi,en,media}/
    cyber-security/
      learning-path.json
      start-your-cyber-security-journey/{vi,en,media}/
      ...                         # 14 module, xem README của từng module
  security-analyst/
    module.json
    soc-l1/
      learning-path.json
      blue-team-introduction/{vi,en,media}/
      ...                         # 14 module, 71 bài × Việt/Anh
    soc-l2/
      learning-path.json          # Nháp, bổ sung đề cương sau
    soc-daily/{vi,en,media}/        # Ghi chép tự do
  network-notes/
    module.json
    fundamentals/{vi,en,media}/
    protocols-and-devices/{vi,en,media}/
    how-the-web-works/{vi,en,media}/
  linux-notes/
    module.json
    linux-fundamentals/{vi,en,media}/
  cloud-notes/
    module.json
    cloud-foundations/{vi,en,media}/
  ai-notes/
    module.json
    evidence-based-ai/{vi,en,media}/
```

**Toàn bộ 31 bài Pre Security ở trong `security-notes/pre-security`; toàn bộ 71 bài SOC L1 ở trong `security-analyst/soc-l1`.** Không cần tìm một bài của bộ khung này ở nhiều repo. Các repo chuyên môn vẫn dùng cho ghi chép độc lập, module chuyên sâu hoặc nội dung phát triển sau.

Mỗi nhóm giữ file `learning-path.json` của mình. Manifest gốc chỉ đăng ký module và các file path cần đọc:

```json
{
  "learningPaths": ["pre-security/learning-path.json", "cyber-security/learning-path.json"],
  "modules": [
    {
      "id": "network-fundamentals",
      "path": "pre-security/network-fundamentals",
      "title": { "vi": "Nền tảng mạng", "en": "Network Fundamentals" },
      "order": 60
    }
  ]
}
```

Đây là ví dụ rút gọn; không thay manifest thực tế bằng ví dụ. `modules[].id` là định danh module, `modules[].path` là thư mục của nó. `learning-path.json` chứa một object lộ trình; định dạng cũ với một file mảng lộ trình vẫn được hỗ trợ.

## Bắt đầu viết bài đã có khung

Mở bất kỳ bài nào bạn muốn viết trước, ví dụ:

- SOC L1: `security-analyst/soc-l1/blue-team-introduction/vi/junior-security-analyst-intro.md`.
- Pre Security: `security-notes/pre-security/operating-systems-basics/vi/linux-cli-basics.md`.

Điền mô tả và nội dung, sửa `date` thành ngày đăng thực tế rồi đổi `status: draft` thành `status: published`. Bạn có thể viết bài thứ 20 trước bài thứ 1. Không cần đổi thứ tự của đề cương. Có thể đăng bản Việt trước và bổ sung bản Anh sau.

Các file khung đang có ngày gợi ý cách nhau một ngày. Đây không phải lịch tự đăng; giữ hoặc sửa theo ngày xuất bản thực tế.

## Trắc nghiệm sau bài học

Mỗi bài học hoàn chỉnh nên có một khối `quiz` ở cuối file Markdown, gồm **6–10 câu** bám vào nội dung đã trình bày. Sáu bài đang xuất bản hiện có 8 câu mỗi bài. Mỗi câu có 4 lựa chọn, một đáp án đúng và giải thích lý do; không thêm câu hỏi chỉ để đủ số lượng khi bài chưa có nội dung.

Khối dùng code fence có tên ngôn ngữ `quiz` và chứa JSON với `title`, `questions`. Mỗi phần tử trong `questions` có `id`, `question`, `options`, `answer`, `explanation`. `id` phải duy nhất trong quiz; `answer` là vị trí đáp án tính từ **0** (bốn lựa chọn tương ứng 0–3). Có thể xem trực tiếp cấu trúc trong `security-notes/pre-security/operating-systems-basics/vi/linux-cli-basics.md`.

Giao diện tự hiển thị khối này sau nội dung, có chấm điểm, giải thích và làm lại; không cần thêm một heading trùng với tiêu đề quiz. Câu hỏi được tách khỏi phần văn bản dùng cho tìm kiếm. Hệ thống không tự viết câu hỏi cho bài mới: tác giả bổ sung quiz cùng nội dung bài và kiểm tra lại đáp án trước khi xuất bản.

## Tạo bài nháp ngay trong module

```bash
pnpm content:new article security-analyst my-investigation --module blue-team-introduction --topics soc,security
pnpm content:new article security-analyst my-investigation --module blue-team-introduction --lang en
```

Lệnh tự cấp thứ tự còn trống trong module, tính cả các ngôn ngữ, và dùng ngày hiện tại theo giờ Việt Nam. Không tiếp nối ngày cuối của các file nháp. Có thể chỉ định `--date YYYY-MM-DD`; bản dịch mặc định kế thừa ID, ngày, chủ đề và thứ tự của bản đã có.

Với repo có nhiều module, chọn `--module`; repo chỉ có một module thì lệnh tự chọn module đó. Bài mới luôn là draft, không cần viết theo thứ tự lộ trình. Chỉ thêm `--outline` khi chủ động muốn tên bản nháp được hiển thị trong đề cương công khai.

## Một nơi lưu, nhiều chủ đề

Ví dụ bài Linux CLI nằm trong Pre Security nhưng được phân loại vào cả Linux và Security:

```yaml
---
id: linux-notes:linux-cli-basics
translationKey: linux-notes:linux-cli-basics
slug: linux-cli-basics
title: Linux CLI Basics
description: ""
date: 2026-11-11
status: draft
outline: true
module: operating-systems-basics
order: 3
topics: [security, linux]
kind: guide
level: beginner
---
```

- Nơi lưu: `security-notes/pre-security/operating-systems-basics/vi/linux-cli-basics.md`.
- `module`: nhóm nội dung lưu trữ, không phải chủ đề.
- `topics`: những chủ đề bài xuất hiện trên website, không bắt buộc trùng tên repo.
- `order`: thứ tự mặc định trong module, không phải ngày đăng hay thứ tự toàn lộ trình.
- `id`, `translationKey`, `slug`: định danh ổn định, giữ nguyên khi đổi thư mục/repo. Tiền tố ID của những bài đã chuyển vẫn được giữ để bảo toàn tham chiếu.

Các chủ đề hiện có: `security`, `soc`, `networking`, `linux`, `cloud`, `ai`. Các bản dịch dùng chung ID, translationKey, slug, module, order và topics. Ảnh trong module có thể dùng `../media/diagram.png`.

## Ghép bài vào lộ trình

SOC L1, Pre Security và Cyber Security 101 chọn từng bài bằng ID. Thứ tự học theo mảng `sections → steps`, độc lập với ngày xuất bản và thứ tự trong module:

```json
{
  "id": "operating-systems-basics",
  "title": { "vi": "Cơ bản về hệ điều hành", "en": "Operating Systems Basics" },
  "steps": [
    { "id": "windows-basics", "article": "security-notes:windows-basics" },
    { "id": "linux-cli-basics", "article": "linux-notes:linux-cli-basics" }
  ]
}
```

Đây là ví dụ rút gọn. Chỉnh file `learning-path.json` trong đúng nhóm khi cần thêm/bớt/đổi thứ tự bài. Thêm bài vào module không tự thay đổi ba đề cương này. Cùng một ID có thể dùng trong nhiều lộ trình và có vị trí học khác nhau; không sao chép Markdown.

Nếu thật sự muốn tự lấy mọi bài trong một module, có thể dùng `sections[].module: "security-analyst/blue-team-introduction"`. Path dạng này nhận thêm các bài công khai/outline mới của module, theo `order`.

Không thêm trường `learning` vào bài mới. Compiler tính tư cách thành viên và thứ tự học từ file path. Giữ nguyên ID bước đã công khai để bảo toàn tiến độ đọc.

## Tạo nhóm/module mới sau này

```bash
pnpm content:new section security-analyst advanced-investigations --group soc-l2 --title "Điều tra nâng cao"
```

Module được tạo trong `soc-l2/advanced-investigations/{vi,en,media}` và đăng ký trong `module.json`. Bổ sung đề cương ở `soc-l2/learning-path.json` khi có nội dung phù hợp. SOC L2 hiện chỉ có file cấu hình nháp để tác giả bổ sung. Cyber Security 101 đã mở đủ 14 module, 56 bước; xem `security-notes/cyber-security/README.md` để tìm đúng file cần viết.

Với một nhóm mới chưa có file path:

```bash
pnpm content:new path my-course --repo security-notes --group my-course --topic security --title "My course" --modules linux-notes/linux-fundamentals
```

Lệnh tạo `my-course/learning-path.json` dạng draft và đăng ký trong manifest. Path có thể tham chiếu bài/module từ repo khác, nhưng file lộ trình vẫn nằm trong nhóm của nó.

## Trạng thái công khai và khóa trang

SOC L1, Pre Security và Cyber Security 101 đang mở đề cương; bài đã xuất bản có thể đọc trực tiếp, các bài khung còn lại giữ trạng thái draft. SOC L2 còn draft. Chủ đề được các bài trong một đề cương công khai sử dụng cũng tự mở, kể cả khi bài chưa xuất bản. Trang Chủ đề tách nhóm có nội dung với các chủ đề còn lại; trang con có thể dẫn đến đề cương liên quan. `outline: true` chỉ công khai tên bài nháp trong đề cương; không công khai thân bài, mô tả, media hay URL. Muốn xuất bản khung outline phải hoàn thiện mô tả và nội dung thực tế.

Hành trình và Đọc sách hiện được mở công khai bằng `lock: false` trong `site/journey.md` và `site/shelf.md`. Đọc sách chỉ hiển thị sách. Muốn khóa lại một trong hai trang, đặt `lock: true`; mật khẩu riêng nằm trong file local bị Git bỏ qua `passwords.json`, với khóa `site/journey` hoặc `site/shelf`. Không đặt mật khẩu trong Markdown. Tiến độ đọc và giấy ghi nhớ được khai báo trong frontmatter của từng cuốn sách; xem `../content/my-corner/books/README.md` trong repo nội dung.

## Kiểm tra và cập nhật repo

```bash
pnpm content
pnpm verify
pnpm build
```

Website và các repo nội dung có lịch sử Git riêng. Khi đổi cấu trúc, cập nhật đủ các repo bị ảnh hưởng và website trước khi chạy workflow cuối cùng. Khi thêm khóa trang, cập nhật GitHub secret `CONTENT_PASSWORDS` từ file local theo quy trình triển khai của bạn; không commit mật khẩu.

Repo GitHub và thư mục local đều dùng tên `security-analyst`. Remote là `https://github.com/vuongthm/security-analyst.git`; website đăng ký `vuongthm/security-analyst` trong `content.sources.json`. Tên cũ `soc-notes` được đổi tên với lịch sử Git giữ nguyên. Các ID bài đã công khai có tiền tố `soc-notes:` vẫn giữ nguyên để bảo toàn liên kết và lộ trình.
