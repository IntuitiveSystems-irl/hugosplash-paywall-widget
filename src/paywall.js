(function () {
  "use strict";

  const API_BASE = (document.currentScript && document.currentScript.src)
    ? new URL(document.currentScript.src).origin
    : "";

  const STYLES = `
    .ln-paywall-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7); display: flex; align-items: center;
      justify-content: center; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .ln-paywall-modal {
      background: #1a1d2e; color: #e2e8f0; border-radius: 16px;
      padding: 2rem; max-width: 400px; width: 90%; text-align: center;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .ln-paywall-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    .ln-paywall-desc { color: #8892a4; font-size: 0.9rem; margin-bottom: 1rem; }
    .ln-paywall-price { color: #f7931a; font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem; }
    .ln-paywall-qr { margin: 1rem auto; }
    .ln-paywall-qr canvas { border-radius: 8px; }
    .ln-paywall-invoice {
      background: #0f1117; border: 1px solid #2a2d3e; border-radius: 8px;
      padding: 0.75rem; word-break: break-all; font-size: 0.7rem;
      color: #8892a4; margin: 1rem 0; cursor: pointer; max-height: 80px; overflow: hidden;
    }
    .ln-paywall-invoice:hover { color: #e2e8f0; }
    .ln-paywall-status {
      font-size: 0.85rem; color: #8892a4; margin-top: 1rem;
    }
    .ln-paywall-status.paid { color: #22c55e; font-weight: 700; font-size: 1.1rem; }
    .ln-paywall-btn {
      background: #f7931a; color: #fff; border: none; border-radius: 8px;
      padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 600;
      cursor: pointer; width: 100%; margin-top: 1rem;
    }
    .ln-paywall-btn:hover { background: #e8850f; }
    .ln-paywall-close {
      position: absolute; top: 1rem; right: 1rem; background: none;
      border: none; color: #8892a4; font-size: 1.5rem; cursor: pointer;
    }
  `;

  function injectStyles() {
    if (document.getElementById("ln-paywall-styles")) return;
    var style = document.createElement("style");
    style.id = "ln-paywall-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function loadQRLib(cb) {
    if (window.QRCode) return cb();
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  async function fetchPaywall(id) {
    var res = await fetch(API_BASE + "/api/paywall/" + id);
    if (!res.ok) throw new Error("Paywall not found");
    return res.json();
  }

  async function createPayment(id) {
    var res = await fetch(API_BASE + "/api/paywall/" + id + "/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to create payment");
    return res.json();
  }

  async function verifyPayment(invoiceId) {
    var res = await fetch(API_BASE + "/api/paywall/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoiceId }),
    });
    if (!res.ok) return { paid: false };
    return res.json();
  }

  async function unlockContent(unlockToken) {
    var res = await fetch(API_BASE + "/api/paywall/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unlockToken: unlockToken }),
    });
    if (!res.ok) return null;
    return res.json();
  }

  function showPaywall(el, paywall) {
    var btn = document.createElement("button");
    btn.className = "ln-paywall-btn";
    btn.textContent = "Unlock for " + paywall.priceSats + " sats";
    btn.onclick = function () { openPaymentModal(el, paywall); };
    el.innerHTML = "";
    el.appendChild(btn);
  }

  async function openPaymentModal(el, paywall) {
    var payment = await createPayment(paywall.id);

    var overlay = document.createElement("div");
    overlay.className = "ln-paywall-overlay";
    overlay.innerHTML = '<div class="ln-paywall-modal" style="position:relative">' +
      '<button class="ln-paywall-close">&times;</button>' +
      '<div class="ln-paywall-title">' + escapeHtml(paywall.title) + '</div>' +
      '<div class="ln-paywall-desc">' + escapeHtml(paywall.description || "") + '</div>' +
      '<div class="ln-paywall-price">' + payment.amountSats + ' sats</div>' +
      '<div class="ln-paywall-qr" id="ln-qr"></div>' +
      '<div class="ln-paywall-invoice" id="ln-invoice" title="Click to copy">' +
        payment.paymentRequest + '</div>' +
      '<div class="ln-paywall-status" id="ln-status">Waiting for payment...</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector(".ln-paywall-close").onclick = function () {
      clearInterval(pollId);
      document.body.removeChild(overlay);
    };

    overlay.querySelector("#ln-invoice").onclick = function () {
      navigator.clipboard.writeText(payment.paymentRequest);
      this.textContent = "Copied!";
      var self = this;
      setTimeout(function () { self.textContent = payment.paymentRequest; }, 2000);
    };

    // QR code
    loadQRLib(function () {
      var canvas = document.createElement("canvas");
      document.getElementById("ln-qr").appendChild(canvas);
      QRCode.toCanvas(canvas, payment.paymentRequest.toUpperCase(), {
        width: 250,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    });

    // Poll for payment
    var pollId = setInterval(async function () {
      try {
        var result = await verifyPayment(payment.invoiceId);
        if (result.paid) {
          clearInterval(pollId);
          var status = document.getElementById("ln-status");
          if (status) {
            status.className = "ln-paywall-status paid";
            status.textContent = "Payment received";
          }
          setTimeout(async function () {
            document.body.removeChild(overlay);
            if (result.redirectUrl) {
              window.location.href = result.redirectUrl;
            } else if (result.unlockToken) {
              var content = await unlockContent(result.unlockToken);
              if (content && content.content) {
                el.innerHTML = '<div style="padding:1rem;white-space:pre-wrap;">' + escapeHtml(content.content) + '</div>' + creatorCta();
              } else if (content && content.redirectUrl) {
                window.location.href = content.redirectUrl;
              } else {
                el.innerHTML = '<div style="color:#22c55e;font-weight:700;padding:1rem;">Content unlocked</div>' + creatorCta();
              }
            } else {
              el.innerHTML = '<div style="color:#22c55e;font-weight:700;padding:1rem;">Content unlocked</div>' + creatorCta();
            }
          }, 1500);
        }
      } catch (e) { /* ignore poll errors */ }
    }, 3000);
  }

  function creatorCta() {
    var baseUrl = API_BASE.replace(/\/api$/, '');
    return '<div style="margin-top:1rem;padding:0.75rem 1rem;border:1px solid rgba(15,118,110,0.15);border-radius:0.75rem;background:rgba(15,118,110,0.03);font-size:0.8rem;line-height:1.4">' +
      '<div style="font-weight:600;color:#0F172A;margin-bottom:0.25rem">Want to sell your own link? Create one in seconds.</div>' +
      '<a href="' + baseUrl + '/register?preset=pay-to-unlock" style="color:#0F766E;font-weight:600;text-decoration:none" target="_blank">Start on HugoSplash</a>' +
      '</div>';
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function initPaywalls() {
    injectStyles();
    var elements = document.querySelectorAll("[data-paywall-id]");
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var id = el.getAttribute("data-paywall-id");
      try {
        var paywall = await fetchPaywall(id);
        showPaywall(el, paywall);
      } catch (e) {
        el.innerHTML = '<div style="color:#ef4444">Failed to load paywall</div>';
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPaywalls);
  } else {
    initPaywalls();
  }
})();
