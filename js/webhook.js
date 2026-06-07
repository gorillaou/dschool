const Webhook = {
  getUrl() {
    return window.DSCHOOL_CONFIG?.DISCORD_WEBHOOK || "";
  },

  send(content, username) {
    const url = Webhook.getUrl();
    if (!url || url.includes("YOUR_WEBHOOK")) {
      throw new Error("Webhook URL is not configured in config.js.");
    }

    const payload = {
      content: content.slice(0, 2000),
      username: username.slice(0, 80),
      avatar_url: Webhook.avatarFor(username),
    };

    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.target = "dschool-webhook";
    form.style.display = "none";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "payload_json";
    input.value = JSON.stringify(payload);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    form.remove();

    return Promise.resolve();
  },

  avatarFor(username) {
    const seed = encodeURIComponent(username.trim() || "dschool");
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=transparent`;
  },
};

window.Webhook = Webhook;
