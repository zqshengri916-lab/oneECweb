import { ArrowUpRight, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductArt } from "../components/ProductArt";
import { PageHero, Reveal } from "../components/UI";
import { STORIES } from "../data";

export function StoriesPage() {
  const [active, setActive] = useState(0);
  const story = STORIES[active];

  useEffect(() => {
    document.title = "校园故事｜青屿 QINGYU";
  }, []);

  return (
    <>
      <PageHero
        eyebrow="REAL CAMPUS / REAL LIFE"
        title={
          <>
            物件会安静地，
            <br />
            <em>参与我们的生活。</em>
          </>
        }
        description="三张不同的书桌，三种不同的校园节奏。我们没有改写他们的故事，只记录那些被日常使用逐渐改变的小事。"
        aside={
          <div className="stories-hero-mark">
            <span>真实</span>
            <span>校园</span>
            <span>生活</span>
          </div>
        }
      />

      <div className="page-container stories-page">
        <div className="story-selector" role="tablist" aria-label="校园故事">
          {STORIES.map((item, index) => (
            <button
              type="button"
              role="tab"
              key={item.id}
              className={active === index ? "is-active" : ""}
              aria-selected={active === index}
              onClick={() => setActive(index)}
            >
              <span>{item.kicker}</span>
              <strong>{item.author}</strong>
              <small>{item.school}</small>
            </button>
          ))}
        </div>

        <Reveal className="story-feature" key={story.id}>
          <div className="story-feature__visual">
            <ProductArt
              art={story.art}
              color={story.color}
              label={`${story.title} 场景插画`}
            />
            <span className="story-feature__number">0{active + 1}</span>
            <span className="story-feature__location">CAMPUS / HANGZHOU</span>
          </div>
          <div className="story-feature__copy">
            <p className="eyebrow">{story.kicker}</p>
            <h2>{story.title}</h2>
            <p>{story.excerpt}</p>
            <blockquote>
              <Quote size={24} />
              {story.quote}
            </blockquote>
            <div>
              <strong>{story.author}</strong>
              <span>{story.school}</span>
            </div>
          </div>
        </Reveal>

        <Reveal className="story-notes">
          <div>
            <p className="eyebrow">FIELD NOTES / 01</p>
            <h2>我们如何记录</h2>
          </div>
          <div className="story-notes__grid">
            <article>
              <span>01</span>
              <h3>不布置“样板间”</h3>
              <p>场景来自真实生活，而不是为了展示产品重新搭建的完美书桌。</p>
            </article>
            <article>
              <span>02</span>
              <h3>不只谈喜欢</h3>
              <p>我们同样关心重量、噪声、清洁方式和长期使用后的磨损。</p>
            </article>
            <article>
              <span>03</span>
              <h3>保留不同答案</h3>
              <p>同一件物件进入不同生活，会得到不同评价。我们如实保留。</p>
            </article>
          </div>
        </Reveal>

        <Reveal className="story-cta">
          <div>
            <p className="eyebrow">YOUR STORY MATTERS</p>
            <h2>你的校园角落，<br />是什么样子？</h2>
          </div>
          <a href="mailto:stories@qingyu.example" className="button button--light">
            分享你的故事
            <ArrowUpRight size={17} />
          </a>
        </Reveal>
      </div>
    </>
  );
}
