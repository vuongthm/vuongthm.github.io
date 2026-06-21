import { type Lang } from "./data"

export interface AdItem {
  badge: Record<Lang, string>
  title: Record<Lang, string>
  description: Record<Lang, string>
  link: string
  buttonText: Record<Lang, string>
  image?: string // Optional promotional image path
}

// Array containing multiple rotating featured article items
export const adSlides: AdItem[] = [
  {
    badge: {
      en: "FEATURED PROJECT",
      vi: "DỰ ÁN NỔI BẬT",
    },
    title: {
      en: "Secure Decoupled Static CMS",
      vi: "Hệ thống CMS Tĩnh Giải Mã Bảo Mật",
    },
    description: {
      en: "An elegant, completely free, and secure multi-repo system to host your memoirs and tech notes securely on GitHub Pages.",
      vi: "Hệ thống đa kho lưu trữ thanh lịch, bảo mật, miễn phí vĩnh viễn giúp vận hành blog cá nhân tĩnh của bạn trên GitHub Pages.",
    },
    link: "https://github.com/vuongthm",
    buttonText: {
      en: "View Source",
      vi: "Xem mã nguồn",
    },
    image: "/hometown/dai-lanh-coast.png",
  },
  {
    badge: {
      en: "LATEST ESSAY",
      vi: "GHI CHÚ MỚI NHẤT",
    },
    title: {
      en: "TCP Three-Way Handshake Explained",
      vi: "TCP Ba Bước Bắt Tay Giải Thích",
    },
    description: {
      en: "A detailed visual walk-through of the TCP connection establishment protocol and packet structures.",
      vi: "Phân tích trực quan và chi tiết tiến trình thiết lập kết nối tin cậy thông qua bắt tay ba bước của TCP.",
    },
    link: "/notes/tcp/",
    buttonText: {
      en: "Read Article",
      vi: "Đọc bài viết",
    },
    image: "/hometown/dai-lanh-mountain.png",
  },
  {
    badge: {
      en: "MEMOIR SERIES",
      vi: "CHUYỆN KỂ NỔI BẬT",
    },
    title: {
      en: "Between Two Harbors Memoir",
      vi: "Giữa Hai Bến Hồi Ký",
    },
    description: {
      en: "Leaving a small coastal village, learning how distance changes family, and finding out what still pulls you home.",
      vi: "Rời khỏi một thị trấn ven biển, học cách khoảng cách làm đổi khác một gia đình, và điều kéo mình trở về.",
    },
    link: "/stories/between-two-harbors/",
    buttonText: {
      en: "Start Reading",
      vi: "Bắt đầu đọc",
    },
    image: "/hometown/dai-lanh-village.png",
  }
]