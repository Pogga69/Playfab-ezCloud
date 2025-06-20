function showToast(type, title, message) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<strong>${title}</strong><br>${message}`;
  document.getElementById("notifications").appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function loginWithCustomId(id, callback) {
  PlayFab.settings.titleId = id;
  PlayFabClientSDK.LoginWithCustomID({
    CustomId: "TestUser_" + Math.floor(Math.random() * 10000),
    CreateAccount: true
  }, result => {
    callback();
  }, error => {
    showToast("error", "❌ Couldn’t Log In", "Make sure Admin API calls are enabled");
    document.getElementById("result").textContent = "Login Failed:\n" + JSON.stringify(error, null, 2);
    switchTab("output");
  });
}

function runCloudScript() {
  const titleId = document.getElementById("titleId").value.trim();
  const functionName = document.getElementById("functionName").value.trim();
  const argsText = document.getElementById("arguments").value.trim();

  if (!titleId || !functionName) {
    showToast("error", "❌ Missing Info", "Title ID and Function Name are required");
    return;
  }

  let args = {};
  try {
    args = argsText ? JSON.parse(argsText) : {};
  } catch (e) {
    showToast("error", "❌ Invalid JSON", e.message);
    document.getElementById("result").textContent = "Invalid JSON:\n" + e.message;
    switchTab("output");
    return;
  }

  loginWithCustomId(titleId, () => {
    PlayFabClientSDK.ExecuteCloudScript({
      FunctionName: functionName,
      FunctionParameter: args,
      GeneratePlayStreamEvent: true
    }, result => {
      showToast("success", "✅ Success", "Function ran successfully");
      saveToRecent(functionName, args);
      document.getElementById("result").textContent = JSON.stringify(result, null, 2);
      switchTab("output");
    }, error => {
      showToast("error", "❌ Execution Failed", "Check your function name or PlayFab title settings");
      document.getElementById("result").textContent = "CloudScript Error:\n" + JSON.stringify(error, null, 2);
      switchTab("output");
    });
  });
}

function switchTab(name) {
  document.querySelectorAll(".tab-content").forEach(el => {
    el.classList.remove("active");
    if (el.id === name) el.classList.add("active");
  });
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
    if (tab.dataset.tab === name) tab.classList.add("active");
  });
}

const recentCalls = [];

function saveToRecent(functionName, args) {
  const match = recentCalls.find(entry =>
    entry.name === functionName &&
    JSON.stringify(entry.args) === JSON.stringify(args)
  );

  if (match) {
    match.count++;
  } else {
    recentCalls.unshift({
      name: functionName,
      args,
      count: 1
    });
  }

  renderRecent();
}

function renderRecent() {
  const container = document.getElementById("recent-list");
  container.innerHTML = "";

  if (recentCalls.length === 0) {
    container.textContent = "No recent calls yet.";
    return;
  }

  recentCalls.forEach(({ name, args, count }, index) => {
    const item = document.createElement("div");
    item.innerHTML = `
      <div style="margin-bottom: 12px;">
        <span style="font-weight: bold;">${name} (${count})</span><br>
        <button onclick="loadRecent(${index})">Open</button>
        <button style="margin-left: 12px;" onclick="reExecute(${index})">Execute</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function loadRecent(index) {
  const data = recentCalls[index];
  if (data) {
    document.getElementById("functionName").value = data.name;
    document.getElementById("arguments").value = JSON.stringify(data.args, null, 2);
    switchTab("run");
  }
}

function reExecute(index) {
  const data = recentCalls[index];
  if (data) {
    document.getElementById("functionName").value = data.name;
    document.getElementById("arguments").value = JSON.stringify(data.args, null, 2);
    runCloudScript();
  }
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    switchTab(tab.dataset.tab);
  });
});
