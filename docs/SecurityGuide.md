# Security & DDoS Protection Guide

## Financial Planner

This guide outlines security threats, structural mitigation techniques, and deployment configurations to protect the serverless Single Page Application (SPA) against volumetric attacks (DDoS) and browser-based vulnerabilities.

---

## 1. DDoS Mitigation Strategies

Because this application compiles into static files (HTML, CSS, JS) and runs serverlessly on **Google Cloud Run**, standard server resource exhaustion is less of a bottleneck, but **billing/egress exhaustion** (vandalism via artificial page requests) is a real risk.

### Option A: Cloudflare (Recommended, Zero Cost)

Using Cloudflare as an DNS/Reverse Proxy is the most cost-effective and powerful shield for a static site.

- **Unmetered DDoS Protection**: Automatically mitigates volumetric layer 3, 4, and 7 DDoS attacks before they reach Google Cloud.
- **Edge Caching**: Cloudflare caches the static assets at globally distributed edge nodes. This means Nginx/Cloud Run is almost never hit, reducing container billing to virtually $0.00/mo even during high traffic.
- **Browser Integrity Check**: Challenges suspicious automated bots with interactive JS challenges.

### Option B: Google Cloud Native Shield (Enterprise)

If you prefer to keep everything inside the Google Cloud ecosystem:

1. **Google Cloud Armor**: Standard DDoS protection is built-in on Cloud Run. To scale to Advanced Layer 7 protection (WAF rules, rate limiting), place an **External HTTPS Load Balancer** in front of Cloud Run and associate a Cloud Armor security policy.
2. **Cloud CDN**: Caches static assets globally, absorbing request spikes without scaling container instances.

---

## 2. Advanced HTTP Security Headers (Nginx)

Adding secure headers directly inside Nginx ensures that the browser locks down client-side APIs, mitigating clickjacking, sniffing, and SSL downgrades.

Add these directives inside the Nginx virtual server block (`/etc/nginx/conf.d/default.conf`):

```nginx
# Prevent clickjacking by disabling embedding inside external frames/iframes
add_header X-Frame-Options "DENY" always;

# Force the browser to respect MIME types and prevent MIME-sniffing
add_header X-Content-Type-Options "nosniff" always;

# Prevent leakage of origin paths when navigating to external resources
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Disable hardware features (camera, mic) to secure client environment
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# Force HTTP Strict Transport Security (HSTS) - only if custom domain SSL is active
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

## 3. Client-Side Data Security (XSS & IndexedDB)

Since all financial figures, loans, and portfolio records are stored client-side in **IndexedDB**:

- **Zero Database Vulnerability**: There is no SQL/NoSQL central database on the cloud to hack. An attacker cannot compromise other users' data because there is no shared server.
- **XSS (Cross-Site Scripting) is the Primary Threat**: If an attacker injects malicious JS (e.g., via a compromised npm dependency), they could query IndexedDB and leak details.

### Mitigation Checklist:

1. **Strict Content Security Policy (CSP)**: Ensure index.html restricts script sources exclusively to `'self'`.
2. **Regular Dependency Audits**:
   ```bash
   npm audit
   ```
3. **Lock Dependencies**: Use `package-lock.json` and avoid installing third-party widgets or tracker scripts that execute untrusted remote code.
