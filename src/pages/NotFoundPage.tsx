import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "页面未找到｜青屿 QINGYU";
  }, []);

  return (
    <section className="not-found page-container">
      <p className="eyebrow">404 / LOST ON THE ISLAND</p>
      <h1>这座小岛<br />还没有这条路。</h1>
      <p>也许链接已经改变，或者你只是偶然走到了这里。</p>
      <Link className="button button--dark" to="/">
        <ArrowLeft size={17} />
        回到首页
      </Link>
      <div className="not-found__sun" aria-hidden="true">Q</div>
    </section>
  );
}
