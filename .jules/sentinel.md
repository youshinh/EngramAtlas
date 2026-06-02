## 2024-05-18 - SSRF Vulnerability in Web Link Fetching
**Vulnerability:** Server-Side Request Forgery (SSRF) in `fetchUrlTitleAndText`.
**Learning:** The application allowed users to submit arbitrary URLs which the server would fetch on their behalf, enabling unauthorized access to internal services and local files (via file:// protocol or loopback IPs).
**Prevention:** Always validate and restrict user-provided URLs. Enforce allowed protocols (`http:`, `https:`) and use custom DNS resolution logic (`lookup` option in `http(s).get`) to block resolution to private/loopback IP addresses.
