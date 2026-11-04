import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { ProductArt } from "../components/ProductArt";
import {
  EmptyState,
  Price,
  ProductCard,
  Rating,
  Reveal,
} from "../components/UI";
import { CATEGORIES } from "../data";
import { useStore } from "../store";

interface LayoutContext {
  openCart: () => void;
}

export function ProductPage() {
  const { slug } = useParams();
  const {
    products,
    favorites,
    addToCart,
    toggleFavorite,
    notify,
  } = useStore();
  const { openCart } = useOutletContext<LayoutContext>();
  const product = products.find((candidate) => candidate.slug === slug);
  const [quantity, setQuantity] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    document.title = product
      ? `${product.name}｜青屿 QINGYU`
      : "商品未找到｜青屿 QINGYU";
    setGalleryIndex(0);
    setQuantity(1);
  }, [product]);

  if (!product) {
    return (
      <div className="page-container not-found-short">
        <EmptyState
          title="这件选物暂时不在"
          description="它可能已经下架，或换了一个新的位置。"
          actionLabel="回到选物商店"
          actionHref="/shop"
        />
      </div>
    );
  }

  const category = CATEGORIES.find((item) => item.id === product.category);
  const favorite = favorites.includes(product.id);
  const related = products
    .filter(
      (candidate) =>
        candidate.category === product.category && candidate.id !== product.id,
    )
    .slice(0, 3);
  const relatedFallback = products
    .filter((candidate) => candidate.id !== product.id)
    .slice(0, 3);
  const recommendations = related.length >= 2 ? related : relatedFallback;

  const add = () => {
    addToCart(product.id, quantity);
    openCart();
    notify("已加入购物袋", `${product.name} × ${quantity}`);
  };

  return (
    <>
      <div className="page-container">
        <nav className="breadcrumbs" aria-label="面包屑">
          <Link to="/">首页</Link>
          <span>/</span>
          <Link to="/shop">选物商店</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`}>
            {category?.name}
          </Link>
          <span>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <section className="product-detail">
          <div className="product-gallery">
            <div className={`product-gallery__main tone-${galleryIndex % 3}`}>
              <ProductArt
                art={product.art}
                color={product.color}
                label={`${product.name} 商品主图`}
              />
              <span>QINGYU OBJECT / 0{galleryIndex + 1}</span>
            </div>
            <div className="product-gallery__thumbs" aria-label="商品图片">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  type="button"
                  className={`tone-${index} ${
                    galleryIndex === index ? "is-active" : ""
                  }`}
                  onClick={() => setGalleryIndex(index)}
                  aria-label={`查看商品图 ${index + 1}`}
                  aria-pressed={galleryIndex === index}
                >
                  <ProductArt
                    art={product.art}
                    color={product.color}
                    label={`${product.name} 商品图 ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="product-info">
            <p className="eyebrow">{category?.english} / QINGYU SELECT</p>
            <div className="product-info__title">
              <h1>{product.name}</h1>
              <button
                type="button"
                className={`favorite-button favorite-button--plain ${
                  favorite ? "is-active" : ""
                }`}
                onClick={() => toggleFavorite(product.id)}
                aria-pressed={favorite}
              >
                <Heart size={20} fill={favorite ? "currentColor" : "none"} />
                <span>{favorite ? "已收藏" : "收藏"}</span>
              </button>
            </div>
            <div className="product-info__rating">
              <Rating value={product.rating} count={product.reviewCount} />
              <span>·</span>
              <span>{product.inventory} 件现货</span>
            </div>
            <p className="product-info__summary">{product.summary}</p>
            <Price
              value={product.price}
              original={product.originalPrice}
              large
            />
            <p className="product-info__description">{product.description}</p>
            <ul className="feature-list">
              {product.features.map((feature) => (
                <li key={feature}>
                  <Check size={15} />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="product-purchase">
              <div className="quantity">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="减少数量"
                >
                  <Minus size={16} />
                </button>
                <span aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(10, value + 1))}
                  aria-label="增加数量"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button className="button button--dark product-add" type="button" onClick={add}>
                加入购物袋
                <span>¥{product.price * quantity}</span>
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="product-benefits">
              <div><Truck size={20} /><span><strong>满 ¥299 包邮</strong>校园订单 48 小时内发出</span></div>
              <div><RotateCcw size={20} /><span><strong>7 天无理由</strong>保持商品与包装完整</span></div>
              <div><ShieldCheck size={20} /><span><strong>一年质保</strong>非人为损坏免费维修</span></div>
            </div>
          </div>
        </section>

        <Reveal className="product-story">
          <div>
            <p className="eyebrow">WHY WE PICKED IT</p>
            <h2>为什么选它</h2>
          </div>
          <div className="product-story__body">
            <p>
              我们邀请 24 位同学在不同校园场景中连续使用两周，记录它真正解决的问题，也保留那些不够完美的地方。
            </p>
            <blockquote>
              “它没有试图变成桌面的主角，却在每一次需要的时候，都刚好在那里。”
            </blockquote>
            <span>青屿选物团队</span>
          </div>
        </Reveal>

        <section className="product-specs">
          <div>
            <p className="eyebrow">DETAILS</p>
            <h2>产品细节</h2>
          </div>
          <div className="spec-grid">
            {product.specs.map((spec) => (
              <div key={spec.label}>
                <span>{spec.label}</span>
                <strong>{spec.value}</strong>
              </div>
            ))}
          </div>
          <div className="product-delivery">
            <PackageCheck size={26} />
            <div>
              <strong>包装说明</strong>
              <p>采用无塑可回收纸包装，随单附送校园生活卡片与保养指南。</p>
            </div>
          </div>
        </section>

        <Reveal className="related-products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOU MAY ALSO LIKE</p>
              <h2>和这件选物一起</h2>
            </div>
            <Link to="/shop" className="text-link">
              返回商店 <ArrowLeft size={15} />
            </Link>
          </div>
          <div className="product-grid product-grid--three">
            {recommendations.map((item, index) => (
              <ProductCard
                key={item.id}
                product={item}
                index={index}
                favorite={favorites.includes(item.id)}
                onFavorite={() => toggleFavorite(item.id)}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </>
  );
}
