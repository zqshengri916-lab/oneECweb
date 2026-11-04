import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { ProductCard, PageHero, EmptyState } from "../components/UI";
import { CATEGORIES } from "../data";
import { useStore } from "../store";
import type { CategoryId } from "../types";

interface LayoutContext {
  openCart: () => void;
}

type SortValue = "featured" | "price-asc" | "price-desc" | "rating";

export function ShopPage() {
  const {
    products,
    favorites,
    addToCart,
    toggleFavorite,
    notify,
  } = useStore();
  const { openCart } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") as CategoryId | null;
  const query = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") ?? "featured") as SortValue;

  useEffect(() => {
    document.title = "选物商店｜青屿 QINGYU";
  }, []);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const inCategory = !category || product.category === category;
      const matchesQuery =
        !normalized ||
        [product.name, product.summary, product.category].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      return inCategory && matchesQuery;
    });

    return filtered.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return Number(b.featured) - Number(a.featured);
    });
  }, [category, products, query, sort]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <PageHero
        eyebrow="THE QINGYU EDIT / 2026"
        title={
          <>
            刚好够用，
            <br />
            <em>也刚好喜欢。</em>
          </>
        }
        description="每一件选物都经过真实校园场景测试。少一点选择负担，多一点每天都会用到的好。"
        aside={
          <div className="shop-hero-art">
            <span>LESS</span>
            <span>BUT</span>
            <span>BETTER</span>
          </div>
        }
      />

      <section className="shop-section page-container">
        <div className="shop-toolbar">
          <div className="filter-pills" role="group" aria-label="商品分类">
            <button
              type="button"
              className={!category ? "is-active" : ""}
              onClick={() => setParam("category", "")}
            >
              全部选物
            </button>
            {CATEGORIES.map((item) => (
              <button
                type="button"
                key={item.id}
                className={category === item.id ? "is-active" : ""}
                onClick={() => setParam("category", item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="shop-tools">
            <label className="inline-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">搜索商品</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setParam("q", event.target.value)}
                placeholder="搜索选物"
              />
            </label>
            <label className="sort-select">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <span className="sr-only">商品排序</span>
              <select
                value={sort}
                onChange={(event) => setParam("sort", event.target.value)}
              >
                <option value="featured">推荐排序</option>
                <option value="price-asc">价格从低到高</option>
                <option value="price-desc">价格从高到低</option>
                <option value="rating">评分优先</option>
              </select>
            </label>
          </div>
        </div>

        <div className="shop-results-bar">
          <p>
            <strong>{visibleProducts.length}</strong> 件选物
            {category &&
              ` · ${CATEGORIES.find((item) => item.id === category)?.name}`}
            {query && ` · 搜索「${query}」`}
          </p>
          {(category || query) && (
            <button type="button" onClick={() => setSearchParams({})}>
              清除筛选
            </button>
          )}
        </div>

        {visibleProducts.length > 0 ? (
          <div className="product-grid product-grid--shop">
            {visibleProducts.map((product, index) => (
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
        ) : (
          <EmptyState
            title="没有找到这件东西"
            description="换一个关键词或分类试试。真正需要的东西，值得多找一会儿。"
            actionLabel="查看全部选物"
            actionHref="/shop"
          />
        )}
      </section>

      <section className="shop-promise">
        <div>
          <span>01</span>
          <h3>真实使用测试</h3>
          <p>每件商品都进入校园场景，而不是只在参数表里好看。</p>
        </div>
        <div>
          <span>02</span>
          <h3>克制而诚实</h3>
          <p>不制造虚假紧迫感，清楚说明材质、尺寸与使用边界。</p>
        </div>
        <div>
          <span>03</span>
          <h3>长期陪伴</h3>
          <p>选择耐用、可维护、不过时的物件，让购买真正有价值。</p>
        </div>
      </section>

      <div className="page-container shop-bottom-note">
        <p>不确定选哪一件？</p>
        <span>看看同学们真实的宿舍与书桌故事。</span>
        <Link className="text-link" to="/stories">阅读校园故事</Link>
      </div>
    </>
  );
}
