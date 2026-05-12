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
  UsersRound,
  BookOpen,
} from "lucide-react";
import { StorypopLogo } from "@/components/storypop-logo";
import styles from "./landing-page.module.css";

const PRIMARY_CTA = "Start tonight's story — free";

const BENEFITS = [
  {
    icon: Mic,
    title: "Screen-free magic",
    body: "No buttons to tap, no swiping, no ads. Your kid just talks — and the story listens back.",
  },
  {
    icon: Heart,
    title: "Your kid is the hero",
    body: "Maya saves the dragon. Theo flies to Mars. Their name, their courage, their bedtime adventure.",
  },
  {
    icon: ShieldCheck,
    title: "Made for parents to trust",
    body: "No ads, no profiles for kids, no creepy data. We never train models on your child's voice.",
  },
  {
    icon: Sparkles,
    title: "Sneaky learning",
    body: "Vocabulary, listening skills, and big imagination — disguised as the highlight of their day.",
  },
];

const STEPS = [
  {
    n: "1",
    art: styles.stepArt1,
    icon: UsersRound,
    title: "Set it up in 30 seconds",
    body: "Tell Storypop your kid's name, age, and the things they love. Pick a story length: short, snuggle, or epic.",
  },
  {
    n: "2",
    art: styles.stepArt2,
    icon: Mic,
    title: "Hand it to your kid",
    body: "They tap once and say what tonight's story is about. A dragon who lost his shoe? A cat who's an astronaut? Yes and yes.",
  },
  {
    n: "3",
    art: styles.stepArt3,
    icon: BookOpen,
    title: "Snuggle up and read",
    body: "An illustrated, narrated 4-scene book appears in minutes. Save it, print it, listen again at bedtime.",
  },
];

const THEMES = [
  { label: "Dragon Rider", image: "/bedtime-universe/dragon-rider.png" },
  { label: "Ocean Explorer", image: "/bedtime-universe/ocean-explorer.png" },
  { label: "Fairy Princess", image: "/bedtime-universe/fairy-princess.png" },
  { label: "Space Ranger", image: "/bedtime-universe/space-ranger.png" },
  { label: "Wizard School", image: "/bedtime-universe/wizard-school.png" },
  { label: "Jungle Adventure", image: "/bedtime-universe/jungle-adventure.png" },
  { label: "Dinosaur Friend", image: "/bedtime-universe/dinosaur-friend.png" },
  { label: "Mermaid Quest", image: "/bedtime-universe/mermaid-quest.png" },
  { label: "Night Sky Magic", image: "/bedtime-universe/night-sky-magic.png" },
  { label: "Backyard Detective", image: "/bedtime-universe/backyard-detective.png" },
] as const;

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "/month",
    tagline: "Try it before bedtime tonight. No card needed.",
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
    tagline: "Unlimited bedtime adventures for the whole family.",
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
    finePrint: "Then $9/mo or $59/year. Cancel anytime.",
  },
  {
    name: "Forever gift",
    price: "$129",
    cadence: " once",
    tagline: "Lifetime Storypop+ for the family. Best gift you'll ever send.",
    features: [
      "Everything in Storypop+",
      "Lifetime — no renewals",
      "Gift-wrap a code for grandparents",
      "Priority support",
    ],
    cta: "Send the gift",
    href: "/play",
    featured: false,
  },
];

const FAQS = [
  {
    q: "How old does my kid need to be?",
    a: "Storypop is designed for ages 1–7. The voice prompts, vocabulary, and story length adapt automatically based on the age you set in their profile.",
  },
  {
    q: "Do I have to sit with them the whole time?",
    a: "Nope. Storypop is fully voice-driven — your kid taps once, talks, listens, and gets a finished illustrated book. Most parents use it as the bedtime wind-down so you can fold the laundry next to them.",
  },
  {
    q: "Is this safe? What about their voice and data?",
    a: "Yes. We don't show ads, we don't sell data, and we never train models on your child's voice. Voice clips are processed for the current story and then discarded.",
  },
  {
    q: "Can I print or share the stories?",
    a: "On Storypop+ you get a print-ready PDF for every story plus a shareable link for grandparents. Great for birthday cards and \"look what I made!\" moments.",
  },
  {
    q: "What if my kid doesn't love a story?",
    a: "Tap regenerate, change the topic, or pick a different story trait. We also offer a 30-day no-questions-asked refund on Storypop+.",
  },
];

export function LandingPage() {
  return (
    <main className={styles.page}>
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
            Start free <ArrowRight size={16} />
          </Link>
        </nav>

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
                See how it works
              </a>
            </div>
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.heroBook}>
              <div className={styles.heroBookPage}>
                <div className={styles.heroSceneArt} />
                <p className={styles.heroPageText}>
                  <strong>Maya</strong> looked at the sleeping dragon and whispered, &ldquo;you
                  forgot your shoe again, didn&apos;t you?&rdquo;
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
                  <span className={styles.heroAudioMeta}>0:42</span>
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

        <section className={styles.section} id="why">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Why parents pay for Storypop</span>
            <h2 className={styles.sectionTitle}>
              Finally, screen time that <em>feels like a hug.</em>
            </h2>
            <p className={styles.sectionLede}>
              YouTube turns kids into passive watchers. Storypop turns them into storytellers,
              listeners, and the hero of their own bedtime.
            </p>
          </header>

          <div className={styles.benefits}>
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <article className={styles.benefitCard} key={title}>
                <div className={styles.benefitIcon}>
                  <Icon size={28} strokeWidth={2.4} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="how">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>How it works</span>
            <h2 className={styles.sectionTitle}>
              From idea to <em>illustrated book</em> in 3 steps.
            </h2>
            <p className={styles.sectionLede}>
              You set it up once. Your kid drives the rest — by talking, not tapping. No reading
              skills required.
            </p>
          </header>

          <div className={styles.steps}>
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <article className={styles.step} key={step.n}>
                  <span className={styles.stepNumber}>{step.n}</span>
                  <div className={`${styles.stepArt} ${step.art}`} aria-hidden="true">
                    <div className={styles.stepArtShimmer} />
                    <div className={styles.stepArtIconWrap}>
                      <StepIcon size={34} strokeWidth={2.2} className={styles.stepArtIcon} />
                    </div>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Story magic</span>
            <h2 className={styles.sectionTitle}>
              A bedtime <em>universe</em> they design themselves.
            </h2>
            <p className={styles.sectionLede}>
              Dragons, dinosaurs, mermaids, deep-sea explorers, fairy royalty. Or whatever your
              kid yells when they grab the mic. Every story is one-of-one.
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
                    sizes="(max-width: 619px) 50vw, (max-width: 919px) 33vw, 216px"
                    className={styles.themeImage}
                  />
                </div>
                <span className={styles.themeLabel}>{theme.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="pricing">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Pricing</span>
            <h2 className={styles.sectionTitle}>
              Cheaper than <em>one bedtime book a month.</em>
            </h2>
            <p className={styles.sectionLede}>
              Cancel anytime. We&apos;ll never charge you for a story your kid didn&apos;t love.
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
                {plan.badge ? <span className={styles.priceBadge}>{plan.badge}</span> : null}
                <h3 className={styles.priceTitle}>{plan.name}</h3>
                <div className={styles.priceAmount}>
                  {plan.price}
                  <span>{plan.cadence}</span>
                </div>
                <p className={styles.priceTagline}>{plan.tagline}</p>
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
                </Link>
                {plan.finePrint ? <p className={styles.priceFinePrint}>{plan.finePrint}</p> : null}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="faq">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>FAQ</span>
            <h2 className={styles.sectionTitle}>
              The questions <em>every parent</em> asks first.
            </h2>
          </header>

          <div className={styles.faq}>
            {FAQS.map((faq, i) => (
              <details className={styles.faqItem} key={faq.q} open={i === 0}>
                <summary>
                  <span>{faq.q}</span>
                  <span className={styles.faqIcon} aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta}>
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
            <p className={styles.finalCtaProof}>
              No credit card · Works on any phone, tablet, or laptop · Cancel anytime
            </p>
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
