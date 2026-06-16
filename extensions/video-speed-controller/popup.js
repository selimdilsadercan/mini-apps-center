document.addEventListener('DOMContentLoaded', () => {
  const speedVal = document.getElementById('speed-val');
  const speedSlider = document.getElementById('speed-slider');
  const videoStatus = document.getElementById('video-status');
  const presetButtons = document.querySelectorAll('.preset-btn');

  let activeTabId = null;
  let isDraggingSlider = false;

  // Initialize and get state
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    activeTabId = tabs[0].id;

    // Request current speed and video details from the content script
    chrome.tabs.sendMessage(activeTabId, { action: "getSpeedState" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        // Content script might not be loaded or not supported (e.g. chrome:// pages)
        setNoVideoState();
        return;
      }
      
      updateUI(response);
    });
  });

  // Listen for speed changes from content script (e.g. keyboard shortcuts)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "speedChanged") {
      updateUI(request);
    }
  });

  // Handle slider drag state to avoid stuttering/fighting with user cursor
  speedSlider.addEventListener('mousedown', () => { isDraggingSlider = true; });
  speedSlider.addEventListener('mouseup', () => { isDraggingSlider = false; });
  speedSlider.addEventListener('touchstart', () => { isDraggingSlider = true; }, { passive: true });
  speedSlider.addEventListener('touchend', () => { isDraggingSlider = false; });

  // Handle slider inputs
  speedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    // Directly update UI speed display text for instant feedback
    speedVal.innerText = val.toFixed(2);
    setSpeed(val);
  });

  // Handle preset clicks
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.getAttribute('data-speed'));
      setSpeed(val);
    });
  });

  function setSpeed(speed) {
    if (!activeTabId) return;

    chrome.tabs.sendMessage(activeTabId, { action: "setSpeed", speed: speed }, (response) => {
      if (response && response.success) {
        updateUI(response);
      }
    });
  }

  function updateUI(state) {
    const speed = state.speed;
    
    // Update speed numbers
    speedVal.innerText = speed.toFixed(2);
    if (!isDraggingSlider) {
      speedSlider.value = speed;
    }

    // Highlight matching preset button
    presetButtons.forEach(btn => {
      const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
      if (Math.abs(btnSpeed - speed) < 0.01) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (state.videoCount > 0) {
      videoStatus.innerText = `${state.videoCount} Video`;
      videoStatus.className = 'status-badge active';
    } else {
      setNoVideoState();
    }
  }

  function setNoVideoState() {
    videoStatus.innerText = 'Video Yok';
    videoStatus.className = 'status-badge';
  }
});
