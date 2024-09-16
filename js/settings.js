/*
  Copyright (C) 2024 SupeChicken666 (supechicken)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see https://www.gnu.org/licenses/gpl-3.0.html.
*/

const chromeURLs                = chrome.runtime.getManifest().optional_host_permissions,
      rootStyle                 = document.documentElement.style,
      currentVideo              = document.getElementById('currentVideo'),
      currentImg                = document.getElementById('currentImg'),
      blurRadiusSlider          = document.getElementById('blurRadiusSlider'),
      blurRadiusPercent         = document.getElementById('blurRadiusPercent'),
      chromeUIBlurRadiusSlider  = document.getElementById('chromeUIBlurRadiusSlider'),
      chromeUIBlurRadiusPercent = document.getElementById('chromeUIBlurRadiusPercent'),
      menuBlurRadiusSlider      = document.getElementById('menuBlurRadiusSlider'),
      menuBlurRadiusPercent     = document.getElementById('menuBlurRadiusPercent'),
      UIOpacitySlider           = document.getElementById('UIOpacitySlider'),
      UIOpacityPercent          = document.getElementById('UIOpacityPercent'),
      chromeUIOpacitySlider     = document.getElementById('chromeUIOpacitySlider'),
      chromeUIOpacityPercent    = document.getElementById('chromeUIOpacityPercent'),
      menuOpacitySlider         = document.getElementById('menuOpacitySlider'),
      menuOpacityPercent        = document.getElementById('menuOpacityPercent'),
      chromeUISection           = document.getElementById('chromeUISection'),
      chromeUIinfo              = document.getElementById('chromeUIinfo'),
      chromeUI                  = document.getElementById('chromeUI'),
      chromeUIBgName            = document.getElementById('chromeUIBgName'),
      backgroundName            = document.getElementById('backgroundName'),
      movingBackground          = document.getElementById('movingBackground'),
      backgroundPicker          = document.getElementById('backgroundPicker'),
      chromeUIBgPicker          = document.getElementById('chromeUIBgPicker'),
      resetBtn                  = document.getElementById('resetBtn'),
      saveBtn                   = document.getElementById('saveBtn');

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

// set labels according to sliders
blurRadiusSlider.oninput = blurRadiusSlider.onchange = () => {
  rootStyle.setProperty('--blur-radius', `${blurRadiusSlider.value}px`);
  blurRadiusPercent.innerText = `${blurRadiusSlider.value}px`;
};

chromeUIBlurRadiusSlider.oninput = chromeUIBlurRadiusSlider.onchange = () => {
  chromeUIBlurRadiusPercent.innerText = `${chromeUIBlurRadiusSlider.value}px`;
};

menuBlurRadiusSlider.oninput = menuBlurRadiusSlider.onchange = () => {
  rootStyle.setProperty('--menu-blur-radius', `${menuBlurRadiusSlider.value}px`);
  menuBlurRadiusPercent.innerText = `${menuBlurRadiusSlider.value}px`;
};

UIOpacitySlider.oninput = UIOpacitySlider.onchange = () => {
  rootStyle.setProperty('--element-opacity', `${UIOpacitySlider.value}%`);
  UIOpacityPercent.innerText = `${UIOpacitySlider.value}%`;
};

chromeUIOpacitySlider.oninput = chromeUIOpacitySlider.onchange = () => {
  chromeUIOpacityPercent.innerText = `${chromeUIOpacitySlider.value}%`;
};

menuOpacitySlider.oninput = menuOpacitySlider.onchange = () => {
  rootStyle.setProperty('--menu-opacity', `${menuOpacitySlider.value}%`);
  menuOpacityPercent.innerText = `${menuOpacitySlider.value}%`;
};

// background picker (Files app)
backgroundPicker.onchange = async () => {
  const backgroundFile     = backgroundPicker.files[0];
  backgroundName.innerText = backgroundFile.name;

  if (backgroundFile.type.startsWith('video/')) {
    currentVideo.src           = URL.createObjectURL(backgroundFile);
    currentVideo.style.display = 'initial';
    currentImg.style.display   = 'none';
  } else {
    currentImg.src             = URL.createObjectURL(backgroundFile);
    currentImg.style.display   = 'initial';
    currentVideo.style.display = 'none';
  }
};

// background picker (Chrome UI)
chromeUIBgPicker.onchange = async () => {
  const chromeUIBgFile     = chromeUIBgPicker.files[0];
  chromeUIBgName.innerText = chromeUIBgFile.name;
};

// reset options
resetBtn.onclick = () => {
  chromeUI.checked                    = false;
  movingBackground.checked            = true;
  blurRadiusSlider.value              = 0;
  blurRadiusPercent.innerText         = `${blurRadiusSlider.value}px`;
  chromeUIBlurRadiusSlider.value      = 0;
  chromeUIBlurRadiusPercent.innerText = `${chromeUIBlurRadiusSlider.value}px`;
  menuBlurRadiusSlider.value          = 5;
  menuBlurRadiusPercent.innerText     = `${menuBlurRadiusSlider.value}px`;
  UIOpacitySlider.value               = 50;
  UIOpacityPercent.innerText          = `${UIOpacitySlider.value}%`
  chromeUIOpacitySlider.value         = 50;
  chromeUIOpacityPercent.innerText    = `${chromeUIOpacitySlider.value}%`
  menuOpacitySlider.value             = 50;
  menuOpacityPercent.innerText        = `${menuOpacitySlider.value}%`;
}

// save changes
saveBtn.onclick = async () => {
  saveBtn.disabled = true;

  const registration   = await chrome.scripting.getRegisteredContentScripts({ids: ["injection-script"]}).then(s => s[0]),
        backgroundFile = backgroundPicker.files[0],
        chromeUIBgFile = chromeUIBgPicker.files[0];

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

  // save background (Files)
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
      backgroundName: backgroundFile.name,
      backgroundURL:  dataURL,
      backgroundType: backgroundFile.type
    }).then(() => printLog('Background for Files app saved.'));
  }

  // save background (Chrome UI)
  if (chromeUIBgFile) {
    let dataURL;

    if (chromeUIBgFile.type.startsWith('image/')) {
      // convert image to webp to reduce file size
      printLog('Converting image to WebP...');
      const webpImg = await img2webp(chromeUIBgFile);
      dataURL       = await getDataURL(webpImg);
    } else {
      dataURL = await getDataURL(chromeUIBgFile);
    }

    await chrome.storage.local.set({
      chromeUIBgName: chromeUIBgFile.name,
      chromeUIBgURL:  dataURL
    }).then(() => printLog('Background for Chrome UI saved.'));
  }

  await chrome.storage.local.set({
    blurRadius:         blurRadiusSlider.value,
    chromeUIBlurRadius: chromeUIBlurRadiusSlider.value,
    menuBlurRadius:     menuBlurRadiusSlider.value,
    UIOpacity:          UIOpacitySlider.value,
    chromeUIOpacity:    chromeUIOpacitySlider.value,
    menuOpacity:        menuOpacitySlider.value,
    chromeUI:           chromeUI.checked,
    movingBackground:   movingBackground.checked
  }).then(() => {
    saveBtn.disabled = false;
    printLog('Options saved.');
    alert("Changes saved.");
  });
};

window.onload = async () => {
  const localStorage = await chrome.storage.local.get([
    'backgroundName',
    'backgroundURL',
    'backgroundType',
    'blurRadius',
    'chromeUIBlurRadius',
    'menuBlurRadius',
    'UIOpacity',
    'chromeUIOpacity',
    'menuOpacity',
    'chromeUI',
    'chromeUIBgName',
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

  chromeUI.checked                    = localStorage.chromeUI;
  movingBackground.checked            = (localStorage.movingBackground === undefined) ? true : localStorage.movingBackground;
  blurRadiusSlider.value              = localStorage.blurRadius || 0;
  blurRadiusPercent.innerText         = `${blurRadiusSlider.value}px`;
  chromeUIBlurRadiusSlider.value      = localStorage.chromeUIBlurRadius || 0;
  chromeUIBlurRadiusPercent.innerText = `${chromeUIBlurRadiusSlider.value}px`;
  menuBlurRadiusSlider.value          = localStorage.menuBlurRadius || 5;
  menuBlurRadiusPercent.innerText     = `${menuBlurRadiusSlider.value}px`;
  UIOpacitySlider.value               = localStorage.UIOpacity || 50;
  UIOpacityPercent.innerText          = `${UIOpacitySlider.value}%`
  chromeUIOpacitySlider.value         = localStorage.chromeUIOpacity || 50;
  chromeUIOpacityPercent.innerText    = `${chromeUIOpacitySlider.value}%`
  menuOpacitySlider.value             = localStorage.menuOpacity || 50;
  menuOpacityPercent.innerText        = `${menuOpacitySlider.value}%`;
  backgroundName.innerText            = localStorage.backgroundName || 'None';
  chromeUIBgName.innerText            = localStorage.chromeUIBgName || 'None';
};
