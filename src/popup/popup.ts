document.addEventListener("DOMContentLoaded", () => {
  const keyInput     = document.getElementById("keyInput") as HTMLInputElement;
  const saveBtn      = document.getElementById("saveBtn") as HTMLButtonElement;
  const statusEl     = document.getElementById("status") as HTMLDivElement;
  const keyRow       = document.getElementById("keyRow") as HTMLDivElement;
  const inputSection = document.getElementById("inputSection") as HTMLDivElement;
  const removeBtn    = document.getElementById("removeBtn") as HTMLButtonElement;
  const keyText      = document.getElementById("keyText") as HTMLSpanElement;

  chrome.storage.local.get("openrouterApiKey", (result) => {
    if (result["openrouterApiKey"]) showActive(result["openrouterApiKey"] as string);
  });

  saveBtn.addEventListener("click", () => {
    const key = keyInput.value.trim();
    if (!key) { showStatus("Please enter a key.", "error"); return; }
    if (!key.startsWith("sk-or")) { showStatus("OpenRouter keys start with sk-or-v1-...", "error"); return; }
    chrome.storage.local.set({ openrouterApiKey: key }, () => {
      showActive(key);
      showStatus("✓ API key saved!", "success");
    });
  });

  removeBtn.addEventListener("click", () => {
    chrome.storage.local.remove("openrouterApiKey", () => {
      keyRow.style.display = "none";
      inputSection.style.display = "block";
      keyInput.value = "";
      showStatus("Key removed.", "success");
    });
  });

  function showActive(key: string) {
    keyText.textContent = key.slice(0, 10) + "••••••••" + key.slice(-4);
    keyRow.style.display = "flex";
    inputSection.style.display = "none";
  }

  function showStatus(msg: string, type: "success" | "error") {
    statusEl.textContent = msg;
    statusEl.className = "status " + type;
  }
});
