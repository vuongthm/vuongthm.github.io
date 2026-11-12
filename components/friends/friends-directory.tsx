"use client"
import { localeName, englishNames } from "@/lib/i18n/english-names.mjs"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { ArrowUpRight, Shuffle } from "lucide-react"
import { friendsMessages } from "@/lib/i18n/friends"
import { personalSpaces } from "@/lib/i18n/personal-spaces"
import type { Locale } from "@/lib/i18n/config"
import type { Friend } from "@/lib/friends/directory"
import { connectionCurve, friendConnections, friendPositions } from "@/lib/friends/network"

function FriendAvatar({ friend }: { friend: Friend }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="friend-avatar" aria-hidden="true">
      {friend.avatar && !failed ? (
        <Image
          src={friend.avatar}
          alt=""
          width={64}
          height={64}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{friend.initials}</span>
      )}
    </span>
  )
}
export function FriendsDirectory({ friends, locale }: { friends: Friend[]; locale: Locale }) {
  const text = friendsMessages[locale],
    t = personalSpaces[locale]
  const [topic, setTopic] = useState("")
  const [selectedId, setSelectedId] = useState(friends[0]?.id ?? "")
  const [width, setWidth] = useState(1000)
  const [hop, setHop] = useState<{ from: string; to: string } | null>(null)
  const canvas = useRef<HTMLDivElement>(null),
    hopPath = useRef<SVGPathElement>(null),
    spark = useRef<SVGCircleElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const topics = useMemo(() => [...new Set(friends.flatMap((friend) => friend.topics))], [friends])
  const visible = useMemo(
    () => friends.filter((friend) => !topic || friend.topics.includes(topic)),
    [friends, topic],
  )
  const selected = visible.find((friend) => friend.id === selectedId) ?? visible[0]
  const connections = useMemo(() => friendConnections(visible), [visible])
  const layout = friendPositions(visible.length, width)
  const positions = new Map(visible.map((friend, index) => [friend.id, layout.points[index]]))
  const from = hop && positions.get(hop.from),
    to = hop && positions.get(hop.to)
  const hopCurve = from && to ? connectionCurve(from, to, width, layout.height) : ""
  useEffect(() => {
    const root = canvas.current
    if (!root) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(root)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!hop || !hopPath.current || !spark.current) return
    const path = hopPath.current,
      dot = spark.current,
      length = path.getTotalLength(),
      start = performance.now()
    let frame = 0
    function move(now: number) {
      const progress = Math.min(1, (now - start) / 850),
        eased = 1 - Math.pow(1 - progress, 3),
        point = path.getPointAtLength(length * eased)
      dot.setAttribute("cx", String(point.x))
      dot.setAttribute("cy", String(point.y))
      if (progress < 1) frame = requestAnimationFrame(move)
      else setHop(null)
    }
    frame = requestAnimationFrame(move)
    return () => cancelAnimationFrame(frame)
  }, [hop, hopCurve])
  function choose(id: string) {
    setHop(null)
    setSelectedId(id)
  }
  function surprise() {
    if (!selected || visible.length < 2) return
    const candidates = visible.filter((friend) => friend.id !== selected.id)
    const next = candidates[Math.floor(Math.random() * candidates.length)]
    setSelectedId(next.id)
    setHop(
      matchMedia("(prefers-reduced-motion: reduce)").matches
        ? null
        : { from: selected.id, to: next.id },
    )
  }
  return (
    <section className="friend-network" aria-label={t.network}>
      <div className="network-tools">
        <div className="network-topics" role="group" aria-label={text.topic}>
          {["", ...topics].map((value) => (
            <button
              key={value}
              aria-pressed={topic === value}
              onClick={() => {
                setTopic(value)
                setHop(null)
              }}
              data-ui-sound="select"
            >
              {value || text.all}
            </button>
          ))}
        </div>
        <button
          className="network-random"
          onClick={surprise}
          disabled={visible.length < 2 || !!hop}
        >
          <Shuffle size={15} />
          {t.random}
        </button>
      </div>
      <p className="network-hint">{t.networkHint}</p>
      <div
        className="network-canvas"
        ref={canvas}
        style={{ height: layout.height }}
        role="group"
        aria-label={t.network}
      >
        <svg
          viewBox={`0 0 ${width} ${layout.height}`}
          preserveAspectRatio="none"
          className="network-lines"
          aria-hidden="true"
        >
          {connections.map((edge) => (
            <path
              key={edge.from + ":" + edge.to}
              d={connectionCurve(
                positions.get(edge.from)!,
                positions.get(edge.to)!,
                width,
                layout.height,
              )}
              className={
                edge.from === selected?.id || edge.to === selected?.id ? "is-connected" : ""
              }
            />
          ))}
          {hopCurve && (
            <>
              <path d={hopCurve} ref={hopPath} className="network-hop-route" />
              <circle ref={spark} className="network-spark" r="5" cx={from!.x} cy={from!.y} />
            </>
          )}
        </svg>
        {visible.map((friend, index) => (
          <button
            key={friend.id}
            ref={(node) => {
              buttons.current[index] = node
            }}
            className={`friend-node tone-${index % 3}${selected?.id === friend.id ? " is-selected" : ""}`}
            style={{
              left: `${(positions.get(friend.id)!.x / width) * 100}%`,
              top: `${(positions.get(friend.id)!.y / layout.height) * 100}%`,
            }}
            aria-label={`${localeName(friend.name, locale)} · ${friend.alias}`}
            aria-pressed={selected?.id === friend.id}
            aria-controls="friend-profile"
            onClick={() => choose(friend.id)}
            onKeyDown={(event) => {
              const direction = ["ArrowRight", "ArrowDown"].includes(event.key)
                ? 1
                : ["ArrowLeft", "ArrowUp"].includes(event.key)
                  ? -1
                  : 0
              if (!direction) return
              event.preventDefault()
              const next = (index + direction + visible.length) % visible.length
              buttons.current[next]?.focus({ preventScroll: true })
              choose(visible[next].id)
            }}
          >
            <FriendAvatar friend={friend} />
            <span className="friend-node-label">{friend.alias}</span>
          </button>
        ))}
      </div>
      {selected ? (
        <div className="network-profile" id="friend-profile" aria-live="polite" aria-atomic="true">
          <FriendAvatar key={selected.id} friend={selected} />
          <div className="network-profile-copy">
            <span className="eyebrow">{t.selected}</span>
            <h2>
              {localeName(selected.name, locale)}
              <small>{selected.alias}</small>
            </h2>
            <p>
              {locale === "en"
                ? englishNames(selected.description[locale])
                : selected.description[locale]}
            </p>
            <div className="network-profile-topics">
              {selected.topics.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
          </div>
          <div className="network-visit">
            <a href={selected.website} target="_blank" rel="noopener noreferrer">
              {text.visit}
              <ArrowUpRight size={15} />
            </a>
            <small>{new URL(selected.website).hostname}</small>
          </div>
        </div>
      ) : (
        <p className="corner-empty">{text.empty}</p>
      )}
    </section>
  )
}
