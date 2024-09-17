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
