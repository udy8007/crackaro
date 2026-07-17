export default function Hero() {
  return (
    <>
<section className="hero" id="home">
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

        {/* Family celebration — fills empty sky band, no extra height */}
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
            <svg className="celeb-cast" viewBox="0 0 480 148" xmlns="http://www.w3.org/2000/svg" focusable="false">
              <defs>
                <radialGradient id="celeb-skin" cx="40%" cy="30%" r="68%">
                  <stop offset="0%" stopColor="#f8d2bc"/>
                  <stop offset="55%" stopColor="#e8a57a"/>
                  <stop offset="100%" stopColor="#d4896a"/>
                </radialGradient>
                <linearGradient id="celeb-dad-shirt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6"/>
                  <stop offset="100%" stopColor="#1d4ed8"/>
                </linearGradient>
                <linearGradient id="celeb-mom-dress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48"/>
                  <stop offset="100%" stopColor="#9f1239"/>
                </linearGradient>
                <linearGradient id="celeb-girl-dress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c"/>
                  <stop offset="100%" stopColor="#ea580c"/>
                </linearGradient>
                <linearGradient id="celeb-mortar-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626"/>
                  <stop offset="40%" stopColor="#991b1b"/>
                  <stop offset="100%" stopColor="#450a0a"/>
                </linearGradient>
                <linearGradient id="celeb-glow" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
                </linearGradient>
                <radialGradient id="celeb-ground" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c2410c" stopOpacity="0.22"/>
                  <stop offset="100%" stopColor="#c2410c" stopOpacity="0"/>
                </radialGradient>
              </defs>

              <ellipse className="celeb-ground" cx="240" cy="138" rx="210" ry="11" fill="url(#celeb-ground)"/>
              <ellipse className="celeb-ground-glow" cx="240" cy="126" rx="190" ry="30" fill="url(#celeb-glow)" opacity="0.6"/>

              {/* Dad */}
              <g className="celeb-fig celeb-fig--dad">
                <ellipse className="celeb-foot-shadow" cx="118" cy="137" rx="20" ry="4.5" fill="#9a3412" opacity="0.22"/>
                <path d="M104 108c0 2 1 18 2 26h9c1-8 1-24 1-26z" fill="#1e3a8a"/>
                <path d="M124 108c0 2 0 18 1 26h9c1-8 1-24 1-26z" fill="#1e3a8a"/>
                <ellipse cx="109" cy="135" rx="6.5" ry="2.6" fill="#0f172a"/>
                <ellipse cx="129" cy="135" rx="6.5" ry="2.6" fill="#0f172a"/>
                <path d="M100 72c0-3 7-9 18-9s18 6 18 9v34c0 2-4 4-18 4s-18-2-18-4z" fill="url(#celeb-dad-shirt)"/>
                <path d="M108 72h20v4H108z" fill="#93c5fd" opacity="0.55"/>
                <path d="M102 78c-11 7-17 18-19 27" stroke="url(#celeb-dad-shirt)" strokeWidth="7.5" strokeLinecap="round" fill="none"/>
                <circle cx="81" cy="107" r="4" fill="url(#celeb-skin)"/>
                <g className="celeb-arm-up">
                  <path d="M132 76c10-14 16-28 12-40" stroke="url(#celeb-dad-shirt)" strokeWidth="7.5" strokeLinecap="round" fill="none"/>
                  <circle cx="142" cy="34" r="4" fill="url(#celeb-skin)"/>
                  <line x1="142" y1="32" x2="150" y2="10" stroke="#a16207" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle className="celeb-spark-core" cx="152" cy="6" r="4.2" fill="#fde047"/>
                  <circle cx="152" cy="6" r="7" fill="#fde047" opacity="0.25"/>
                </g>
                <rect x="113" y="62" width="10" height="8" rx="3" fill="url(#celeb-skin)"/>
                <circle cx="118" cy="54" r="13" fill="url(#celeb-skin)"/>
                <path d="M105 48c3-11 19-14 27-5-8 1-14 5-16 12z" fill="#1c1917"/>
                <circle cx="113" cy="53" r="1.4" fill="#3f2a1e"/>
                <circle cx="123" cy="53" r="1.4" fill="#3f2a1e"/>
                <circle cx="113.4" cy="52.5" r="0.45" fill="#fff" opacity="0.75"/>
                <circle cx="123.4" cy="52.5" r="0.45" fill="#fff" opacity="0.75"/>
                <path d="M114 60c2.6 2.4 7 2.4 9.5 0" stroke="#a16207" strokeWidth="1.35" strokeLinecap="round" fill="none"/>
              </g>

              {/* Mom — sparkler wave like others */}
              <g className="celeb-fig celeb-fig--mom">
                <ellipse className="celeb-foot-shadow" cx="200" cy="137" rx="18" ry="4" fill="#9a3412" opacity="0.22"/>
                <path d="M186 112c0 2 1 15 2 22h8c1-7 1-20 1-22z" fill="#881337"/>
                <path d="M206 112c0 2 0 15 1 22h8c1-7 1-20 1-22z" fill="#881337"/>
                <ellipse cx="191" cy="135" rx="6" ry="2.4" fill="#4c0519"/>
                <ellipse cx="211" cy="135" rx="6" ry="2.4" fill="#4c0519"/>
                <path d="M180 74c0-3 8-9 20-9s20 6 20 9v30c0 2-6 5-20 5s-20-3-20-5z" fill="url(#celeb-mom-dress)"/>
                <path d="M190 74h20c2 0 4 2 4 4l-2 5H188l-2-5c0-2 2-4 4-4z" fill="#fda4af" opacity="0.45"/>
                <path d="M182 82c-8 10-10 20-10 26" stroke="url(#celeb-mom-dress)" strokeWidth="6.5" strokeLinecap="round" fill="none"/>
                <circle cx="170" cy="110" r="3.5" fill="url(#celeb-skin)"/>
                <g className="celeb-arm-wave celeb-arm-wave--mom">
                  <path d="M218 80c10-14 16-28 12-38" stroke="url(#celeb-mom-dress)" strokeWidth="6.5" strokeLinecap="round" fill="none"/>
                  <circle cx="228" cy="40" r="3.6" fill="url(#celeb-skin)"/>
                  <line x1="228" y1="38" x2="238" y2="16" stroke="#a16207" strokeWidth="1.7" strokeLinecap="round"/>
                  <circle className="celeb-spark-core" cx="240" cy="12" r="4" fill="#f97316"/>
                  <circle cx="240" cy="12" r="7" fill="#f97316" opacity="0.25"/>
                </g>
                <rect x="195" y="64" width="10" height="8" rx="3" fill="url(#celeb-skin)"/>
                <circle cx="200" cy="56" r="12" fill="url(#celeb-skin)"/>
                <path d="M187 50c2-11 22-14 28-4-10 0-15 5-17 11z" fill="#431407"/>
                <circle cx="195" cy="55" r="1.3" fill="#3f2a1e"/>
                <circle cx="205" cy="55" r="1.3" fill="#3f2a1e"/>
                <circle cx="195.4" cy="54.5" r="0.4" fill="#fff" opacity="0.75"/>
                <circle cx="205.4" cy="54.5" r="0.4" fill="#fff" opacity="0.75"/>
                <path d="M196 62c2.2 2 6 2 8 0" stroke="#a16207" strokeWidth="1.25" strokeLinecap="round" fill="none"/>
              </g>

              {/* Girl kid */}
              <g className="celeb-fig celeb-fig--girl">
                <ellipse className="celeb-foot-shadow" cx="278" cy="137" rx="14" ry="3.5" fill="#9a3412" opacity="0.22"/>
                <path d="M267 112c0 2 1 15 2 22h7c1-7 1-20 1-22z" fill="#9a3412"/>
                <path d="M282 112c0 2 0 15 1 22h7c1-7 1-20 1-22z" fill="#9a3412"/>
                <ellipse cx="271" cy="135" rx="5.5" ry="2.2" fill="#451a03"/>
                <ellipse cx="286" cy="135" rx="5.5" ry="2.2" fill="#451a03"/>
                <path d="M264 86c0-3 6-8 14-8s14 5 14 8v24c0 2-4 4-14 4s-14-2-14-4z" fill="url(#celeb-girl-dress)"/>
                <circle cx="278" cy="84" r="4.5" fill="#fdba74" opacity="0.5"/>
                <path d="M266 90c-7 7-9 16-9 22" stroke="url(#celeb-girl-dress)" strokeWidth="6" strokeLinecap="round" fill="none"/>
                <circle cx="255" cy="114" r="3.2" fill="url(#celeb-skin)"/>
                <g className="celeb-arm-wave">
                  <path d="M290 88c12-10 18-22 16-34" stroke="url(#celeb-girl-dress)" strokeWidth="6" strokeLinecap="round" fill="none"/>
                  <circle cx="304" cy="52" r="3.5" fill="url(#celeb-skin)"/>
                  <line x1="304" y1="50" x2="316" y2="28" stroke="#a16207" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle className="celeb-spark-core" cx="318" cy="24" r="3.6" fill="#fb7185"/>
                  <circle cx="318" cy="24" r="6.5" fill="#fb7185" opacity="0.28"/>
                </g>
                <rect x="273" y="76" width="10" height="7" rx="2.5" fill="url(#celeb-skin)"/>
                <circle cx="278" cy="70" r="10" fill="url(#celeb-skin)"/>
                <path d="M267 66c3-10 17-12 21-2-6 0-10 4-11 9z" fill="#7c2d12"/>
                <circle cx="274" cy="69" r="1.2" fill="#3f2a1e"/>
                <circle cx="282" cy="69" r="1.2" fill="#3f2a1e"/>
                <circle cx="274.35" cy="68.55" r="0.35" fill="#fff" opacity="0.75"/>
                <circle cx="282.35" cy="68.55" r="0.35" fill="#fff" opacity="0.75"/>
                <path d="M275 75c1.9 1.8 5.2 1.8 6.8 0" stroke="#a16207" strokeWidth="1.15" strokeLinecap="round" fill="none"/>
              </g>

              {/* Skyshot mortar */}
              <g className="celeb-mortar">
                <ellipse className="celeb-foot-shadow" cx="360" cy="136" rx="12" ry="4" fill="#9a3412" opacity="0.28"/>
                <path d="M352 100h16l2 34c0 2-4 4-10 4s-10-2-10-4z" fill="url(#celeb-mortar-g)"/>
                <rect x="354" y="102" width="12" height="10" rx="2" fill="#fbbf24" opacity="0.85"/>
                <rect x="356" y="104" width="8" height="3" rx="1" fill="#fef08a"/>
                <rect x="356" y="92" width="8" height="10" rx="1.5" fill="#7f1d1d"/>
                <ellipse cx="360" cy="92" rx="5" ry="2" fill="#450a0a"/>
                <path className="celeb-fuse" d="M360 92c2-6 6-8 8-6" stroke="#a3a3a3" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                <circle className="celeb-fuse-spark" cx="369" cy="85" r="2.4" fill="#fde047"/>
              </g>
            </svg>

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

      <div className="hero-sparkles" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span>
      </div>
      <div className="hero-lanterns hero-lanterns--legacy" aria-hidden="true">
        <i className="fa-solid fa-lightbulb"></i>
        <i className="fa-solid fa-lightbulb"></i>
        <i className="fa-solid fa-lightbulb"></i>
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
            <a href="#packs" className="btn btn-outline btn-lg">
              <i className="fa-solid fa-gift"></i> View Festival Packs
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
