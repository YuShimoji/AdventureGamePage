// Snapshot Comparison Utility
// Provides diff viewing for snapshots

(function () {
  let selectedSnapshots = [];

  function selectSnapshotForComparison(snapshotId) {
    if (selectedSnapshots.includes(snapshotId)) {
      selectedSnapshots = selectedSnapshots.filter((id) => id !== snapshotId);
    } else {
      selectedSnapshots.push(snapshotId);
      if (selectedSnapshots.length > 2) {
        selectedSnapshots.shift(); // Keep only latest 2
      }
    }
    updateCompareButton();
  }

  function updateCompareButton() {
    const btn = document.getElementById("snapshot-compare-btn");
    if (!btn) return;

    if (selectedSnapshots.length === 2) {
      btn.disabled = false;
      btn.textContent = `比較 (${selectedSnapshots.length})`;
    } else {
      btn.disabled = true;
      btn.textContent = `比較 (${selectedSnapshots.length}/2)`;
    }
  }

  async function compareSnapshots() {
    if (selectedSnapshots.length !== 2) {
      alert("比較するには2つのスナップショットを選択してください");
      return;
    }

    try {
      // Load both snapshots
      const snap1 = await loadSnapshot(selectedSnapshots[0]);
      const snap2 = await loadSnapshot(selectedSnapshots[1]);

      if (!snap1 || !snap2) {
        alert("スナップショットの読み込みに失敗しました");
        return;
      }

      // Calculate diff
      const diff = calculateTextDiff(snap1.text || "", snap2.text || "");

      // Show comparison modal
      showComparisonModal(snap1, snap2, diff);
    } catch (e) {
      console.error("Snapshot comparison failed:", e);
      alert("比較処理に失敗しました: " + e.message);
    }
  }

  async function loadSnapshot(id) {
    try {
      if (window.StorageBridge && window.StorageBridge.get) {
        return await window.StorageBridge.get(id);
      } else {
        const provider = window.StorageHub?.getProvider?.();
        if (provider) {
          const result = provider.get(id);
          return result && typeof result.then === "function" ? await result : result;
        }
      }
      return null;
    } catch (e) {
      console.error("Failed to load snapshot:", id, e);
      return null;
    }
  }

  function calculateTextDiff(text1, text2) {
    // Simple line-by-line diff
    const lines1 = text1.split("\n");
    const lines2 = text2.split("\n");
    const diff = [];

    const maxLen = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLen; i++) {
      const line1 = lines1[i] !== undefined ? lines1[i] : null;
      const line2 = lines2[i] !== undefined ? lines2[i] : null;

      if (line1 === line2) {
        diff.push({ type: "equal", line1, line2, index: i });
      } else if (line1 === null) {
        diff.push({ type: "added", line1: null, line2, index: i });
      } else if (line2 === null) {
        diff.push({ type: "removed", line1, line2: null, index: i });
      } else {
        diff.push({ type: "modified", line1, line2, index: i });
      }
    }

    return diff;
  }

  function showComparisonModal(snap1, snap2, diff) {
    const modal = document.createElement("div");
    modal.id = "snapshot-comparison-modal";
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); z-index: 10001;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
      background: var(--surface, #fff); color: var(--text-color, #000);
      padding: 24px; border-radius: 12px; max-width: 1200px; width: 100%;
      max-height: 90vh; overflow: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `;

    const stats = calculateDiffStats(diff);

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0;">スナップショット比較</h2>
        <div class="spacer"></div>
        <button id="compare-close" class="btn">閉じる</button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="padding: 12px; background: rgba(0,0,0,0.05); border-radius: 8px;">
          <h3 style="margin-top: 0; font-size: 14px;">スナップショット 1</h3>
          <p style="font-size: 12px; margin: 4px 0;"><strong>タイトル:</strong> ${snap1.title || "(なし)"}</p>
          <p style="font-size: 12px; margin: 4px 0;"><strong>保存日時:</strong> ${snap1.meta?.savedAt ? new Date(snap1.meta.savedAt).toLocaleString() : "不明"}</p>
          <p style="font-size: 12px; margin: 4px 0;"><strong>ラベル:</strong> ${snap1.meta?.label || "(なし)"}</p>
        </div>
        <div style="padding: 12px; background: rgba(0,0,0,0.05); border-radius: 8px;">
          <h3 style="margin-top: 0; font-size: 14px;">スナップショット 2</h3>
          <p style="font-size: 12px; margin: 4px 0;"><strong>タイトル:</strong> ${snap2.title || "(なし)"}</p>
          <p style="font-size: 12px; margin: 4px 0;"><strong>保存日時:</strong> ${snap2.meta?.savedAt ? new Date(snap2.meta.savedAt).toLocaleString() : "不明"}</p>
          <p style="font-size: 12px; margin: 4px 0;"><strong>ラベル:</strong> ${snap2.meta?.label || "(なし)"}</p>
        </div>
      </div>

      <div style="padding: 12px; background: rgba(0,0,0,0.05); border-radius: 8px; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 13px;">
          <strong>変更統計:</strong> 
          <span style="color: #28a745;">+${stats.added}</span> / 
          <span style="color: #dc3545;">-${stats.removed}</span> / 
          <span style="color: #ffc107;">~${stats.modified}</span> / 
          <span>${stats.equal} 行変更なし</span>
        </p>
      </div>

      <div id="diff-container" style="font-family: monospace; font-size: 13px; line-height: 1.6; background: var(--surface-secondary, #f5f5f5); padding: 16px; border-radius: 8px; overflow: auto; max-height: 50vh;">
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Render diff
    renderDiff(diff);

    // Event handlers
    document.getElementById("compare-close").addEventListener("click", () => {
      modal.remove();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  function calculateDiffStats(diff) {
    const stats = { added: 0, removed: 0, modified: 0, equal: 0 };
    diff.forEach((item) => {
      stats[item.type === "equal" ? "equal" : item.type]++;
    });
    return stats;
  }

  function renderDiff(diff) {
    const container = document.getElementById("diff-container");
    if (!container) return;

    diff.forEach((item) => {
      const lineEl = document.createElement("div");
      lineEl.style.cssText = "padding: 2px 4px; margin: 1px 0;";

      switch (item.type) {
        case "added":
          lineEl.style.background = "rgba(40, 167, 69, 0.15)";
          lineEl.innerHTML = `<span style="color: #28a745;">+ ${escapeHtml(item.line2 || "")}</span>`;
          break;
        case "removed":
          lineEl.style.background = "rgba(220, 53, 69, 0.15)";
          lineEl.innerHTML = `<span style="color: #dc3545;">- ${escapeHtml(item.line1 || "")}</span>`;
          break;
        case "modified":
          lineEl.style.background = "rgba(255, 193, 7, 0.15)";
          lineEl.innerHTML = `<span style="color: #ffc107;">~ ${escapeHtml(item.line1 || "")}</span><br><span style="color: #ffc107;">~ ${escapeHtml(item.line2 || "")}</span>`;
          break;
        case "equal":
          lineEl.innerHTML = `<span style="color: var(--muted, #666);">  ${escapeHtml(item.line1 || "")}</span>`;
          break;
      }

      container.appendChild(lineEl);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Expose API
  window.SnapshotCompare = {
    selectSnapshotForComparison,
    compareSnapshots,
    getSelectedSnapshots: () => selectedSnapshots.slice(),
  };
})();
