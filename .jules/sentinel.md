## 2024-05-18 - SSRF Vulnerability in Web Link Fetching
**Vulnerability:** Server-Side Request Forgery (SSRF) in `fetchUrlTitleAndText`.
**Learning:** The application allowed users to submit arbitrary URLs which the server would fetch on their behalf, enabling unauthorized access to internal services and local files (via file:// protocol or loopback IPs).
**Prevention:** Always validate and restrict user-provided URLs. Enforce allowed protocols (`http:`, `https:`) and use custom DNS resolution logic (`lookup` option in `http(s).get`) to block resolution to private/loopback IP addresses.

## 2024-10-27 - [Fix SSRF bypass and DoS vulnerability]
**Vulnerability:** Found a CRITICAL SSRF bypass and DoS vulnerability due to type unsafety.
**Learning:** Found that strict `127.0.0.1` equality checks can be bypassed using alternate loopback IPs (`127.0.0.2` or `127.1`). Also found that JSON parsing and missing type validation (e.g., `toLowerCase()` on non-strings) can cause Express servers to crash entirely resulting in a Denial of Service.
**Prevention:** Always check IP ranges using CIDR or `startsWith('127.')` instead of explicit `127.0.0.1` and always ensure robust type checks for parsed JSON inputs before invoking string-only prototype methods like `.toLowerCase()`.

## 2026-06-04 - [SSRF bypass via direct IP literal]
**Vulnerability:** Node.js native `URL` parser bypasses custom `lookup` options when the URL hostname is a direct IP literal (e.g., 127.0.0.1, 0177.0.0.1, 2130706433), exposing internal APIs despite existing DNS resolution-based SSRF protections.
**Learning:** `http.get` / `https.get` doesn't call custom DNS lookup logic if the destination is a pre-resolved IP literal, meaning DNS rebinding mitigations won't protect against direct internal IP hits.
**Prevention:** Add a pre-flight synchronous check using `require('net').isIP(parsedUrl.hostname)` to enforce the internal IP block list before even attempting to construct the request.
