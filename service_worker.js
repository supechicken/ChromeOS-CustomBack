const chromeURLs = chrome.runtime.getManifest().optional_host_permissions;

function registerInjectionScript() {
  return chrome.scripting.registerContentScripts([{
    allFrames: true,
    persistAcrossSessions: false,
    id:  'injection-script',
    js:  ['js/inject.js'],
    css: ['css/inject.css'],
    matches: chromeURLs,
    runAt: 'document_end'
  }]).then(() => {
    console.log('Injection script registered!');
  }).catch(e => {
    console.error(e);
    console.error('Failed to register injection script.\n\nDoes the "Extensions on chrome:// URLs" flag enabled?');
    throw new Error('Failed to register injection script.');
  });
}

chrome.runtime.onInstalled.addListener(async i => {
  switch (i.reason) {
    case 'install':
      await new Promise(resolve => setTimeout(resolve, 1000));
      chrome.windows.create({ url: '/html/settings.html', type: 'popup' });
      break;
    default:
      await registerInjectionScript();
      break;
  }
});

// register injection script on startup
chrome.runtime.onStartup.addListener(async () => {
  const localStorage = await chrome.storage.local.get(['backgroundURL']);

  if (!localStorage.backgroundURL) return;

  await registerInjectionScript();
});
