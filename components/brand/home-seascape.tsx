/** An original coastal landscape: a small sailboat setting out, with its wake fading behind it. */
export function HomeSeascape() {
  return (
    <svg
      className="home-seascape"
      viewBox="0 0 1440 340"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path
        className="sea-far"
        d="M0 44C97 36 135 112 211 91C284 71 306 29 400 70C483 106 463 160 528 148C641 128 649 20 775 56C872 83 886 160 974 133C1065 104 1096 18 1204 29C1301 37 1330 98 1440 48V340H0Z"
      />
      <path
        className="sea-middle"
        d="M0 143C121 93 217 120 301 157C421 210 468 202 566 134C668 64 756 90 823 160C877 217 950 222 1038 171C1185 86 1301 111 1440 173V340H0Z"
      />
      <g className="voyage-route">
        <g className="boat-wake" fill="none" strokeLinecap="round">
          <path
            className="wake-stream"
            d="M1 13c-24 1-42 10-67 10M-6 19c-28 10-47 11-72 10M-14 25c-18 9-38 12-57 10"
          />
          <ellipse className="wake-ripple wake-one" cx="-16" cy="17" rx="17" ry="4" />
          <ellipse className="wake-ripple wake-two" cx="-16" cy="17" rx="17" ry="4" />
          <ellipse className="wake-ripple wake-three" cx="-16" cy="17" rx="17" ry="4" />
        </g>
        <g className="sailboat">
          <path className="boat-mast" d="M37-74V4" />
          <path className="boat-jib" d="M31-59 7-6h24Z" />
          <path className="boat-sail" d="M43-67 79-6H43Z" />
          <path className="boat-sail-seam" d="m46-52 23 40H46" />
          <path className="boat-pennant" d="m38-74 21 6-21 6Z" />
          <path className="boat-hull" d="M0 0c27 4 61 4 88-1L74 14c-20 5-48 2-65-4Z" />
          <path className="boat-gunwale" d="M2 1c27 4 59 4 83-1" />
          <path className="boat-signature" d="m38 7 4 6 5-8" />
        </g>
      </g>
      <path
        className="sea-front"
        d="M0 174C155 122 317 151 451 198C535 228 601 309 660 307C704 306 740 245 820 250C946 258 1042 329 1120 287C1215 236 1227 144 1327 143C1368 142 1405 155 1440 169V340H0Z"
      />
    </svg>
  )
}
