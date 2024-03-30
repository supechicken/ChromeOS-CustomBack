const rootStyle       = document.documentElement.style,
      backgroundImg   = document.createElement("img"),
      backgroundVideo = document.createElement('video');

function printLog(message) {
  // printLog(): print to browser console
  if (message instanceof Array) {
    message.forEach(m => console.log('[ChromeOS CustomBack]:', m));
  } else {
    console.log('[ChromeOS CustomBack]:', message);
  }
}

function hex2rgba(str) {
  return str.match(/^\#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/).
         slice(1, -1).map(hex => parseInt(hex, 16)).join(', ');
}

window.addEventListener('load', async () => {
  const localStorage = await chrome.storage.local.get([
    'backgroundURL',
    'backgroundType',
    'blurRadius',
    'menuBlurRadius',
    'UIOpacity',
    'menuOpacity',
    'chromeUI',
    'materialYou'
  ]);

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

  const orig_app_base_color          = getComputedStyle(document.documentElement).getPropertyValue('--cros-sys-app_base'),
        orig_app_base_shaded_color   = getComputedStyle(document.documentElement).getPropertyValue('--cros-sys-app_base_shaded'),
        txt_cros_sys_app_base        = hex2rgba(orig_app_base_color),
        txt_cros_sys_app_base_shaded = hex2rgba(orig_app_base_shaded_color);

  if (localStorage.materialYou) {
    rootStyle.setProperty('--txt-cros-sys-app_base', txt_cros_sys_app_base);
    rootStyle.setProperty('--txt-cros-sys-app_base_shaded', txt_cros_sys_app_base_shaded);
  }

  rootStyle.setProperty('--blur-radius', `${localStorage.blurRadius || 5}px`);
  rootStyle.setProperty('--menu-blur-radius', `${localStorage.menuBlurRadius || 5}px`);
  rootStyle.setProperty('--element-opacity', `${localStorage.UIOpacity || 50}%`);
  rootStyle.setProperty('--menu-opacity', `${localStorage.menuOpacity || 50}%`);
  rootStyle.setProperty('--cros-sys-app_base', 'var(--new-cros-sys-app_base)');
  rootStyle.setProperty('--cros-sys-app_base_shaded', 'var(--new-cros-sys-app_base_shaded)');
  rootStyle.setProperty('--cros-sys-base_elevated', 'var(--new-cros-sys-app_base)');
  rootStyle.setProperty('--cr-card-background-color', 'var(--new-cros-sys-app_base)');

  printLog('Style injected!');

  if (localStorage.backgroundType.startsWith('video/')) {
    backgroundVideo.autoplay = backgroundVideo.loop = backgroundVideo.muted = true;

    backgroundVideo.src           = localStorage.backgroundURL;
    backgroundVideo.className     = "customBackground";
    backgroundVideo.style.display = 'initial';

    document.body.appendChild(backgroundVideo);
  } else {
    backgroundImg.src             = localStorage.backgroundURL;
    backgroundImg.className       = "customBackground";
    backgroundVideo.style.display = 'initial';

    document.body.appendChild(backgroundImg);
  }
});
