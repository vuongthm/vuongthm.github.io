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

export function NotebookOrbit() {
  return (
    <svg className="notebook-orbit" viewBox="0 0 320 220" fill="none" aria-hidden="true">
      <ellipse
        className="orbit-line"
        cx="160"
        cy="112"
        rx="132"
        ry="60"
        transform="rotate(-19 160 112)"
      />
      <path className="orbit-line orbit-line-soft" d="M48 92C55 24 129 18 193 45S298 136 260 184" />
      <g className="orbit-notebook" transform="rotate(-8 160 114)">
        <path
          className="orbit-paper"
          d="M108 57H199Q210 57 210 69V169Q210 179 199 179H108Q99 179 99 169V67Q99 57 108 57Z"
        />
        <path className="orbit-ink" d="M118 58V178M136 90H188M136 105H179M136 120H188" />
        <path className="orbit-ink orbit-signature" d="m144 143 8 13 15-22" />
        <path className="orbit-binding" d="M94 77H106M94 99H106M94 121H106M94 143H106M94 165H106" />
      </g>
      <circle className="orbit-node orbit-node-one" cx="44" cy="151" r="7" />
      <circle className="orbit-node orbit-node-two" cx="276" cy="74" r="5" />
      <path className="orbit-star" d="M251 160V176M243 168H259M53 46V56M48 51H58" />
      <circle className="orbit-small" cx="236" cy="36" r="2" />
      <circle className="orbit-small" cx="81" cy="187" r="2.5" />
    </svg>
  )
}
