import { READING_PROGRESS_CIRCUMFERENCE, READING_PROGRESS_RADIUS } from "@/lib/reading/progress"

export function ReadingProgress({ label }: { label: string }) {
  return (
    <span
      className="reader-progress-ring"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle
          className="reader-progress-track"
          cx="8"
          cy="8"
          r={READING_PROGRESS_RADIUS}
          strokeWidth="1.5"
        />
        <circle
          className="reader-progress-fill"
          cx="8"
          cy="8"
          r={READING_PROGRESS_RADIUS}
          strokeWidth="1.5"
          strokeDasharray={READING_PROGRESS_CIRCUMFERENCE}
          strokeDashoffset={READING_PROGRESS_CIRCUMFERENCE}
          strokeOpacity={0}
        />
      </svg>
    </span>
  )
}
