const chromeURLs            = chrome.runtime.getManifest().optional_host_permissions,
      chromeVersion         = parseInt(navigator.userAgent.match(/Chrome\/([0-9]+)/)[1]),
      rootStyle             = document.documentElement.style,
      currentVideo          = document.getElementById('currentVideo'),
      currentImg            = document.getElementById('currentImg'),
      blurRadiusSlider      = document.getElementById('blurRadiusSlider'),
      blurRadiusPercent     = document.getElementById('blurRadiusPercent'),
      menuBlurRadiusSlider  = document.getElementById('menuBlurRadiusSlider'),
      menuBlurRadiusPercent = document.getElementById('menuBlurRadiusPercent'),
      UIOpacitySlider       = document.getElementById('UIOpacitySlider'),
      UIOpacityPercent      = document.getElementById('UIOpacityPercent'),
      menuOpacitySlider     = document.getElementById('menuOpacitySlider'),
      menuOpacityPercent    = document.getElementById('menuOpacityPercent'),
      chromeUISection       = document.getElementById('chromeUISection'),
      chromeUIinfo          = document.getElementById('chromeUIinfo'),
      chromeUI              = document.getElementById('chromeUI'),
      movingBackground      = document.getElementById('movingBackground'),
      backgroundPicker      = document.getElementById('backgroundPicker'),
      saveBtn               = document.getElementById('saveBtn');

function printLog(message) {
  // printLog(): print to browser console
  if (message instanceof Array) {
    message.forEach(m => console.log('[ChromeOS CustomBack]:', m));
  } else {
    console.log('[ChromeOS CustomBack]:', message);
  }
}

function getDataURL(file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);

  return new Promise((resolve, reject) => {
    reader.onload  = () => resolve(reader.result);
    reader.onerror = e  => reject(e);
  });
}

async function img2webp(imgBlob) {
  const img = new Image();

  img.src = URL.createObjectURL(imgBlob);
  await new Promise(resolve => img.onload = resolve);

  const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight),
        ctx    = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0);

  const result = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });

  printLog(`img2webp: ${imgBlob.size} bytes -> ${result.size} bytes (reduced ${Math.round((imgBlob.size - result.size) / imgBlob.size * 100)}%)`);
  return result;
}

chromeUIinfo.onclick = () => {
  alert('Not supported for videos on Chrome v124+ due to tightened Content Security Policy (CSP) on built-in pages');
}

// set labels according to sliders
blurRadiusSlider.oninput = blurRadiusSlider.onchange = () => {
  rootStyle.setProperty('--blur-radius', `${blurRadiusSlider.value}px`);
  blurRadiusPercent.innerText = `${blurRadiusSlider.value}px`;
};

menuBlurRadiusSlider.oninput = menuBlurRadiusSlider.onchange = () => {
  rootStyle.setProperty('--menu-blur-radius', `${menuBlurRadiusSlider.value}px`);
  menuBlurRadiusPercent.innerText = `${menuBlurRadiusSlider.value}px`;
};

UIOpacitySlider.oninput = UIOpacitySlider.onchange = () => {
  rootStyle.setProperty('--element-opacity', `${UIOpacitySlider.value}%`);
  UIOpacityPercent.innerText = `${UIOpacitySlider.value}%`;
};

menuOpacitySlider.oninput = menuOpacitySlider.onchange = () => {
  rootStyle.setProperty('--menu-opacity', `${menuOpacitySlider.value}%`);
  menuOpacityPercent.innerText = `${menuOpacitySlider.value}%`;
};

// background picker
backgroundPicker.onchange = async () => {
  const backgroundFile = backgroundPicker.files[0];

  if (backgroundFile.type.startsWith('video/')) {
    if (chromeVersion >= 124) {
      chromeUI.checked      = false;
      chromeUI.disabled     = true;
      chromeUISection.title = 'Not supported for videos on Chrome v124+ due to tightened Content Security Policy (CSP) on built-in pages';
      chromeUISection.classList.add('disabled');
      chromeUISection.querySelector('.switch > .slider').classList.add('disabled');
    }

    currentVideo.src           = URL.createObjectURL(backgroundFile);
    currentVideo.style.display = 'initial';
    currentImg.style.display   = 'none';
  } else {
    if (chromeVersion >= 124) {
      chromeUI.disabled     = false;
      chromeUISection.title = '';
      chromeUISection.classList.remove('disabled');
      chromeUISection.querySelector('.switch > .slider').classList.remove('disabled');
    }

    currentImg.src             = URL.createObjectURL(backgroundFile);
    currentImg.style.display   = 'initial';
    currentVideo.style.display = 'none';
  }
};

// save changes
saveBtn.onclick = async () => {
  saveBtn.disabled = true;

  const registration   = await chrome.scripting.getRegisteredContentScripts({ids: ["injection-script"]}).then(s => s[0]),
        backgroundFile = backgroundPicker.files[0];

  await chrome.permissions.request({ origins: chromeURLs }).then(() => {
    printLog('Permission acquired!');
  }).catch(e => {
    saveBtn.disabled = false;
    console.error(e);
    alert('Failed to acquire permission for chrome:// URLs.\n\nDoes the "Extensions on chrome:// URLs" flag enabled?');
    throw new Error('Failed to acquire permission for chrome:// URLs.');
  });

  if (registration) {
    printLog([ 'Registration:', registration ]);
  } else {
    await chrome.scripting.registerContentScripts([{
      allFrames: true,
      persistAcrossSessions: false,
      id:  'injection-script',
      js:  ['js/inject.js'],
      css: ['css/inject.css'],
      matches: chromeURLs,
      runAt: 'document_end'
    }]).then(() => {
      printLog('Injection script registered!');
    }).catch(e => {
      saveBtn.disabled = false;
      console.error(e);
      alert('Failed to register injection script.\n\nDoes the "Extensions on chrome:// URLs" flag enabled?');
      throw new Error('Failed to register injection script.');
    });
  }

  if (backgroundFile) {
    let dataURL;

    if (backgroundFile.type.startsWith('image/')) {
      // convert image to webp to reduce file size
      printLog('Converting image to WebP...');
      const webpImg = await img2webp(backgroundFile);
      dataURL       = await getDataURL(webpImg);
    } else {
      dataURL = await getDataURL(backgroundFile);
    }

    await chrome.storage.local.set({
      backgroundURL:  dataURL,
      backgroundType: backgroundFile.type
    }).then(() => printLog('Background saved.'));
  }

  await chrome.storage.local.set({
    blurRadius:       blurRadiusSlider.value,
    menuBlurRadius:   menuBlurRadiusSlider.value,
    UIOpacity:        UIOpacitySlider.value,
    menuOpacity:      menuOpacitySlider.value,
    chromeUI:         chromeUI.checked,
    movingBackground: movingBackground.checked
  }).then(() => {
    saveBtn.disabled = false;
    printLog('Options saved.');
    alert("Changes saved.");
  });
};

window.onload = async () => {
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

  rootStyle.setProperty('--blur-radius', `${localStorage.blurRadius || 0}px`);
  rootStyle.setProperty('--menu-blur-radius', `${localStorage.menuBlurRadius || 5}px`);
  rootStyle.setProperty('--element-opacity', `${localStorage.UIOpacity || 50}%`);
  rootStyle.setProperty('--menu-opacity', `${localStorage.menuOpacity || 50}%`);

  if (localStorage.backgroundURL) {
    if (localStorage.backgroundType.startsWith('video/')) {
      currentVideo.style.display = 'initial';
      currentVideo.src           = localStorage.backgroundURL;
    } else {
      currentImg.style.display = 'initial';
      currentImg.src           = localStorage.backgroundURL;
    }
  }

  chromeUI.checked                = localStorage.chromeUI;
  movingBackground.checked        = (localStorage.movingBackground === undefined) ? true : localStorage.movingBackground;
  blurRadiusSlider.value          = localStorage.blurRadius || 0;
  blurRadiusPercent.innerText     = `${blurRadiusSlider.value}px`;
  menuBlurRadiusSlider.value      = localStorage.menuBlurRadius || 5;
  menuBlurRadiusPercent.innerText = `${menuBlurRadiusSlider.value}px`;
  UIOpacitySlider.value           = localStorage.UIOpacity || 50;
  UIOpacityPercent.innerText      = `${UIOpacitySlider.value}%`
  menuOpacitySlider.value         = localStorage.menuOpacity || 50;
  menuOpacityPercent.innerText    = `${menuOpacitySlider.value}%`;
};
