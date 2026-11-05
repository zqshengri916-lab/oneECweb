import {
  ArrowLeft,
  Edit3,
  FileText,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { ProductArt } from "../components/ProductArt";
import { CATEGORIES } from "../data";
import { useStore } from "../store";
import type {
  CategoryId,
  NewsArticle,
  Product,
  VisualKey,
} from "../types";

const VISUALS: VisualKey[] = [
  "headphones",
  "lamp",
  "bag",
  "keyboard",
  "bottle",
  "notebook",
  "speaker",
  "organizer",
];

const BLANK_PRODUCT: Product = {
  id: "",
  slug: "",
  name: "",
  category: "study",
  price: 99,
  summary: "",
  description: "",
  features: ["校园场景实测", "一年质保"],
  specs: [
    { label: "材质", value: "待补充" },
    { label: "产地", value: "中国" },
  ],
  rating: 4.8,
  reviewCount: 0,
  inventory: 20,
  art: "notebook",
  color: "#617660",
  featured: false,
  createdAt: new Date().toISOString().slice(0, 10),
};

const BLANK_ARTICLE: NewsArticle = {
  id: "",
  slug: "",
  category: "品牌动态",
  title: "",
  excerpt: "",
  body: [""],
  publishedAt: new Date().toISOString().slice(0, 10),
  readTime: 4,
  art: "notebook",
  color: "#617660",
};

export function StudioPage() {
  const {
    products,
    articles,
    upsertProduct,
    deleteProduct,
    upsertArticle,
    deleteArticle,
    resetCatalog,
    notify,
    databaseStatus,
  } = useStore();
  const [tab, setTab] = useState<"products" | "articles">("products");
  const [query, setQuery] = useState("");
  const [productDraft, setProductDraft] = useState<Product | null>(null);
  const [articleDraft, setArticleDraft] = useState<NewsArticle | null>(null);
  const [articleBody, setArticleBody] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    document.title = "运营后台演示｜青屿 QINGYU";
  }, []);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        product.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [products, query],
  );

  const filteredArticles = useMemo(
    () =>
      articles.filter((article) =>
        article.title.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [articles, query],
  );

  const openNewProduct = () => {
    setFormError("");
    setProductDraft({
      ...BLANK_PRODUCT,
      id: `p-${Date.now()}`,
      slug: `new-object-${Date.now().toString().slice(-5)}`,
    });
  };

  const openProduct = (product: Product) => {
    setFormError("");
    setProductDraft({ ...product });
  };

  const openNewArticle = () => {
    setFormError("");
    setArticleBody("");
    setArticleDraft({
      ...BLANK_ARTICLE,
      id: `n-${Date.now()}`,
      slug: `new-story-${Date.now().toString().slice(-5)}`,
    });
  };

  const openArticle = (article: NewsArticle) => {
    setFormError("");
    setArticleBody(article.body.join("\n\n"));
    setArticleDraft({ ...article, body: [...article.body] });
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productDraft) return;
    const slugConflict = products.some(
      (product) =>
        product.slug === productDraft.slug && product.id !== productDraft.id,
    );
    if (slugConflict) {
      setFormError("商品链接标识已存在，请换一个英文标识");
      return;
    }
    const saved = await upsertProduct(productDraft);
    if (!saved) return;
    notify(
      products.some((product) => product.id === productDraft.id)
        ? "商品已更新"
        : "商品已创建",
      productDraft.name,
    );
    setProductDraft(null);
  };

  const saveArticle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!articleDraft) return;
    const body = articleBody
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    if (body.length === 0) {
      setFormError("正文至少需要填写一个段落");
      return;
    }
    const slugConflict = articles.some(
      (article) =>
        article.slug === articleDraft.slug && article.id !== articleDraft.id,
    );
    if (slugConflict) {
      setFormError("文章链接标识已存在，请换一个英文标识");
      return;
    }
    const saved = await upsertArticle({ ...articleDraft, body });
    if (!saved) return;
    notify(
      articles.some((article) => article.id === articleDraft.id)
        ? "文章已更新"
        : "文章已创建",
      articleDraft.title,
    );
    setArticleDraft(null);
    setArticleBody("");
  };

  const confirmDeleteProduct = async (product: Product) => {
    if (window.confirm(`确认删除「${product.name}」？此操作不可撤销。`)) {
      const deleted = await deleteProduct(product.id);
      if (!deleted) return;
      notify("商品已删除", product.name);
    }
  };

  const confirmDeleteArticle = async (article: NewsArticle) => {
    if (window.confirm(`确认删除「${article.title}」？此操作不可撤销。`)) {
      const deleted = await deleteArticle(article.id);
      if (!deleted) return;
      notify("文章已删除", article.title);
    }
  };

  return (
    <div className="studio-page">
      <div className="studio-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          返回网站
        </Link>
        <div>
          <p className="eyebrow">QINGYU OPERATIONS / DATABASE</p>
          <h1>运营工作台</h1>
          <p>商品与资讯管理 · 数据实时写入 SQLite 数据库</p>
        </div>
        <button
          className="button button--outline"
          type="button"
          onClick={async () => {
            if (window.confirm("确认将商品与资讯恢复为初始示例数据？")) {
              const reset = await resetCatalog();
              if (reset) notify("内容已重置", "数据库已恢复初始示例数据");
            }
          }}
        >
          <RotateCcw size={16} />
          恢复示例数据
        </button>
      </div>

      <div className="studio-stats">
        <div>
          <Package size={22} />
          <span>商品总数<strong>{products.length}</strong></span>
        </div>
        <div>
          <FileText size={22} />
          <span>文章总数<strong>{articles.length}</strong></span>
        </div>
        <div>
          <span className={`studio-dot ${databaseStatus !== "connected" ? "is-offline" : ""}`} />
          <span>SQLite<strong>{databaseStatus === "connected" ? "已连接" : databaseStatus === "connecting" ? "连接中" : "连接异常"}</strong></span>
        </div>
      </div>

      <div className="studio-panel">
        <div className="studio-toolbar">
          <div className="studio-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "products"}
              className={tab === "products" ? "is-active" : ""}
              onClick={() => {
                setTab("products");
                setQuery("");
              }}
            >
              <Package size={17} />
              商品管理
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "articles"}
              className={tab === "articles" ? "is-active" : ""}
              onClick={() => {
                setTab("articles");
                setQuery("");
              }}
            >
              <FileText size={17} />
              资讯管理
            </button>
          </div>
          <div className="studio-toolbar__actions">
            <label className="inline-search">
              <Search size={16} />
              <span className="sr-only">搜索内容</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索名称或标题"
              />
            </label>
            <button
              className="button button--dark"
              type="button"
              onClick={tab === "products" ? openNewProduct : openNewArticle}
            >
              <Plus size={17} />
              {tab === "products" ? "新增商品" : "新增文章"}
            </button>
          </div>
        </div>

        {tab === "products" ? (
          <div className="studio-table-wrap">
            <table className="studio-table">
              <thead>
                <tr>
                  <th>商品</th>
                  <th>分类</th>
                  <th>价格</th>
                  <th>库存</th>
                  <th>推荐</th>
                  <th><span className="sr-only">操作</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="studio-product">
                        <ProductArt
                          art={product.art}
                          color={product.color}
                          label={product.name}
                        />
                        <div>
                          <strong>{product.name}</strong>
                          <small>/{product.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {CATEGORIES.find((item) => item.id === product.category)?.name}
                    </td>
                    <td>¥{product.price}</td>
                    <td>{product.inventory}</td>
                    <td>
                      <span className={`table-status ${product.featured ? "is-on" : ""}`}>
                        {product.featured ? "是" : "否"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => openProduct(product)}
                          aria-label={`编辑 ${product.name}`}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDeleteProduct(product)}
                          aria-label={`删除 ${product.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="studio-empty">没有匹配的商品</div>
            )}
          </div>
        ) : (
          <div className="studio-table-wrap">
            <table className="studio-table">
              <thead>
                <tr>
                  <th>文章</th>
                  <th>分类</th>
                  <th>发布日期</th>
                  <th>阅读时长</th>
                  <th><span className="sr-only">操作</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <div className="studio-product">
                        <ProductArt
                          art={article.art}
                          color={article.color}
                          label={article.title}
                        />
                        <div>
                          <strong>{article.title}</strong>
                          <small>/{article.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td>{article.category}</td>
                    <td>{article.publishedAt}</td>
                    <td>{article.readTime} 分钟</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => openArticle(article)}
                          aria-label={`编辑 ${article.title}`}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDeleteArticle(article)}
                          aria-label={`删除 ${article.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredArticles.length === 0 && (
              <div className="studio-empty">没有匹配的文章</div>
            )}
          </div>
        )}
      </div>

      {productDraft && (
        <div className="modal-backdrop" role="presentation">
          <div className="studio-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <div className="studio-modal__header">
              <div>
                <p className="eyebrow">PRODUCT EDITOR</p>
                <h2 id="product-form-title">
                  {products.some((product) => product.id === productDraft.id)
                    ? "编辑商品"
                    : "新增商品"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setProductDraft(null)}
                aria-label="关闭商品表单"
              >
                <X size={21} />
              </button>
            </div>
            <form className="studio-form" onSubmit={saveProduct}>
              <div className="form-grid">
                <label>
                  <span>商品名称 *</span>
                  <input
                    required
                    value={productDraft.name}
                    onChange={(event) =>
                      setProductDraft({ ...productDraft, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>链接标识 *</span>
                  <input
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    value={productDraft.slug}
                    onChange={(event) =>
                      setProductDraft({ ...productDraft, slug: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>分类</span>
                  <select
                    value={productDraft.category}
                    onChange={(event) =>
                      setProductDraft({
                        ...productDraft,
                        category: event.target.value as CategoryId,
                      })
                    }
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>商品插画</span>
                  <select
                    value={productDraft.art}
                    onChange={(event) =>
                      setProductDraft({
                        ...productDraft,
                        art: event.target.value as VisualKey,
                      })
                    }
                  >
                    {VISUALS.map((visual) => (
                      <option key={visual} value={visual}>{visual}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>价格 *</span>
                  <input
                    required
                    min="1"
                    type="number"
                    value={productDraft.price}
                    onChange={(event) =>
                      setProductDraft({
                        ...productDraft,
                        price: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  <span>原价</span>
                  <input
                    min="0"
                    type="number"
                    value={productDraft.originalPrice ?? ""}
                    onChange={(event) =>
                      setProductDraft({
                        ...productDraft,
                        originalPrice: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  <span>库存</span>
                  <input
                    min="0"
                    type="number"
                    value={productDraft.inventory}
                    onChange={(event) =>
                      setProductDraft({
                        ...productDraft,
                        inventory: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  <span>主题色</span>
                  <input
                    type="color"
                    value={productDraft.color}
                    onChange={(event) =>
                      setProductDraft({ ...productDraft, color: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>标签</span>
                  <input
                    value={productDraft.badge ?? ""}
                    onChange={(event) =>
                      setProductDraft({ ...productDraft, badge: event.target.value })
                    }
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={productDraft.featured}
                    onChange={(event) =>
                      setProductDraft({
                        ...productDraft,
                        featured: event.target.checked,
                      })
                    }
                  />
                  <span>首页推荐</span>
                </label>
                <label className="form-grid__wide">
                  <span>一句话介绍 *</span>
                  <input
                    required
                    value={productDraft.summary}
                    onChange={(event) =>
                      setProductDraft({ ...productDraft, summary: event.target.value })
                    }
                  />
                </label>
                <label className="form-grid__wide">
                  <span>商品描述 *</span>
                  <textarea
                    required
                    rows={4}
                    value={productDraft.description}
                    onChange={(event) =>
                      setProductDraft({
                        ...productDraft,
                        description: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="studio-modal__actions">
                <button type="button" className="button button--outline" onClick={() => setProductDraft(null)}>
                  取消
                </button>
                <button type="submit" className="button button--dark">保存商品</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {articleDraft && (
        <div className="modal-backdrop" role="presentation">
          <div className="studio-modal" role="dialog" aria-modal="true" aria-labelledby="article-form-title">
            <div className="studio-modal__header">
              <div>
                <p className="eyebrow">ARTICLE EDITOR</p>
                <h2 id="article-form-title">
                  {articles.some((article) => article.id === articleDraft.id)
                    ? "编辑文章"
                    : "新增文章"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setArticleDraft(null)}
                aria-label="关闭文章表单"
              >
                <X size={21} />
              </button>
            </div>
            <form className="studio-form" onSubmit={saveArticle}>
              <div className="form-grid">
                <label>
                  <span>文章标题 *</span>
                  <input
                    required
                    value={articleDraft.title}
                    onChange={(event) =>
                      setArticleDraft({ ...articleDraft, title: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>链接标识 *</span>
                  <input
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    value={articleDraft.slug}
                    onChange={(event) =>
                      setArticleDraft({ ...articleDraft, slug: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>分类</span>
                  <select
                    value={articleDraft.category}
                    onChange={(event) =>
                      setArticleDraft({
                        ...articleDraft,
                        category: event.target.value as NewsArticle["category"],
                      })
                    }
                  >
                    <option value="品牌动态">品牌动态</option>
                    <option value="生活灵感">生活灵感</option>
                    <option value="校园观察">校园观察</option>
                  </select>
                </label>
                <label>
                  <span>封面插画</span>
                  <select
                    value={articleDraft.art}
                    onChange={(event) =>
                      setArticleDraft({
                        ...articleDraft,
                        art: event.target.value as VisualKey,
                      })
                    }
                  >
                    {VISUALS.map((visual) => (
                      <option key={visual} value={visual}>{visual}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>发布日期</span>
                  <input
                    type="date"
                    value={articleDraft.publishedAt}
                    onChange={(event) =>
                      setArticleDraft({
                        ...articleDraft,
                        publishedAt: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span>阅读时长</span>
                  <input
                    min="1"
                    type="number"
                    value={articleDraft.readTime}
                    onChange={(event) =>
                      setArticleDraft({
                        ...articleDraft,
                        readTime: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="form-grid__wide">
                  <span>摘要 *</span>
                  <textarea
                    required
                    rows={3}
                    value={articleDraft.excerpt}
                    onChange={(event) =>
                      setArticleDraft({
                        ...articleDraft,
                        excerpt: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="form-grid__wide">
                  <span>正文 *（空行分隔段落）</span>
                  <textarea
                    required
                    rows={8}
                    value={articleBody}
                    onChange={(event) => setArticleBody(event.target.value)}
                  />
                </label>
              </div>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="studio-modal__actions">
                <button type="button" className="button button--outline" onClick={() => setArticleDraft(null)}>
                  取消
                </button>
                <button type="submit" className="button button--dark">保存文章</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
