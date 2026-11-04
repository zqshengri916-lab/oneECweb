# 青屿 QINGYU

面向校园生活方式的现代电商品牌官网。项目包含品牌展示、商品浏览、资讯、校园故事、购物车、模拟结算、账户与运营后台演示。

仅作为学习用途，不会进行任何更新、优化性能或修复可能存在的bug。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址即可。生产构建与检查命令：

```bash
npm run lint
npm run build
npm run preview
```

## 页面

- `/` 品牌首页与主视觉轮播
- `/shop` 商品筛选、搜索和排序
- `/product/:slug` 商品详情
- `/about` 品牌信息
- `/news`、`/article/:slug` 生活志与文章
- `/stories` 校园故事
- `/cart` 购物车、结算与订单成功页
- `/account` 注册、登录、收藏与订单历史
- `/studio` 商品和资讯运营后台演示

## 数据说明

本站是可离线运行的前端高保真演示，不连接真实服务端或支付系统。商品、购物袋、收藏、账户和订单使用 `localStorage` 保存，可通过运营后台的「恢复示例数据」重置商品和资讯。

商品视觉使用原创 SVG 和 CSS 构建，全部资源随项目本地加载，不依赖外部图片或字体服务。

## 技术栈

- React 19
- TypeScript
- Vite
- React Router
- React Context + reducer
- 原生 CSS
- Playwright（浏览器验收、测试）
