import {
  ArrowRight,
  Check,
  Instagram,
  Mail,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useStore } from "../store";
import { Brand } from "./Brand";
import { ProductArt } from "./ProductArt";
import { Price } from "./UI";

const NAV_ITEMS = [
  { label: "首页", to: "/" },
  { label: "选物商店", to: "/shop" },
  { label: "关于青屿", to: "/about" },
  { label: "生活志", to: "/news" },
  { label: "校园故事", to: "/stories" },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    products,
    cart,
    cartCount,
    subtotal,
    shipping,
    discount,
    total,
    user,
    toasts,
    updateQuantity,
    removeFromCart,
    removeToast,
    notify,
  } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const overlayOpen = mobileOpen || cartOpen;
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, cartOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
    setSearchOpen(false);
  };

  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) {
      notify("请输入有效邮箱", "我们会用它发送每周生活灵感");
      return;
    }
    setEmail("");
    notify("订阅成功", "下一位把生活过好的人，就是你");
  };

  return (
    <div className="site-shell">
      <ScrollToTop />
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <div className="announcement">
        <p>校园专属：满 ¥299 包邮 · 新客下单享青屿限定贴纸</p>
        <Link to="/shop">去逛逛 <ArrowRight size={13} /></Link>
      </div>
      <header className="site-header">
        <div className="site-header__inner">
          <Brand />
          <nav className="desktop-nav" aria-label="主导航">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => (isActive ? "is-active" : "")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button"
              type="button"
              onClick={() => setSearchOpen((current) => !current)}
              aria-expanded={searchOpen}
              aria-label="搜索商品"
            >
              <Search size={20} />
            </button>
            <Link className="icon-button account-link" to="/account" aria-label="我的账户">
              <UserRound size={20} />
              {user && <span className="user-dot" aria-hidden="true" />}
            </Link>
            <button
              className="icon-button cart-trigger"
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`购物袋，共 ${cartCount} 件商品`}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
            <button
              className="icon-button mobile-menu-button"
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="打开菜单"
              aria-expanded={mobileOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
        <div className={`search-panel ${searchOpen ? "is-open" : ""}`}>
          <form onSubmit={submitSearch} role="search">
            <Search size={20} aria-hidden="true" />
            <label className="sr-only" htmlFor="header-search">
              搜索商品
            </label>
            <input
              ref={searchRef}
              id="header-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="试试搜索「阅读灯」或「耳机」"
            />
            <button type="submit">搜索</button>
            <button
              type="button"
              className="search-panel__close"
              onClick={() => setSearchOpen(false)}
              aria-label="关闭搜索"
            >
              <X size={20} />
            </button>
          </form>
        </div>
      </header>

      <div className={`mobile-nav ${mobileOpen ? "is-open" : ""}`}>
        <button
          className="overlay-scrim"
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="关闭菜单"
        />
        <div className="mobile-nav__panel">
          <div className="mobile-nav__top">
            <Brand />
            <button
              className="icon-button"
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="关闭菜单"
            >
              <X size={23} />
            </button>
          </div>
          <nav aria-label="移动端主导航">
            {NAV_ITEMS.map((item, index) => (
              <NavLink key={item.to} to={item.to}>
                <span>0{index + 1}</span>
                {item.label}
                <ArrowRight size={20} />
              </NavLink>
            ))}
          </nav>
          <div className="mobile-nav__footer">
            <p>把校园生活，过得更有质感。</p>
            <Link to="/account">
              <UserRound size={18} />
              {user ? user.name : "登录 / 注册"}
            </Link>
          </div>
        </div>
      </div>

      <div className={`cart-drawer ${cartOpen ? "is-open" : ""}`}>
        <button
          className="overlay-scrim"
          type="button"
          onClick={() => setCartOpen(false)}
          aria-label="关闭购物袋"
        />
        <aside className="cart-drawer__panel" aria-label="购物袋">
          <div className="cart-drawer__header">
            <div>
              <p className="eyebrow">YOUR BAG</p>
              <h2>购物袋 <span>{cartCount}</span></h2>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => setCartOpen(false)}
              aria-label="关闭购物袋"
            >
              <X size={22} />
            </button>
          </div>
          {cart.length === 0 ? (
            <div className="drawer-empty">
              <ShoppingBag size={40} strokeWidth={1.2} />
              <h3>购物袋还空着</h3>
              <p>从今天真正需要的那件东西开始。</p>
              <Link className="button button--dark" to="/shop" onClick={() => setCartOpen(false)}>
                浏览全部选物
              </Link>
            </div>
          ) : (
            <>
              <div className="drawer-lines">
                {cart.map((item) => {
                  const product = products.find(
                    (candidate) => candidate.id === item.productId,
                  );
                  if (!product) return null;
                  return (
                    <div className="drawer-line" key={item.productId}>
                      <Link
                        to={`/product/${product.slug}`}
                        onClick={() => setCartOpen(false)}
                        className="drawer-line__image"
                      >
                        <ProductArt
                          art={product.art}
                          color={product.color}
                          label={product.name}
                        />
                      </Link>
                      <div className="drawer-line__info">
                        <div className="drawer-line__title">
                          <Link
                            to={`/product/${product.slug}`}
                            onClick={() => setCartOpen(false)}
                          >
                            {product.name}
                          </Link>
                          <Price value={product.price} />
                        </div>
                        <div className="drawer-line__actions">
                          <div className="quantity quantity--small">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(product.id, item.quantity - 1)
                              }
                              aria-label={`减少 ${product.name} 数量`}
                            >
                              <Minus size={13} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(product.id, item.quantity + 1)
                              }
                              aria-label={`增加 ${product.name} 数量`}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="cart-drawer__summary">
                <div><span>商品小计</span><Price value={subtotal} /></div>
                {discount > 0 && <div className="discount-line"><span>满减优惠</span><span>-¥{discount}</span></div>}
                <div><span>运费</span><span>{shipping === 0 ? "免运费" : `¥${shipping}`}</span></div>
                {shipping > 0 && (
                  <p className="shipping-hint">
                    再买 ¥{299 - subtotal} 即可免运费
                  </p>
                )}
                <div className="cart-drawer__total">
                  <span>合计</span>
                  <Price value={total} large />
                </div>
                <Link
                  className="button button--dark button--full"
                  to="/cart"
                  onClick={() => setCartOpen(false)}
                >
                  去结算
                  <ArrowRight size={17} />
                </Link>
                <p className="cart-drawer__note">
                  <Check size={14} /> 校园满 ¥299 包邮 · 7 天无理由退换
                </p>
              </div>
            </>
          )}
        </aside>
      </div>

      <main id="main-content">
        <Outlet context={{ openCart: () => setCartOpen(true) }} />
      </main>

      <footer className="site-footer">
        <div className="site-footer__top">
          <div className="footer-brand">
            <Brand light />
            <p>为真实的校园生活设计，<br />也为每一个认真生活的你。</p>
            <div className="social-row">
              <a href="mailto:hello@qingyu.example" aria-label="发送邮件">
                <Mail size={18} />
              </a>
              <a href="#newsletter" aria-label="关注青屿社交账号">
                <Instagram size={18} />
              </a>
            </div>
          </div>
          <div className="footer-links">
            <div>
              <h3>探索</h3>
              <Link to="/shop">全部商品</Link>
              <Link to="/shop?category=study">专注学习</Link>
              <Link to="/shop?category=desk">桌面生活</Link>
              <Link to="/stories">校园故事</Link>
            </div>
            <div>
              <h3>关于</h3>
              <Link to="/about">品牌理念</Link>
              <Link to="/news">青屿生活志</Link>
              <Link to="/about#contact">联系我们</Link>
              <Link to="/studio">运营后台演示</Link>
            </div>
          </div>
          <div className="newsletter" id="newsletter">
            <p className="eyebrow">QINGYU LETTER</p>
            <h3>收一封校园生活来信</h3>
            <p>每周一次，不制造焦虑，只分享一点让生活变好的灵感。</p>
            <form onSubmit={subscribe}>
              <label className="sr-only" htmlFor="newsletter-email">
                邮箱地址
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="你的邮箱地址"
              />
              <button type="submit" aria-label="订阅青屿来信">
                <ArrowRight size={19} />
              </button>
            </form>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>© 2026 青屿生活科技有限公司 · 本网站为课程设计演示</p>
          <div>
              <button type="button" onClick={() => notify("隐私说明", "课程演示站仅保存完成订单和账户展示所需的数据")}>隐私政策</button>
            <button type="button" onClick={() => notify("服务条款", "本演示站不提供真实交易服务")}>服务条款</button>
          </div>
        </div>
        <div className="footer-wordmark" aria-hidden="true">QINGYU</div>
      </footer>

      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id}>
            <span className="toast__icon">
              <Check size={16} />
            </span>
            <div>
              <strong>{toast.title}</strong>
              {toast.detail && <p>{toast.detail}</p>}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="关闭通知"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
