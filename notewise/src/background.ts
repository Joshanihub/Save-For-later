/// <reference types="chrome"/>

chrome.runtime.onInstalled.addListener(() => {
  console.log('Notewise extension installed.');
  
  // Set default uninstall URL if needed
  // chrome.runtime.setUninstallURL('https://notewise.app/goodbye');
});

// Setup background sync alarms
chrome.alarms.create('sync-alarm', { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-alarm') {
    console.log('Triggering background sync');
    // We would normally ping the sync service here, but offline sync
    // is currently handled in the React application when online.
  }
});
