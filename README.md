# dschool

**Discord School** — a sleek, secret Discord-style web page for class chat. Messages relay to your Discord server through a webhook, and your display name is locked behind a login so nobody can impersonate you.

## Themes

| Name | Vibe |
|------|------|
| **Obsidian Vault** | Sleek black · midnight study mode |
| **Crimson Archive** | Dark maroon · old library energy |
| **Horizon Desk** | Dark sky blue · late-night notes |

## Setup (GitHub Pages)

1. **Copy config**
   ```bash
   cp config.example.js config.js
   ```
   Edit `config.js` and paste your Discord webhook URL and invite link.

2. **Push to GitHub**
   - Create a repo (e.g. `dschool`)
   - Push this folder
   - In repo **Settings → Pages**, set source to `main` branch, root folder
   - Your site will be at `https://YOUR_USERNAME.github.io/dschool/`

3. **Share the site link** with your class — not the webhook URL.

## How login works

- Each person **registers once** with a username + password.
- Usernames are stored in the browser with **PBKDF2 password hashing**.
- Only someone who knows the password can send messages as that username.
- The webhook sends messages with **`username` set to your logged-in name**, so Discord shows your name on every message.

## Local preview

```bash
npx serve .
```

Then open `http://localhost:3000`.

## Files

- `index.html` — Discord-style layout
- `css/styles.css` — three theme palettes
- `js/auth.js` — register / login / session
- `js/webhook.js` — Discord webhook relay
- `js/app.js` — chat UI logic
- `config.js` — webhook + invite link
