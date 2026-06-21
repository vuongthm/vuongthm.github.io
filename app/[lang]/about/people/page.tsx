"use client"

import Image from "next/image"
import { Link } from "@/components/ui/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useLang } from "@/components/providers/lang-provider"

const PEOPLE_EN = [
  {
    name: "Ba (Father)",
    photo: "/about/people-ba.png",
    role: "Family",
    bio: "The man who kept every school prize in a tin box and never needed to say he was proud.",
  },
  {
    name: "AAA",
    photo: "/about/people-aaa.png",
    role: "Closest friend",
    bio: "The person who told me to start writing publicly when I was still afraid to.",
  },
  {
    name: "BBB",
    photo: "/about/people-bbb.png",
    role: "Colleague & co-founder",
    bio: "We built the first broken product together. Still building, still breaking things.",
  },
]

const PEOPLE_VI = [
  {
    name: "Ba",
    photo: "/about/people-ba.png",
    role: "Gia đình",
    bio: "Người đã cất mọi tờ giấy khen vào hộp sắt mà không cần nói thêm gì.",
  },
  {
    name: "aaa",
    photo: "/about/people-aaa.png",
    role: "Người bạn thân nhất",
    bio: "Người đã nói với tôi hãy bắt đầu viết công khai khi tôi còn sợ.",
  },
  {
    name: "bbb",
    photo: "/about/people-bbb.png",
    role: "Đồng nghiệp",
    bio: "Cùng nhau làm ra sản phẩm đầu tiên rồi thất bại. Vẫn đang làm, vẫn đang thất bại.",
  },
]

const COPY = {
  en: {
    heading: "People in my life",
    desc: "A few of the people who have shaped how I think, what I build, and who I am.",
    back: "Back to About",
  },
  vi: {
    heading: "Những người trong cuộc đời tôi",
    desc: "Một số người đã định hình cách tôi suy nghĩ, những gì tôi làm, và con người tôi.",
    back: "Quay lại Về tôi",
  },
}

export default function PeoplePage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const people = lang === "en" ? PEOPLE_EN : PEOPLE_VI

  return (
    <>
      <Header />

      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={13} />
            {c.back}
          </Link>

          <div className="mb-10">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3 text-pretty">
              {c.heading}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
              {c.desc}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {people.map((person) => (
              <div
                key={person.name}
                className="flex flex-col items-center text-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent-brand/30 transition-colors duration-150"
              >
                <div className="relative size-16 sm:size-20 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                  <Image
                    src={person.photo}
                    alt={person.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm leading-snug">
                    {person.name}
                  </p>
                  <p className="text-xs text-accent-brand mt-0.5">{person.role}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    {person.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer lang={lang} />
    </>
  )
}