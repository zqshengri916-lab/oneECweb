import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProductArt } from "../components/ProductArt";
import { PageHero } from "../components/UI";
import { useStore } from "../store";

const FILTERS = ["全部", "品牌动态", "生活灵感", "校园观察"] as const;

export function NewsPage() {
  const { articles } = useStore();
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]>("全部");

  useEffect(() => {
    document.title = "青屿生活志｜青屿 QINGYU";
  }, []);

  const visible = useMemo(
    () =>
      filter === "全部"
        ? articles
        : articles.filter((article) => article.category === filter),
    [articles, filter],
  );
  const featured = visible[0] ?? articles[0];

  return (
    <>
      <PageHero
        eyebrow="QINGYU JOURNAL / VOL. 08"
        title={
          <>
            记录日常里，
            <br />
            <em>那些微小但重要的事。</em>
          </>
        }
        description="青屿生活志是一份关于校园空间、声音、物件和年轻人的观察笔记。我们相信，理解生活比推销产品更重要。"
        aside={
          <div className="journal-cover">
            <span>Q</span>
            <p>ISSUE<br />NO. 08</p>
            <small>STUDENT LIFE<br />& EVERYDAY THINGS</small>
          </div>
        }
      />

      <div className="page-container news-page">
        <div className="news-filter-row">
          <p>浏览主题</p>
          <div role="group" aria-label="资讯分类">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                className={filter === item ? "is-active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {featured && (
          <Link
            to={`/article/${featured.slug}`}
            className="featured-article"
          >
            <div className="featured-article__art">
              <ProductArt
                art={featured.art}
                color={featured.color}
                label={featured.title}
              />
              <span>FEATURED STORY</span>
            </div>
            <div className="featured-article__copy">
              <p className="eyebrow">
                {featured.category} · {featured.readTime} MIN READ
              </p>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <span className="text-link">
                阅读全文
                <ArrowUpRight size={17} />
              </span>
              <small>{featured.publishedAt}</small>
            </div>
          </Link>
        )}

        <div className="article-grid">
          {visible.slice(1).map((article, index) => (
            <Link
              to={`/article/${article.slug}`}
              className="article-card"
              key={article.id}
            >
              <div className="article-card__art">
                <ProductArt
                  art={article.art}
                  color={article.color}
                  label={article.title}
                />
                <span>0{index + 2}</span>
              </div>
              <div className="article-card__copy">
                <p>
                  {article.category} · {article.readTime} 分钟
                </p>
                <h3>{article.title}</h3>
                <span>{article.excerpt}</span>
                <div>
                  <small>{article.publishedAt}</small>
                  <ArrowUpRight size={18} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="empty-state news-empty">
            <h3>这个主题还在慢慢写</h3>
            <p>先看看其它生活灵感吧。</p>
            <button type="button" className="button button--dark" onClick={() => setFilter("全部")}>
              查看全部
            </button>
          </div>
        )}
      </div>
    </>
  );
}
