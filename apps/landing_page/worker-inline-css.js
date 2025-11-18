export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle analytics endpoint
    if (pathname === '/api/analytics' && request.method === 'POST') {
      return handleAnalyticsEvent(request, env);
    }

    // Serve main page with inline CSS (backup approach)
    if (pathname === '/' || pathname === '/index.html') {
      return new Response(getInlineHTML(), {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      });
    }

    // Still serve CSS as separate file for external requests
    if (pathname === '/styles.css') {
      return new Response(getCSSContent(), {
        headers: {
          'Content-Type': 'text/css',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // Health check endpoint
    if (pathname === '/health') {
      return new Response('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 404 for other paths
    return new Response('Not Found', { status: 404 });
  }
};

function getCSSContent() {
  return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    color: #e0e0e0;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
    overflow-x: hidden;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
header {
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
    border-bottom: 1px solid #333;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
}

.logo {
    font-size: 1.8rem;
    font-weight: 700;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
    background-size: 200% 200%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

.nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
}

.nav-links a {
    color: #e0e0e0;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-links a:hover {
    color: #4ecdc4;
}

/* Hero Section */
.hero {
    padding: 120px 0 80px;
    text-align: center;
    position: relative;
}

.hero h1 {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.hero p {
    font-size: 1.3rem;
    color: #b0b0b0;
    margin-bottom: 2.5rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.cta-button {
    display: inline-block;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    color: white;
    padding: 15px 40px;
    text-decoration: none;
    border-radius: 30px;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
}

.cta-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(255, 107, 107, 0.4);
}

/* Features Section */
.features {
    padding: 80px 0;
    background: rgba(255, 255, 255, 0.02);
}

.features h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #ffffff;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
}

.feature-card {
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
    border-color: #4ecdc4;
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
}

.feature-card h3 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    color: #4ecdc4;
}

.feature-card p {
    color: #b0b0b0;
    line-height: 1.6;
}

/* Tiers Section */
.tiers {
    padding: 80px 0;
}

.tiers h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #ffffff;
}

.tiers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.tier-card {
    background: rgba(255, 255, 255, 0.05);
    padding: 2.5rem;
    border-radius: 20px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    position: relative;
    transition: all 0.3s ease;
}

.tier-card.featured {
    border-color: #4ecdc4;
    background: rgba(78, 205, 196, 0.1);
}

.tier-card.featured::before {
    content: 'MOST POPULAR';
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: #4ecdc4;
    color: #000;
    padding: 5px 20px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
}

.tier-card:hover {
    transform: translateY(-10px);
    border-color: #4ecdc4;
}

.tier-card h3 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #4ecdc4;
}

.tier-price {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.5rem;
}

.tier-price small {
    font-size: 1rem;
    color: #b0b0b0;
}

.tier-features {
    list-style: none;
    margin: 2rem 0;
}

.tier-features li {
    padding: 0.5rem 0;
    color: #e0e0e0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tier-features li::before {
    content: '✓';
    color: #4ecdc4;
    font-weight: 700;
}

.tier-button {
    width: 100%;
    padding: 15px;
    background: transparent;
    color: #4ecdc4;
    border: 2px solid #4ecdc4;
    border-radius: 10px;
    font-weight: 600;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.tier-button:hover, .tier-card.featured .tier-button {
    background: #4ecdc4;
    color: #000;
}

/* Footer */
footer {
    background: rgba(0, 0, 0, 0.9);
    padding: 3rem 0 1rem;
    border-top: 1px solid #333;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h4 {
    color: #4ecdc4;
    margin-bottom: 1rem;
    font-size: 1.1rem;
}

.footer-section a {
    color: #b0b0b0;
    text-decoration: none;
    display: block;
    margin-bottom: 0.5rem;
    transition: color 0.3s ease;
}

.footer-section a:hover {
    color: #4ecdc4;
}

.footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid #333;
    color: #666;
}

/* Responsive Design */
@media (max-width: 768px) {
    .hero h1 {
        font-size: 2.5rem;
    }

    .hero p {
        font-size: 1.1rem;
    }

    .nav-links {
        display: none;
    }

    .features-grid,
    .tiers-grid {
        grid-template-columns: 1fr;
    }

    .container {
        padding: 0 15px;
    }

    .hero {
        padding: 100px 0 60px;
    }

    .features,
    .tiers {
        padding: 60px 0;
    }
}`;
}

function getInlineHTML() {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BacklogBlitz - Organize Your Gaming Life</title>
    <meta name="description" content="BacklogBlitz helps gamers organize their games across all stores, track their backlog, and discover what to play next with AI-powered recommendations.">

    <!-- Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');

        // Custom event tracking
        function trackEvent(action, category, label) {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });

            // Also send to our analytics endpoint
            fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: action,
                    category: category,
                    label: label,
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    referrer: document.referrer
                })
            }).catch(console.error);
        }
    </script>

    <style>
\${getCSSContent()}
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <div class="logo">BacklogBlitz</div>
            <ul class="nav-links">
                <li><a href="#features" onclick="trackEvent('click', 'navigation', 'features')">Features</a></li>
                <li><a href="#pricing" onclick="trackEvent('click', 'navigation', 'pricing')">Pricing</a></li>
                <li><a href="#about" onclick="trackEvent('click', 'navigation', 'about')">About</a></li>
                <li><a href="#contact" onclick="trackEvent('click', 'navigation', 'contact')">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <h1>Conquer Your Gaming Backlog</h1>
                <p>Organize games from Steam, GOG, Epic, and MyAbandonware in one place. Get AI-powered recommendations for your next gaming adventure.</p>
                <a href="#pricing" class="cta-button" onclick="trackEvent('click', 'cta', 'hero_get_started')">Get Started Today</a>
            </div>
        </section>

        <section id="features" class="features">
            <div class="container">
                <h2>Why Choose BacklogBlitz?</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <span class="feature-icon">🎮</span>
                        <h3>Cross-Store Integration</h3>
                        <p>Connect Steam, GOG, Epic Games, MyAbandonware, and more. All your games in one unified library.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">🎯</span>
                        <h3>Smart Backlog Management</h3>
                        <p>Flag games as played or want-to-play. Sort and filter your backlog with intelligent categorization.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">🤖</span>
                        <h3>AI-Powered Recommendations</h3>
                        <p>Get personalized suggestions for your next game based on your preferences and gaming history.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">📊</span>
                        <h3>Gaming Analytics</h3>
                        <p>Track your gaming habits, completion rates, and discover patterns in your gaming preferences.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">🔍</span>
                        <h3>Discovery Engine</h3>
                        <p>Find hidden gems in your library and discover games you forgot you owned.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">📱</span>
                        <h3>Cross-Platform Sync</h3>
                        <p>Access your gaming library and recommendations across all your devices.</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="pricing" class="tiers">
            <div class="container">
                <h2>Choose Your Gaming Journey</h2>
                <div class="tiers-grid">
                    <div class="tier-card">
                        <h3>Explorer</h3>
                        <div class="tier-price">Free<small></small></div>
                        <ul class="tier-features">
                            <li>Connect 2 game stores</li>
                            <li>Basic backlog management</li>
                            <li>Manual game flagging</li>
                            <li>Basic sorting & filtering</li>
                            <li>Community support</li>
                        </ul>
                        <button class="tier-button" onclick="trackEvent('click', 'pricing', 'explorer_signup')">Start Free</button>
                    </div>

                    <div class="tier-card featured">
                        <h3>Adventurer</h3>
                        <div class="tier-price">$9<small>/month</small></div>
                        <ul class="tier-features">
                            <li>Connect unlimited stores</li>
                            <li>AI-powered recommendations</li>
                            <li>Advanced filtering & search</li>
                            <li>Gaming analytics dashboard</li>
                            <li>Auto-sync with game stores</li>
                            <li>Export data capabilities</li>
                            <li>Priority support</li>
                        </ul>
                        <button class="tier-button" onclick="trackEvent('click', 'pricing', 'adventurer_signup')">Start Adventure</button>
                    </div>

                    <div class="tier-card">
                        <h3>Champion</h3>
                        <div class="tier-price">$19<small>/month</small></div>
                        <ul class="tier-features">
                            <li>Everything in Adventurer</li>
                            <li>Advanced AI recommendations</li>
                            <li>Custom recommendation algorithms</li>
                            <li>Gaming social features</li>
                            <li>Achievement tracking</li>
                            <li>Time played analytics</li>
                            <li>API access</li>
                            <li>White-label options</li>
                            <li>Premium support</li>
                        </ul>
                        <button class="tier-button" onclick="trackEvent('click', 'pricing', 'champion_signup')">Become Champion</button>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Product</h4>
                    <a href="#features">Features</a>
                    <a href="#pricing">Pricing</a>
                    <a href="/roadmap">Roadmap</a>
                    <a href="/changelog">Changelog</a>
                </div>
                <div class="footer-section">
                    <h4>Support</h4>
                    <a href="/help">Help Center</a>
                    <a href="/docs">Documentation</a>
                    <a href="/contact">Contact Us</a>
                    <a href="/status">System Status</a>
                </div>
                <div class="footer-section">
                    <h4>Company</h4>
                    <a href="/about">About</a>
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/terms">Terms of Service</a>
                    <a href="/blog">Blog</a>
                </div>
                <div class="footer-section">
                    <h4>Connect</h4>
                    <a href="https://twitter.com/backlogblitz" onclick="trackEvent('click', 'social', 'twitter')">Twitter</a>
                    <a href="https://discord.gg/backlogblitz" onclick="trackEvent('click', 'social', 'discord')">Discord</a>
                    <a href="https://reddit.com/r/backlogblitz" onclick="trackEvent('click', 'social', 'reddit')">Reddit</a>
                    <a href="https://github.com/backlogblitz" onclick="trackEvent('click', 'social', 'github')">GitHub</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 BacklogBlitz. All rights reserved. Made with 💜 for gamers worldwide.</p>
            </div>
        </div>
    </footer>

    <script>
        // Page load analytics
        gtag('event', 'page_view', {
            page_title: 'BacklogBlitz Landing Page',
            page_location: window.location.href
        });

        // Scroll tracking
        let scrollThresholds = [25, 50, 75, 90];
        let triggeredThresholds = [];

        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);

            scrollThresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !triggeredThresholds.includes(threshold)) {
                    triggeredThresholds.push(threshold);
                    trackEvent('scroll', 'engagement', \`\${threshold}_percent\`);
                }
            });
        });

        // Time on page tracking
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            trackEvent('engagement', 'time_on_page', timeOnPage.toString());
        });
    </script>
</body>
</html>\`;
}

async function handleAnalyticsEvent(request, env) {
  try {
    const data = await request.json();

    // Store analytics data in KV storage
    const timestamp = new Date().toISOString();
    const key = \`analytics:\${timestamp}:\${Math.random().toString(36).substr(2, 9)}\`;

    const analyticsData = {
      ...data,
      ip: request.headers.get('CF-Connecting-IP'),
      country: request.cf?.country,
      timestamp: timestamp
    };

    // Store in KV (if backlog_blitz_KV is configured)
    if (env.backlog_blitz_KV) {
      await env.backlog_blitz_KV.put(key, JSON.stringify(analyticsData));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to store analytics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
