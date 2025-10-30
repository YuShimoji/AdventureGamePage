(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("playtest-modal");
    const iframe = document.getElementById("playtest-iframe");
    const closeBtn = document.getElementById("playtest-modal-close");
    const inlineBtn = document.getElementById("playtest-inline");
    const windowBtn = document.getElementById("playtest-window");
    const statusEl = document.getElementById("playtest-status");

    if (!modal || !iframe || !closeBtn || !inlineBtn || !windowBtn) return;

    function openModal() {
      if (!modal || !iframe) return;
      // Load play.html in iframe
      iframe.src = "play.html";
      modal.hidden = false;
      modal.style.display = "flex";
      if (statusEl) statusEl.textContent = "プレイテストを開始しました。";
    }

    function closeModal() {
      if (!modal || !iframe) return;
      iframe.src = "about:blank";
      modal.hidden = true;
      modal.style.display = "none";
      if (statusEl) statusEl.textContent = "";
    }

    function openInNewWindow() {
      window.open("play.html", "_blank", "width=800,height=600");
      if (statusEl) statusEl.textContent = "新しいウィンドウでプレイテストを開きました。";
    }

    inlineBtn.addEventListener("click", openModal);
    windowBtn.addEventListener("click", openInNewWindow);
    closeBtn.addEventListener("click", closeModal);

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  });
})();
