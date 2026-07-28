import { useState } from 'react'
import { supabase } from './lib/supabase'
import Particles from './Particles'
import './App.css'

function scrollToWaitlist() {
  document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
}

const engines = [
  {
    n: '01',
    name: 'Memory Engine',
    tag: 'It stops forgetting',
    body: "One fact per file, an index your AI loads every session, links between them. Start a fresh chat and it already knows your project, your goals, and what you decided last week.",
  },
  {
    n: '02',
    name: 'The AI Manager',
    tag: 'It pushes back',
    body: "Claude stops being a chatbot and becomes a manager with opinions — one that tracks your plan, tells you when you're chasing a shiny object, and refuses to let you start a fifth thing.",
  },
  {
    n: '03',
    name: 'Build Pipeline',
    tag: 'Idea to live URL',
    body: 'Idea → spec → phased checklist → shipped. The same rails that took a real SaaS from "what if" to a paying-ready product, with a live URL inside 48 hours.',
  },
  {
    n: '04',
    name: 'Content Engine',
    tag: 'The build markets itself',
    body: "Every build step becomes a post. Hooks, captions, a batch-recording system — so the thing you're making is also the thing that gets you seen.",
  },
]

const steps = [
  { n: '01', name: 'Get the vault', body: 'One download. Open it in Obsidian, point Claude at it, done in ten minutes.' },
  { n: '02', name: 'Run the system', body: 'Idea → spec → phased checklist. The manager keeps the plan and tells you when you’re drifting.' },
  { n: '03', name: 'Ship the thing', body: 'A live URL, auth, payments — the same rails that put a real SaaS on the internet.' },
]

const notThis = [
  { not: 'Not video lectures', but: 'files you actually open' },
  { not: 'Not a folder of notes', but: 'a vault Claude reads' },
  { not: 'Not a subscription', but: 'one payment, yours forever' },
  { not: 'Not theory', but: 'the exact setup that shipped ClipScry' },
  { not: 'Not stale screenshots', but: 'this site was built with it' },
]

const faqs = [
  {
    q: 'Is this a course?',
    a: "No. It's a vault — real files you open in Obsidian and start using. There's no 6-hour video course to sit through. You point Claude at it and it works.",
  },
  {
    q: 'Do I need to know how to code?',
    a: "No. I didn't when I started. That's the point of the AI Manager — it writes the code, you make the decisions. You'll still need judgment and patience.",
  },
  {
    q: 'Will this make me money?',
    a: "I have no idea, and anyone who promises you that is lying. It's a system for building and shipping without losing the thread. What you build with it is on you.",
  },
  {
    q: "What does it cost to run?",
    a: 'Obsidian is free. Claude is a paid subscription. Everything else in the stack has a free tier that carries you until you actually have users.',
  },
  {
    q: 'Why is it not out yet?',
    a: "Because I'm still using it to build in public, and I'd rather ship it right than fast. It drops in August 2026. Join the list and you'll get it that day, at founder price.",
  },
]

/**
 * The vault screenshot section. Renders nothing at all until
 * public/vault-graph.png exists — so this can ship live before the
 * screenshot is taken without ever showing a broken box to a visitor.
 */
function VaultShot() {
  const [missing, setMissing] = useState(false)
  if (missing) return null

  return (
    <section className="section">
      <p className="kicker">What it looks like</p>
      <h2>Not a folder of notes.<br />A vault that gets <span className="accent">read</span>.</h2>
      <figure className="shot">
        <div className="shot-bar" aria-hidden="true">
          <span className="dot dot-r" /><span className="dot dot-y" /><span className="dot dot-g" />
          <span className="shot-title">the-2am-system · 34 notes · 99 links</span>
        </div>
        <div className="shot-body">
          <img
            src="/vault-graph.svg"
            alt="Link graph of The 2AM System vault: 34 notes connected by 99 links"
            onError={() => setMissing(true)}
          />
        </div>
      </figure>
      <p className="shot-note">
        Every note links to the others. Claude walks that web before it writes a single line.
      </p>
    </section>
  )
}

function Waitlist() {
  const [email, setEmail] = useState('')
  const [building, setBuilding] = useState('')
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.trim(), building: building.trim() || null, source: 'site' })

    if (error) {
      // a duplicate email is still a success from the visitor's point of view
      if (error.code === '23505') {
        setState('done')
        setMsg("You're already on the list 🌒")
        return
      }
      setState('error')
      setMsg("Couldn't save that — try again in a moment.")
      return
    }
    setState('done')
    setMsg("You're on the list 🌒 I'll email you the day it drops.")
  }

  if (state === 'done') {
    return (
      <div className="wl-done">
        <p className="wl-done-msg">{msg}</p>
        <p className="wl-note">No spam. One email when it's ready.</p>
      </div>
    )
  }

  return (
    <form className="wl-form" onSubmit={submit}>
      <input
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Your email"
      />
      <input
        type="text"
        placeholder="What are you building? (optional)"
        value={building}
        onChange={(e) => setBuilding(e.target.value)}
        aria-label="What are you building"
      />
      <button type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? 'Joining…' : 'Join the waitlist →'}
      </button>
      {state === 'error' && <p className="wl-error">{msg}</p>}
      <p className="wl-note">No spam. One email when it's ready.</p>
    </form>
  )
}

export default function App() {
  return (
    <div className="page">
      <div className="grid-bg" aria-hidden="true" />
      <Particles />

      <nav className="nav">
        <span className="logo">
          <span className="logo-mark">&gt;_</span> The 2AM System
        </span>
        <button type="button" className="nav-btn" onClick={scrollToWaitlist}>Join waitlist</button>
      </nav>

      <header className="hero">
        <p className="eyebrow">A Claude-powered build system · Dropping August 2026</p>
        <h1>
          Your AI forgets everything<br />you told it <span className="accent">yesterday.</span>
        </h1>
        <p className="sub">
          So you explain your project again. And again. Every session starts from zero,
          every good decision gets lost, and the thing you were building quietly dies in
          a folder. This is the fix: one Obsidian vault, wired to Claude, that remembers
          everything and actually builds with you.
        </p>
        <button type="button" className="cta" onClick={scrollToWaitlist}>Get it when it drops →</button>
        <p className="cta-note">Built at 2am, in the dark, by one person. Not a course.</p>
      </header>

      <section className="section">
        <p className="kicker">The problem</p>
        <h2>You don't have a discipline problem.<br />You have a memory problem.</h2>
        <div className="pain-grid">
          <div className="pain"><span className="pain-x">✕</span><p>You re-explain your entire project at the start of every AI session.</p></div>
          <div className="pain"><span className="pain-x">✕</span><p>Decisions you made last week are gone. So you make them again, differently.</p></div>
          <div className="pain"><span className="pain-x">✕</span><p>Five half-finished projects, because nothing holds the thread between days.</p></div>
          <div className="pain"><span className="pain-x">✕</span><p>Your notes are a graveyard. You write them and never open them again.</p></div>
        </div>
      </section>

      <section className="section">
        <p className="kicker">What's inside</p>
        <h2>Four engines. One vault.</h2>
        <div className="engines">
          {engines.map((e) => (
            <article className="engine" key={e.n}>
              <span className="engine-n">{e.n}</span>
              <div className="engine-text">
                <h3>{e.name}</h3>
                <p className="engine-tag">{e.tag}</p>
                <p className="engine-body">{e.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="kicker">How it runs</p>
        <h2>Three steps. That's the whole loop.</h2>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step-wrap" key={s.n}>
              <article className="step">
                <span className="step-n">{s.n}</span>
                <div>
                  <h3>{s.name}</h3>
                  <p>{s.body}</p>
                </div>
              </article>
              {i < steps.length - 1 && <span className="step-arrow" aria-hidden="true">↓</span>}
            </div>
          ))}
        </div>
      </section>

      <VaultShot />

      <section className="section proof">
        <p className="kicker">The receipt</p>
        <h2>I didn't write this system. I ran it.</h2>
        <p className="proof-body">
          Everything in this vault came out of actually building{' '}
          <a href="https://www.clipscry.com" target="_blank" rel="noreferrer">ClipScry</a> —
          a real, live SaaS that transcribes raw footage so you can search what you said and
          jump to the exact second. Auth, database, payments, custom domain, the whole thing.
          Solo, from a dark room, with no CS degree.
        </p>
        <p className="proof-body">
          The system is the part that made it survivable. It's still running right now,
          building the next thing.
        </p>
        <a className="proof-link" href="https://www.clipscry.com" target="_blank" rel="noreferrer">
          See what it built →
        </a>
      </section>

      <section className="section">
        <p className="kicker">To be clear</p>
        <h2>Why this isn't <span className="accent">another course</span>.</h2>
        <ul className="not-list">
          {notThis.map((r, i) => (
            <li key={r.not}>
              <span className="not-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="not-a">{r.not}</span>
              <span className="not-arrow" aria-hidden="true">→</span>
              <span className="not-b">{r.but}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" id="waitlist">
        <div className="price-card">
          <p className="kicker">When it drops</p>
          <div className="price-row">
            <span className="price">$27</span>
            <span className="price-old">$79</span>
          </div>
          <p className="price-note">Founder price for everyone on the list. One payment, lifetime updates.</p>

          <ul className="price-list">
            <li>The complete pre-built vault — open it and go</li>
            <li>The memory system, ready to wire to Claude</li>
            <li>Manager prompts, build checklists, spec templates</li>
            <li>The content engine that turns building into posts</li>
          </ul>

          <div className="divider" />

          <p className="wl-head">It isn't finished yet — and I won't take your money for something that doesn't exist.</p>
          <p className="wl-sub">Dropping <strong>August 2026</strong>. Get on the list and you'll get it the day it's done, at founder price.</p>
          <Waitlist />
        </div>
      </section>

      <section className="section">
        <p className="kicker">Straight answers</p>
        <h2>Questions</h2>
        <div className="faqs">
          {faqs.map((f) => (
            <details className="faq" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p className="footer-mark"><span className="logo-mark">&gt;_</span></p>
        <p>The 2AM System — built in the dark, shipped anyway.</p>
        <p className="footer-sub">
          <a href="https://instagram.com/shipsat2am" target="_blank" rel="noreferrer">@shipsat2am</a>
          {' · '}
          <a href="https://www.clipscry.com" target="_blank" rel="noreferrer">ClipScry</a>
        </p>
      </footer>
    </div>
  )
}
