import { Link } from "react-router-dom";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? "brand--light" : ""}`}
      aria-label="青屿 QINGYU 首页"
    >
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 42 42">
          <path
            d="M9 27c1-12 9-18 23-18-1 14-9 21-23 18Z"
            fill="currentColor"
          />
          <path
            d="M8 34c6-5 10-9 14-16"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.7"
          />
        </svg>
      </span>
      <span className="brand__type">
        <strong>青屿</strong>
        <small>QINGYU</small>
      </span>
    </Link>
  );
}
