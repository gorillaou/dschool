const CHANNELS = {
  general: "general",
  homework: "homework-help",
  afterschool: "after-school",
};

const App = {
  currentChannel: "general",
  messages: [],

  init() {
    App.applyTheme(Auth.getTheme());
    App.bindAuth();
    App.bindThemeControls();
    App.bindChat();

    const session = Auth.getSession();
    if (session?.displayName) {
      App.enterChat(session.displayName);
    }

    const invite = window.DSCHOOL_CONFIG?.DISCORD_INVITE;
    if (invite) {
      document.getElementById("discord-link").href = invite;
    }
  },

  applyTheme(theme) {
    document.body.dataset.theme = theme;
    document.querySelectorAll(".theme-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.theme === theme);
    });
  },

  bindAuth() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const authError = document.getElementById("auth-error");

    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const isLogin = tab.dataset.tab === "login";
        loginForm.classList.toggle("hidden", !isLogin);
        registerForm.classList.toggle("hidden", isLogin);
        authError.textContent = "";
      });
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      authError.textContent = "";
      try {
        const name = await Auth.login(
          document.getElementById("login-username").value,
          document.getElementById("login-password").value
        );
        App.enterChat(name);
      } catch (error) {
        authError.textContent = error.message;
      }
    });

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      authError.textContent = "";

      const password = document.getElementById("register-password").value;
      const confirm = document.getElementById("register-confirm").value;
      if (password !== confirm) {
        authError.textContent = "Passwords do not match.";
        return;
      }

      try {
        const name = await Auth.register(
          document.getElementById("register-username").value,
          password
        );
        App.enterChat(name);
      } catch (error) {
        authError.textContent = error.message;
      }
    });
  },

  bindThemeControls() {
    const setTheme = (theme) => {
      Auth.setTheme(theme);
      App.applyTheme(theme);
    };

    document.querySelectorAll(".theme-chip, .theme-card").forEach((el) => {
      el.addEventListener("click", () => setTheme(el.dataset.theme));
    });

    document.getElementById("theme-toggle").addEventListener("click", () => {
      document.getElementById("theme-modal").showModal();
    });

    document.getElementById("close-theme-modal").addEventListener("click", () => {
      document.getElementById("theme-modal").close();
    });
  },

  bindChat() {
    document.getElementById("logout-btn").addEventListener("click", () => {
      Auth.logout();
      document.getElementById("app").classList.add("hidden");
      document.getElementById("auth-screen").classList.remove("hidden");
      document.getElementById("message-input").value = "";
      App.messages = [];
      App.renderMessages();
    });

    document.querySelectorAll(".channel").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".channel").forEach((c) => c.classList.remove("active"));
        button.classList.add("active");
        App.currentChannel = button.dataset.channel;
        App.updateChannelUi();
      });
    });

    document.getElementById("message-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("message-input");
      const text = input.value.trim();
      if (!text) return;

      const session = Auth.getSession();
      if (!session?.displayName) return;

      const channelLabel = CHANNELS[App.currentChannel] || "general";
      const localMessage = App.addMessage({
        author: session.displayName,
        content: text,
        pending: true,
      });

      input.value = "";
      input.focus();

      try {
        await Webhook.send(text, session.displayName, channelLabel);
        localMessage.pending = false;
        App.renderMessages();
      } catch (error) {
        localMessage.pending = false;
        localMessage.failed = true;
        localMessage.content = `${text}\n\n⚠ ${error.message}`;
        App.renderMessages();
      }
    });
  },

  enterChat(displayName) {
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("user-name").textContent = displayName;
    document.getElementById("user-avatar").textContent = displayName.charAt(0).toUpperCase();
    App.updateChannelUi();
    App.addMessage({
      author: "dschool",
      content: `Welcome back, **${displayName}**. Messages relay to Discord under your locked username.`,
      system: true,
    });
    document.getElementById("message-input").focus();
  },

  updateChannelUi() {
    const label = CHANNELS[App.currentChannel] || "general";
    document.getElementById("channel-title").textContent = label;
    document.getElementById("message-input").placeholder = `Message #${label}`;
  },

  addMessage(message) {
    const entry = {
      id: crypto.randomUUID(),
      author: message.author,
      content: message.content,
      time: new Date(),
      system: Boolean(message.system),
      pending: Boolean(message.pending),
      failed: Boolean(message.failed),
    };
    App.messages.push(entry);
    App.renderMessages();
    return entry;
  },

  renderMessages() {
    const container = document.getElementById("messages");
    container.innerHTML = App.messages
      .map((message) => {
        if (message.system) {
          return `
            <article class="message system">
              <div></div>
              <div class="message-body">${message.content}</div>
            </article>
          `;
        }

        const initial = message.author.charAt(0).toUpperCase();
        const time = message.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const status = message.pending ? " · sending…" : message.failed ? " · failed" : "";

        return `
          <article class="message${message.pending ? " pending" : ""}">
            <div class="message-avatar">${initial}</div>
            <div>
              <div class="message-head">
                <strong>${App.escapeHtml(message.author)}</strong>
                <time>${time}${status}</time>
              </div>
              <div class="message-body">${App.escapeHtml(message.content)}</div>
            </div>
          </article>
        `;
      })
      .join("");

    container.scrollTop = container.scrollHeight;
  },

  escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  },
};

document.addEventListener("DOMContentLoaded", App.init);
