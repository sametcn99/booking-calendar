# Security Checklist

Running a self-hosted application requires attention to security best practices. Use this checklist to ensure your Booking Calendar instance is secure.

## 🔐 Credentials

- [ ] **Change Default Admin Password:** Never use 'admin' or weak passwords in production.
- [ ] **Strong JWT Secret:** Use a long, random string for `JWT_SECRET`.
- [ ] **Rotate VAPID Keys:** If you suspect keys are compromised, regenerate and update them.

## 🌐 Network

- [ ] **HTTPS Always:** Serve the application only over HTTPS. Use certificates from Let's Encrypt or similar.
- [ ] **Firewall:** Only expose the necessary ports (e.g., 443 via your reverse proxy).
- [ ] **Secure SMTP:** Use encrypted connections (TLS/SSL) for your mail server.

## 💾 Data & Persistence

- [ ] **Database Backups:** Regularly back up the `./data/booking.db` file to a separate location.
- [ ] **File Permissions:** Ensure the `.env` file and `data/` directory have restrictive file permissions.

## 🛡 Protection

- [ ] **Rate Limiting:** Keep the rate limiting enabled to prevent brute-force attacks on the login and booking endpoints.
- [ ] **Webhook Signatures:** If using webhooks, always verify the `X-BookingCalendar-Signature` in your receiver.

## 📦 Deployment

- [ ] **Keep Up to Date:** Regularly pull the latest changes from the repository to receive security patches.
- [ ] **Use Docker:** Containers provide an extra layer of isolation for the application environment.

::: danger CRITICAL
Self-hosting means you are responsible for your data security. Follow these steps carefully to ensure your and your guests' data remains private.
:::
