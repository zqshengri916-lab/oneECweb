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

interface StoreState {
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  favorites: string[];
  catalog: Catalog;
}

interface BootstrapPayload extends Catalog {
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  favorites: string[];
}

type StoreAction =
  | { type: "HYDRATE"; payload: BootstrapPayload }
  | { type: "SET_CART"; cart: CartItem[] }
  | { type: "SET_USER"; user: User | null }
  | { type: "SET_FAVORITES"; favorites: string[] }
  | { type: "ADD_ORDER"; order: Order }
  | { type: "UPSERT_PRODUCT"; product: Product }
  | { type: "DELETE_PRODUCT"; productId: string }
  | { type: "UPSERT_ARTICLE"; article: NewsArticle }
  | { type: "DELETE_ARTICLE"; articleId: string }
  | { type: "SET_CATALOG"; catalog: Catalog };

const INITIAL_STATE: StoreState = {
  cart: [],
  user: null,
  orders: [],
  favorites: [],
  catalog: DEFAULT_CATALOG,
};

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "HYDRATE":
      return {
        cart: action.payload.cart,
        user: action.payload.user,
        orders: action.payload.orders,
        favorites: action.payload.favorites,
        catalog: {
          products: action.payload.products,
          articles: action.payload.articles,
        },
      };
    case "SET_CART":
      return { ...state, cart: action.cart };
    case "SET_USER":
      return { ...state, user: action.user };
    case "SET_FAVORITES":
      return { ...state, favorites: action.favorites };
    case "ADD_ORDER":
      return {
        ...state,
        cart: [],
        orders: [action.order, ...state.orders],
        catalog: {
          ...state.catalog,
          products: state.catalog.products.map((product) => {
            const line = action.order.lines.find(
              (item) => item.productId === product.id,
            );
            return line
              ? {
                  ...product,
                  inventory: Math.max(0, product.inventory - line.quantity),
                }
              : product;
          }),
        },
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
    case "SET_CATALOG":
      return { ...state, catalog: action.catalog };
    default:
      return state;
  }
}

export type DatabaseStatus = "connecting" | "connected" | "error";

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
  databaseStatus: DatabaseStatus;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<string | null>;
  logout: () => Promise<void>;
  checkout: (customer: CheckoutInfo) => Promise<Order | null>;
  upsertProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  upsertArticle: (article: NewsArticle) => Promise<boolean>;
  deleteArticle: (articleId: string) => Promise<boolean>;
  resetCatalog: () => Promise<boolean>;
  notify: (title: string, detail?: string) => void;
  removeToast: (id: number) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "请求数据库失败";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || `请求失败（${response.status}）`);
  }
  return payload as T;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [databaseStatus, setDatabaseStatus] =
    useState<DatabaseStatus>("connecting");
  const [isLoading, setIsLoading] = useState(true);
  const toastCounter = useRef(0);

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

  const loadBootstrap = useCallback(async () => {
    try {
      const payload = await request<BootstrapPayload>("/api/bootstrap");
      dispatch({ type: "HYDRATE", payload });
      setDatabaseStatus("connected");
    } catch (error) {
      setDatabaseStatus("error");
      notify("数据库连接失败", errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

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

  const setCart = useCallback((cart: CartItem[]) => {
    dispatch({ type: "SET_CART", cart });
  }, []);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      const existing = state.cart.find(
        (item) => item.productId === productId,
      );
      const nextQuantity = Math.min(10, (existing?.quantity ?? 0) + quantity);
      try {
        const payload = await request<{ cart: CartItem[] }>(
          `/api/cart/${encodeURIComponent(productId)}`,
          {
            method: "PUT",
            body: JSON.stringify({ quantity: nextQuantity }),
          },
        );
        setCart(payload.cart);
      } catch (error) {
        notify("加入购物袋失败", errorMessage(error));
      }
    },
    [notify, setCart, state.cart],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      try {
        const payload = await request<{ cart: CartItem[] }>(
          `/api/cart/${encodeURIComponent(productId)}`,
          {
            method: "PUT",
            body: JSON.stringify({
              quantity: Math.max(0, Math.min(10, quantity)),
            }),
          },
        );
        setCart(payload.cart);
      } catch (error) {
        notify("数量更新失败", errorMessage(error));
      }
    },
    [notify, setCart],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      try {
        const payload = await request<{ cart: CartItem[] }>(
          `/api/cart/${encodeURIComponent(productId)}`,
          { method: "DELETE" },
        );
        setCart(payload.cart);
      } catch (error) {
        notify("移除商品失败", errorMessage(error));
      }
    },
    [notify, setCart],
  );

  const clearCart = useCallback(async () => {
    try {
      await request<{ cart: CartItem[] }>("/api/cart", { method: "DELETE" });
      setCart([]);
    } catch (error) {
      notify("清空购物袋失败", errorMessage(error));
    }
  }, [notify, setCart]);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const isFavorite = state.favorites.includes(productId);
      try {
        const payload = await request<{ favorites: string[] }>(
          `/api/favorites/${encodeURIComponent(productId)}`,
          { method: isFavorite ? "DELETE" : "PUT" },
        );
        dispatch({ type: "SET_FAVORITES", favorites: payload.favorites });
      } catch (error) {
        notify("收藏操作失败", errorMessage(error));
      }
    },
    [notify, state.favorites],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await request<{ user: User }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        await loadBootstrap();
        notify("欢迎回来", "你的账户数据已从数据库恢复");
        return null;
      } catch (error) {
        return errorMessage(error);
      }
    },
    [loadBootstrap, notify],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        await request<{ user: User }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        await loadBootstrap();
        notify("账户创建成功", "欢迎加入青屿校园计划");
        return null;
      } catch (error) {
        return errorMessage(error);
      }
    },
    [loadBootstrap, notify],
  );

  const logout = useCallback(async () => {
    try {
      await request<{ user: null }>("/api/auth/logout", { method: "POST" });
      await loadBootstrap();
      notify("已安全退出");
    } catch (error) {
      notify("退出失败", errorMessage(error));
    }
  }, [loadBootstrap, notify]);

  const checkout = useCallback(
    async (customer: CheckoutInfo) => {
      try {
        const order = await request<Order>("/api/orders", {
          method: "POST",
          body: JSON.stringify(customer),
        });
        dispatch({ type: "ADD_ORDER", order });
        notify("订单提交成功", `订单号 ${order.id}`);
        return order;
      } catch (error) {
        notify("订单提交失败", errorMessage(error));
        return null;
      }
    },
    [notify],
  );

  const upsertProduct = useCallback(
    async (product: Product) => {
      try {
        const payload = await request<{ product: Product }>(
          "/api/admin/products",
          {
            method: "PUT",
            body: JSON.stringify(product),
          },
        );
        dispatch({ type: "UPSERT_PRODUCT", product: payload.product });
        return true;
      } catch (error) {
        notify("保存商品失败", errorMessage(error));
        return false;
      }
    },
    [notify],
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      try {
        await request<{ deleted: string }>(
          `/api/admin/products/${encodeURIComponent(productId)}`,
          { method: "DELETE" },
        );
        dispatch({ type: "DELETE_PRODUCT", productId });
        return true;
      } catch (error) {
        notify("删除商品失败", errorMessage(error));
        return false;
      }
    },
    [notify],
  );

  const upsertArticle = useCallback(
    async (article: NewsArticle) => {
      try {
        const payload = await request<{ article: NewsArticle }>(
          "/api/admin/articles",
          {
            method: "PUT",
            body: JSON.stringify(article),
          },
        );
        dispatch({ type: "UPSERT_ARTICLE", article: payload.article });
        return true;
      } catch (error) {
        notify("保存文章失败", errorMessage(error));
        return false;
      }
    },
    [notify],
  );

  const deleteArticle = useCallback(
    async (articleId: string) => {
      try {
        await request<{ deleted: string }>(
          `/api/admin/articles/${encodeURIComponent(articleId)}`,
          { method: "DELETE" },
        );
        dispatch({ type: "DELETE_ARTICLE", articleId });
        return true;
      } catch (error) {
        notify("删除文章失败", errorMessage(error));
        return false;
      }
    },
    [notify],
  );

  const resetCatalog = useCallback(async () => {
    try {
      await request<{ ok: true }>("/api/admin/reset", { method: "POST" });
      const payload = await request<BootstrapPayload>("/api/bootstrap");
      dispatch({ type: "SET_CATALOG", catalog: payload });
      dispatch({ type: "SET_CART", cart: payload.cart });
      dispatch({ type: "SET_FAVORITES", favorites: payload.favorites });
      setDatabaseStatus("connected");
      return true;
    } catch (error) {
      notify("恢复示例数据失败", errorMessage(error));
      return false;
    }
  }, [notify]);

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
      databaseStatus,
      isLoading,
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
      databaseStatus,
      deleteArticle,
      deleteProduct,
      discount,
      isLoading,
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
