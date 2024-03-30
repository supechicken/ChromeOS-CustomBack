const chromeURLs            = chrome.runtime.getManifest().optional_host_permissions,
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
      chromeUI              = document.getElementById('chromeUI'),
      materialYou           = document.getElementById('materialYou'),
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
    currentVideo.src = URL.createObjectURL(backgroundFile);
    currentVideo.style.display = 'initial';
  } else {
    currentImg.src = URL.createObjectURL(backgroundFile);
    currentImg.style.display = 'initial';
  }
};

// save changes
saveBtn.onclick = async () => {
  const registration   = await chrome.scripting.getRegisteredContentScripts({ids: ["injection-script"]}).then(s => s[0]),
        backgroundFile = backgroundPicker.files[0];

  await chrome.permissions.request({ origins: chromeURLs }).then(() => {
    printLog('Permission acquired!');
  }).catch(e => {
    console.error(e);
    alert('Failed to acquire permission for chrome:// URLs.\n\nDoes the "Extensions on chrome:// URLs" flag enabled?');
    throw new Error('Failed to acquire permission for chrome:// URLs.')
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
      console.error(e);
      alert('Failed to register injection script.\n\nDoes the "Extensions on chrome:// URLs" flag enabled?');
      throw new Error('Failed to register injection script.');
    });
  }

  if (backgroundFile) {
    const dataURL = await getDataURL(backgroundFile);
    await chrome.storage.local.set({
      backgroundURL:  dataURL,
      backgroundType: backgroundFile.type
    }).then(() => printLog('Background saved.'));
  }

  await chrome.storage.local.set({
    blurRadius:     blurRadiusSlider.value,
    menuBlurRadius: menuBlurRadiusSlider.value,
    UIOpacity:      UIOpacitySlider.value,
    menuOpacity:    menuOpacitySlider.value,
    chromeUI:       chromeUI.checked,
    materialYou:    materialYou.checked
  }).then(() => {
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
    'materialYou'
  ]);

  rootStyle.setProperty('--blur-radius', `${localStorage.blurRadius || 5}px`);
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
  materialYou.checked             = localStorage.materialYou;
  blurRadiusSlider.value          = localStorage.blurRadius || 5;
  blurRadiusPercent.innerText     = `${blurRadiusSlider.value}px`;
  menuBlurRadiusSlider.value      = localStorage.menuBlurRadius || 5;
  menuBlurRadiusPercent.innerText = `${menuBlurRadiusSlider.value}px`;
  UIOpacitySlider.value           = localStorage.UIOpacity || 50;
  UIOpacityPercent.innerText      = `${UIOpacitySlider.value}%`
  menuOpacitySlider.value         = localStorage.menuOpacity || 50;
  menuOpacityPercent.innerText    = `${menuOpacitySlider.value}%`
};
