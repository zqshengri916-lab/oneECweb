import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MoveRight,
  Pause,
  Play,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ProductArt } from "../components/ProductArt";
import {
  Price,
  ProductCard,
  Reveal,
  SectionHeading,
} from "../components/UI";
import { CATEGORIES, HERO_SLIDES, STORIES } from "../data";
import { useStore } from "../store";

interface LayoutContext {
  openCart: () => void;
}

export function HomePage() {
  const { products, articles, favorites, addToCart, toggleFavorite, notify } =
    useStore();
  const { openCart } = useOutletContext<LayoutContext>();
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    document.title = "青屿 QINGYU｜校园生活好物";
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [paused]);

  const slide = HERO_SLIDES[slideIndex];
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const spotlight = products[0];
  const latestArticles = articles.slice(0, 3);

  const addSpotlight = () => {
    addToCart(spotlight.id);
    openCart();
    notify("已加入购物袋", spotlight.name);
  };

  return (
    <>
      <section
        className={`hero hero--${slide.theme}`}
        aria-roledescription="carousel"
        aria-label="青屿本期主视觉"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="hero__noise" aria-hidden="true" />
        <div className="hero__copy" key={slide.eyebrow}>
          <p className="eyebrow">
            <Sparkles size={14} />
            {slide.eyebrow}
          </p>
          <h1>
            {slide.title}
            <span>{slide.emphasis}</span>
          </h1>
          <p className="hero__description">{slide.description}</p>
          <div className="hero__actions">
            <Link className="button button--light" to={slide.href}>
              {slide.cta}
              <ArrowRight size={17} />
            </Link>
            <Link className="text-link text-link--light" to="/about">
              我们的故事
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="hero__note">{slide.note}</p>
        </div>
        <div className="hero__visual" aria-live="polite">
          <span className="hero__circle-text" aria-hidden="true">
            EVERYDAY OBJECTS · BETTER CAMPUS LIFE ·
          </span>
          <div className="hero__art-card" key={slide.art}>
            <ProductArt
              art={slide.art}
              color={
                slide.theme === "forest"
                  ? "#78917a"
                  : slide.theme === "clay"
                    ? "#dc8c65"
                    : "#173c2e"
              }
              label={`${slide.emphasis} 主题商品插画`}
            />
            <span className="hero__stamp">
              <Star size={13} fill="currentColor" /> 校园人气
            </span>
          </div>
          <div className="hero__mini-card hero__mini-card--top">
            <span>QINGYU / 2026</span>
            <strong>生活不必</strong>
            <strong>等到以后</strong>
          </div>
          <div className="hero__mini-card hero__mini-card--bottom">
            <span className="hero__mini-number">4.9</span>
            <span>来自 2,400+<br />校园用户</span>
          </div>
        </div>
        <div className="hero__controls">
          <button
            type="button"
            onClick={() =>
              setSlideIndex(
                (current) =>
                  (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
              )
            }
            aria-label="上一张主视觉"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="hero__dots">
            {HERO_SLIDES.map((item, index) => (
              <button
                key={item.eyebrow}
                type="button"
                className={index === slideIndex ? "is-active" : ""}
                onClick={() => setSlideIndex(index)}
                aria-label={`查看第 ${index + 1} 张主视觉`}
                aria-current={index === slideIndex}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPaused((current) => !current)}
            aria-label={paused ? "继续自动轮播" : "暂停自动轮播"}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            type="button"
            onClick={() =>
              setSlideIndex((current) => (current + 1) % HERO_SLIDES.length)
            }
            aria-label="下一张主视觉"
          >
            <ArrowRight size={18} />
          </button>
        </div>
        <p className="hero__counter" aria-live="polite">
          0{slideIndex + 1} <span>/ 0{HERO_SLIDES.length}</span>
        </p>
      </section>

      <section className="marquee-strip" aria-label="青屿品牌关键词">
        <div>
          <span>LESS, BUT BETTER</span>
          <i>✦</i>
          <span>真实生活选物</span>
          <i>✦</i>
          <span>CAMPUS DAILY</span>
          <i>✦</i>
          <span>轻一点生活</span>
          <i>✦</i>
          <span>LESS, BUT BETTER</span>
          <i>✦</i>
          <span>真实生活选物</span>
        </div>
      </section>

      <div className="page-container">
        <Reveal className="category-section">
          <SectionHeading
            eyebrow="FIND YOUR MOMENT"
            title={
              <>
                今天，想把时间
                <br />
                <em>留给哪一刻？</em>
              </>
            }
            description="不是为所有需求买东西，而是为真正想要的生活，挑选几个恰到好处的伙伴。"
            action={{ label: "浏览全部选物", href: "/shop" }}
          />
          <div className="category-grid">
            {CATEGORIES.map((category, index) => (
              <Link
                to={`/shop?category=${category.id}`}
                className={`category-card category-card--${index + 1}`}
                key={category.id}
              >
                <div className="category-card__top">
                  <span>0{index + 1}</span>
                  <ArrowUpRight size={20} />
                </div>
                <div className="category-card__art">
                  <ProductArt
                    art={category.visual}
                    color={
                      ["#60735f", "#b96445", "#705b43", "#9e946f"][index]
                    }
                    label={category.name}
                  />
                </div>
                <div className="category-card__copy">
                  <p>{category.english}</p>
                  <h3>{category.name}</h3>
                  <span>{category.description}</span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        <Reveal className="featured-section">
          <SectionHeading
            eyebrow="DAILY EDIT / 01"
            title={
              <>
                本周，大家
                <br />
                都在买什么
              </>
            }
            description="根据校园真实订单与使用评价，整理出的本周高频好物。"
            action={{ label: "进入商店", href: "/shop" }}
          />
          <div className="product-grid">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                favorite={favorites.includes(product.id)}
                onFavorite={() => toggleFavorite(product.id)}
                onAdd={() => {
                  addToCart(product.id);
                  openCart();
                  notify("已加入购物袋", product.name);
                }}
              />
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal className="manifesto">
        <div className="manifesto__label">
          <span>MANIFESTO</span>
          <span>2026 — NOW</span>
        </div>
        <div className="manifesto__main">
          <p className="eyebrow">OUR POINT OF VIEW</p>
          <h2>
            好物不必很多，
            <br />
            <em>但每一天都要顺手。</em>
          </h2>
          <div className="manifesto__body">
            <p>
              青屿关注真实校园里的小问题：一张拥挤的书桌、一段吵闹的通勤、一次太晚结束的自习。
              我们寻找那些安静解决这些问题的物件。
            </p>
            <Link className="text-link text-link--light" to="/about">
              了解青屿的故事
              <MoveRight size={17} />
            </Link>
          </div>
        </div>
        <div className="manifesto__stats">
          <div>
            <strong>12</strong>
            <span>所合作高校</span>
          </div>
          <div>
            <strong>2.4k</strong>
            <span>真实校园评价</span>
          </div>
          <div>
            <strong>92%</strong>
            <span>用户愿意推荐</span>
          </div>
        </div>
      </Reveal>

      <div className="page-container">
        <Reveal className="spotlight">
          <div className="spotlight__art">
            <ProductArt
              art={spotlight.art}
              color={spotlight.color}
              label={spotlight.name}
            />
            <span className="spotlight__tag">EDITOR'S PICK</span>
          </div>
          <div className="spotlight__copy">
            <p className="eyebrow">ONE OBJECT, ONE CHANGE</p>
            <h2>
              一件好物，
              <br />
              换来更安静的一小时。
            </h2>
            <p>
              {spotlight.summary} 在青屿，我们更在意它能否自然融入你每一天的生活。
            </p>
            <div className="spotlight__price">
              <div>
                <span>{spotlight.name}</span>
                <Price
                  value={spotlight.price}
                  original={spotlight.originalPrice}
                  large
                />
              </div>
              <button className="button button--accent" type="button" onClick={addSpotlight}>
                加入购物袋
                <ArrowRight size={17} />
              </button>
            </div>
            <Link className="text-link" to={`/product/${spotlight.slug}`}>
              查看完整细节
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </Reveal>

        <Reveal className="story-section">
          <SectionHeading
            eyebrow="REAL CAMPUS STORIES"
            title={
              <>
                每一种生活，
                <br />
                都有自己的答案
              </>
            }
            description="我们走进真实的宿舍与书桌，记录人与物件之间安静发生的改变。"
            action={{ label: "阅读全部故事", href: "/stories" }}
          />
          <div className="story-grid">
            {STORIES.map((story, index) => (
              <Link to="/stories" className="story-card" key={story.id}>
                <div className="story-card__art">
                  <ProductArt
                    art={story.art}
                    color={story.color}
                    label={`${story.title} 场景插画`}
                  />
                  <span>{story.kicker}</span>
                </div>
                <div className="story-card__copy">
                  <p>0{index + 1} / CAMPUS STORY</p>
                  <h3>{story.title}</h3>
                  <span>{story.excerpt}</span>
                  <div className="story-card__meta">
                    <small>{story.author} · {story.school}</small>
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal className="journal-section">
        <div className="page-container">
          <SectionHeading
            eyebrow="QINGYU JOURNAL"
            title="青屿生活志"
            description="关于空间、声音与校园节奏的观察和灵感。"
            action={{ label: "阅读更多", href: "/news" }}
          />
          <div className="journal-list">
            {latestArticles.map((article, index) => (
              <Link
                to={`/article/${article.slug}`}
                className="journal-row"
                key={article.id}
              >
                <span className="journal-row__index">0{index + 1}</span>
                <div className="journal-row__content">
                  <span>{article.category} · {article.readTime} 分钟阅读</span>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                </div>
                <div className="journal-row__art">
                  <ProductArt
                    art={article.art}
                    color={article.color}
                    label={article.title}
                  />
                </div>
                <ArrowUpRight className="journal-row__arrow" size={20} />
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal className="home-cta">
        <div className="home-cta__sun" aria-hidden="true" />
        <p className="eyebrow">A BETTER DAY STARTS HERE</p>
        <h2>
          不必等生活完美，
          <br />
          <em>从今天的一件小事开始。</em>
        </h2>
        <p>去选一件真正会陪你很久的东西。</p>
        <Link className="button button--light" to="/shop">
          开始逛逛
          <ArrowRight size={17} />
        </Link>
      </Reveal>
    </>
  );
}
