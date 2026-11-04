import { ArrowRight, Mail, MapPin } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ProductArt } from "../components/ProductArt";
import { PageHero, Reveal, SectionHeading } from "../components/UI";

const VALUES = [
  {
    number: "01",
    title: "从真实生活出发",
    description:
      "我们不从趋势报告开始选品，而是走进宿舍、教室和校园小路，观察那些每天真正发生的小问题。",
  },
  {
    number: "02",
    title: "让设计退后一步",
    description:
      "好设计不需要时刻提醒你它的存在。它应该顺手、耐看，在长期使用里慢慢成为生活的一部分。",
  },
  {
    number: "03",
    title: "诚实说明选择",
    description:
      "我们展示材质、尺寸和使用边界，也认真说出产品不擅长的地方。清楚的信息，是信任的起点。",
  },
];

const TIMELINE = [
  {
    year: "2023",
    title: "从一个宿舍问题开始",
    description: "创始团队在 1.2 米的宿舍书桌旁，完成第一份校园生活物件观察。",
  },
  {
    year: "2024",
    title: "第一场校园试用",
    description: "与 6 所高校的 120 位同学一起，测试阅读灯和降噪耳机的真实使用表现。",
  },
  {
    year: "2025",
    title: "青屿选物正式上线",
    description: "首个包含 12 件商品的校园生活系列发布，坚持小批量、长期迭代。",
  },
  {
    year: "2026",
    title: "把个人桌面带到线下",
    description: "第一间校园快闪空间开放，让每个物件都能被摸到、试到、真正使用。",
  },
];

export function AboutPage() {
  useEffect(() => {
    document.title = "关于青屿｜把校园生活过得更有质感";
  }, []);

  return (
    <>
      <PageHero
        eyebrow="ABOUT QINGYU / SINCE 2023"
        title={
          <>
            我们相信，
            <br />
            <em>日常值得被认真对待。</em>
          </>
        }
        description="青屿是一个为校园生活而生的生活方式品牌。我们选择克制的设计、耐用的材料和真正解决问题的小物，让每一个普通日子都更顺手一点。"
        aside={
          <div className="about-hero-art">
            <span className="about-hero-art__ring" />
            <ProductArt art="notebook" color="#617660" label="青屿校园生活手账" />
            <p>SMALL THINGS<br />BIG DAYS</p>
          </div>
        }
      />

      <section className="about-intro page-container">
        <div className="about-intro__statement">
          <span>OUR BELIEF</span>
          <h2>
            生活不是等待
            <br />
            某个更好的以后。
          </h2>
        </div>
        <div className="about-intro__copy">
          <p>
            它发生在今天早八前匆忙的一杯咖啡里，发生在宿舍桌上摊开的笔记里，也发生在晚自习结束后走过的那条小路里。
          </p>
          <p>
            青屿希望做的，是为这些真实的日常，找到一些更合适的伙伴。不夸张，不囤积，不追逐短暂的新鲜感。
          </p>
          <Link to="/shop" className="text-link">
            看看我们选了哪些东西
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Reveal className="about-image-band">
        <div className="about-image-band__copy">
          <p className="eyebrow">CAMPUS IS OUR STUDIO</p>
          <h2>校园不是缩小版的社会，<br />它有自己真实的生活逻辑。</h2>
        </div>
        <div className="about-image-band__composition">
          <div>
            <ProductArt art="lamp" color="#c66c4c" label="阅读灯场景" />
          </div>
          <div>
            <ProductArt art="bag" color="#765b43" label="通勤包场景" />
          </div>
          <span>Made for<br />real days.</span>
        </div>
      </Reveal>

      <div className="page-container">
        <Reveal className="values-section">
          <SectionHeading
            eyebrow="HOW WE CHOOSE"
            title={
              <>
                我们的选择，
                <br />
                <em>从三条原则开始。</em>
              </>
            }
          />
          <div className="values-grid">
            {VALUES.map((value) => (
              <article key={value.number}>
                <span>{value.number}</span>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal className="timeline-section">
          <SectionHeading eyebrow="OUR JOURNEY" title="一路走来" />
          <div className="timeline">
            {TIMELINE.map((item) => (
              <div className="timeline__item" key={item.year}>
                <span>{item.year}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal className="about-numbers">
        <div>
          <span>12</span>
          <p>所高校真实测试</p>
        </div>
        <div>
          <span>2,400+</span>
          <p>条校园使用反馈</p>
        </div>
        <div>
          <span>24</span>
          <p>周平均使用周期</p>
        </div>
        <div>
          <span>92%</span>
          <p>愿意再次推荐</p>
        </div>
      </Reveal>

      <section className="about-contact page-container" id="contact">
        <div>
          <p className="eyebrow">COME SAY HI</p>
          <h2>想聊聊一件好物，<br />或一个真实的问题？</h2>
        </div>
        <div className="about-contact__details">
          <p>
            我们很愿意听见来自校园的真实反馈。产品使用问题、合作建议，或者只是想分享你的书桌，都欢迎写信给我们。
          </p>
          <a href="mailto:hello@qingyu.example">
            <Mail size={18} />
            hello@qingyu.example
          </a>
          <span>
            <MapPin size={18} />
            杭州 · 大学城 · 青屿快闪空间
          </span>
          <small>周一至周五 10:00 - 18:00</small>
        </div>
      </section>
    </>
  );
}
