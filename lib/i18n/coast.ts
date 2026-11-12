import type { Locale } from "./config"
const en = {
  eyebrow: "Away from the screen",
  title: "Dai Lanh, Khanh Hoa.",
  note: "The sea, the hills, and the homes along the coast.",
  album: "Explore the photo journal",
}
export const coastMessages: Record<Locale, typeof en> = {
  en,
  vi: {
    eyebrow: "Ngoài màn hình",
    title: "Đại Lãnh, Khánh Hòa.",
    note: "Biển, núi và những mái nhà bên bờ nước.",
    album: "Ghé xem bộ ảnh",
  },
  ja: {
    eyebrow: "画面の外で",
    title: "ダイラン、カインホア省。",
    note: "海と山、海岸沿いに並ぶ家々。",
    album: "写真日記を見る",
  },
  zh: {
    eyebrow: "屏幕之外",
    title: "大岭，庆和省。",
    note: "海、山与海岸边的家。",
    album: "浏览影像日记",
  },
}
