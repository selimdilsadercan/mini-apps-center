let currentSpeed = 1.0;

function showIndicator(video, text) {
  const container = video.closest('.html5-video-player') || video.parentElement;
  if (!container) return;

  // Ensure the container has positioning context if it's not YouTube's player
  if (!video.closest('.html5-video-player')) {
    const style = window.getComputedStyle(container);
    if (style.position === 'static') {
      container.style.position = 'relative';
    }
  }

  // Find or create the inline indicator
  let indicator = container.querySelector('.video-speed-indicator-inline');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'video-speed-indicator-inline';
    container.appendChild(indicator);
  }

  indicator.innerText = text;
  indicator.classList.add('show');

  clearTimeout(video.indicatorTimeout);
  video.indicatorTimeout = setTimeout(() => {
    indicator.classList.remove('show');
  }, 1000);
}

function updateVideoSpeed(delta) {
  const videos = document.querySelectorAll('video');

  if (videos.length > 0) {
    currentSpeed = videos[0].playbackRate;
  }

  currentSpeed = Math.max(0.1, currentSpeed + delta);

  videos.forEach(video => {
    video.playbackRate = currentSpeed;
    showIndicator(video, `${currentSpeed.toFixed(2)}x`);
  });

  // Broadcast speed change to popup if it is open
  try {
    chrome.runtime.sendMessage({
      action: "speedChanged",
      speed: currentSpeed,
      videoCount: videos.length,
      currentTime: videos[0] ? videos[0].currentTime : 0,
      duration: videos[0] ? videos[0].duration : 0
    });
  } catch (err) {
    // Popup is closed, ignore
  }
}

function seekVideo(seconds) {
  const videos = document.querySelectorAll('video');
  if (videos.length === 0) return;

  videos.forEach(video => {
    video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + seconds));
    showIndicator(video, seconds > 0 ? `+${seconds}sn` : `${seconds}sn`);
  });

  // Broadcast change to popup if open
  try {
    chrome.runtime.sendMessage({
      action: "speedChanged",
      speed: currentSpeed,
      videoCount: videos.length,
      currentTime: videos[0].currentTime,
      duration: videos[0].duration || 0
    });
  } catch (err) {
    // Popup is closed, ignore
  }
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return;
  }

  const key = e.key.toLowerCase();
  if (key === 'd') {
    updateVideoSpeed(0.1);
  } else if (key === 's') {
    updateVideoSpeed(-0.1);
  } else if (key === 'x') {
    seekVideo(5);
  } else if (key === 'z') {
    seekVideo(-5);
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const videos = document.querySelectorAll('video');
  if (videos.length > 0) {
    currentSpeed = videos[0].playbackRate;
  }

  if (request.action === "getSpeedState") {
    let duration = 0;
    let currentTime = 0;
    if (videos.length > 0) {
      duration = videos[0].duration || 0;
      currentTime = videos[0].currentTime || 0;
    }
    sendResponse({
      speed: currentSpeed,
      videoCount: videos.length,
      currentTime: currentTime,
      duration: duration
    });
  } else if (request.action === "setSpeed") {
    const targetSpeed = parseFloat(request.speed);
    if (!isNaN(targetSpeed) && targetSpeed > 0) {
      currentSpeed = targetSpeed;
      videos.forEach(video => {
        video.playbackRate = currentSpeed;
        showIndicator(video, `${currentSpeed.toFixed(2)}x`);
      });

      let duration = 0;
      let currentTime = 0;
      if (videos.length > 0) {
        duration = videos[0].duration || 0;
        currentTime = videos[0].currentTime || 0;
      }
      sendResponse({
        success: true,
        speed: currentSpeed,
        videoCount: videos.length,
        currentTime: currentTime,
        duration: duration
      });
    } else {
      sendResponse({ success: false });
    }
  }
  return true;
});


