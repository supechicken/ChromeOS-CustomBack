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

const origStyle       = getComputedStyle(document.documentElement),
      injectedStyle   = new CSSStyleSheet,
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

function color2hex(colorStr) {
  const ctx     = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = colorStr;

  const color = ctx.fillStyle;

  if (color.startsWith('rgba')) {
    // RGBA code
    return color.match(/^rgba\((.+?), (.+?), (.+?), .+?\)$/).slice(1)
  } else {
    // hex code
    return color.match(/^\#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/).
           slice(1).map(hex => parseInt(hex, 16)).join(', ');
  }
}

function appendCSS(css, isGlobal = false) {
  return injectedStyle.insertRule(`${isGlobal ? ':root' : 'body'} { ${css} }`);
}

function setupColorVariables() {
  colorVars.forEach(varName => {
    const origColor = getComputedStyle(document.documentElement).getPropertyValue(`--${varName}`);

    if (!origColor) return;

    appendCSS(`--txt-${varName}: ${color2hex(origColor)};`, true);
    appendCSS(`--${varName}: var(--new-${varName});`);
  });
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
            shadowRoot    = fileQuickView.shadowRoot;

      injectedStyle.insertRule(`
        #dialog {
          background-color: rgba(var(--txt-cros-sys-app_base_shaded), var(--menu-opacity));
          backdrop-filter: blur(var(--menu-blur-radius));
        }
      `);

      shadowRoot.adoptedStyleSheets.push(injectedStyle);
      break;
    default:
      if (localStorage.chromeUI) {
        document.querySelectorAll('body > *:not(#backgroundImg)').forEach(e => {
          e.style.backgroundColor = 'var(--new-cros-sys-app_base_shaded)'
        });

        break;
      } else {
        return;
      }
  }

  appendCSS(`
    --blur-radius:      ${localStorage.blurRadius || 5}px;
    --menu-blur-radius: ${localStorage.menuBlurRadius || 5}px;
    --element-opacity:  ${localStorage.UIOpacity || 50}%;
    --menu-opacity:     ${localStorage.menuOpacity || 50}%;
  `, true);

  setupColorVariables();
  document.adoptedStyleSheets.push(injectedStyle);

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
