import { useState, type CSSProperties, type KeyboardEvent } from "react";
import type { Gift } from "./gifts";
import { useGifts, useReservations } from "./reservations";
import "./public.css";

const URL_RE = /https?:\/\/[^\s]+/g;
const DOTS = ["var(--peach)", "var(--violet)", "var(--mint)"];
const CONFETTI = [
  "oklch(0.84 0.12 165)",
  "oklch(0.86 0.12 50)",
  "oklch(0.82 0.12 290)",
  "oklch(0.9 0.13 95)",
];

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function linkLabel(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "a.co" || host.includes("amazon.")) return "Amazon-ზე ნახვა";
    if (host === "docs.google.com") return "სიის ნახვა";
    return host;
  } catch {
    return "ლინკი";
  }
}

// pulls URLs out of the text so they can be shown as pill buttons
function splitLinks(text: string) {
  const links = text.match(URL_RE) ?? [];
  const clean = text
    .replace(URL_RE, "")
    .replace(/[\s\-—–>:]+$/u, "")
    .trim();
  return { text: clean || text, links };
}

function burst(el: Element | null) {
  if (!el || reducedMotion()) return;
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("span");
    const s = 5 + Math.random() * 5;
    const a = Math.random() * Math.PI * 2;
    const d = 40 + Math.random() * 80;
    Object.assign(p.style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      width: `${s}px`,
      height: `${Math.random() > 0.5 ? s : s * 0.45}px`,
      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      background: CONFETTI[i % 4],
      pointerEvents: "none",
      zIndex: "999",
    });
    document.body.appendChild(p);
    p.animate(
      [
        { transform: "translate(-50%,-50%) scale(0.4)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 10}px)) rotate(${Math.random() * 360}deg) scale(1)`,
          opacity: 1,
          offset: 0.6,
        },
        {
          transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.15}px), calc(-50% + ${Math.sin(a) * d + 30}px)) rotate(${Math.random() * 540}deg) scale(0.6)`,
          opacity: 0,
        },
      ],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)" },
    ).onfinish = () => p.remove();
  }
}

// staggered fade-in on first render
function anim(i: number): CSSProperties {
  return { animationDelay: `${80 + Math.min(i, 18) * 55}ms` };
}

export default function PublicPage() {
  const { gifts, loading: giftsLoading, error: giftsError } = useGifts();
  const { reserved, toggle, loading, error } = useReservations();
  const birthdayGifts = gifts.filter((g) => g.section === "birthday");
  const abroadGifts = gifts.filter((g) => g.section === "abroad");

  return (
    <div className="pl">
      <div className="pl-orbs" aria-hidden>
        <div className="pl-orb pl-orb-a" />
        <div className="pl-orb pl-orb-b" />
        <div className="pl-orb pl-orb-c" />
      </div>

      <main className="pl-main">
        <header className="pl-header pl-anim" style={anim(0)}>
          <div className="pl-eyebrow">
            <span className="pl-dot" style={{ "--dot": "var(--mint)" } as CSSProperties} />
            <span>საჩუქრების სია</span>
          </div>
          <h1>
            რა შეგიძლია აჩუქო <span className="pl-accent">კონსტანტინე თავაძეს</span>
          </h1>
          <p className="pl-lead">
            დაბადების დღეზე, ან ისედაც, თუ გაგისწორდება. მონიშნე, რასაც ყიდულობ
            — რომ სხვებმაც იცოდნენ.
          </p>
        </header>

        {(error || giftsError) && (
          <p className="pl-error">შეცდომა: {error || giftsError}</p>
        )}
        {giftsLoading && <p className="pl-lead">იტვირთება...</p>}

        <ul className="pl-list">
          {birthdayGifts.map((gift, i) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              index={i}
              on={reserved.has(gift.id)}
              disabled={loading}
              onToggle={() => toggle(gift.id)}
            />
          ))}
        </ul>

        <section className="pl-abroad pl-anim" style={anim(1)}>
          <div className="pl-abroad-head">
            <div className="pl-eyebrow">
              <span className="pl-dot" style={{ "--dot": "var(--violet)" } as CSSProperties} />
              <span>თუ სადმე მიდიხარ</span>
            </div>
            <h2>
              რა შეგიძლია ჩამოუტანო{" "}
              <span className="pl-accent-violet">უცხო ქვეყნიდან</span>
            </h2>
          </div>
          <div className="pl-grid">
            {abroadGifts.map((gift, i) => {
              const { text, links } = splitLinks(gift.text);
              return (
                <div key={gift.id} className="pl-abroad-card">
                  <span
                    className="pl-dot pl-abroad-dot"
                    style={{ "--dot": DOTS[i % 3] } as CSSProperties}
                  />
                  <div className="pl-card-body">
                    <span>{text}</span>
                    {links.map((url) => (
                      <LinkPill key={url} url={url} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="pl-footer pl-anim" style={anim(2)}>
          მადლობა, რომ ფიქრობ ჩემზე
        </footer>
      </main>
    </div>
  );
}

function GiftCard(props: {
  gift: Gift;
  index: number;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const { text, links } = splitLinks(props.gift.text);
  const [boxEl, setBoxEl] = useState<HTMLSpanElement | null>(null);

  const activate = () => {
    if (props.disabled) return;
    if (boxEl && !reducedMotion()) {
      boxEl.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(0.78)" },
          { transform: "scale(1.18)" },
          { transform: "scale(1)" },
        ],
        { duration: 480, easing: "cubic-bezier(.34,1.56,.64,1)" },
      );
    }
    if (!props.on) burst(boxEl);
    props.onToggle();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      activate();
    }
  };

  return (
    <li
      className={`pl-card pl-anim${props.on ? " is-on" : ""}`}
      style={anim(props.index + 1)}
      role="checkbox"
      aria-checked={props.on}
      aria-disabled={props.disabled}
      tabIndex={0}
      onClick={activate}
      onKeyDown={onKey}
    >
      <span className="pl-box" ref={setBoxEl}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <polyline
            points="3,8.5 6.5,12 13,4.5"
            stroke="oklch(0.2 0.03 265)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="18"
            strokeDashoffset={props.on ? 0 : 18}
          />
        </svg>
      </span>
      <div className="pl-card-body">
        <div className="pl-card-line">
          <span className="pl-card-text">{text}</span>
          <span className="pl-badge">ვყიდულობ</span>
        </div>
        {links.map((url) => (
          <LinkPill key={url} url={url} />
        ))}
      </div>
      <span className="pl-num">{String(props.index + 1).padStart(2, "0")}</span>
    </li>
  );
}

function LinkPill({ url }: { url: string }) {
  return (
    <a
      className="pl-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <span>{linkLabel(url)}</span>
      <span aria-hidden>↗</span>
    </a>
  );
}
