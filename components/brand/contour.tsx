/** Shared, tangent-aligned curves keep the hero and footer in the same visual language. */
export function Contour({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`contour ${className}`}
      viewBox="0 0 1440 110"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="contour-back"
        d="M0 47C180 47 180 10 360 10S540 85 720 85S900 30 1080 30S1260 60 1440 60V110H0Z"
      />
      <path
        className="contour-front"
        d="M0 72C180 72 180 42 360 42S540 104 720 104S900 61 1080 61S1260 83 1440 83V110H0Z"
      />
    </svg>
  )
}
