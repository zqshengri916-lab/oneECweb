import { ArrowRight, Star } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { ProductArt } from "./ProductArt";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: PropsWithChildren<{ className?: string; delay?: number }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.08 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: { label: string; href: string };
  align?: "left" | "center";
}) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="section-heading__description">{description}</p>}
      </div>
      {action && (
        <Link className="text-link" to={action.href}>
          {action.label}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function ProductCard({
  product,
  onAdd,
  favorite,
  onFavorite,
  index = 0,
}: {
  product: Product;
  onAdd?: () => void;
  favorite?: boolean;
  onFavorite?: () => void;
  index?: number;
}) {
  return (
    <article
      className="product-card reveal is-visible"
      style={{ transitionDelay: `${index * 55}ms` }}
    >
      <div className="product-card__visual">
        <Link
          to={`/product/${product.slug}`}
          aria-label={`查看 ${product.name}`}
        >
          <ProductArt
            art={product.art}
            color={product.color}
            label={`${product.name} 商品插画`}
          />
        </Link>
        {product.badge && (
          <span className="product-card__badge">{product.badge}</span>
        )}
        {onFavorite && (
          <button
            className={`favorite-button ${favorite ? "is-active" : ""}`}
            type="button"
            onClick={onFavorite}
            aria-label={favorite ? `取消收藏 ${product.name}` : `收藏 ${product.name}`}
            aria-pressed={favorite}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.3l7.8-7.8 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
            </svg>
          </button>
        )}
        {onAdd && (
          <button
            className="product-card__quick"
            type="button"
            onClick={onAdd}
          >
            快速加入
          </button>
        )}
      </div>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.badge ?? "QINGYU SELECT"}</span>
          <Rating value={product.rating} compact />
        </div>
        <h3>
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p>{product.summary}</p>
        <div className="product-card__bottom">
          <Price value={product.price} original={product.originalPrice} />
          <Link
            className="round-link"
            to={`/product/${product.slug}`}
            aria-label={`查看 ${product.name} 详情`}
          >
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function Price({
  value,
  original,
  large = false,
}: {
  value: number;
  original?: number;
  large?: boolean;
}) {
  return (
    <span className={`price ${large ? "price--large" : ""}`}>
      <span className="price__currency">¥</span>
      <span>{value}</span>
      {original && <del>¥{original}</del>}
    </span>
  );
}

export function Rating({
  value,
  count,
  compact = false,
}: {
  value: number;
  count?: number;
  compact?: boolean;
}) {
  return (
    <span className={`rating ${compact ? "rating--compact" : ""}`}>
      <Star size={compact ? 12 : 15} fill="currentColor" aria-hidden="true" />
      <span>{value.toFixed(1)}</span>
      {count !== undefined && <small>({count})</small>}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__sun" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      <Link className="button button--dark" to={actionHref}>
        {actionLabel}
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  tone = "cream",
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  tone?: "cream" | "forest" | "clay";
  aside?: ReactNode;
}) {
  return (
    <section className={`page-hero page-hero--${tone}`}>
      <div className="page-hero__copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {aside && <div className="page-hero__aside">{aside}</div>}
    </section>
  );
}
