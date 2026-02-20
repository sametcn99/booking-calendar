import { writeFileSync } from "node:fs";
import webpush from "web-push";

const vapidKeys = webpush.generateVAPIDKeys();

const output = `VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;

writeFileSync("vapid-keys.txt", output);
console.log("Keys written to vapid-keys.txt");
