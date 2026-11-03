(async () => {
  const status = document.getElementById('offlineStatus');
  if (!('serviceWorker' in navigator)) {
    status.textContent = '当前浏览器无法准备离线使用。';
    return;
  }
  try {
    await navigator.serviceWorker.register('./sw.js');
    const refreshStatus = () => {
      if (navigator.serviceWorker.controller) status.textContent = '离线已就绪';
    };
    navigator.serviceWorker.addEventListener('controllerchange', refreshStatus);
    await navigator.serviceWorker.ready;
    refreshStatus();
  } catch {
    status.textContent = '离线准备失败。请联网重新打开。';
  }
})();
