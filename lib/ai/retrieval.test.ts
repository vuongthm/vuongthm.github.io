import { describe, expect, it } from "vitest"
import { retrieveSources } from "./retrieval"
const documents = [
  {
    title: "MAC Address và ARP",
    summary: "Tìm địa chỉ vật lý trong mạng LAN.",
    topics: ["networking"],
    tags: ["arp"],
    excerpt: "ARP maps an IP address to a MAC address.",
  },
  {
    title: "Security bắt đầu từ những câu hỏi",
    summary: "Một cách tiếp cận tư duy bảo vệ hệ thống.",
    topics: ["security"],
    tags: [],
    excerpt: "Xác định tài sản và ranh giới tin cậy.",
  },
]
describe("question retrieval", () => {
  it("finds a concept inside natural Vietnamese and English questions", () => {
    expect(retrieveSources(documents, "ARP hoạt động như thế nào?")[0].title).toContain("ARP")
    expect(retrieveSources(documents, "How does ARP work?")[0].title).toContain("ARP")
  })
  it("handles Japanese word boundaries and technical queries", () => {
    expect(retrieveSources(documents, "ARPはどのように動作しますか？")[0].title).toContain("ARP")
    expect(
      retrieveSources(documents, "セキュリティは何から学べばよいですか？")[0].topics,
    ).toContain("security")
    expect(retrieveSources(documents, "料理のレシピ")).toEqual([])
  })
  it("matches Chinese security and networking topic names", () => {
    expect(retrieveSources(documents, "网络中的 ARP 如何工作？")[0].title).toContain("ARP")
    expect(retrieveSources(documents, "安全应该从哪里开始？")[0].topics).toContain("security")
  })
  it("maps localized topic names without inventing unrelated answers", () => {
    expect(retrieveSources(documents, "Tôi nên học bảo mật từ đâu?")[0].topics).toContain(
      "security",
    )
    expect(retrieveSources(documents, "quantum entanglement")).toEqual([])
  })
})
