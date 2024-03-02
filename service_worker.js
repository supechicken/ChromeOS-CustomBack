chrome.runtime.onInstalled.addListener(async i => {
  switch (i.reason) {
    case 'install':
      chrome.windows.create({ url: '/html/settings.html', type: 'popup' });
      break;
  }
});
