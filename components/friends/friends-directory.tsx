"use client"
import { localeName, englishNames } from "@/lib/i18n/english-names.mjs"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import Image from "next/image"
import { ArrowUpRight, Shuffle } from "lucide-react"
import { friendsMessages } from "@/lib/i18n/friends"
import { personalSpaces } from "@/lib/i18n/personal-spaces"
import type { Locale } from "@/lib/i18n/config"
import type { Friend } from "@/lib/friends/directory"
import { connectionCurve, friendConnections, friendPositions } from "@/lib/friends/network"
import { useFriendMotion } from "@/lib/hooks/use-friend-motion"

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
  const [selectedId, setSelectedId] = useState("")
  const [width, setWidth] = useState(1000)
  const canvas = useRef<HTMLDivElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const topics = useMemo(() => [...new Set(friends.flatMap((friend) => friend.topics))], [friends])
  const visible = useMemo(
    () => friends.filter((friend) => !topic || friend.topics.includes(topic)),
    [friends, topic],
  )
  const selected = visible.find((friend) => friend.id === selectedId)
  const connections = useMemo(() => friendConnections(visible), [visible])
  const focusedConnections = useMemo(
    () =>
      selected
        ? connections
            .filter((edge) => edge.from === selected.id || edge.to === selected.id)
            .map((edge) => ({
              ...edge,
              from: selected.id,
              to: edge.from === selected.id ? edge.to : edge.from,
            }))
        : [],
    [connections, selected],
  )
  const ids = useMemo(() => visible.map((friend) => friend.id), [visible])
  const layout = useMemo(() => {
    const related = connections.flatMap((edge) =>
      edge.from === selected?.id
        ? [ids.indexOf(edge.to)]
        : edge.to === selected?.id
          ? [ids.indexOf(edge.from)]
          : [],
    )
    return friendPositions(visible.length, width, selected ? ids.indexOf(selected.id) : -1, related)
  }, [visible, ids, width, selected, connections])
  useFriendMotion(canvas, ids, layout.points, width, layout.height)
  const positions = new Map(visible.map((friend, index) => [friend.id, layout.points[index]]))
  useEffect(() => {
    const root = canvas.current
    if (!root) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(root)
    return () => observer.disconnect()
  }, [])
  function choose(id: string) {
    setSelectedId((current) => (current === id ? "" : id))
  }
  function surprise() {
    const candidates = visible.filter((friend) => friend.id !== selected?.id)
    const next = candidates[Math.floor(Math.random() * candidates.length)]
    if (next) setSelectedId(next.id)
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
                setSelectedId("")
              }}
              data-ui-sound="select"
            >
              {value || text.all}
            </button>
          ))}
        </div>
        <button className="network-random" onClick={surprise} disabled={visible.length === 0}>
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
          {focusedConnections.map((edge, index) => {
            const curve = connectionCurve(
              positions.get(edge.from)!,
              positions.get(edge.to)!,
              width,
              layout.height,
            )
            return (
              <g key={edge.from + ":" + edge.to} className="is-connected">
                <path d={curve} data-from={edge.from} data-to={edge.to} />
                {index < 60 && (
                  <path
                    d={curve}
                    pathLength={1}
                    data-from={edge.from}
                    data-to={edge.to}
                    className="network-data"
                    style={
                      {
                        "--flow-duration": `${5 + (index % 4)}s`,
                        "--flow-delay": `${-index * 1.37}s`,
                      } as CSSProperties
                    }
                  />
                )}
              </g>
            )
          })}
        </svg>
        {visible.map((friend, index) => (
          <button
            key={friend.id}
            data-friend-id={friend.id}
            data-ui-sound="select"
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
      ) : visible.length === 0 ? (
        <p className="corner-empty">{text.empty}</p>
      ) : null}
    </section>
  )
}
