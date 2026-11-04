import {
  ArrowRight,
  Heart,
  LogOut,
  Package,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ProductArt } from "../components/ProductArt";
import { PageHero, ProductCard } from "../components/UI";
import { useStore } from "../store";

export function AccountPage() {
  const {
    user,
    orders,
    favorites,
    products,
    login,
    register,
    logout,
    toggleFavorite,
  } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "我的账户｜青屿 QINGYU";
  }, []);

  const changeMode = (next: "login" | "register") => {
    setMode(next);
    setError("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const success =
      mode === "login"
        ? login(email, password)
        : register(name, email, password);
    if (!success) {
      setError(
        mode === "login"
          ? "请输入有效邮箱和至少 6 位密码"
          : "请填写称呼、有效邮箱和至少 6 位密码",
      );
    }
  };

  if (!user) {
    return (
      <>
        <PageHero
          eyebrow="MY QINGYU / MEMBER SPACE"
          title={
            <>
              把喜欢的，
              <br />
              <em>留在自己的岛屿。</em>
            </>
          }
          description="登录后可同步收藏、查看模拟订单，并在下一次回来时保留你的购物袋。"
          aside={
            <div className="account-hero-mark">
              <span>Q</span>
              <small>MEMBER<br />SINCE 2026</small>
            </div>
          }
        />
        <div className="account-auth page-container">
          <div className="account-auth__intro">
            <p className="eyebrow">WELCOME TO QINGYU</p>
            <h2>一个更安静的账户，<br />收藏真实喜欢的东西。</h2>
            <ul>
              <li><Heart size={17} /> 保存你的长期心愿清单</li>
              <li><Package size={17} /> 随时查看模拟订单进度</li>
              <li><UserRound size={17} /> 保留你的校园收货信息</li>
            </ul>
          </div>
          <div className="auth-card">
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={mode === "login" ? "is-active" : ""}
                onClick={() => changeMode("login")}
              >
                登录
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                className={mode === "register" ? "is-active" : ""}
                onClick={() => changeMode("register")}
              >
                注册
              </button>
            </div>
            <form onSubmit={submit}>
              <div>
                <p className="eyebrow">
                  {mode === "login" ? "WELCOME BACK" : "JOIN THE ISLAND"}
                </p>
                <h2>{mode === "login" ? "欢迎回来" : "创建你的青屿账户"}</h2>
                <p className="auth-card__hint">
                  这是课程演示账户，不会上传或验证个人信息。
                </p>
              </div>
              {mode === "register" && (
                <label>
                  <span>你的称呼</span>
                  <input
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="例如：小屿"
                  />
                </label>
              )}
              <label>
                <span>邮箱</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@example.com"
                />
              </label>
              <label>
                <span>密码</span>
                <input
                  required
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 6 位"
                />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button--dark button--full" type="submit">
                {mode === "login" ? "登录账户" : "创建账户"}
                <ArrowRight size={17} />
              </button>
              <p className="auth-terms">
                继续即代表你理解这是前端功能演示，所有数据仅保存在本机浏览器。
              </p>
            </form>
          </div>
        </div>
      </>
    );
  }

  const favoriteProducts = products.filter((product) =>
    favorites.includes(product.id),
  );
  const initials = user.name.slice(0, 1).toUpperCase();

  return (
    <div className="page-container account-page">
      <header className="account-header">
        <div className="account-avatar">{initials}</div>
        <div>
          <p className="eyebrow">MY QINGYU / MEMBER</p>
          <h1>你好，{user.name}</h1>
          <p>{user.email} · 加入于 {new Date(user.joinedAt).toLocaleDateString("zh-CN")}</p>
        </div>
        <button type="button" className="button button--outline" onClick={logout}>
          <LogOut size={16} />
          退出登录
        </button>
      </header>

      <section className="account-stats" aria-label="账户概览">
        <div>
          <strong>{orders.length}</strong>
          <span>历史订单</span>
        </div>
        <div>
          <strong>{favoriteProducts.length}</strong>
          <span>心愿收藏</span>
        </div>
        <div>
          <strong>12</strong>
          <span>校园灵感</span>
        </div>
      </section>

      <div className="account-main">
        <section className="account-orders">
          <div className="account-section-heading">
            <div>
              <p className="eyebrow">ORDER HISTORY</p>
              <h2>我的订单</h2>
            </div>
            <Package size={21} />
          </div>
          {orders.length === 0 ? (
            <div className="account-empty">
              <Package size={30} />
              <h3>还没有订单</h3>
              <p>等你找到第一件真正需要的东西。</p>
              <Link className="text-link" to="/shop">去挑选 <ArrowRight size={15} /></Link>
            </div>
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <article key={order.id}>
                  <div className="order-list__top">
                    <div>
                      <span>订单号 {order.id}</span>
                      <small>{new Date(order.createdAt).toLocaleString("zh-CN")}</small>
                    </div>
                    <span className="status-pill">{order.status}</span>
                  </div>
                  <div className="order-list__lines">
                    {order.lines.map((line) => (
                      <div key={line.productId}>
                        <ProductArt art={line.art} label={line.name} />
                        <span>{line.name}<small>× {line.quantity}</small></span>
                      </div>
                    ))}
                  </div>
                  <div className="order-list__bottom">
                    <span>共 {order.lines.reduce((sum, line) => sum + line.quantity, 0)} 件</span>
                    <strong>合计 ¥{order.total}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="account-profile">
          <p className="eyebrow">ACCOUNT DETAILS</p>
          <h2>账户信息</h2>
          <dl>
            <div><dt>称呼</dt><dd>{user.name}</dd></div>
            <div><dt>邮箱</dt><dd>{user.email}</dd></div>
            <div><dt>账户类型</dt><dd>青屿校园会员</dd></div>
            <div><dt>数据存储</dt><dd>仅本机浏览器</dd></div>
          </dl>
          <a href="mailto:hello@qingyu.example" className="text-link">
            联系账户支持
            <ArrowRight size={15} />
          </a>
        </aside>
      </div>

      <section className="account-favorites">
        <div className="account-section-heading">
          <div>
            <p className="eyebrow">SAVED FOR LATER</p>
            <h2>心愿清单</h2>
          </div>
          <Heart size={21} />
        </div>
        {favoriteProducts.length > 0 ? (
          <div className="product-grid product-grid--three">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                favorite
                onFavorite={() => toggleFavorite(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="account-empty account-empty--wide">
            <Heart size={30} />
            <h3>心愿清单还是空的</h3>
            <p>把不想错过的选物收藏起来，下次回来再看。</p>
            <Link className="text-link" to="/shop">去逛逛 <ArrowRight size={15} /></Link>
          </div>
        )}
      </section>
    </div>
  );
}
