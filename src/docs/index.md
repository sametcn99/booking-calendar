---
layout: home

hero:
  name: "BOOKING CALENDAR"
  text: "Self-Hosted Appointment Management"
  tagline: "A modern, open-source, and privacy-focused booking system for professionals who value control and simplicity."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/sametcn99/booking-calendar

features:
  - title: 🔒 Self-Hosted Privacy
    details: Your data, your rules. SQLite-based persistence ensures easy backups and absolute control over your information.
  - title: 📱 Native PWA Experience
    details: Fully installable as an app. Manage your calendar with a fast, responsive interface on any device.
  - title: ⚡ Instant Notifications
    details: Real-time web push and email alerts. Keep your guests and yourself updated without delay.
  - title: 🔗 Extensible Webhooks
    details: HMAC secured webhooks for seamless integration with Discord, Slack, or your automation workflows.
  - title: 📅 Calendar Sync
    details: Full ICS support. Sync your appointments with Google, Apple, or Outlook effortlessly.
  - title: 🥟 Optimized for Bun
    details: Built for high-performance with Bun, React, and TypeORM. Minimal footprint, maximum speed.
---

<div class="home-content">

  <!-- ─── STATS BAR ─── -->
  <section class="stats-bar anim-fade" style="--delay: 0.1s">
    <div class="stat-item">
      <span class="stat-value">< 30s</span>
      <span class="stat-label">Docker Deploy</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">0 $</span>
      <span class="stat-label">100% Free & Open</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">PWA</span>
      <span class="stat-label">Any Device</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">i18n</span>
      <span class="stat-label">Multi-Language</span>
    </div>
  </section>

  <!-- ─── STEPS ─── -->
  <section class="section">
    <h2 class="section-title anim-fade" style="--delay: 0.15s">Launch in Minutes</h2>
    <p class="section-subtitle anim-fade" style="--delay: 0.2s">Three simple steps to your own booking system.</p>
    <div class="steps-container">
      <div class="step-card anim-slide-up" style="--delay: 0.25s">
        <div class="step-number">1</div>
        <h3>Clone</h3>
        <p>Get the source code and install dependencies.</p>
        <code class="step-code">git clone & bun install</code>
      </div>
      <div class="step-connector anim-fade" style="--delay: 0.3s">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
      </div>
      <div class="step-card anim-slide-up" style="--delay: 0.35s">
        <div class="step-number">2</div>
        <h3>Configure</h3>
        <p>Set environment variables and preferences.</p>
        <code class="step-code">cp .env.example .env</code>
      </div>
      <div class="step-connector anim-fade" style="--delay: 0.4s">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
      </div>
      <div class="step-card anim-slide-up" style="--delay: 0.45s">
        <div class="step-number">3</div>
        <h3>Deploy</h3>
        <p>Run with Docker or Bun and accept bookings.</p>
        <code class="step-code">docker compose up -d</code>
      </div>
    </div>
  </section>

  <!-- ─── WHY SECTION ─── -->
  <section class="section">
    <h2 class="section-title anim-fade" style="--delay: 0.15s">Why Booking Calendar?</h2>
    <p class="section-subtitle anim-fade" style="--delay: 0.2s">Everything you need, nothing you don't.</p>
    <div class="why-grid">
      <div class="why-card anim-slide-up" style="--delay: 0.25s">
        <div class="why-icon">🛡️</div>
        <h3>No Third-Party Lock-in</h3>
        <p>Run on your own server. No subscription fees, no vendor dependency. Your calendar data stays with you — always.</p>
      </div>
      <div class="why-card anim-slide-up" style="--delay: 0.3s">
        <div class="why-icon">🎨</div>
        <h3>Developer Friendly</h3>
        <p>Clean TypeScript codebase with Controller/Service/Repository layers. REST API with OpenAPI docs. Easy to extend.</p>
      </div>
      <div class="why-card anim-slide-up" style="--delay: 0.35s">
        <div class="why-icon">🚀</div>
        <h3>Production Ready</h3>
        <p>Docker support, rate limiting, HMAC webhooks, email with ICS, push notifications — everything wired up out of the box.</p>
      </div>
    </div>
  </section>

  <!-- ─── ARCHITECTURE ─── -->
  <section class="section">
    <h2 class="section-title anim-fade" style="--delay: 0.15s">Modern Architecture</h2>
    <p class="section-subtitle anim-fade" style="--delay: 0.2s">Built with battle-tested tools, served from a single process.</p>
    <div class="tech-grid">
      <div class="tech-box anim-slide-up" style="--delay: 0.25s">
        <span class="tech-label">Frontend</span>
        <div class="tech-items">
          <span class="tech-tag">React 19</span>
          <span class="tech-tag">TypeScript</span>
          <span class="tech-tag">Base Web</span>
          <span class="tech-tag">Vite</span>
        </div>
      </div>
      <div class="tech-box anim-slide-up" style="--delay: 0.3s">
        <span class="tech-label">Backend</span>
        <div class="tech-items">
          <span class="tech-tag">Bun</span>
          <span class="tech-tag">TypeORM</span>
          <span class="tech-tag">SQLite</span>
          <span class="tech-tag">Nodemailer</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ─── CTA ─── -->
  <section class="section">
    <div class="cta-card anim-slide-up" style="--delay: 0.2s">
      <h2>Ready to take control of your calendar?</h2>
      <p>Deploy your own booking system in minutes. No credit card, no vendor lock-in — just your server, your data.</p>
      <div class="cta-actions">
        <a href="/guide/getting-started" class="cta-button primary">Get Started Now</a>
        <a href="https://github.com/sametcn99/booking-calendar" class="cta-button secondary" target="_blank" rel="noopener">⭐ Star on GitHub</a>
      </div>
    </div>
  </section>

</div>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const elements = document.querySelectorAll('.anim-fade, .anim-slide-up')
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('anim-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )
  
  elements.forEach((el) => observer.observe(el))
})
</script>

<style>
/* ─── Variables ─── */
:root {
  --accent: #8b5cf6;
  --accent-soft: rgba(139, 92, 246, 0.12);
  --grd: linear-gradient(135deg, #000000 0%, #1e1b4b 50%, #581c87 100%);
}

/* ─── Intersection Observer Animations ─── */
.anim-fade,
.anim-slide-up {
  opacity: 0;
  transition: opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1),
              transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: var(--delay, 0s);
}

.anim-fade {
  transform: translateY(12px);
}

.anim-slide-up {
  transform: translateY(36px);
}

.anim-visible {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

/* ─── Layout ─── */
.home-content {
  max-width: 1152px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.section {
  margin-bottom: 96px;
}

.section-title {
  text-align: center;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  margin-bottom: 12px;
  background: var(--grd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
}

.section-subtitle {
  text-align: center;
  font-size: 1.1rem;
  color: var(--vp-c-text-3);
  margin-bottom: 48px;
  font-weight: 500;
}

/* ─── Stats Bar ─── */
.stats-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  padding: 28px 40px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  margin-bottom: 96px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: var(--vp-c-divider);
}

/* ─── Steps ─── */
.steps-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.step-card {
  flex: 1 1 260px;
  max-width: 320px;
  padding: 32px 24px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative;
}

.step-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 20px 48px -12px rgba(124, 58, 237, 0.2);
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--grd);
  color: white;
  border-radius: 14px;
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 20px;
  box-shadow: 0 6px 16px -4px rgba(124, 58, 237, 0.4);
}

.step-card h3 {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--vp-c-text-1);
}

.step-card p {
  color: var(--vp-c-text-2);
  line-height: 1.55;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.step-code {
  display: inline-block;
  padding: 6px 14px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-family: "Fira Code", "JetBrains Mono", monospace;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
}

.step-connector {
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

/* ─── Why Section ─── */
.why-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.why-card {
  padding: 32px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative;
  overflow: hidden;
}

/* Shimmer effect */
.why-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(139, 92, 246, 0.04) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
  pointer-events: none;
}

.why-card:hover::after {
  left: 100%;
}

.why-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 16px 36px -10px rgba(124, 58, 237, 0.18);
}

.why-icon {
  font-size: 2rem;
  margin-bottom: 16px;
}

.why-card h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--vp-c-text-1);
}

.why-card p {
  color: var(--vp-c-text-2);
  line-height: 1.65;
  font-size: 0.9rem;
}

/* ─── Tech Stack ─── */
.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.tech-box {
  padding: 24px;
  background: var(--accent-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
}

.tech-box:hover {
  border-color: rgba(139, 92, 246, 0.3);
}

.tech-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.tech-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  padding: 5px 12px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  transition: all 0.25s ease;
}

.tech-tag:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

/* ─── CTA ─── */
.cta-card {
  padding: 72px 40px;
  background: var(--grd);
  border-radius: 28px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

/* Animated mesh overlay */
.cta-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 30% 0%,
    rgba(255, 255, 255, 0.08) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.cta-card h2 {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  color: white;
  margin-bottom: 16px;
  -webkit-text-fill-color: white !important;
  position: relative;
}

.cta-card p {
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 36px;
  max-width: 580px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  position: relative;
}

.cta-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  text-decoration: none !important;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.cta-button.primary {
  background: white;
  color: #6d28d9;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.cta-button.primary:hover {
  box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.45), 0 10px 15px -5px rgba(0, 0, 0, 0.3);
  color: #4c1d95;
}

.cta-button.secondary {
  background: rgba(255, 255, 255, 0.12);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
}

.cta-button.secondary:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.45);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
  color: white !important;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .stats-bar {
    gap: 20px;
    padding: 24px 20px;
  }

  .stat-divider {
    display: none;
  }

  .step-connector {
    display: none;
  }

  .steps-container {
    flex-direction: column;
  }

  .step-card {
    max-width: 100%;
  }

  .cta-card {
    padding: 48px 24px;
  }
}

@media (max-width: 480px) {
  .home-content {
    padding: 16px 16px 60px;
  }

  .section {
    margin-bottom: 64px;
  }
}
</style>
