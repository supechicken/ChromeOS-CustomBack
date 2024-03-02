import { printLog } from "./shared/functions.js";

const rootStyle         = document.documentElement.style,
      currentImg        = document.getElementById('currentImg'),
      blurRadiusSlider  = document.getElementById('blurRadiusSlider'),
      blurRadiusPercent = document.getElementById('blurRadiusPercent'),
      UIOpacitySlider   = document.getElementById('UIOpacitySlider'),
      UIOpacityPercent  = document.getElementById('UIOpacityPercent'),
      chromeUI          = document.getElementById('chromeUI'),
      backgroundPicker  = document.getElementById('backgroundPicker'),
      saveBtn           = document.getElementById('saveBtn');

function getDataURL(file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);

  return new Promise((resolve, reject) => {
    reader.onload  = () => resolve(reader.result);
    reader.onerror = e  => reject(e);
  });
}

blurRadiusSlider.oninput = blurRadiusSlider.onchange = () => {
  rootStyle.setProperty('--blur-radius', `${blurRadiusSlider.value}px`);
  blurRadiusPercent.innerText = `${blurRadiusSlider.value}px`;
};

UIOpacitySlider.oninput = UIOpacitySlider.onchange = () => {
  rootStyle.setProperty('--element-opacity', `${UIOpacitySlider.value}%`);
  UIOpacityPercent.innerText = `${UIOpacitySlider.value}%`;
};

backgroundPicker.onchange = async () => {
  const backgroundFile = backgroundPicker.files[0];

  currentImg.src = URL.createObjectURL(backgroundFile);
};

saveBtn.onclick = async () => {
  const backgroundFile = backgroundPicker.files[0];

  if (backgroundFile) {
    const dataURL = await getDataURL(backgroundFile);
    chrome.storage.local.set({ backgroundURL: dataURL }, () => printLog('Background saved.'));
  }

  chrome.storage.local.set({ blurRadius: blurRadiusSlider.value, UIOpacity: UIOpacitySlider.value, chromeUI: chromeUI.checked }, () => {
    printLog('Options saved.');
    alert("Changes saved.");
  });
};

window.onload = async () => {
  const localStorage = await new Promise(r => chrome.storage.local.get(['backgroundURL', 'blurRadius', 'UIOpacity', 'chromeUI'], c => r(c)));

  rootStyle.setProperty('--blur-radius', `${localStorage.blurRadius || 5}px`);
  rootStyle.setProperty('--element-opacity', `${localStorage.UIOpacity || 50}%`);

  if (localStorage.backgroundURL) currentImg.src = localStorage.backgroundURL;

  chromeUI.checked            = localStorage.chromeUI;
  blurRadiusSlider.value      = localStorage.blurRadius || 5;
  blurRadiusPercent.innerText = `${blurRadiusSlider.value}px`;
  UIOpacitySlider.value       = localStorage.UIOpacity || 50;
  UIOpacityPercent.innerText  = `${UIOpacitySlider.value}%`
};