import Image from "next/image";
import Link from "next/link";
import {
  Mic,
  ShieldCheck,
  Sparkles,
  Heart,
  WandSparkles,
  Play,
  Volume2,
  ArrowRight,
  ShieldHalf,
  Smartphone,
  Plus,
  Minus,
  Cake,
  Clock,
  Lock,
  Printer,
  HeartCrack,
  Gift,
} from "lucide-react";
import { StorypopLogo } from "@/components/storypop-logo";
import {
  Cloud,
  Tree,
  Star,
  Sparkle,
  HillsBand,
} from "@/components/landscape-decoration";
import {
  StepProfileCard,
  StepMicScene,
  StepBookScene,
} from "@/components/step-illustrations";
import styles from "./landing-page.module.css";

const PRIMARY_CTA = "Start tonight's story — free";

const TRUST_BADGES = [
  { icon: ShieldHalf, label: "Made for parents" },
  { icon: Heart, label: "Loved by kids" },
  { icon: Lock, label: "Safe & private" },
];

const BENEFITS = [
  {
    icon: Mic,
    title: "Screen-free magic",
    body: "No buttons, no tapping, no swiping. Just talk — and the story listens back.",
    accent: Sparkle,
    iconClass: styles.iconPurple,
  },
  {
    icon: Heart,
    title: "Your kid is the hero",
    body: "Every story is personalized with their name, choices, and big imagination.",
    accent: Heart,
    iconClass: styles.iconCoral,
  },
  {
    icon: ShieldCheck,
    title: "Made for parents to trust",
    body: "No creepy data, no profiles, no ads. 100% safe, private, and kid-first.",
    accent: Lock,
    iconClass: styles.iconTeal,
  },
  {
    icon: Sparkles,
    title: "Sneaky learning",
    body: "Builds vocabulary, listening skills, and big imagination — disguised as the highlight of their day.",
    accent: Sparkles,
    iconClass: styles.iconAmber,
  },
];

const STEPS = [
  {
    n: "1",
    title: "Set it up in 30 seconds",
    body: "Tell Storypop your kid's name, age, and their favorite things. Pick a story length: short, snuggle, or epic.",
    Art: StepProfileCard,
  },
  {
    n: "2",
    title: "Hand it to your kid",
    body: "They tap once and say what tonight's story is about. A dragon who lost his shoe? A cat who's an astronaut? Yes and yes.",
    Art: StepMicScene,
  },
  {
    n: "3",
    title: "Snuggle up and read",
    body: "An illustrated, narrated bedtime book appears in minutes. Save it, print it, listen again — bedtime magic, ready whenever you are.",
    Art: StepBookScene,
  },
];

const THEMES = [
  { label: "Dragon Rider", image: "/bedtime-universe/dragon-rider.png", labelClass: styles.themeLabelPurple },
  { label: "Ocean Explorer", image: "/bedtime-universe/ocean-explorer.png", labelClass: styles.themeLabelTeal },
  { label: "Fairy Princess", image: "/bedtime-universe/fairy-princess.png", labelClass: styles.themeLabelPink },
  { label: "Space Ranger", image: "/bedtime-universe/space-ranger.png", labelClass: styles.themeLabelPurple },
  { label: "Wizard School", image: "/bedtime-universe/wizard-school.png", labelClass: styles.themeLabelAmber },
  { label: "Jungle Adventure", image: "/bedtime-universe/jungle-adventure.png", labelClass: styles.themeLabelGreen },
  { label: "Dinosaur Friend", image: "/bedtime-universe/dinosaur-friend.png", labelClass: styles.themeLabelAmber },
  { label: "Mermaid Quest", image: "/bedtime-universe/mermaid-quest.png", labelClass: styles.themeLabelTeal },
  { label: "Night Sky Magic", image: "/bedtime-universe/night-sky-magic.png", labelClass: styles.themeLabelPurple },
  { label: "Backyard Detective", image: "/bedtime-universe/backyard-detective.png", labelClass: styles.themeLabelGreen },
] as const;

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "/month",
    tagline: "Try Storypop tonight. No card needed.",
    features: [
      "1 free illustrated story",
      "4 scenes, narrated out loud",
      "Read together in the browser",
      "Save the story link to share",
    ],
    cta: "Start free",
    href: "/play",
    featured: false,
  },
  {
    name: "Storypop+",
    price: "$9",
    cadence: "/month",
    badge: "Most loved",
    tagline: "Unlimited bedtime adventures your kids will love.",
    features: [
      "Unlimited illustrated stories",
      "Multi-voice narration (kids voices + narrator)",
      "Save, print & share PDFs",
      "Up to 3 kid profiles",
      "Cancel anytime in one tap",
    ],
    cta: "Start 7-day free trial",
    href: "/play",
    featured: true,
    finePrint: "Then $9/mo. Cancel anytime.",
  },
  {
    name: "Forever gift",
    price: "$129",
    cadence: " once",
    tagline: "The perfect gift that keeps on giving — forever.",
    features: [
      "Everything in Storypop+",
      "Lifetime access, no renewals",
      "Gift-wrap a code for grandparents",
      "Priority support from our team",
    ],
    cta: "Send the gift",
    href: "/play",
    featured: false,
    ctaIcon: Gift,
  },
];

const FAQS = [
  {
    icon: Cake,
    iconBg: styles.faqIconPurple,
    q: "How old does my kid need to be?",
    a: "Storypop is designed for ages 1–7. The voice prompts, vocabulary, and story length adapt automatically based on the age you set in their profile.",
  },
  {
    icon: Clock,
    iconBg: styles.faqIconCoral,
    q: "Do I have to sit with them the whole time?",
    a: "Nope. Storypop is fully voice-driven — your kid taps once, talks, listens, and gets a finished illustrated book. Most parents use it as the bedtime wind-down so you can fold the laundry next to them.",
  },
  {
    icon: Lock,
    iconBg: styles.faqIconTeal,
    q: "Is this safe? What about their voice and data?",
    a: "Yes. We don't show ads, we don't sell data, and we never train models on your child's voice. Voice clips are processed for the current story and then discarded.",
  },
  {
    icon: Printer,
    iconBg: styles.faqIconAmber,
    q: "Can I print or share the stories?",
    a: "On Storypop+ you get a print-ready PDF for every story plus a shareable link for grandparents. Great for birthday cards and \"look what I made!\" moments.",
  },
  {
    icon: HeartCrack,
    iconBg: styles.faqIconPink,
    q: "What if my kid doesn't love a story?",
    a: "Tap regenerate, change the topic, or pick a different story trait. We also offer a 30-day no-questions-asked refund on Storypop+.",
  },
];

function LandscapeBackdrop() {
  return (
    <div className={styles.landscape} aria-hidden="true">
      {/* Sky gradient is on .page; here we layer the decorations */}

      {/* Trees on bottom-left of the page */}
      <Tree className={`${styles.tree} ${styles.treeBig}`} />
      <Tree className={`${styles.tree} ${styles.treeMid}`} />
      <Tree className={`${styles.tree} ${styles.treeSmall}`} />

      {/* Clouds scattered down the entire page */}
      <Cloud className={`${styles.cloud} ${styles.cloud1}`} />
      <Cloud className={`${styles.cloud} ${styles.cloud2}`} />
      <Cloud className={`${styles.cloud} ${styles.cloud3}`} />
      <Cloud className={`${styles.cloud} ${styles.cloud4}`} />
      <Cloud className={`${styles.cloud} ${styles.cloud5}`} />
      <Cloud className={`${styles.cloud} ${styles.cloud6}`} />

      {/* Stars and sparkles scattered down the page */}
      <Star className={`${styles.star} ${styles.starA}`} color="#f9b6c8" />
      <Star className={`${styles.star} ${styles.starB}`} color="#ffe066" />
      <Star className={`${styles.star} ${styles.starC}`} color="#dcb6ff" />
      <Star className={`${styles.star} ${styles.starD}`} color="#ffe066" />
      <Star className={`${styles.star} ${styles.starE}`} color="#f9b6c8" />
      <Sparkle className={`${styles.sparkle} ${styles.sparkleA}`} color="#c4b5fd" />
      <Sparkle className={`${styles.sparkle} ${styles.sparkleB}`} color="#f9b6c8" />
      <Sparkle className={`${styles.sparkle} ${styles.sparkleC}`} color="#c4b5fd" />
      <Sparkle className={`${styles.sparkle} ${styles.sparkleD}`} color="#ffe066" />

      {/* Bottom hills band */}
      <HillsBand className={styles.hillsBand} />
    </div>
  );
}

export function LandingPage() {
  return (
    <main className={styles.page}>
      <LandscapeBackdrop />

      <div className={styles.container}>
        <nav className={styles.nav} aria-label="Primary">
          <Link className={styles.brand} href="/" aria-label="Storypop home">
            <StorypopLogo className={styles.brandLogo} title="Storypop" />
          </Link>
          <div className={styles.navLinks}>
            <a href="#how">How it works</a>
            <a href="#why">Why parents love it</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <Link className={styles.navCta} href="/play">
            <Sparkles size={16} /> Start free <ArrowRight size={16} />
          </Link>
        </nav>

        {/* ───────── Hero ───────── */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>
              <span>✨</span> Bedtime, reinvented for the iPad generation
            </p>
            <h1 className={styles.heroTitle}>
              Tonight, your kid stars in <em>their own bedtime story.</em>
            </h1>
            <p className={styles.heroLede}>
              Storypop turns a few spoken words into a fully illustrated, narrated bedtime book.
              No screens to tap. No keyboards. Just imagination, out loud.
            </p>
            <div className={styles.heroCtas}>
              <Link className={styles.btnPrimary} href="/play">
                <Mic size={20} />
                {PRIMARY_CTA}
              </Link>
              <a className={styles.btnSecondary} href="#how">
                <Play size={16} fill="currentColor" />
                See how it works
              </a>
            </div>
            <ul className={styles.trustRow}>
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <Icon size={16} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.heroBook}>
              <div className={styles.heroBookPage}>
                <div className={styles.heroSceneArt}>
                  <Image
                    src="/bedtime-universe/dragon-rider.png"
                    alt=""
                    fill
                    sizes="(max-width: 960px) 80vw, 320px"
                    priority
                    className={styles.heroSceneImage}
                  />
                </div>
                <p className={styles.heroPageText}>
                  <strong>Maya</strong> and her brave dragon Theo soared above the clouds, chasing
                  a sky full of stars.
                </p>
              </div>
              <div className={`${styles.heroBookPage} ${styles.heroBookPageRight}`}>
                <span className={styles.heroSpeaker}>
                  <Volume2 size={14} /> Narrator
                </span>
                <p className={styles.heroPageText}>
                  The dragon yawned. Sparkles drifted out. And the whole forest smelled like
                  toasted marshmallows.
                </p>
                <div className={styles.heroAudioBar}>
                  <button
                    className={styles.heroAudioPlay}
                    type="button"
                    aria-label="Preview narration"
                    tabIndex={-1}
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                  <div className={styles.heroAudioWaves}>
                    {Array.from({ length: 22 }).map((_, i) => (
                      <span key={i} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${styles.floatSticker} ${styles.floatSticker1}`}>
              <em>📚</em>
              <strong>4 scenes</strong>
              <span>made in minutes</span>
            </div>
            <div className={`${styles.floatSticker} ${styles.floatSticker2}`}>
              <em>🎙️</em>
              <strong>Real voices</strong>
              <span>not robotic AI</span>
            </div>
            <div className={`${styles.floatSticker} ${styles.floatSticker3}`}>
              <em>🌙</em>
              <strong>Bedtime ready</strong>
              <span>tonight, not next week</span>
            </div>
          </div>
        </section>

        {/* ───────── Why parents love it ───────── */}
        <section className={styles.section} id="why">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>
              <Sparkles size={12} /> Why parents love Storypop
            </span>
            <h2 className={styles.sectionTitle}>
              Finally, screen time that <em>feels like a hug.</em>
            </h2>
            <p className={styles.sectionLede}>
              Storypop turns kids into storytellers, listeners, and the hero of their own bedtime.
            </p>
          </header>

          <div className={styles.benefits}>
            {BENEFITS.map(({ icon: Icon, title, body, accent: Accent, iconClass }) => (
              <article className={styles.benefitCard} key={title}>
                <div className={`${styles.benefitIcon} ${iconClass}`}>
                  <Icon size={26} strokeWidth={2.4} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                <div className={styles.benefitAccent}>
                  <Accent size={18} strokeWidth={2.4} />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ───────── How it works ───────── */}
        <section className={styles.section} id="how">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>
              <Sparkles size={12} /> How it works
            </span>
            <h2 className={styles.sectionTitle}>
              From idea to <em>illustrated book</em> in 3 steps.
            </h2>
            <p className={styles.sectionLede}>
              You set it up once. Your kid drives the rest — by talking, not tapping. No reading
              skills required.
            </p>
          </header>

          <div className={styles.steps}>
            {STEPS.map(({ n, title, body, Art }) => (
              <article className={styles.step} key={n}>
                <span className={styles.stepNumber}>{n}</span>
                <Art className={styles.stepArt} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>

          <ul className={styles.trustFooter}>
            {[
              { icon: ShieldHalf, label: "Made for parents", color: styles.trustPurple },
              { icon: Heart, label: "Loved by kids", color: styles.trustPink },
              { icon: Lock, label: "Safe & private", color: styles.trustGreen },
            ].map(({ icon: Icon, label, color }) => (
              <li key={label} className={color}>
                <Icon size={16} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ───────── Story magic / themes ───────── */}
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>
              <Sparkles size={12} /> Story magic
            </span>
            <h2 className={styles.sectionTitle}>
              A bedtime <em>universe</em> they design themselves.
            </h2>
            <p className={styles.sectionLede}>
              Dragons, dinosaurs, mermaids, deep-sea explorers, fairy royalty, space adventures,
              or whatever your kid imagines. Every story is one-of-one.
            </p>
          </header>

          <div className={styles.themes}>
            {THEMES.map((theme) => (
              <div className={styles.themeCard} key={theme.label}>
                <div className={styles.themeArt}>
                  <Image
                    src={theme.image}
                    alt={theme.label}
                    fill
                    sizes="(max-width: 619px) 50vw, (max-width: 919px) 33vw, 200px"
                    className={styles.themeImage}
                  />
                </div>
                <span className={`${styles.themeLabel} ${theme.labelClass}`}>
                  <Sparkles size={10} />
                  {theme.label}
                  <Sparkles size={10} />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Pricing ───────── */}
        <section className={styles.section} id="pricing">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>
              <Sparkles size={12} /> Pricing
            </span>
            <h2 className={styles.sectionTitle}>
              Cheaper than <em>one bedtime book</em> a month.
            </h2>
            <p className={styles.sectionLede}>
              Cancel anytime. You&apos;ll never pay for stories your family doesn&apos;t use—only
              for the magic you love.
            </p>
          </header>

          <div className={styles.pricing}>
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`${styles.priceCard} ${
                  plan.featured ? styles.priceFeatured : ""
                }`.trim()}
              >
                {plan.badge ? (
                  <span className={styles.priceBadge}>
                    <Sparkles size={12} /> {plan.badge} <Sparkles size={12} />
                  </span>
                ) : null}
                <h3 className={styles.priceTitle}>{plan.name}</h3>
                <div className={styles.priceAmount}>
                  {plan.price}
                  <span>{plan.cadence}</span>
                </div>
                <p className={styles.priceTagline}>{plan.tagline}</p>
                <div className={styles.priceDivider} />
                <ul className={styles.priceFeatures}>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <span className={styles.priceCheck}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link className={styles.priceCta} href={plan.href}>
                  {plan.cta}
                  {plan.ctaIcon ? <plan.ctaIcon size={16} /> : null}
                  {plan.featured ? <Sparkles size={16} /> : null}
                </Link>
                {plan.finePrint ? (
                  <p className={styles.priceFinePrint}>{plan.finePrint}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <section className={styles.section} id="faq">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>
              <Sparkles size={12} /> FAQ
            </span>
            <h2 className={styles.sectionTitle}>
              The questions <em>every parent</em> asks first.
            </h2>
          </header>

          <div className={styles.faq}>
            {FAQS.map((faq, i) => {
              const FaqIcon = faq.icon;
              return (
                <details className={styles.faqItem} key={faq.q} open={i === 0}>
                  <summary>
                    <span className={styles.faqQuestion}>{faq.q}</span>
                    <span className={styles.faqIcon} aria-hidden="true">
                      <Plus className={styles.faqPlus} size={14} />
                      <Minus className={styles.faqMinus} size={14} />
                    </span>
                  </summary>
                  <div className={styles.faqBody}>
                    <span className={`${styles.faqAccentIcon} ${faq.iconBg}`}>
                      <FaqIcon size={22} />
                    </span>
                    <p>{faq.a}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        {/* ───────── Final CTA ───────── */}
        <section className={styles.finalCta}>
          <div className={styles.finalCtaBokeh} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className={styles.finalCtaSparkles} aria-hidden="true">
            <Sparkle className={styles.finalCtaSparkle1} color="#ffe066" />
            <Sparkle className={styles.finalCtaSparkle2} color="#fbcfe8" />
            <Sparkle className={styles.finalCtaSparkle3} color="#fff" />
          </div>
          <div className={styles.finalCtaInner}>
            <h2>Make tonight magical.</h2>
            <p>
              One tap. One spoken idea. A bedtime book they&apos;ll ask for again tomorrow. Try
              your first Storypop free — your kid can be the hero in under 3 minutes.
            </p>
            <Link className={styles.btnPrimary} href="/play">
              <WandSparkles size={20} />
              {PRIMARY_CTA}
            </Link>
            <ul className={styles.finalCtaProof}>
              <li>
                <ShieldHalf size={14} /> No credit card
              </li>
              <li>
                <Smartphone size={14} /> Works on any phone, tablet, or laptop
              </li>
              <li>
                <Heart size={14} /> Cancel anytime
              </li>
            </ul>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <span className={styles.footerCopy}>
              © {new Date().getFullYear()} Storypop · Made with love for bedtime
            </span>
            <div className={styles.footerLinks}>
              <Link href="/play">Start a story</Link>
              <Link href="/stories">My library</Link>
              <Link href="/settings">Parent settings</Link>
              <a href="mailto:hello@storypop.app">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
