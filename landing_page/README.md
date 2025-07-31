# BacklogBlitz Landing Page

A modern, responsive landing page for BacklogBlitz - the ultimate gaming backlog management tool.

## Features

- 🎨 Modern, gaming-focused design with dark theme
- 📱 Fully responsive for all devices
- 📊 Built-in analytics tracking
- ⚡ Hosted on Cloudflare Workers for fast global delivery
- 🚀 Three-tier pricing structure
- 🎮 Highlights cross-store game integration

## Quick Start

### Local Development

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Install dependencies:
```bash
npm install
```

3. Start local development server:
```bash
npm run dev
```

### Deployment

1. **Setup KV Storage for Analytics:**
```bash
npm run kv:create
npm run kv:create:preview
```

2. **Update wrangler.toml** with your KV namespace IDs from the previous step.

3. **Deploy to staging:**
```bash
npm run deploy:staging
```

4. **Deploy to production:**
```bash
npm run deploy
```

## Analytics

The landing page includes comprehensive analytics tracking:

- Page views and section visibility
- Button clicks and interactions
- Scroll depth tracking
- Time on page
- Form interactions (ready for future signup forms)

Analytics data is stored in Cloudflare KV storage and can be viewed with:
```bash
npm run analytics:view
```

## Customization

### Update Google Analytics ID

Replace `G-XXXXXXXXXX` in both `index.html` and `worker.js` with your actual Google Analytics tracking ID.

### Custom Domain

1. Add your domain to Cloudflare
2. Update `wrangler.toml` with your custom routes
3. Deploy with `npm run deploy`

### Pricing Tiers

Edit the pricing tiers in `index.html` and `worker.js` to match your actual pricing structure.

## File Structure

```
landing_page/
├── index.html          # Main landing page
├── styles.css          # Styling and responsive design
├── analytics.js        # Client-side analytics
├── worker.js           # Cloudflare Worker (server-side)
├── wrangler.toml       # Cloudflare Worker configuration
├── package.json        # Node.js dependencies and scripts
└── README.md           # This file
```

## Development Tips

- Use `npm run dev` for local development with hot reload
- Check `npm run tail` for real-time worker logs
- Test mobile responsiveness at different screen sizes
- Monitor analytics in Google Analytics dashboard

## Production Checklist

- [ ] Update Google Analytics tracking ID
- [ ] Configure custom domain
- [ ] Set up KV namespace for analytics
- [ ] Test all pricing tier buttons
- [ ] Verify responsive design on mobile
- [ ] Check page load performance
- [ ] Enable security headers (already included)

## Analytics Features

### Automatic Tracking
- Page loads and section views
- Button hovers and clicks
- Scroll depth (25%, 50%, 75%, 90%)
- Time spent on page
- Social link clicks

### Data Storage
Analytics events are stored in Cloudflare KV with:
- Event type and category
- Timestamp and user info
- IP and country (via Cloudflare)
- Referrer and user agent

### Privacy
- No personal data collection
- GDPR-friendly analytics
- No third-party cookies beyond Google Analytics
