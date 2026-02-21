# Troubleshooting

Common issues and their solutions when setting up or running Booking Calendar.

## Installation Issues

### Bun command not found
Ensure Bun is installed and in your PATH. Visit [bun.sh](https://bun.sh) for installation instructions.

### Database Errors (SQLite)
If you see errors related to the database, check:
- Write permissions for the `data/` directory.
- `DATABASE_URL` path in your `.env`.
- If the file is locked by another process.

## Notification Issues

### Push Notifications not working
- Verify your VAPID keys are generated and set correctly in `.env`.
- Ensure your site is running on **HTTPS** or **localhost**. Push notifications require a secure context.
- Check if the service worker is registered correctly in your browser's developer tools.

### Emails not being sent
- Check your SMTP configuration in `.env`.
- Ensure your mail server allows connections from your application IP.
- Check the server logs for specific SMTP errors.

## PWA Issues

### Install button not appearing
- PWA requires **HTTPS** (or localhost).
- Ensure all icons in `src/client/public` are present and correctly referenced in the manifest.

## Docker Issues

### Permission Denied on `data/`
When running in Docker, the container user needs write access to the mounted volume for SQLite.
```bash
chmod -R 777 data/  # Use with caution, better to chown to the correct user
```

### Port Conflicts
If port 3000 is taken, change it in `docker-compose.yml` or `.env`.
