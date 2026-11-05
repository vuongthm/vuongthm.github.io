"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Search,
  Settings2,
  ShieldCheck,
  Square,
  Trash2,
  X,
} from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { Dialog } from "./dialog"
import { askAI, extractSummary } from "@/lib/ai/client"
import { aiProviders, type AIProvider } from "@/lib/ai/providers"
import { assistantMessages } from "@/lib/i18n/assistant"
import { copy } from "@/lib/i18n/copy"
import type { SearchEntry } from "@/lib/content/types"
import { retrieveSources } from "@/lib/ai/retrieval"

type Turn = {
  id: number
  role: "user" | "assistant"
  text: string
  sources?: SearchEntry[]
  label?: string
}
export function Assistant() {
  const { aiOpen, setAiOpen } = useSite()
  return aiOpen ? <AssistantContent onClose={() => setAiOpen(false)} /> : null
}
function AssistantContent({ onClose }: { onClose: () => void }) {
  const {
      locale,
      dictionary: m,
      aiProvider,
      setAIProvider,
      aiProfiles,
      setAIProfile,
      aiGateway,
      setAIGateway,
      aiContext,
      searchEntries,
    } = useSite(),
    text = assistantMessages[locale],
    profile = aiProfiles[aiProvider],
    provider = aiProviders[aiProvider]
  const [settings, setSettings] = useState(false),
    [question, setQuestion] = useState(""),
    [turns, setTurns] = useState<Turn[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [visible, setVisible] = useState(false),
    [copied, setCopied] = useState<number | null>(null)
  const abort = useRef<AbortController | null>(null),
    epoch = useRef(0),
    count = useRef(0),
    end = useRef<HTMLDivElement>(null)
  useEffect(
    () => () => {
      epoch.current++
      abort.current?.abort()
    },
    [],
  )
  useEffect(() => {
    end.current?.scrollIntoView({
      block: "end",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }, [turns, busy, error])
  function stop() {
    epoch.current++
    abort.current?.abort()
    setBusy(false)
  }
  async function submit(value = question) {
    const prompt = value.trim()
    if (!prompt || busy) return
    const token = ++epoch.current,
      found = retrieveSources(searchEntries, prompt, 4),
      sources = aiContext ? searchEntries.filter((e) => e.href === aiContext.href) : found
    const history = turns.slice(-6).map((t) => ({ role: t.role, content: t.text.slice(0, 4000) }))
    setTurns((previous) => [...previous, { id: ++count.current, role: "user", text: prompt }])
    setQuestion("")
    setError("")
    setBusy(true)
    const controller = new AbortController()
    abort.current = controller
    const timeout = setTimeout(() => controller.abort(), 45000)
    try {
      const context = aiContext
        ? `TITLE: ${aiContext.title}\nURL: ${aiContext.href}\n${aiContext.body}`
        : sources.map((e) => `TITLE: ${e.title}\nURL: ${e.href}\n${e.excerpt}`).join("\n\n")
      let answer: string
      if (!profile.key)
        answer = aiContext
          ? extractSummary(aiContext.body)
              .map((p) => `- ${p}`)
              .join("\n\n")
          : sources.length
            ? sources
                .slice(0, 3)
                .map((e) => `**${e.title}**\n\n${extractSummary(e.excerpt, 1)[0] ?? e.summary}`)
                .join("\n\n")
            : text.empty
      else if (!context) answer = text.empty
      else
        answer = await askAI({
          provider: aiProvider,
          gateway: aiGateway,
          key: profile.key,
          model: profile.model,
          question: prompt,
          context: context.slice(0, 24000),
          locale,
          signal: controller.signal,
          history,
        })
      if (epoch.current === token)
        setTurns((previous) => [
          ...previous,
          {
            id: ++count.current,
            role: "assistant",
            text: answer || text.empty,
            sources,
            label: profile.key ? provider.label : text.local,
          },
        ])
    } catch (cause) {
      if (epoch.current === token)
        setError(
          controller.signal.aborted
            ? text.cancelled
            : cause instanceof TypeError
              ? text.unavailable
              : cause instanceof Error
                ? cause.message
                : text.unavailable,
        )
    } finally {
      clearTimeout(timeout)
      if (epoch.current === token) setBusy(false)
    }
  }
  async function copyAnswer(turn: Turn) {
    try {
      await navigator.clipboard.writeText(turn.text)
      setCopied(turn.id)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      setCopied(null)
    }
  }
  const prompts = aiContext
    ? [
        copy(
          locale,
          "Tóm tắt ý chính và những điều cần nhớ",
          "Summarize the key ideas and takeaways",
        ),
        copy(
          locale,
          "Giải thích bài này cho người mới bắt đầu",
          "Explain this article to a beginner",
        ),
      ]
    : [
        copy(locale, "ARP hoạt động như thế nào?", "How does ARP work?"),
        copy(locale, "Bắt đầu học Security từ đâu?", "Where should I start with security?"),
        copy(locale, "SOC xử lý cảnh báo như thế nào?", "How does a SOC investigate an alert?"),
      ]
  return (
    <Dialog label={text.title} onClose={onClose} className="assistant-dialog">
      <header className="assistant-header">
        <div className="assistant-mark">
          <BookOpen size={21} strokeWidth={1.5} />
        </div>
        <div>
          <strong>{text.title}</strong>
          <small>
            {profile.key ? provider.label : text.local}
            <span className="assistant-mode-dot" />
            {profile.key ? text.configured : text.subtitle}
          </small>
        </div>
        <button
          className="icon-button"
          disabled={busy}
          onClick={() => {
            setSettings(!settings)
            setVisible(false)
          }}
          aria-label={text.settings}
          aria-pressed={settings}
        >
          <Settings2 size={18} />
        </button>
        <button className="icon-button" onClick={onClose} aria-label={m.close}>
          <X size={19} />
        </button>
      </header>
      {settings ? (
        <div className="assistant-settings">
          <button className="text-link" onClick={() => setSettings(false)}>
            <ChevronLeft size={14} />
            {m.back}
          </button>
          <h2>{text.settings}</h2>
          <label htmlFor="ai-provider">{text.provider}</label>
          <select
            id="ai-provider"
            value={aiProvider}
            onChange={(e) => {
              setAIProvider(e.target.value as AIProvider)
              setVisible(false)
            }}
          >
            {Object.entries(aiProviders).map(([id, p]) => (
              <option key={id} value={id}>
                {p.label}
                {aiProfiles[id as AIProvider].key ? " · ✓" : ""}
              </option>
            ))}
          </select>
          <label htmlFor="ai-key">
            {provider.label} · {text.key}
          </label>
          <div className="assistant-key-field">
            <input
              id="ai-key"
              type={visible ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              value={profile.key}
              onChange={(e) => setAIProfile(aiProvider, { ...profile, key: e.target.value.trim() })}
            />
            <button
              type="button"
              aria-label={visible ? text.hide : text.show}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <label htmlFor="ai-model">{text.model}</label>
          <input
            id="ai-model"
            value={profile.model}
            autoComplete="off"
            onChange={(e) => setAIProfile(aiProvider, { ...profile, model: e.target.value })}
          />
          {aiProvider !== "gemini" && (
            <>
              <label htmlFor="ai-gateway">{text.gateway}</label>
              <input
                id="ai-gateway"
                type="url"
                value={aiGateway}
                placeholder="https://your-gateway.workers.dev"
                onChange={(e) => setAIGateway(e.target.value.trim())}
              />
              <p className="assistant-field-hint">{text.gatewayHint}</p>
            </>
          )}
          <div className="privacy-note">
            <ShieldCheck size={18} />
            <p>
              {text.privacy}
              <br />
              {text.quota}
            </p>
          </div>
          <button
            className="button primary"
            onClick={() => setSettings(false)}
            disabled={!profile.model.trim()}
          >
            <Check size={16} />
            {text.done}
          </button>
          {profile.key && (
            <button
              className="button secondary"
              onClick={() => setAIProfile(aiProvider, { ...profile, key: "" })}
            >
              <Trash2 size={15} />
              {text.forget}
            </button>
          )}
          <a className="text-link" href={provider.keys} target="_blank" rel="noreferrer">
            {text.getKey}
            <ArrowUpRight size={13} />
          </a>
        </div>
      ) : (
        <>
          <div className="assistant-body">
            {!turns.length ? (
              <div className="assistant-welcome">
                <span className="assistant-welcome-label">vuong. / {text.local}</span>
                <h2>{aiContext?.title ?? text.intro}</h2>
                <p>{text.introText}</p>
                <div className="assistant-prompts">
                  {prompts.map((prompt) => (
                    <button key={prompt} onClick={() => void submit(prompt)}>
                      <Search size={15} />
                      <span>{prompt}</span>
                      <ArrowUpRight size={13} />
                    </button>
                  ))}
                </div>
                <button className="connect-hint" onClick={() => setSettings(true)}>
                  <KeyRound size={15} />
                  {text.settings}
                  <span>Gemini · OpenAI · Claude · Grok</span>
                </button>
              </div>
            ) : (
              <>
                <div className="assistant-conversation-tools">
                  <button
                    onClick={() => {
                      stop()
                      setTurns([])
                      setError("")
                    }}
                  >
                    <Trash2 size={13} />
                    {text.newChat}
                  </button>
                </div>
                <div
                  className="assistant-messages"
                  role="log"
                  aria-label={text.title}
                  aria-live="polite"
                >
                  {turns.map((turn) => (
                    <article className={`assistant-message is-${turn.role}`} key={turn.id}>
                      <div className="assistant-message-label">
                        <span>{turn.role === "user" ? text.you : turn.label}</span>
                        {turn.role === "assistant" && (
                          <button
                            aria-label={copied === turn.id ? text.copied : text.copy}
                            onClick={() => void copyAnswer(turn)}
                          >
                            {copied === turn.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                      <div
                        className={
                          turn.role === "assistant" ? "assistant-answer" : "question-bubble"
                        }
                      >
                        {turn.role === "assistant" ? (
                          <ReactMarkdown>{turn.text}</ReactMarkdown>
                        ) : (
                          turn.text
                        )}
                      </div>
                      {!!turn.sources?.length && (
                        <div className="answer-sources">
                          <span>{text.source}</span>
                          {turn.sources.map((source) => (
                            <Link href={source.href} key={source.id} onClick={onClose}>
                              {source.title}
                              <ArrowUpRight size={12} />
                            </Link>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
            {busy && (
              <div className="assistant-loading" role="status">
                <LoaderCircle size={17} className="spin" />
                {text.reading}
              </div>
            )}
            {error && (
              <div className="error-message" role="alert">
                <p>{error}</p>
                <button
                  className="text-link"
                  onClick={() => {
                    const last = turns.findLast((t) => t.role === "user")
                    if (last) void submit(last.text)
                  }}
                >
                  {text.retry}
                </button>
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            className="assistant-input"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={text.placeholder}
              maxLength={2000}
              aria-label={m.ask}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  void submit()
                }
              }}
            />
            {busy ? (
              <button
                type="button"
                className="assistant-stop"
                aria-label={text.stop}
                onClick={stop}
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button type="submit" disabled={!question.trim()} aria-label={m.send}>
                <ArrowUp size={18} />
              </button>
            )}
          </form>
          <p className="assistant-disclaimer">{profile.key ? text.disclaimer : text.localNote}</p>
        </>
      )}
    </Dialog>
  )
}
