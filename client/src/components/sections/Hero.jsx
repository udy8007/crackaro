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

  // Very slow flipbook (~0.8 fps)
  useEffect(() => {
    SHINCHAN_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const id = window.setInterval(() => {
      setFrame((n) => (n + 1) % SHINCHAN_FRAMES.length);
    }, 1200);
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
      </div>

      {/* Sky fireworks only — cast sits in the hero grid center column */}
      <div className="hero-celeb" aria-hidden="true">
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

        {/* Dim scatter — gift packs + celebration icons near cast bottom */}
        <div className="hero-scatter" aria-hidden="true">
          <figure className="hero-scatter__item hero-scatter__item--gift-a">
            <div className="c-cracker c-cracker--gift c-cracker--xs">
              <span className="c-cracker__bow"></span>
              <span className="c-cracker__gift-box"></span>
            </div>
          </figure>
          <figure className="hero-scatter__item hero-scatter__item--gift-b">
            <div className="c-cracker c-cracker--gift c-cracker--xs">
              <span className="c-cracker__bow"></span>
              <span className="c-cracker__gift-box"></span>
            </div>
          </figure>
          <figure className="hero-scatter__item hero-scatter__item--gift-c">
            <div className="c-cracker c-cracker--gift c-cracker--xs">
              <span className="c-cracker__bow"></span>
              <span className="c-cracker__gift-box"></span>
            </div>
          </figure>
          <figure className="hero-scatter__item hero-scatter__item--celeb-a">
            <div className="c-cracker c-cracker--chakri c-cracker--xs">
              <span className="c-cracker__wheel"></span>
              <span className="c-cracker__hub"></span>
            </div>
          </figure>
          <figure className="hero-scatter__item hero-scatter__item--celeb-b">
            <div className="c-cracker c-cracker--chakri c-cracker--xs">
              <span className="c-cracker__wheel"></span>
              <span className="c-cracker__hub"></span>
            </div>
          </figure>
          <figure className="hero-scatter__item hero-scatter__item--celeb-c">
            <div className="c-cracker c-cracker--chakri c-cracker--xs">
              <span className="c-cracker__wheel"></span>
              <span className="c-cracker__hub"></span>
            </div>
          </figure>
          <span className="hero-scatter__burst hero-scatter__burst--1"></span>
          <span className="hero-scatter__burst hero-scatter__burst--2"></span>
          <span className="hero-scatter__burst hero-scatter__burst--3"></span>
          <span className="hero-scatter__dot hero-scatter__dot--1"></span>
          <span className="hero-scatter__dot hero-scatter__dot--2"></span>
          <span className="hero-scatter__dot hero-scatter__dot--3"></span>
          <span className="hero-scatter__dot hero-scatter__dot--4"></span>
        </div>

        <div className="hero-spark-trails">
          <span className="hero-trail hero-trail--1"></span>
          <span className="hero-trail hero-trail--2"></span>
          <span className="hero-trail hero-trail--3"></span>
        </div>
      </div>

      <div className="container hero-inner">
        <div className="hero-content">
          {/* Mobile-only — gift packs + shaded glow behind the copy */}
          <div className="hero-mobile-bg" aria-hidden="true">
            <span className="hero-mobile-bg__shade hero-mobile-bg__shade--rose"></span>
            <span className="hero-mobile-bg__shade hero-mobile-bg__shade--gold"></span>
            <span className="hero-mobile-bg__shade hero-mobile-bg__shade--amber"></span>
            <span className="hero-mobile-bg__shade hero-mobile-bg__shade--coral"></span>
            <figure className="hero-mobile-bg__gift hero-mobile-bg__gift--1">
              <div className="c-cracker c-cracker--gift">
                <span className="c-cracker__bow"></span>
                <span className="c-cracker__gift-box"></span>
              </div>
            </figure>
            <figure className="hero-mobile-bg__gift hero-mobile-bg__gift--2">
              <div className="c-cracker c-cracker--gift">
                <span className="c-cracker__bow"></span>
                <span className="c-cracker__gift-box"></span>
              </div>
            </figure>
            <figure className="hero-mobile-bg__gift hero-mobile-bg__gift--3">
              <div className="c-cracker c-cracker--gift">
                <span className="c-cracker__bow"></span>
                <span className="c-cracker__gift-box"></span>
              </div>
            </figure>
            <figure className="hero-mobile-bg__gift hero-mobile-bg__gift--4">
              <div className="c-cracker c-cracker--gift">
                <span className="c-cracker__bow"></span>
                <span className="c-cracker__gift-box"></span>
              </div>
            </figure>
            <img
              className="hero-mobile-bg__pack hero-mobile-bg__pack--1"
              src="/images/gift-pack.svg"
              alt=""
              width="120"
              height="135"
              decoding="async"
              draggable="false"
            />
            <img
              className="hero-mobile-bg__pack hero-mobile-bg__pack--2"
              src="/images/gift-pack.svg"
              alt=""
              width="100"
              height="112"
              decoding="async"
              draggable="false"
            />
            <span className="hero-mobile-bg__sparkle"></span>
            <span className="hero-mobile-bg__sparkle"></span>
            <span className="hero-mobile-bg__sparkle"></span>
            <span className="hero-mobile-bg__sparkle"></span>
            <span className="hero-mobile-bg__sparkle"></span>
            <span className="hero-mobile-bg__sparkle"></span>
          </div>
          <div className="hero-copy">
            <p className="eyebrow"><i className="fa-solid fa-star"></i> Sivakasi Festival Collection</p>
            <h1>Make every celebration <span className="text-gradient">truly memorable</span></h1>
            <p className="hero-text">
              Discover carefully selected crackers and authentic Sivakasi quality
              for homes, weddings, and special events.
            </p>
            <div className="hero-cta">
              <a href="#products" className="btn btn-primary btn-lg hero-cta__browse">
                <i className="fa-solid fa-bag-shopping"></i>
                <span>Browse Products</span>
              </a>
              <a href="#contact" className="btn btn-outline btn-lg">
                <i className="fa-solid fa-headset"></i> Get a Quote
              </a>
            </div>
          </div>
        </div>

        <div className="hero-cast" aria-hidden="true">
          {/* Mobile: small gift packs behind/beside the cast */}
          <div className="hero-cast-gifts">
            <figure className="hero-cast-gifts__item hero-cast-gifts__item--l1">
              <div className="c-cracker c-cracker--gift c-cracker--xs">
                <span className="c-cracker__bow"></span>
                <span className="c-cracker__gift-box"></span>
              </div>
            </figure>
            <figure className="hero-cast-gifts__item hero-cast-gifts__item--l2">
              <div className="c-cracker c-cracker--gift c-cracker--xs">
                <span className="c-cracker__bow"></span>
                <span className="c-cracker__gift-box"></span>
              </div>
            </figure>
            <figure className="hero-cast-gifts__item hero-cast-gifts__item--r1">
              <div className="c-cracker c-cracker--gift c-cracker--xs">
                <span className="c-cracker__bow"></span>
                <span className="c-cracker__gift-box"></span>
              </div>
            </figure>
            <figure className="hero-cast-gifts__item hero-cast-gifts__item--r2">
              <div className="c-cracker c-cracker--gift c-cracker--xs">
                <span className="c-cracker__bow"></span>
                <span className="c-cracker__gift-box"></span>
              </div>
            </figure>
            <span className="hero-cast-gifts__shade hero-cast-gifts__shade--left"></span>
            <span className="hero-cast-gifts__shade hero-cast-gifts__shade--right"></span>
          </div>
          <div className="celeb-stage celeb-stage--inline">
            <div className="celeb-cast celeb-cast--flip">
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

        <div className="hero-visual">
          <div className="hero-visual-orbit" aria-hidden="true">
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
          </div>
        </div>
      </div>

      <div className="hero-bridge" aria-hidden="true">
        <svg
          className="hero-bridge__wave"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
        >
          <path
            className="hero-bridge__wave-fill"
            d="M0,18 C240,40 480,0 720,16 C960,32 1200,4 1440,20 L1440,40 L0,40 Z"
          />
        </svg>
      </div>
    </section>
    </>
  );
}
