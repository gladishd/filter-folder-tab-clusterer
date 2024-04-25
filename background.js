chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // You could initialize some data here if needed
});

// A simple function to mimic clustering
function someClusteringFunction(tabs) {
  // Group tabs by their domain for simplicity
  const clusters = tabs.reduce((acc, tab) => {
    const domain = new URL(tab.url).hostname;
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(tab);
    return acc;
  }, {});
  return Object.values(clusters);
}

let currentClusters = [];

chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({}, function (tabs) {
    const data = tabs.map(tab => ({ url: tab.url, title: tab.title }));
    currentClusters = someClusteringFunction(data);
    console.log('Clusters formed:', currentClusters);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchClusters') {
    sendResponse({ clusters: currentClusters });
  }
});
