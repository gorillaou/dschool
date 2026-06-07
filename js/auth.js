const AUTH_STORAGE_KEY = "dschool_accounts_v1";
const SESSION_KEY = "dschool_session_v1";
const THEME_KEY = "dschool_theme_v1";

const Auth = {
  async hashPassword(password, saltBytes) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 120000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    return {
      salt: Auth.toBase64(salt),
      hash: Auth.toBase64(new Uint8Array(hashBuffer)),
    };
  },

  toBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
  },

  fromBase64(str) {
    return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  },

  loadAccounts() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  },

  saveAccounts(accounts) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(accounts));
  },

  normalizeUsername(username) {
    return username.trim().replace(/\s+/g, " ");
  },

  validateUsername(username) {
    if (username.length < 2 || username.length > 32) {
      return "Username must be 2–32 characters.";
    }
    if (!/^[a-zA-Z0-9._ -]+$/.test(username)) {
      return "Use letters, numbers, spaces, dots, dashes, or underscores.";
    }
    return null;
  },

  async register(username, password) {
    const name = Auth.normalizeUsername(username);
    const usernameError = Auth.validateUsername(name);
    if (usernameError) {
      throw new Error(usernameError);
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const accounts = Auth.loadAccounts();
    if (accounts[name.toLowerCase()]) {
      throw new Error("That username is already taken.");
    }

    const { salt, hash } = await Auth.hashPassword(password);
    accounts[name.toLowerCase()] = {
      displayName: name,
      salt,
      hash,
      createdAt: Date.now(),
    };
    Auth.saveAccounts(accounts);
    Auth.setSession(name);
    return name;
  },

  async login(username, password) {
    const name = Auth.normalizeUsername(username);
    const accounts = Auth.loadAccounts();
    const record = accounts[name.toLowerCase()];

    if (!record) {
      throw new Error("No account found with that username.");
    }

    const { hash } = await Auth.hashPassword(password, Auth.fromBase64(record.salt));
    if (hash !== record.hash) {
      throw new Error("Incorrect password.");
    }

    Auth.setSession(record.displayName);
    return record.displayName;
  },

  setSession(displayName) {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        displayName,
        loginAt: Date.now(),
      })
    );
  },

  getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  getTheme() {
    return localStorage.getItem(THEME_KEY) || "obsidian-vault";
  },

  setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    document.body.dataset.theme = theme;
  },
};

window.Auth = Auth;
