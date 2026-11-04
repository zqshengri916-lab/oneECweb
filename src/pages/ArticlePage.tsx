import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductArt } from "../components/ProductArt";
import { EmptyState } from "../components/UI";
import { useStore } from "../store";

export function ArticlePage() {
  const { slug } = useParams();
  const { articles } = useStore();
  const article = articles.find((candidate) => candidate.slug === slug);
  const related = articles.filter((candidate) => candidate.id !== article?.id).slice(0, 2);

  useEffect(() => {
    document.title = article
      ? `${article.title}｜青屿生活志`
      : "文章未找到｜青屿";
  }, [article]);

  if (!article) {
    return (
      <div className="page-container not-found-short">
        <EmptyState
          title="这篇文章暂时找不到"
          description="也许它被移动到了新的位置，先去看看其它生活灵感。"
          actionLabel="返回生活志"
          actionHref="/news"
        />
      </div>
    );
  }

  return (
    <article className="article-page">
      <header className="article-header page-container">
        <Link to="/news" className="back-link">
          <ArrowLeft size={16} />
          返回生活志
        </Link>
        <div className="article-header__meta">
          <span>{article.category}</span>
          <span>
            <Clock size={14} /> {article.readTime} 分钟阅读
          </span>
          <span>{article.publishedAt}</span>
        </div>
        <h1>{article.title}</h1>
        <p>{article.excerpt}</p>
      </header>

      <div className="article-cover page-container">
        <ProductArt
          art={article.art}
          color={article.color}
          label={article.title}
        />
        <span>QINGYU JOURNAL / 青屿生活志</span>
      </div>

      <div className="article-layout page-container">
        <aside>
          <p>SHARE THE STORY</p>
          <button type="button" aria-label="分享文章">↗</button>
        </aside>
        <div className="article-body">
          <p className="article-body__lead">{article.body[0]}</p>
          {article.body.slice(1).map((paragraph, index) => (
            <div key={paragraph}>
              {index === 1 && (
                <blockquote>
                  “生活不是等待某个更好的以后，而是把今天过得更有自己的样子。”
                </blockquote>
              )}
              <p>{paragraph}</p>
            </div>
          ))}
          <div className="article-author">
            <span>QY</span>
            <div>
              <strong>青屿编辑部</strong>
              <p>记录真实的校园生活，以及那些值得被认真对待的小事。</p>
            </div>
          </div>
        </div>
      </div>

      <section className="related-articles page-container">
        <h2>继续阅读</h2>
        {related.map((item) => (
          <Link to={`/article/${item.slug}`} key={item.id}>
            <span>{item.category}</span>
            <strong>{item.title}</strong>
            <ArrowRight size={19} />
          </Link>
        ))}
      </section>
    </article>
  );
}
