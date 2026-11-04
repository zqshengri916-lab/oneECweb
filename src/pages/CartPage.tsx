import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ProductArt } from "../components/ProductArt";
import { EmptyState, Price } from "../components/UI";
import { useStore } from "../store";
import type { CheckoutInfo, Order } from "../types";

const EMPTY_FORM: CheckoutInfo = {
  name: "",
  email: "",
  phone: "",
  address: "",
  note: "",
};

export function CartPage() {
  const {
    products,
    cart,
    subtotal,
    shipping,
    discount,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
    user,
    notify,
  } = useStore();
  const [step, setStep] = useState<"bag" | "checkout">("bag");
  const [form, setForm] = useState<CheckoutInfo>({
    ...EMPTY_FORM,
    name: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  useEffect(() => {
    document.title = "购物袋｜青屿 QINGYU";
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^1\d{10}$/.test(form.phone)) {
      notify("请检查手机号", "请输入 11 位中国大陆手机号");
      return;
    }
    const order = checkout(form);
    setSubmittedOrder(order);
    setStep("bag");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submittedOrder) {
    return (
      <section className="order-success page-container">
        <div className="order-success__mark">
          <Check size={35} />
        </div>
        <p className="eyebrow">ORDER CONFIRMED</p>
        <h1>你的青屿包裹，<br /><em>正在准备出发。</em></h1>
        <p>
          订单已成功提交。我们会在 48 小时内完成校园包裹打包，
          发货信息将发送至 {submittedOrder.customer.email}。
        </p>
        <div className="order-success__card">
          <div>
            <span>订单编号</span>
            <strong>{submittedOrder.id}</strong>
          </div>
          <div>
            <span>订单金额</span>
            <strong>¥{submittedOrder.total}</strong>
          </div>
          <div>
            <span>收件人</span>
            <strong>{submittedOrder.customer.name}</strong>
          </div>
          <div>
            <span>状态</span>
            <strong className="status-pill">{submittedOrder.status}</strong>
          </div>
        </div>
        <div className="order-success__lines">
          {submittedOrder.lines.map((line) => (
            <div key={line.productId}>
              <ProductArt art={line.art} label={line.name} />
              <span>{line.name} × {line.quantity}</span>
              <strong>¥{line.price * line.quantity}</strong>
            </div>
          ))}
        </div>
        <div className="order-success__actions">
          <Link className="button button--dark" to="/account">
            查看我的订单
            <ArrowRight size={17} />
          </Link>
          <Link className="button button--outline" to="/shop">
            继续逛逛
          </Link>
        </div>
      </section>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="page-container not-found-short">
        <h1 className="sr-only">购物袋</h1>
        <EmptyState
          title="购物袋还空着"
          description="从今天真正需要的那件东西开始。我们的选物不多，但都经得起日常。"
          actionLabel="去逛逛"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="page-container cart-page">
      <nav className="cart-steps" aria-label="结算进度">
        <span className="is-active"><i>1</i>购物袋</span>
        <ChevronRight size={15} />
        <span className={step === "checkout" ? "is-active" : ""}><i>2</i>填写信息</span>
        <ChevronRight size={15} />
        <span><i>3</i>完成</span>
      </nav>

      <div className="cart-page__heading">
        <div>
          <p className="eyebrow">YOUR SELECTION</p>
          <h1>{step === "bag" ? "购物袋" : "确认收货信息"}</h1>
        </div>
        <Link to="/shop" className="back-link">
          <ArrowLeft size={16} />
          继续购物
        </Link>
      </div>

      <div className="cart-layout">
        <div className="cart-content">
          {step === "bag" ? (
            <>
              <div className="cart-table-head">
                <span>商品</span>
                <span>数量</span>
                <span>小计</span>
              </div>
              <div className="cart-lines">
                {cart.map((item) => {
                  const product = products.find(
                    (candidate) => candidate.id === item.productId,
                  );
                  if (!product) return null;
                  return (
                    <article className="cart-line" key={item.productId}>
                      <Link
                        to={`/product/${product.slug}`}
                        className="cart-line__image"
                      >
                        <ProductArt
                          art={product.art}
                          color={product.color}
                          label={product.name}
                        />
                      </Link>
                      <div className="cart-line__info">
                        <span>{product.badge ?? "QINGYU SELECT"}</span>
                        <h2>
                          <Link to={`/product/${product.slug}`}>
                            {product.name}
                          </Link>
                        </h2>
                        <p>{product.summary}</p>
                        <Price value={product.price} />
                      </div>
                      <div className="quantity">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(product.id, item.quantity - 1)
                          }
                          aria-label={`减少 ${product.name} 数量`}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(product.id, item.quantity + 1)
                          }
                          aria-label={`增加 ${product.name} 数量`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <strong className="cart-line__total">
                        ¥{product.price * item.quantity}
                      </strong>
                      <button
                        className="cart-line__remove"
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        aria-label={`移除 ${product.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </article>
                  );
                })}
              </div>
              <div className="cart-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={clearCart}
                >
                  清空购物袋
                </button>
                <span><PackageCheck size={17} /> 商品会使用可回收环保包装</span>
              </div>
            </>
          ) : (
            <form className="checkout-form" id="checkout-form" onSubmit={handleSubmit}>
              <div className="checkout-section-title">
                <span>01</span>
                <div>
                  <h2>收货信息</h2>
                  <p>请填写校园地址或常用收件地址。</p>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  <span>姓名 *</span>
                  <input
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="怎么称呼你"
                  />
                </label>
                <label>
                  <span>邮箱 *</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="用于接收订单通知"
                  />
                </label>
                <label>
                  <span>手机号 *</span>
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="11 位手机号"
                  />
                </label>
                <label className="form-grid__wide">
                  <span>详细地址 *</span>
                  <input
                    required
                    autoComplete="street-address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, address: event.target.value }))
                    }
                    placeholder="学校、宿舍楼、房间号或校外详细地址"
                  />
                </label>
                <label className="form-grid__wide">
                  <span>订单备注</span>
                  <textarea
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="选填，例如希望放在宿舍门口"
                    rows={3}
                  />
                </label>
              </div>
              <div className="checkout-section-title checkout-section-title--payment">
                <span>02</span>
                <div>
                  <h2>支付方式</h2>
                  <p>课程演示不会产生真实扣款。</p>
                </div>
              </div>
              <label className="payment-option">
                <input type="radio" name="payment" defaultChecked />
                <span className="payment-option__check" />
                <span>
                  <strong>模拟在线支付</strong>
                  <small>提交订单即模拟支付成功</small>
                </span>
                <ShieldCheck size={20} />
              </label>
              <button
                className="text-button checkout-back"
                type="button"
                onClick={() => setStep("bag")}
              >
                <ArrowLeft size={15} />
                返回购物袋
              </button>
            </form>
          )}
        </div>

        <aside className="order-summary">
          <div className="order-summary__heading">
            <p className="eyebrow">ORDER SUMMARY</p>
            <ShoppingBag size={21} />
          </div>
          <div className="summary-products">
            {cart.map((item) => {
              const product = products.find(
                (candidate) => candidate.id === item.productId,
              );
              return product ? (
                <div key={item.productId}>
                  <ProductArt
                    art={product.art}
                    color={product.color}
                    label={product.name}
                  />
                  <span>{product.name}<small>× {item.quantity}</small></span>
                  <strong>¥{product.price * item.quantity}</strong>
                </div>
              ) : null;
            })}
          </div>
          <div className="summary-rows">
            <div><span>商品小计</span><span>¥{subtotal}</span></div>
            <div>
              <span>运费</span>
              <span>{shipping === 0 ? "免运费" : `¥${shipping}`}</span>
            </div>
            {discount > 0 && (
              <div className="discount-row">
                <span>满 ¥599 减 ¥40</span>
                <span>-¥{discount}</span>
              </div>
            )}
          </div>
          <div className="summary-total">
            <span>合计</span>
            <Price value={total} large />
          </div>
          <p className="summary-note">
            {shipping === 0
              ? "已享受校园订单免运费"
              : `还差 ¥${299 - subtotal} 可享受免运费`}
          </p>
          {step === "bag" ? (
            <button
              className="button button--dark button--full"
              type="button"
              onClick={() => setStep("checkout")}
            >
              去结算
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              className="button button--dark button--full"
              type="submit"
              form="checkout-form"
            >
              提交订单 ¥{total}
              <ArrowRight size={17} />
            </button>
          )}
          <p className="summary-secure">
            <ShieldCheck size={14} />
            安全结算 · 7 天无理由退换
          </p>
        </aside>
      </div>
    </div>
  );
}
