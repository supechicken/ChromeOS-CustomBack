const colorVars = [
  'cr-card-background-color',
  'cr-drawer-background-color',
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

const injectedStyle   = new CSSStyleSheet,
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

function appendCSS(css, isGlobal = false) {
  return injectedStyle.insertRule(`${isGlobal ? ':root' : 'body'} { ${css} }`);
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
      const fileQuickView = document.getElementById('quick-view').shadowRoot;

      injectedStyle.insertRule(`
        #dialog {
          background-color: rgba(var(--txt-cros-sys-app_base_shaded), var(--menu-opacity));
          backdrop-filter: blur(var(--menu-blur-radius));
        }
      `);

      fileQuickView.adoptedStyleSheets.push(injectedStyle);
      break;
    case 'os-settings':
      // inject blur code to cr-drawer shadow root
      const mainElement     = document.querySelector('os-settings-ui'),
            crDrawer        = mainElement.shadowRoot.getElementById('drawer').shadowRoot;

      mainElement.style.backgroundColor = 'var(--new-cros-sys-app_base_shaded)';
      injectedStyle.insertRule(`#dialog { backdrop-filter: blur(var(--menu-blur-radius)); }`);

      crDrawer.adoptedStyleSheets.push(injectedStyle);
      break;
    default:
      if (localStorage.chromeUI) {
        const drawer_inject_blur = e => {
          const shadowRoot = e.shadowRoot,
                container  = shadowRoot.getElementById('dialog');

          container.style.backdropFilter = `blur(var(--menu-blur-radius))`;
        };

        const drawer_observer = new MutationObserver((records, _) => {
          records[0].addedNodes?.forEach(e => {
            if (e.tagName === 'CR-DRAWER') drawer_inject_blur(e);
          });
        });

        document.querySelectorAll('body > *:not(#backgroundImg)').forEach(e => {
          e.style.backgroundColor = 'rgb(from var(--new-cros-sys-app_base_shaded) r g b / var(--tertiary-opacity))';

          if (!e.shadowRoot) return;

          e.shadowRoot.querySelectorAll('cr-drawer').forEach(drawer => drawer_inject_blur(drawer));
          drawer_observer.observe(e.shadowRoot, { childList: true });
        });

        if (location.hostname === 'extensions') {
          // fix color for the developer mode toolbar
          const mainElement = document.querySelector('extensions-manager').shadowRoot,
                extToolbar  = mainElement.getElementById('toolbar').shadowRoot,
                devToolbar  = extToolbar.getElementById('devDrawer');

          if (devToolbar) devToolbar.style.backgroundColor = 'transparent';
        }

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

  colorVars.forEach(varName => appendCSS(`--${varName}: var(--new-${varName});`));

  document.adoptedStyleSheets.push(injectedStyle);

  printLog('Style injected!');

  if (localStorage.backgroundType.startsWith('video/')) {
    backgroundVideo.autoplay = backgroundVideo.loop = backgroundVideo.muted = true;

    backgroundVideo.src           = localStorage.backgroundURL;
    backgroundVideo.className     = "customBackground";
    backgroundVideo.style.display = 'initial';

    bodyElement.appendChild(backgroundVideo);
  } else {
    backgroundImg.src             = localStorage.backgroundURL;
    backgroundImg.className       = "customBackground";
    backgroundVideo.style.display = 'initial';

    bodyElement.appendChild(backgroundImg);
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
