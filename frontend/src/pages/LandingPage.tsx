import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthModal } from '../components/auth/AuthModal'

const steps = [
  {
    number: '01',
    title: 'Choose a Template',
    description: 'Pick from built-in templates for common bug types, or define your own fields. Every team works differently — BugScribe adapts.',
  },
  {
    number: '02',
    title: 'Describe the Bug',
    description: 'Fill a structured form or just write freely. Attach a log file if you have one. No formatting required.',
  },
  {
    number: '03',
    title: 'Copy a Ready-to-Use Report',
    description: 'Get a clean, professional bug report instantly. Paste it straight into Jira, Linear, Monday, or any tool you use.',
  },
]

const testimonials = [
  {
    quote: 'BugScribe cut the time I spend writing bug reports in half. The AI picks up exactly what I mean, even when I describe things messily.',
    name: 'Sarah K.',
    role: 'QA Lead, SaaS startup',
    initials: 'SK',
  },
  {
    quote: "Our whole team switched to BugScribe. Reports are consistent now — no more 'what does this even mean' moments during triage.",
    name: 'Daniel M.',
    role: 'Engineering Manager',
    initials: 'DM',
  },
  {
    quote: "I used to dread writing bug reports. Now I just paste my notes and it's done. One of those tools you don't know you need until you have it.",
    name: 'Ayla R.',
    role: 'Product Designer',
    initials: 'AR',
  },
]

const faqs = [
  {
    question: 'Do I need experience writing bug reports?',
    answer: "Not at all. BugScribe is designed for anyone — describe what happened in plain language and the AI structures it into a professional report.",
  },
  {
    question: 'Can I use my own template structure?',
    answer: 'Yes. Create fully custom templates with exactly the fields your team uses. They are saved to your account and available across devices.',
  },
  {
    question: 'Does it work with Jira, Linear, or Monday?',
    answer: "BugScribe generates clean plain-text output ready to paste into any bug tracker or project management tool.",
  },
  {
    question: 'Is my data private?',
    answer: 'Yes. Your reports and templates are scoped to your account only. We do not use your data to train any models.',
  },
  {
    question: 'Is there a free plan?',
    answer: 'Yes — get started for free with no credit card required.',
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-medium text-white/90 group-hover:text-white transition-colors">{question}</span>
        <svg
          className={`h-4 w-4 text-white/40 shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="pb-5 text-sm text-white/50 leading-relaxed">{answer}</p>
      )}
    </div>
  )
}

const RAW_TEXT = `login button not working on safari —
after typing credentials it just freezes,
no error, nothing. happens every time
on both ios and mac.`

const REPORT_SECTIONS = [
  { label: 'Title',              value: 'Login button unresponsive on Safari after first attempt' },
  { label: 'Environment',        value: 'Safari 17 · iOS 17.4 · macOS Sonoma' },
  { label: 'Steps to Reproduce', value: '1. Open login page in Safari\n2. Enter valid credentials\n3. Click login — button freezes' },
  { label: 'Actual Behavior',    value: 'Button becomes unresponsive. No error shown. No network request fired.' },
]

// Loop timing (ms)
const CHAR_INTERVAL   = 38
const PAUSE_AFTER_TYPE = 500
const COLLAPSE_DURATION = 500
const SECTION_INTERVAL = 650
const PAUSE_FULL       = 2200
const FADE_OUT         = 500

function ReportCard() {
  const [typedText, setTypedText]       = useState('')
  const [inputVisible, setInputVisible] = useState(true)
  const [visibleCount, setVisibleCount] = useState(0)
  const [cardVisible, setCardVisible]   = useState(true)
  const [statusLabel, setStatusLabel]   = useState('waiting for input…')

  useEffect(() => {
    let cancelled = false
    const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

    async function runLoop() {
      while (!cancelled) {
        setTypedText('')
        setInputVisible(true)
        setVisibleCount(0)
        setCardVisible(true)
        setStatusLabel('typing…')

        for (let i = 1; i <= RAW_TEXT.length; i++) {
          await wait(CHAR_INTERVAL)
          if (cancelled) return
          setTypedText(RAW_TEXT.slice(0, i))
        }

        await wait(PAUSE_AFTER_TYPE)
        if (cancelled) return
        setStatusLabel('analyzing…')

        setInputVisible(false)
        await wait(COLLAPSE_DURATION)
        if (cancelled) return

        setStatusLabel('generating report…')
        for (let i = 1; i <= REPORT_SECTIONS.length; i++) {
          await wait(i === 1 ? 200 : SECTION_INTERVAL)
          if (cancelled) return
          setVisibleCount(i)
        }

        setStatusLabel('report ready')

        await wait(PAUSE_FULL)
        if (cancelled) return

        setCardVisible(false)
        await wait(FADE_OUT + 200)
        if (cancelled) return
      }
    }

    runLoop()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      <div className="absolute inset-0 rounded-2xl bg-cyan-500/[0.08] blur-2xl scale-105 pointer-events-none" />

      <div
        className="relative rounded-2xl border border-white/10 overflow-hidden"
        style={{
          background: 'rgba(8, 15, 30, 0.88)',
          backdropFilter: 'blur(24px)',
          opacity: cardVisible ? 1 : 0,
          transition: `opacity ${FADE_OUT}ms ease`,
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
            </div>
            <span className="text-[11px] font-mono text-white/25">bugscribe.app</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${statusLabel === 'report ready' ? 'bg-cyan-400' : statusLabel === 'analyzing…' || statusLabel === 'generating report…' ? 'bg-amber-400 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[11px] font-mono text-white/25">{statusLabel}</span>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6 space-y-4 overflow-hidden" style={{ height: '350px' }}>
          <div
            style={{
              maxHeight: inputVisible ? '140px' : '0px',
              opacity: inputVisible ? 1 : 0,
              overflow: 'hidden',
              transition: `max-height ${COLLAPSE_DURATION}ms ease, opacity ${COLLAPSE_DURATION}ms ease`,
            }}
          >
            <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.12em] mb-2">Free text input</p>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-lg px-4 py-3 font-mono text-[12px] text-white/50 leading-relaxed whitespace-pre-wrap min-h-[72px]">
              {typedText}
              {inputVisible && <span className="inline-block w-px h-[13px] bg-cyan-400/70 ml-px align-middle animate-pulse" />}
            </div>
          </div>

          <div
            className="transition-opacity duration-500"
            style={{ opacity: visibleCount > 0 ? 1 : 0 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[10px] font-mono text-cyan-400/40 uppercase tracking-widest">structured report</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>
          </div>

          <div className="space-y-4">
            {REPORT_SECTIONS.map((section, i) => (
              <div
                key={section.label}
                style={{
                  opacity: visibleCount > i ? 1 : 0,
                  transform: visibleCount > i ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.45s ease, transform 0.45s ease',
                }}
              >
                <p className="text-[10px] font-mono text-cyan-400/50 uppercase tracking-[0.12em] mb-1.5">
                  {section.label}
                </p>
                <p className="text-[13px] text-white/70 leading-relaxed whitespace-pre-line">
                  {section.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/[0.05] mx-6 mb-5 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500/40 rounded-full"
            style={{
              width: `${(visibleCount / REPORT_SECTIONS.length) * 100}%`,
              transition: visibleCount > 0 ? `width ${SECTION_INTERVAL * REPORT_SECTIONS.length}ms linear` : 'none',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup' } | null>(null)

  const openAuth = (mode: 'login' | 'signup') => {
    if (user) {
      navigate('/app')
    } else {
      setAuthModal({ open: true, mode })
    }
  }

  const scrollToSteps = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing-scroll bg-[#05080f] text-white font-sans">

      {/* Auth Modal */}
      {authModal?.open && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal(null)}
        />
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-[#05080f]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 bg-cyan-500 rounded flex items-center justify-center text-[#05080f] text-xs font-bold">B</div>
            <span className="font-semibold text-white tracking-tight">BugScribe</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/50">
              <button onClick={scrollToSteps} className="hover:text-white transition-colors">How It Works</button>
              <button onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Testimonials</button>
              <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">FAQ</button>
            </nav>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuth('login')}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="text-sm font-medium bg-cyan-500 text-[#05080f] px-4 py-1.5 rounded hover:bg-cyan-400 transition-colors flex items-center gap-1.5"
              >
                Get Started <span className="text-xs">→</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-cyan-400/80 tracking-widest uppercase">System operational</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-serif font-bold leading-tight mb-6">
              The art of{' '}
              <span className="italic text-cyan-400">precise</span>{' '}
              bug reporting.
            </h1>

            <p className="text-lg text-white/50 mb-10 leading-relaxed">
              Describe the bug your way — structured form or free text — and BugScribe turns it into a clear, professional report ready to paste anywhere.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={() => openAuth('signup')}
                className="px-6 py-2.5 bg-cyan-500 text-[#05080f] text-sm font-semibold rounded hover:bg-cyan-400 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={scrollToSteps}
                className="px-6 py-2.5 border border-white/20 text-white/70 text-sm font-medium rounded hover:border-white/40 hover:text-white transition-colors"
              >
                See How It Works
              </button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <ReportCard />

            <div className="bug-climb pointer-events-none select-none absolute -right-6 bottom-0" aria-hidden="true">
              <svg width="22" height="36" viewBox="0 0 22 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="bug-glow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <g filter="url(#bug-glow)" opacity="0.7">
                  <line x1="8" y1="3" x2="3" y2="0" stroke="#22d3ee" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="14" y1="3" x2="19" y2="0" stroke="#22d3ee" strokeWidth="1" strokeLinecap="round"/>
                  <ellipse cx="11" cy="5" rx="4" ry="3" fill="#0e7490" stroke="#22d3ee" strokeWidth="0.8"/>
                  <ellipse cx="11" cy="16" rx="5.5" ry="8" fill="#0e7490" stroke="#22d3ee" strokeWidth="0.8"/>
                  <line x1="5.5" y1="16" x2="16.5" y2="16" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.5"/>
                  <line x1="5.5" y1="11" x2="1" y2="9"  stroke="#22d3ee" strokeWidth="0.9" strokeLinecap="round"/>
                  <line x1="16.5" y1="11" x2="21" y2="9" stroke="#22d3ee" strokeWidth="0.9" strokeLinecap="round"/>
                  <line x1="5.5" y1="15" x2="1" y2="14"  stroke="#22d3ee" strokeWidth="0.9" strokeLinecap="round"/>
                  <line x1="16.5" y1="15" x2="21" y2="14" stroke="#22d3ee" strokeWidth="0.9" strokeLinecap="round"/>
                  <line x1="5.5" y1="20" x2="1" y2="22"  stroke="#22d3ee" strokeWidth="0.9" strokeLinecap="round"/>
                  <line x1="16.5" y1="20" x2="21" y2="22" stroke="#22d3ee" strokeWidth="0.9" strokeLinecap="round"/>
                  <line x1="11" y1="24" x2="11" y2="28" stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.5"/>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">Three steps to a perfect report</h2>
          <p className="text-white/40 text-lg max-w-lg">
            From rough notes to a polished bug report — in under a minute.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 rounded-xl overflow-hidden">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-[#05080f] p-10 hover:bg-white/[0.03] transition-colors group"
            >
              <p className="font-mono text-xs text-cyan-400/60 mb-6 tracking-widest">{step.number}</p>
              <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-cyan-400 transition-colors">{step.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div
          className="rounded-xl border border-white/10 px-12 py-16 text-center relative overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at top, rgba(6,182,212,0.12) 0%, transparent 70%)' }}
        >
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">
            Ready to write better bug reports?
          </h2>
          <p className="text-white/40 mb-8 text-lg">Join teams who ship faster with clearer communication.</p>
          <button
            onClick={() => openAuth('signup')}
            className="inline-block px-8 py-3 bg-cyan-500 text-[#05080f] font-semibold text-sm rounded hover:bg-cyan-400 transition-colors"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">What teams are saying</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white/[0.03] border border-white/10 rounded-xl p-8 hover:border-white/20 transition-colors flex flex-col gap-6"
            >
              <p className="text-sm text-white/60 leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-mono text-cyan-400">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/30">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">Frequently asked questions</h2>
        </div>
        <div>
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-6 w-6 bg-cyan-500 rounded flex items-center justify-center text-[#05080f] text-xs font-bold">B</div>
              <span className="font-semibold text-white">BugScribe</span>
            </div>
            <p className="text-sm text-white/30 leading-relaxed max-w-xs">
              Crafted for engineering teams who value clarity, speed, and professional communication.
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4">Product</p>
            <div className="flex flex-col gap-2.5 text-sm text-white/50">
              <button onClick={scrollToSteps} className="text-left hover:text-white transition-colors">How It Works</button>
              <button onClick={() => openAuth('signup')} className="text-left hover:text-white transition-colors">Get Started</button>
            </div>
          </div>
          <div>
            <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4">Account</p>
            <div className="flex flex-col gap-2.5 text-sm text-white/50">
              <button onClick={() => openAuth('login')} className="text-left hover:text-white transition-colors">Log in</button>
              <button onClick={() => openAuth('signup')} className="text-left hover:text-white transition-colors">Sign up</button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-8 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-white/20">System operational</span>
        </div>
      </footer>

    </div>
  )
}
