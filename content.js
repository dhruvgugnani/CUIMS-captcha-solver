console.log("Content script loaded");

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "solveCaptcha") {
    console.log("Solving captcha...");
    
    // Select the CAPTCHA image element.
    const captchaImg = document.querySelector("img[id*='Captcha']");
    if (!captchaImg) {
      console.error("Captcha image not found!");
      sendResponse({ result: "Failed: Captcha image not found" });
      return;
    }
    
    // Select the CAPTCHA input field.
    const captchaInput = document.querySelector("input[name*='captcha']");
    if (!captchaInput) {
      console.error("Captcha input field not found!");
      sendResponse({ result: "Failed: Captcha input field not found" });
      return;
    }
    
    // Set up a canvas to capture the displayed image at a higher resolution.
    const scaleFactor = 5; // Increase this factor as needed.
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Use the displayed dimensions, then scale them up.
    const displayWidth = captchaImg.width;
    const displayHeight = captchaImg.height;
    canvas.width = displayWidth * scaleFactor;
    canvas.height = displayHeight * scaleFactor;
    
    // Optionally, enable image smoothing for better quality.
    ctx.imageSmoothingEnabled = true;
    
    // Draw the image scaled up onto the canvas.
    ctx.drawImage(captchaImg, 0, 0, canvas.width, canvas.height);
    
    // Convert the canvas content to a Data URL (PNG).
    const dataUrl = canvas.toDataURL("image/png");
    console.log("Captured and scaled CAPTCHA as data URL.");
    
    // Use Tesseract.js to perform OCR on the scaled image.
    (async () => {
      try {
        const worker = Tesseract.createWorker({
          logger: m => console.log(m) // Logs OCR progress.
        });
        await worker.load();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        const { data: { text } } = await worker.recognize(dataUrl);
        await worker.terminate();
        
        const recognizedText = text.trim();
        console.log("Recognized text:", recognizedText);
        
        // Fill the recognized text into the CAPTCHA input field.
        captchaInput.value = recognizedText;
        captchaInput.dispatchEvent(new Event("input", { bubbles: true }));
        captchaInput.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("Captcha input field updated.");
        
        sendResponse({ result: recognizedText });
      } catch (err) {
        console.error("Tesseract OCR error:", err);
        sendResponse({ result: "Failed: OCR error" });
      }
    })();
    
    return true; // Keep the response channel open.
  }
});
