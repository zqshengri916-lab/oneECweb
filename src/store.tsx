/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_CATALOG } from "./data";
import type {
  CartItem,
  Catalog,
  CheckoutInfo,
  NewsArticle,
  Order,
  Product,
  ToastMessage,
  User,
} from "./types";

const STORAGE = {
  cart: "qingyu.cart.v1",
  user: "qingyu.user.v1",
  orders: "qingyu.orders.v1",
  favorites: "qingyu.favorites.v1",
  catalog: "qingyu.catalog.v1",
};

interface StoreState {
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  favorites: string[];
  catalog: Catalog;
}

type StoreAction =
  | { type: "ADD_TO_CART"; productId: string; quantity: number }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "CLEAR_CART" }
  | { type: "SET_USER"; user: User | null }
  | { type: "TOGGLE_FAVORITE"; productId: string }
  | { type: "ADD_ORDER"; order: Order }
  | { type: "UPSERT_PRODUCT"; product: Product }
  | { type: "DELETE_PRODUCT"; productId: string }
  | { type: "UPSERT_ARTICLE"; article: NewsArticle }
  | { type: "DELETE_ARTICLE"; articleId: string }
  | { type: "RESET_CATALOG" };

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function cloneCatalog(): Catalog {
  return JSON.parse(JSON.stringify(DEFAULT_CATALOG)) as Catalog;
}

function createInitialState(): StoreState {
  const fallbackCatalog = cloneCatalog();
  const catalog = readStorage<Catalog>(STORAGE.catalog, fallbackCatalog);
  return {
    cart: readStorage<CartItem[]>(STORAGE.cart, []),
    user: readStorage<User | null>(STORAGE.user, null),
    orders: readStorage<Order[]>(STORAGE.orders, []),
    favorites: readStorage<string[]>(STORAGE.favorites, []),
    catalog:
      Array.isArray(catalog.products) && Array.isArray(catalog.articles)
        ? catalog
        : fallbackCatalog,
  };
}

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existing = state.cart.find(
        (item) => item.productId === action.productId,
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.productId === action.productId
              ? {
                  ...item,
                  quantity: Math.min(10, item.quantity + action.quantity),
                }
              : item,
          ),
        };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            productId: action.productId,
            quantity: Math.min(10, Math.max(1, action.quantity)),
          },
        ],
      };
    }
    case "UPDATE_QUANTITY":
      return {
        ...state,
        cart:
          action.quantity <= 0
            ? state.cart.filter(
                (item) => item.productId !== action.productId,
              )
            : state.cart.map((item) =>
                item.productId === action.productId
                  ? { ...item, quantity: Math.min(10, action.quantity) }
                  : item,
              ),
      };
    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter(
          (item) => item.productId !== action.productId,
        ),
      };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "SET_USER":
      return { ...state, user: action.user };
    case "TOGGLE_FAVORITE":
      return {
        ...state,
        favorites: state.favorites.includes(action.productId)
          ? state.favorites.filter((id) => id !== action.productId)
          : [...state.favorites, action.productId],
      };
    case "ADD_ORDER":
      return {
        ...state,
        orders: [action.order, ...state.orders],
        cart: [],
      };
    case "UPSERT_PRODUCT": {
      const exists = state.catalog.products.some(
        (product) => product.id === action.product.id,
      );
      return {
        ...state,
        catalog: {
          ...state.catalog,
          products: exists
            ? state.catalog.products.map((product) =>
                product.id === action.product.id ? action.product : product,
              )
            : [action.product, ...state.catalog.products],
        },
      };
    }
    case "DELETE_PRODUCT":
      return {
        ...state,
        cart: state.cart.filter(
          (item) => item.productId !== action.productId,
        ),
        favorites: state.favorites.filter(
          (productId) => productId !== action.productId,
        ),
        catalog: {
          ...state.catalog,
          products: state.catalog.products.filter(
            (product) => product.id !== action.productId,
          ),
        },
      };
    case "UPSERT_ARTICLE": {
      const exists = state.catalog.articles.some(
        (article) => article.id === action.article.id,
      );
      return {
        ...state,
        catalog: {
          ...state.catalog,
          articles: exists
            ? state.catalog.articles.map((article) =>
                article.id === action.article.id ? action.article : article,
              )
            : [action.article, ...state.catalog.articles],
        },
      };
    }
    case "DELETE_ARTICLE":
      return {
        ...state,
        catalog: {
          ...state.catalog,
          articles: state.catalog.articles.filter(
            (article) => article.id !== action.articleId,
          ),
        },
      };
    case "RESET_CATALOG":
      return { ...state, catalog: cloneCatalog() };
    default:
      return state;
  }
}

interface StoreContextValue {
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  favorites: string[];
  products: Product[];
  articles: NewsArticle[];
  cartCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  toasts: ToastMessage[];
  addToCart: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  checkout: (customer: CheckoutInfo) => Order;
  upsertProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  upsertArticle: (article: NewsArticle) => void;
  deleteArticle: (articleId: string) => void;
  resetCatalog: () => void;
  notify: (title: string, detail?: string) => void;
  removeToast: (id: number) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastCounter = useRef(0);

  useEffect(() => {
    window.localStorage.setItem(STORAGE.cart, JSON.stringify(state.cart));
  }, [state.cart]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE.user, JSON.stringify(state.user));
  }, [state.user]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE.orders, JSON.stringify(state.orders));
  }, [state.orders]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE.favorites,
      JSON.stringify(state.favorites),
    );
  }, [state.favorites]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE.catalog,
      JSON.stringify(state.catalog),
    );
  }, [state.catalog]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (title: string, detail?: string) => {
      toastCounter.current += 1;
      const id = toastCounter.current;
      setToasts((current) => [...current.slice(-2), { id, title, detail }]);
      window.setTimeout(() => removeToast(id), 3600);
    },
    [removeToast],
  );

  const cartCount = state.cart.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const subtotal = state.cart.reduce((sum, item) => {
    const product = state.catalog.products.find(
      (candidate) => candidate.id === item.productId,
    );
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);
  const shipping = subtotal === 0 || subtotal >= 299 ? 0 : 18;
  const discount = subtotal >= 599 ? 40 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    dispatch({ type: "ADD_TO_CART", productId, quantity });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_FROM_CART", productId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    dispatch({ type: "TOGGLE_FAVORITE", productId });
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      if (!email.includes("@") || password.length < 6) return false;
      const name = email.split("@")[0];
      dispatch({
        type: "SET_USER",
        user: {
          id: `u-${email}`,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          email,
          joinedAt: new Date().toISOString(),
        },
      });
      notify("欢迎回来", "你的青屿账户已登录");
      return true;
    },
    [notify],
  );

  const register = useCallback(
    (name: string, email: string, password: string) => {
      if (!name.trim() || !email.includes("@") || password.length < 6) {
        return false;
      }
      dispatch({
        type: "SET_USER",
        user: {
          id: `u-${Date.now()}`,
          name: name.trim(),
          email,
          joinedAt: new Date().toISOString(),
        },
      });
      notify("账户创建成功", "欢迎加入青屿校园计划");
      return true;
    },
    [notify],
  );

  const logout = useCallback(() => {
    dispatch({ type: "SET_USER", user: null });
    notify("已安全退出");
  }, [notify]);

  const checkout = useCallback(
    (customer: CheckoutInfo) => {
      const order: Order = {
        id: `QY${Date.now().toString().slice(-9)}`,
        lines: state.cart.flatMap((item) => {
          const product = state.catalog.products.find(
            (candidate) => candidate.id === item.productId,
          );
          return product
            ? [
                {
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  quantity: item.quantity,
                  art: product.art,
                },
              ]
            : [];
        }),
        subtotal,
        shipping,
        discount,
        total,
        status: "已确认",
        customer,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_ORDER", order });
      notify("订单提交成功", `订单号 ${order.id}`);
      return order;
    },
    [discount, notify, shipping, state.cart, state.catalog.products, subtotal, total],
  );

  const upsertProduct = useCallback((product: Product) => {
    dispatch({ type: "UPSERT_PRODUCT", product });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    dispatch({ type: "DELETE_PRODUCT", productId });
  }, []);

  const upsertArticle = useCallback((article: NewsArticle) => {
    dispatch({ type: "UPSERT_ARTICLE", article });
  }, []);

  const deleteArticle = useCallback((articleId: string) => {
    dispatch({ type: "DELETE_ARTICLE", articleId });
  }, []);

  const resetCatalog = useCallback(() => {
    dispatch({ type: "RESET_CATALOG" });
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      cart: state.cart,
      user: state.user,
      orders: state.orders,
      favorites: state.favorites,
      products: state.catalog.products,
      articles: state.catalog.articles,
      cartCount,
      subtotal,
      shipping,
      discount,
      total,
      toasts,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleFavorite,
      login,
      register,
      logout,
      checkout,
      upsertProduct,
      deleteProduct,
      upsertArticle,
      deleteArticle,
      resetCatalog,
      notify,
      removeToast,
    }),
    [
      addToCart,
      cartCount,
      checkout,
      clearCart,
      deleteArticle,
      deleteProduct,
      discount,
      login,
      logout,
      notify,
      register,
      removeFromCart,
      removeToast,
      resetCatalog,
      shipping,
      state.cart,
      state.catalog.articles,
      state.catalog.products,
      state.favorites,
      state.orders,
      state.user,
      subtotal,
      toasts,
      toggleFavorite,
      total,
      updateQuantity,
      upsertArticle,
      upsertProduct,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
}
