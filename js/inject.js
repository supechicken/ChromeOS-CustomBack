const colorVars = [
  'cr-card-background-color',
  'cros-sys-app_base',
  'cros-sys-app_base_shaded',
  'cros-sys-base_elevated',
  'cros-sys-surface',
  'cros-sys-surface1',
  'cros-sys-surface2',
  'cros-sys-surface3',
  'cros-sys-surface4',
  'cros-sys-surface5'
];

const rootStyle       = document.documentElement.style,
      bodyElement     = document.body,
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

function hex2rgb(str) {
  return str.match(/^\#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/).
         slice(1).map(hex => parseInt(hex, 16)).join(', ');
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
    'movingBackground'
  ]);

  switch (location.hostname) {
    case 'file-manager':
      // inject blur code to file-quick-view shadow root
      const fileQuickView = document.getElementById('quick-view'),
            shadowRoot    = fileQuickView.shadowRoot,
            newCss        = new CSSStyleSheet;

      newCss.insertRule('#dialog { background-color: rgba(var(--txt-cros-sys-app_base_shaded), var(--menu-opacity)); backdrop-filter: blur(var(--menu-blur-radius)); }');
      shadowRoot.adoptedStyleSheets.push(newCss);
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
  rootStyle.setProperty('--menu-blur-radius', `${localStorage.menuBlurRadius || 5}px`);
  rootStyle.setProperty('--element-opacity', `${localStorage.UIOpacity || 50}%`);
  rootStyle.setProperty('--menu-opacity', `${localStorage.menuOpacity || 50}%`);

  colorVars.forEach(varName => {
    const orig_color = getComputedStyle(document.documentElement).getPropertyValue(`--${varName}`);

    if (!orig_color) return;

    rootStyle.setProperty(`--txt-${varName}`, hex2rgb(orig_color));
    rootStyle.setProperty(`--${varName}`, `var(--new-${varName})`);
  });

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

  if (localStorage.movingBackground) {
    backgroundImg.style.transform = backgroundVideo.style.transform = 'scale(103%)';

    document.body.addEventListener('mousemove', e => {
      const bodyHeight = bodyElement.offsetHeight,
            bodyWidth  = bodyElement.offsetWidth;

      backgroundImg.style.objectPosition = backgroundVideo.style.objectPosition = `
        calc(50% + ${Math.round((bodyWidth * 0.01) * (e.clientX / bodyWidth * 2 - 1))}px)
        calc(50% + ${Math.round((bodyHeight * 0.01) * (e.clientY / bodyHeight * 2 - 1))}px)
      `;
    });
  }
});
