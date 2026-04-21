# ⚡ HugoSplash Paywall Widget

> Drop-in Bitcoin Lightning paywall for any website. One line of code, 0% platform fees, instant settlement.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Lightning](https://img.shields.io/badge/Bitcoin-Lightning-f7931a.svg)](https://lightning.network)

Accept Bitcoin payments for your paid content with one line of code. Works on any website — WordPress, Ghost, Hugo, Substack (via redirect), React, Vue, plain HTML.

## What it does

1. Visitor clicks your locked content
2. Widget renders a Lightning payment QR + invoice
3. Visitor pays from any Lightning wallet
4. Content unlocks instantly via a signed token — no account, no email, no middleman
5. You receive sats directly to your wallet (minus ~0.1% Lightning routing fee vs Stripe's 3%)

## Install

```html
<script src="https://hugosplash.com/paywall.js"></script>
<div data-paywall-id="YOUR_PAYWALL_ID"></div>
```

That's the whole install. The widget auto-mounts on any `<div data-paywall-id="...">` on the page.

## Create a paywall ID

Sign up at [hugosplash.com](https://hugosplash.com), create a paywall from the dashboard. You get an ID + an API key. Embed the ID on your site; the dashboard tracks revenue.

Or use the API directly — full OpenAPI spec at [hugosplash.com/api/docs/openapi.json](https://hugosplash.com/api/docs/openapi.json).

## Examples

See [`examples/`](./examples/):

- [`plain.html`](./examples/plain.html) — 3 lines of HTML
- [`react.tsx`](./examples/react.tsx) — React component wrapping the widget
- [`wordpress.php`](./examples/wordpress.php) — WordPress shortcode
- [`ghost-partial.hbs`](./examples/ghost-partial.hbs) — Ghost theme partial

## Options

Control the paywall via `data-*` attributes on the mounting `<div>`:

| Attribute | Default | Description |
|---|---|---|
| `data-paywall-id` | required | Paywall UUID from hugosplash.com dashboard |
| `data-api-base` | `https://hugosplash.com` | API origin — change to self-host |
| `data-title` | from paywall | Override title shown above QR |
| `data-theme` | `light` | `light` \| `dark` |
| `data-on-unlock` | — | Name of a global function to call on unlock |
| `data-redirect` | — | URL to redirect to after unlock |

## Self-hosting

If you want to run the whole stack yourself:
- Backend: https://github.com/IntuitiveSystems-irl/hugosplash-saas (coming soon)
- This widget: point `data-api-base` at your own API

## How it works

1. Widget `fetch`es `/api/paywall/:id` to get price + title
2. User clicks "Pay" → widget POSTs to `/api/paywall/:id/pay` → gets `paymentRequest` (bolt11 invoice)
3. Widget renders QR code + invoice text
4. Widget polls `/api/paywall/verify` every 2 seconds
5. When paid, server returns a signed `unlockToken`
6. Widget POSTs to `/api/paywall/unlock` with the token → gets the protected content
7. Content replaces the paywall in the DOM

Token is HMAC-signed server-side, scoped to the paywall + invoice, expires in 1 hour.

## Security

- No user credentials ever stored in the widget
- Content is never shipped to the browser until payment confirmed
- Unlock token is signature-verified server-side — can't be forged
- Public paywall API has rate limiting (600 req/15min per IP)

## License

MIT — use it anywhere.

## Built by

[HugoSplash](https://hugosplash.com) — Lightning paywalls for creators. Also offers:
- **Full install service** — we install on your site in 5-7 days ($500–$3000) — [hugosplash.com/services](https://hugosplash.com/services)
- **Paid Nostr relay + NIP-05 identity** — [relay.hugosplash.com](https://relay.hugosplash.com)

## Contributing

PRs welcome. Issues appreciated. Please keep the widget under 10KB minified.

---

**Questions?** Open an issue, or email [hi@businessintuitive.tech](mailto:hi@businessintuitive.tech).
