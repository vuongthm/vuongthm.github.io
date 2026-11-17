import type { Locale } from "./config"

const vi = {
  invitation: "Bạn có ý tưởng hay muốn góp thêm nội dung? Để lại email và cùng mình trao đổi nhé.",
  email: "Email của bạn",
  submit: "Soạn thư đóng góp",
  hint: "Mở bản nháp email để bạn viết ý tưởng trước khi gửi.",
  subject: "Đóng góp nội dung cho vuongthm",
  greeting: "Chào Vuong,\n\nMình muốn đóng góp nội dung cho website của bạn.",
  contact: "Email liên hệ",
  contribution: "Ý tưởng hoặc nội dung mình muốn đóng góp:",
}

export const footerMessages: Record<Locale, Record<keyof typeof vi, string>> = {
  vi,
  en: {
    invitation:
      "Have an idea or something to add? Enter your email and let's make these notes better together.",
    email: "Your email address",
    submit: "Write a contribution",
    hint: "Opens an email draft for you to add your idea before sending.",
    subject: "A contribution to vuongthm",
    greeting: "Hi Vuong,\n\nI'd like to contribute to your website.",
    contact: "Contact email",
    contribution: "My idea or contribution:",
  },
  ja: {
    invitation:
      "アイデアや補足したい内容はありますか？メールアドレスを入力して、気軽にお知らせください。",
    email: "メールアドレス",
    submit: "提案のメールを作成",
    hint: "メールの下書きを開き、アイデアを書いてから送信できます。",
    subject: "vuongthm へのコンテンツの提案",
    greeting: "Vuong さん、こんにちは。\n\nサイトへの提案があります。",
    contact: "連絡先メールアドレス",
    contribution: "アイデア・提案の内容：",
  },
  zh: {
    invitation: "有想法或想补充的内容吗？留下邮箱，一起让这些笔记变得更好。",
    email: "你的邮箱地址",
    submit: "撰写投稿邮件",
    hint: "打开邮件草稿，补充你的想法后再发送。",
    subject: "给 vuongthm 的内容建议",
    greeting: "Vuong，你好！\n\n我想为你的网站补充一些内容。",
    contact: "联系邮箱",
    contribution: "我的想法或投稿内容：",
  },
}
