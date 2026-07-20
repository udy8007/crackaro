import { useEffect, useRef, useState } from "react";
import {
  armSkyshotIntroOnGesture,
  playSkyshotIntro,
  preloadSkyshotSound,
  stopSkyshotIntro,
} from "../../utils/skyshotSound";

const SHINCHAN_FRAMES = [
  "/images/shinchan-cut-1.png?v=2",
  "/images/shinchan-cut-2.png?v=2",
  "/images/shinchan-cut-3.png?v=2",
  "/images/shinchan-cut-4.png?v=2",
];

export default function Hero() {
  const heroRef = useRef(null);
  const [frame, setFrame] = useState(0);

  // Snappy anime flipbook (~6 fps hard cuts)
  useEffect(() => {
    SHINCHAN_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const id = window.setInterval(() => {
      setFrame((n) => (n + 1) % SHINCHAN_FRAMES.length);
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    let disposeGesture = () => {};
    let visible = true;
    let leaveTimer = 0;

    preloadSkyshotSound();

    const armUnlock = () => {
      disposeGesture();
      disposeGesture = armSkyshotIntroOnGesture();
    };

    armUnlock();
    playSkyshotIntro();

    const onHeroPointer = () => {
      playSkyshotIntro();
    };
    el.addEventListener("pointerdown", onHeroPointer, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting && entry.intersectionRatio >= 0.08;

        if (nowVisible) {
          if (leaveTimer) {
            window.clearTimeout(leaveTimer);
            leaveTimer = 0;
          }
          if (!visible) {
            visible = true;
            armUnlock();
            playSkyshotIntro();
          }
          return;
        }

        if (visible && !leaveTimer) {
          leaveTimer = window.setTimeout(() => {
            leaveTimer = 0;
            visible = false;
            disposeGesture();
            disposeGesture = () => {};
            stopSkyshotIntro(false);
          }, 400);
        }
      },
      { threshold: [0, 0.08, 0.25, 0.5] }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (leaveTimer) window.clearTimeout(leaveTimer);
      disposeGesture();
      el.removeEventListener("pointerdown", onHeroPointer);
    };
  }, []);

  return (
    <>
<section className="hero" id="home" ref={heroRef}>
      {/* Top sky fill — celebration scene, bursts, garland */}
      <div className="hero-top-sky" aria-hidden="true">
        <div className="hero-top-glow"></div>
        <div className="hero-sky-burst hero-sky-burst--center"></div>
        <div className="hero-sky-burst hero-sky-burst--left"></div>
        <div className="hero-sky-burst hero-sky-burst--right"></div>
        <div className="hero-sky-burst hero-sky-burst--mid"></div>
        <div className="hero-garland">
          <span className="hero-garland__wire"></span>
          <span className="hero-lamp hero-lamp--1"><i className="fa-solid fa-lightbulb"></i></span>
          <span className="hero-lamp hero-lamp--2"><i className="fa-solid fa-lightbulb"></i></span>
          <span className="hero-lamp hero-lamp--3"><i className="fa-solid fa-lightbulb"></i></span>
          <span className="hero-lamp hero-lamp--4"><i className="fa-solid fa-lightbulb"></i></span>
          <span className="hero-lamp hero-lamp--5"><i className="fa-solid fa-lightbulb"></i></span>
          <span className="hero-lamp hero-lamp--6"><i className="fa-solid fa-lightbulb"></i></span>
          <span className="hero-lamp hero-lamp--7"><i className="fa-solid fa-lightbulb"></i></span>
        </div>
        <div className="hero-top-sparks">
          <span></span><span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>

        {/* Shinchan-style anime GIF celebration — blends with cream sky */}
        <div className="hero-celeb">
          <div className="celeb-sky">
            <span className="celeb-rocket celeb-rocket--1"><i></i><b></b></span>
            <span className="celeb-rocket celeb-rocket--2"><i></i><b></b></span>
            <span className="celeb-rocket celeb-rocket--3"><i></i><b></b></span>
            <span className="celeb-bloom celeb-bloom--1"></span>
            <span className="celeb-bloom celeb-bloom--2"></span>
            <span className="celeb-bloom celeb-bloom--3"></span>
            <span className="celeb-ember"></span><span className="celeb-ember"></span>
            <span className="celeb-ember"></span><span className="celeb-ember"></span>
            <span className="celeb-ember"></span><span className="celeb-ember"></span>
            <span className="celeb-ember"></span><span className="celeb-ember"></span>
          </div>

          <div className="celeb-stage">
            <div className="celeb-cast celeb-cast--flip" aria-hidden="true">
              <img
                className="celeb-cast__frame"
                src={SHINCHAN_FRAMES[frame]}
                alt=""
                width="420"
                height="480"
                decoding="async"
                draggable="false"
              />
            </div>

            <div className="celeb-spark-spray celeb-spark-spray--dad">
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
            <div className="celeb-spark-spray celeb-spark-spray--mom">
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
            <div className="celeb-spark-spray celeb-spark-spray--girl">
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
            <div className="celeb-launch">
              <span className="celeb-launch__rocket"></span>
              <span className="celeb-launch__trail"></span>
              <span className="celeb-launch__pop"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Rocket blossoms across full hero — empty gaps around copy + cartoon */}
      <div className="hero-side-skyshots" aria-hidden="true">
        <span className="side-shot side-shot--left-a">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom"></em>
        </span>
        <span className="side-shot side-shot--left-b">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom side-shot__bloom--pink"></em>
        </span>
        <span className="side-shot side-shot--left-c">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom side-shot__bloom--orange"></em>
        </span>
        <span className="side-shot side-shot--right-a">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom side-shot__bloom--orange"></em>
        </span>
        <span className="side-shot side-shot--right-b">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom side-shot__bloom--violet"></em>
        </span>
        <span className="side-shot side-shot--right-c">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom"></em>
        </span>
        <span className="side-shot side-shot--mid-l">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom side-shot__bloom--pink"></em>
        </span>
        <span className="side-shot side-shot--mid-c">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom"></em>
        </span>
        <span className="side-shot side-shot--mid-r">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom side-shot__bloom--violet"></em>
        </span>
        <span className="side-shot side-shot--top-l">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom side-shot__bloom--orange"></em>
        </span>
        <span className="side-shot side-shot--low-l">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom"></em>
        </span>
        <span className="side-shot side-shot--low-r">
          <i className="side-shot__rocket"></i>
          <b className="side-shot__trail"></b>
          <em className="side-shot__bloom side-shot__bloom--pink"></em>
        </span>
      </div>

      <div className="hero-sparkles" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span>
      </div>
      <div className="hero-lanterns hero-lanterns--legacy" aria-hidden="true">
        <i className="fa-solid fa-lightbulb"></i>
        <i className="fa-solid fa-lightbulb"></i>
        <i className="fa-solid fa-lightbulb"></i>
      </div>

      {/* Mobile-only festive sky — skyshots & blooms (extra decor, desktop unchanged) */}
      <div className="hero-mobile-festive" aria-hidden="true">
        <span className="m-sky m-sky--1"><i></i><b></b></span>
        <span className="m-sky m-sky--2"><i></i><b></b></span>
        <span className="m-sky m-sky--3"><i></i><b></b></span>
        <span className="m-sky m-sky--4"><i></i><b></b></span>
        <span className="m-bloom m-bloom--1"></span>
        <span className="m-bloom m-bloom--2"></span>
        <span className="m-bloom m-bloom--3"></span>
        <span className="m-bloom m-bloom--4"></span>
        <span className="m-spark"></span>
        <span className="m-spark"></span>
        <span className="m-spark"></span>
        <span className="m-spark"></span>
        <span className="m-spark"></span>
        <span className="m-spark"></span>
        <span className="m-spark"></span>
        <span className="m-spark"></span>
        <span className="m-mortar m-mortar--left"></span>
        <span className="m-mortar m-mortar--right"></span>
      </div>

      {/* Cracker decorations — pure CSS, no external images */}
      <div className="hero-deco" aria-hidden="true">
        <div className="hero-burst hero-burst--1"></div>
        <div className="hero-burst hero-burst--2"></div>
        <div className="hero-burst hero-burst--3"></div>

        <figure className="hero-float hero-float--rocket">
          <div className="c-cracker c-cracker--rocket c-cracker--lg">
            <span className="c-cracker__spark"></span>
            <span className="c-cracker__fuse"></span>
            <span className="c-cracker__nose"></span>
            <span className="c-cracker__body"></span>
            <span className="c-cracker__fins"></span>
          </div>
          <span className="hero-deco-shadow"></span>
        </figure>

        <figure className="hero-float hero-float--skyshot-launch">
          <div className="skyshot-launch">
            <span className="skyshot-launch__trail"></span>
            <span className="skyshot-launch__burst"></span>
            <div className="c-cracker c-cracker--rocket c-cracker--md">
              <span className="c-cracker__spark"></span>
              <span className="c-cracker__fuse"></span>
              <span className="c-cracker__nose"></span>
              <span className="c-cracker__body"></span>
              <span className="c-cracker__fins"></span>
            </div>
          </div>
          <span className="hero-deco-shadow"></span>
        </figure>

        <figure className="hero-float hero-float--chakri">
          <div className="c-cracker c-cracker--chakri">
            <span className="c-cracker__wheel"></span>
            <span className="c-cracker__hub"></span>
          </div>
          <span className="hero-deco-shadow"></span>
        </figure>

        <figure className="hero-float hero-float--gift">
          <div className="c-cracker c-cracker--gift">
            <span className="c-cracker__bow"></span>
            <span className="c-cracker__gift-box"></span>
          </div>
          <span className="hero-deco-shadow"></span>
        </figure>

        <div className="hero-spark-trails">
          <span className="hero-trail hero-trail--1"></span>
          <span className="hero-trail hero-trail--2"></span>
          <span className="hero-trail hero-trail--3"></span>
        </div>
      </div>

      <div className="container hero-inner">
        <div className="hero-content">
          <p className="eyebrow"><i className="fa-solid fa-star"></i> Sivakasi Festival Collection</p>
          <h1>Make every celebration <span className="text-gradient">truly memorable</span></h1>
          <p className="hero-text">
            Discover carefully selected crackers, elegant gift boxes, and celebration packs — authentic Sivakasi quality for homes, weddings, and special events.
          </p>
          <div className="hero-cta">
            <a href="#products" className="btn btn-primary btn-lg">
              <i className="fa-solid fa-bag-shopping"></i> Browse Products
            </a>
          </div>
          <div className="hero-meta">
            <div>
              <strong>500+</strong>
              <span>Product varieties</span>
            </div>
            <div>
              <strong>25+</strong>
              <span>Years experience</span>
            </div>
            <div>
              <strong>50k+</strong>
              <span>Happy customers</span>
            </div>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-orbit">
            <figure className="hero-orbit-item hero-orbit-item--skyshot">
              <div className="skyshot-launch skyshot-launch--orbit">
                <span className="skyshot-launch__trail"></span>
                <span className="skyshot-launch__burst"></span>
                <div className="c-cracker c-cracker--rocket c-cracker--sm">
                  <span className="c-cracker__spark"></span>
                  <span className="c-cracker__fuse"></span>
                  <span className="c-cracker__nose"></span>
                  <span className="c-cracker__body"></span>
                  <span className="c-cracker__fins"></span>
                </div>
              </div>
              <span className="hero-deco-shadow hero-deco-shadow--sm"></span>
            </figure>
            <figure className="hero-orbit-item hero-orbit-item--chakri">
              <div className="c-cracker c-cracker--chakri c-cracker--sm">
                <span className="c-cracker__wheel"></span>
                <span className="c-cracker__hub"></span>
              </div>
              <span className="hero-deco-shadow hero-deco-shadow--sm"></span>
            </figure>
          </div>
          <div className="hero-panel">
            <div className="hero-badge"><i className="fa-solid fa-crown"></i> Curated Celebration Collection</div>
            <div className="hero-showcase">
              <div className="hero-product-grid">
                <div className="hero-mini hero-mini--sparkler">
                  <span className="hero-mini__sparks">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </span>
                  <span className="hero-mini__label">Golden Sparklers</span>
                </div>
                <div className="hero-mini hero-mini--gift hero-mini--featured">
                  <span className="hero-mini__ribbon"></span>
                  <span className="hero-mini__icon">
                    <i className="fa-solid fa-gift"></i>
                  </span>
                  <span className="hero-mini__label">Signature Gift Box</span>
                </div>
                <div className="hero-mini hero-mini--rocket">
                  <span className="hero-mini__icon">
                    <i className="fa-solid fa-fire-flame-curved"></i>
                  </span>
                  <span className="hero-mini__label">Festive Favourites</span>
                </div>
              </div>
              <h2>Celebrate in Style</h2>
              <p>Diwali · Weddings · New Year · Every Special Moment</p>
              <div className="hero-festive-tags">
                <span className="hero-festive-tags__hot"><i className="fa-solid fa-star"></i> Best Sellers</span>
                <span>Premium Quality</span>
                <span>Gift Collections</span>
              </div>
            </div>
            <ul className="hero-points">
              <li><i className="fa-solid fa-check"></i> Genuine quality products</li>
              <li><i className="fa-solid fa-check"></i> Competitive wholesale rates</li>
              <li><i className="fa-solid fa-check"></i> Secure packaging &amp; shipping</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
