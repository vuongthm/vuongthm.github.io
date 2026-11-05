"use client"
import { useId, useRef, useState, type FormEvent } from "react"
import { ArrowRight, Check, CircleHelp, RotateCcw, X } from "lucide-react"
import { Dialog } from "@/components/search/dialog"
import { useSite } from "@/components/providers/site-provider"
import { learningMessages } from "@/lib/i18n/learning"
import { gradeQuiz } from "@/lib/learning/quiz.mjs"
export interface QuizData {
  title: string
  questions: {
    id: string
    question: string
    options: string[]
    answer: number
    explanation: string
  }[]
}
export function KnowledgeQuiz({ quiz }: { quiz: QuizData }) {
  const { locale } = useSite(),
    text = learningMessages[locale],
    id = useId()
  const [open, setOpen] = useState(false),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [graded, setGraded] = useState(false),
    [incomplete, setIncomplete] = useState(false)
  const result = gradeQuiz(quiz, answers),
    summary = useRef<HTMLDivElement>(null),
    form = useRef<HTMLFormElement>(null)
  function submit(event: FormEvent) {
    event.preventDefault()
    if (result.answered < result.total) {
      setIncomplete(true)
      return
    }
    setGraded(true)
    requestAnimationFrame(() => {
      summary.current?.focus({ preventScroll: true })
      summary.current?.scrollIntoView({
        block: "nearest",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })
    })
  }
  function continueQuiz() {
    setIncomplete(false)
    requestAnimationFrame(() => {
      const missing = form.current?.querySelector<HTMLInputElement>("input:invalid")
      missing?.focus({ preventScroll: true })
      missing?.closest("fieldset")?.scrollIntoView({ block: "nearest", behavior: "auto" })
    })
  }
  return (
    <>
      {incomplete && (
        <Dialog label={text.incompleteTitle} className="quiz-notice-dialog" onClose={continueQuiz}>
          <div className="quiz-notice">
            <CircleHelp size={28} strokeWidth={1.4} aria-hidden="true" />
            <h2>{text.incompleteTitle}</h2>
            <p>
              {text.incompleteMessage.replace("{count}", String(result.total - result.answered))}
            </p>
            <button type="button" className="button primary" onClick={continueQuiz}>
              {text.continueQuiz}
              <ArrowRight size={15} />
            </button>
          </div>
        </Dialog>
      )}
      <section className="knowledge-quiz" aria-labelledby={`${id}-title`}>
        <div className="quiz-heading">
          <CircleHelp size={23} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h2 id={`${id}-title`}>{quiz.title || text.quizTitle}</h2>
            <p>
              {quiz.questions.length} {text.questions} · {text.quizIntro}
            </p>
          </div>
          <button
            className="button primary"
            aria-expanded={open}
            aria-controls={`${id}-form`}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? text.closeQuiz : text.quiz}
            <ArrowRight size={15} />
          </button>
        </div>
        {open && (
          <form id={`${id}-form`} onSubmit={submit} ref={form} noValidate>
            {graded && (
              <div className="quiz-result" role="status" tabIndex={-1} ref={summary}>
                <strong>
                  {text.score}: {result.correct} / {result.total}
                </strong>
                <span>{Math.round((result.correct / result.total) * 100)}%</span>
              </div>
            )}
            <div
              className="quiz-scroll"
              role="region"
              aria-label={quiz.title || text.quizTitle}
              tabIndex={0}
            >
              {quiz.questions.map((question, index) => (
                <fieldset key={question.id} className="quiz-question">
                  <legend>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {question.question}
                  </legend>
                  <div className="quiz-options">
                    {question.options.map((option, choice) => {
                      const checked = answers[question.id] === choice
                      const state = graded
                        ? choice === question.answer
                          ? "is-correct"
                          : checked
                            ? "is-wrong"
                            : ""
                        : checked
                          ? "is-selected"
                          : ""
                      return (
                        <label key={choice} className={`quiz-option ${state}`}>
                          <input
                            type="radio"
                            name={`${id}-${question.id}`}
                            value={choice}
                            required
                            checked={checked}
                            aria-describedby={
                              graded ? `${id}-${question.id}-explanation` : undefined
                            }
                            onChange={() => {
                              setAnswers((previous) => ({ ...previous, [question.id]: choice }))
                              setGraded(false)
                            }}
                          />
                          <span>{option}</span>
                          {graded && choice === question.answer && (
                            <Check size={16} aria-hidden="true" />
                          )}
                          {graded && checked && choice !== question.answer && (
                            <X size={16} aria-hidden="true" />
                          )}
                        </label>
                      )
                    })}
                  </div>
                  {graded && (
                    <div id={`${id}-${question.id}-explanation`} className="quiz-explanation">
                      <strong>
                        {answers[question.id] === question.answer ? text.correct : text.incorrect}.{" "}
                        {text.explanation}
                      </strong>
                      <p>{question.explanation}</p>
                    </div>
                  )}
                </fieldset>
              ))}
            </div>
            <div className="quiz-actions">
              <span aria-live="polite" aria-atomic="true">
                {result.answered} / {result.total} {text.answered}
              </span>
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setAnswers({})
                  setGraded(false)
                  requestAnimationFrame(() =>
                    form.current?.querySelector<HTMLInputElement>("input")?.focus(),
                  )
                }}
              >
                <RotateCcw size={14} />
                {text.retry}
              </button>
              <button className="button primary" type="submit">
                {text.check}
                <Check size={15} />
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  )
}
