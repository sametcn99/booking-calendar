# Web Push (VAPID)

Booking Calendar uses browser-native push notifications to alert admins of new appointments and other events. This is powered by the **VAPID** (Voluntary Application Server Identification) protocol.

## How it Works

1. **Frontend:** The browser generates a push subscription using your **Public VAPID Key**.
2. **Backend:** The server stores these subscriptions and uses the **Private VAPID Key** to sign and send notifications through the browser's push service (e.g., Google's FCM or Apple's Push Service).

## Generating Keys

You can generate a fresh pair of VAPID keys using the built-in generator:

```bash
bun run generate-vapid-keys
```

This will create a `vapid-keys.txt` file in your root directory containing lines you can copy-paste directly into your `.env` file:

```env
VITE_VAPID_PUBLIC_KEY=BEl...
VAPID_PRIVATE_KEY=2Vw...
```

## Configuration Steps

1. **Update .env:** Copy the generated keys into your `.env` file.
2. **Rebuild Frontend:** Since the Public Key is a build-time variable (`VITE_`), you must rebuild:
   - **Local:** `cd src/client && bun run build`
   - **Docker:** `docker compose up -d --build`
3. **Restart Server:** The backend needs to read the Private Key at startup.
4. **Subscribe:** Open the admin panel, go to **Settings**, and enable Push Notifications. Your browser will prompt you for permission.

::: warning BROWSER SUPPORT
Push notifications require a secure context (HTTPS) and are supported by most modern browsers on Desktop and Android. On iOS, they are supported when the app is "Added to Home Screen" (PWA mode).
:::
