## 2024-05-18 - SSRF Vulnerability in Web Link Fetching
**Vulnerability:** Server-Side Request Forgery (SSRF) in `fetchUrlTitleAndText`.
**Learning:** The application allowed users to submit arbitrary URLs which the server would fetch on their behalf, enabling unauthorized access to internal services and local files (via file:// protocol or loopback IPs).
**Prevention:** Always validate and restrict user-provided URLs. Enforce allowed protocols (`http:`, `https:`) and use custom DNS resolution logic (`lookup` option in `http(s).get`) to block resolution to private/loopback IP addresses.

## 2024-10-27 - [Fix SSRF bypass and DoS vulnerability]
**Vulnerability:** Found a CRITICAL SSRF bypass and DoS vulnerability due to type unsafety.
**Learning:** Found that strict `127.0.0.1` equality checks can be bypassed using alternate loopback IPs (`127.0.0.2` or `127.1`). Also found that JSON parsing and missing type validation (e.g., `toLowerCase()` on non-strings) can cause Express servers to crash entirely resulting in a Denial of Service.
**Prevention:** Always check IP ranges using CIDR or `startsWith('127.')` instead of explicit `127.0.0.1` and always ensure robust type checks for parsed JSON inputs before invoking string-only prototype methods like `.toLowerCase()`.
