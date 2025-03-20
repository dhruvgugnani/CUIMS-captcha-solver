document.addEventListener("DOMContentLoaded", () => {
  // Automatically send message to solve captcha on popup load.
  sendSolveMessage();

  const solveBtn = document.getElementById("solveBtn");
  if (!solveBtn) {
    console.error("No solveBtn found in popup.html");
    return;
  }
  
  // Re-trigger solving on button click.
  solveBtn.addEventListener("click", () => {
    sendSolveMessage();
  });
});

function sendSolveMessage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error("chrome.tabs.query error:", chrome.runtime.lastError.message);
      return;
    }
    
    if (!tabs || tabs.length === 0) {
      alert("No active tab found.");
      return;
    }
    
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, { command: "solveCaptcha" }, (response) => {
      if (chrome.runtime.lastError) {
        //console.error("Error sending message:", chrome.runtime.lastError.message);
        return;
      }
      
      if (!response) {
        console.error("No response received from content script.");
        return;
      }
      
      console.log("Captcha solved. Recognized text:", response.result);
      // Update status text in popup
      const status = document.getElementById("status");
      status.textContent = "Recognized text: " + response.result;
    });
  });
}
