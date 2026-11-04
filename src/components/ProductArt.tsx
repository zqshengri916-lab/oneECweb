import type { VisualKey } from "../types";

interface ProductArtProps {
  art: VisualKey;
  color?: string;
  label?: string;
  className?: string;
}

export function ProductArt({
  art,
  color = "#56705d",
  label,
  className = "",
}: ProductArtProps) {
  const artwork = {
    headphones: (
      <g>
        <path
          d="M92 209v-28c0-60 48-108 108-108s108 48 108 108v28"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="20"
        />
        <rect x="72" y="190" width="42" height="106" rx="20" fill="currentColor" />
        <rect x="286" y="190" width="42" height="106" rx="20" fill="currentColor" />
        <rect x="80" y="202" width="24" height="82" rx="12" fill="#f6f0e3" opacity=".76" />
        <rect x="296" y="202" width="24" height="82" rx="12" fill="#f6f0e3" opacity=".76" />
        <path d="M113 237c30-22 144-22 174 0" fill="none" stroke="currentColor" strokeWidth="8" opacity=".35" />
      </g>
    ),
    lamp: (
      <g>
        <ellipse cx="201" cy="332" rx="92" ry="16" fill="#14251d" opacity=".12" />
        <path d="M201 323V175c0-44 24-75 60-92" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="15" />
        <path d="M252 76l74 46-43 69-71-45z" fill="currentColor" />
        <path d="M230 138l72 46" stroke="#fff8e9" strokeLinecap="round" strokeWidth="7" opacity=".5" />
        <ellipse cx="196" cy="322" rx="65" ry="15" fill="currentColor" />
        <path d="M161 310h70" stroke="#fff8e9" strokeLinecap="round" strokeWidth="5" opacity=".6" />
      </g>
    ),
    bag: (
      <g>
        <path d="M144 144c0-28 24-52 56-52s56 24 56 52" fill="none" stroke="currentColor" strokeWidth="13" />
        <path d="M108 139c0-12 10-22 22-22h140c12 0 22 10 22 22l20 170c1 13-9 24-22 24H110c-13 0-23-11-22-24z" fill="currentColor" />
        <path d="M129 159h142" stroke="#f5efe1" strokeWidth="5" opacity=".54" />
        <path d="M150 270h100" stroke="#f5efe1" strokeLinecap="round" strokeWidth="7" opacity=".38" />
        <rect x="177" y="236" width="46" height="22" rx="11" fill="#f5efe1" opacity=".65" />
        <circle cx="200" cy="247" r="4" fill={color} />
      </g>
    ),
    keyboard: (
      <g>
        <path d="M78 232l43-92h216l-31 111H108z" fill="currentColor" />
        <path d="M95 216l35-57h191l-23 61z" fill="#f2e8d4" opacity=".88" />
        {Array.from({ length: 12 }).map((_, index) => (
          <rect
            key={index}
            x={124 + (index % 6) * 25}
            y={173 + Math.floor(index / 6) * 22}
            width="19"
            height="16"
            rx="4"
            fill={color}
            opacity=".52"
          />
        ))}
        <path d="M75 232h224l-16 59H108z" fill="currentColor" opacity=".82" />
        <path d="M121 250h133" stroke="#f9f1df" strokeLinecap="round" strokeWidth="5" opacity=".5" />
      </g>
    ),
    bottle: (
      <g>
        <path d="M174 93h52v34c0 13 17 26 17 46v132c0 18-14 32-32 32h-22c-18 0-32-14-32-32V173c0-20 17-33 17-46z" fill="currentColor" />
        <path d="M177 106h46" stroke="#fff7e7" strokeWidth="10" opacity=".7" />
        <path d="M181 157h38v161h-38z" fill="#fff7e7" opacity=".12" />
        <circle cx="200" cy="223" r="33" fill="#fff7e7" opacity=".5" />
        <path d="M183 224c12-12 25-12 36 0" fill="none" stroke={color} strokeLinecap="round" strokeWidth="4" />
      </g>
    ),
    notebook: (
      <g>
        <path d="M92 124h216v170H92z" fill="currentColor" />
        <path d="M109 112h177v168H109z" fill="#f5eddb" />
        <path d="M200 112v168" stroke={color} strokeWidth="5" opacity=".24" />
        {Array.from({ length: 6 }).map((_, index) => (
          <g key={index}>
            <path d={`M130 ${145 + index * 19}h125`} stroke={color} opacity=".2" strokeWidth="2" />
            <path d={`M130 ${152 + index * 19}h125`} stroke={color} opacity=".2" strokeWidth="2" />
          </g>
        ))}
        <path d="M117 135h64" stroke={color} strokeLinecap="round" strokeWidth="5" opacity=".65" />
        <path d="M225 161l31 31-44 43-39 7 8-39z" fill={color} opacity=".75" />
      </g>
    ),
    speaker: (
      <g>
        <rect x="116" y="92" width="168" height="218" rx="54" fill="currentColor" />
        <rect x="138" y="113" width="124" height="171" rx="40" fill="#f4ecdc" opacity=".22" />
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 5 }).map((__, column) => (
            <circle
              key={`${row}-${column}`}
              cx={155 + column * 22}
              cy={150 + row * 22}
              r="3"
              fill="#f4ecdc"
              opacity=".68"
            />
          )),
        )}
        <circle cx="200" cy="278" r="17" fill="#f4ecdc" opacity=".45" />
        <path d="M258 108c28 21 33 61 15 91" fill="none" stroke="#f4ecdc" strokeLinecap="round" strokeWidth="5" opacity=".7" />
      </g>
    ),
    organizer: (
      <g>
        <path d="M80 177h102v125H80z" fill="currentColor" />
        <path d="M189 143h78v159h-78z" fill={color} opacity=".8" />
        <path d="M274 198h55v104h-55z" fill="currentColor" opacity=".72" />
        <path d="M91 189h80" stroke="#faeed8" strokeWidth="4" opacity=".45" />
        <path d="M201 156h54" stroke="#faeed8" strokeWidth="4" opacity=".45" />
        <path d="M284 210h35" stroke="#faeed8" strokeWidth="4" opacity=".38" />
        <path d="M228 143v68" stroke="#faeed8" strokeWidth="5" opacity=".28" />
      </g>
    ),
  }[art];

  return (
    <div className={`product-art ${className}`}>
      <span className="product-art__halo" style={{ backgroundColor: color }} />
      <svg
        viewBox="0 0 400 400"
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        style={{ color }}
      >
        <g className="product-art__shadow" opacity=".1">
          <ellipse cx="200" cy="337" rx="118" ry="20" fill="#10221a" />
        </g>
        {artwork}
      </svg>
      <span className="product-art__grain" />
    </div>
  );
}
