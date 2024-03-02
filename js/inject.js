const rootStyle     = document.documentElement.style,
      backgroundImg = document.createElement("img");

function hex2rgba(hex, alpha = 1) {
  const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

window.addEventListener('load', async () => {
  const printLog     = await import(chrome.runtime.getURL('js/shared/functions.js')).then(m => m.printLog),
        localStorage = await new Promise(r => chrome.storage.local.get(['backgroundURL', 'blurRadius', 'UIOpacity', 'chromeUI'], c => r(c)));

  switch (location.hostname) {
    case 'os-settings':
    case 'file-manager':
      break;
    default:
      if (localStorage.chromeUI) {
        document.querySelectorAll('body > *:not(#backgroundImg)').forEach(e => {
          e.style.backgroundColor = 'var(--new-cros-sys-app_base_shaded)'
        });
      } else {
        return;
      }
      break;
  }

  rootStyle.setProperty('--blur-radius', `${localStorage.blurRadius || 5}px`);
  rootStyle.setProperty('--element-opacity', `${localStorage.UIOpacity || 50}%`);
  rootStyle.setProperty('--cros-sys-app_base', 'var(--new-cros-sys-app_base)');
  rootStyle.setProperty('--cros-sys-app_base_shaded', 'var(--new-cros-sys-app_base_shaded)');
  rootStyle.setProperty('--cros-sys-base_elevated', 'var(--new-cros-sys-app_base)');
  rootStyle.setProperty('--cr-card-background-color', 'var(--new-cros-sys-app_base)');

  printLog('Style injected!');

  backgroundImg.src       = localStorage.backgroundURL;
  backgroundImg.className = "backgroundImg";

  document.body.appendChild(backgroundImg);
});