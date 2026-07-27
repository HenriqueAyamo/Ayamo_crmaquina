export default function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="flex-shrink-0" aria-hidden="true">
      <defs>
        <clipPath id="logo-mark-circle">
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath="url(#logo-mark-circle)">
        <rect width="100" height="100" fill="#F2B23C" />
        <path d="M0,22 C22,10 42,32 68,20 C84,12 94,17 100,15 L100,0 L0,0 Z" fill="#B3382B" />
        <path d="M0,55 C20,44 42,66 66,53 C82,45 92,50 100,48 L100,100 L0,100 Z" fill="#123A66" />
        <path d="M0,76 C20,66 46,88 70,74 C86,66 96,71 100,69 L100,100 L0,100 Z" fill="#149AA6" />
      </g>
    </svg>
  )
}
