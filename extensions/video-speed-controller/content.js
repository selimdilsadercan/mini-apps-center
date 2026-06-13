let currentSpeed = 1.0;

function showSpeedIndicator(speed) {
  let indicator = document.getElementById('video-speed-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'video-speed-indicator';
    document.body.appendChild(indicator);
  }
  indicator.innerText = `${speed.toFixed(2)}x`;
  indicator.classList.add('show');
  
  clearTimeout(window.speedIndicatorTimeout);
  window.speedIndicatorTimeout = setTimeout(() => {
    indicator.classList.remove('show');
  }, 1000);
}

function updateVideoSpeed(delta) {
  const videos = document.querySelectorAll('video');
  
  // Update currentSpeed based on the first video found, or default to 1.0
  if (videos.length > 0) {
    currentSpeed = videos[0].playbackRate;
  }

  currentSpeed = Math.max(0.1, currentSpeed + delta);
  
  videos.forEach(video => {
    video.playbackRate = currentSpeed;
  });
  
  showSpeedIndicator(currentSpeed);
}

document.addEventListener('keydown', (e) => {
  // Ignore if user is typing in an input/textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return;
  }

  if (e.key.toLowerCase() === 'd') {
    updateVideoSpeed(0.1);
  } else if (e.key.toLowerCase() === 's') {
    updateVideoSpeed(-0.1);
  }
});
