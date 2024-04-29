let isCreatingBookmark = false; // Flag to prevent concurrent bookmark creation

// A helper function to extract keywords from a string
function extractKeywords(str) {
  return str.toLowerCase().split(/[\s,]+/).filter(word => word.length > 3);
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

function someClusteringFunction(tabs) {
  const clusters = tabs.reduce((acc, tab) => {
    const domain = new URL(tab.url).hostname;
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(tab);
    return acc;
  }, {});

  return Object.values(clusters).map(cluster => {
    const allTitles = cluster.map(tab => tab.title).join(' ');
    const keywords = extractKeywords(allTitles);
    const keywordCounts = keywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {});
    const sortedKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
    const name = sortedKeywords[0] || 'Cluster';
    return { name: name.charAt(0).toUpperCase() + name.slice(1), tabs: cluster };
  });
}

let currentClusters = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'switchToTab') {
    chrome.tabs.query({}, function (tabs) {
      const tab = tabs.find(t => t.url === message.url);
      if (tab) {
        chrome.tabs.update(tab.id, { active: true });
      } else {
        // Optional: Open a new tab if not found
        chrome.tabs.create({ url: message.url });
      }
    });
  }
  if (message.action === 'fetchClusters') {
    chrome.tabs.query({}, function (tabs) {
      const data = tabs.map(tab => ({ url: tab.url, title: tab.title }));
      currentClusters = someClusteringFunction(data);
      sendResponse({ clusters: currentClusters });
    });
    return true;
  } else if (message.action === 'saveBookmarks') {
    if (isCreatingBookmark) {
      console.log('Bookmark creation in progress. Please wait.');
      sendResponse({ status: 'Bookmark creation in progress' });
      return;
    }
    isCreatingBookmark = true;
    saveClustersAsBookmarks(currentClusters, message.addTimestamp, () => {
      isCreatingBookmark = false;
      sendResponse({ status: 'Bookmarks saved with timestamp!' });
    });
    return true; // async response
  }
});

function saveClustersAsBookmarks(clusters, addTimestamp, callback) {
  let folderTitle = 'All Clusters';
  if (addTimestamp) {
    const date = new Date();
    const timestamp = date.toISOString().replace(/:/g, '-').slice(0, 19);
    folderTitle += ' ' + timestamp;
  }

  chrome.bookmarks.search({ title: folderTitle }, function (results) {
    if (results.length) {
      updateClustersFolder(results[0].id, clusters, callback);
    } else {
      chrome.bookmarks.create({ title: folderTitle }, function (newFolder) {
        updateClustersFolder(newFolder.id, clusters, callback);
      });
    }
  });
}

function updateClustersFolder(folderId, clusters, callback) {
  chrome.bookmarks.getChildren(folderId, function (children) {
    let removalPromises = children.map(child => new Promise(resolve => chrome.bookmarks.removeTree(child.id, resolve)));
    Promise.all(removalPromises).then(() => {
      let creationPromises = clusters.map(clusterObj =>
        new Promise(resolve => chrome.bookmarks.create({ parentId: folderId, title: clusterObj.name }, function (clusterFolder) {
          let tabCreationPromises = clusterObj.tabs.map(tab =>
            new Promise(tabResolve => chrome.bookmarks.create({ parentId: clusterFolder.id, title: tab.title, url: tab.url }, tabResolve)));
          Promise.all(tabCreationPromises).then(resolve);
        }))
      );
      Promise.all(creationPromises).then(callback);
    });
  });
}

chrome.bookmarks.onRemoved.addListener(function (id, removeInfo) {
  chrome.runtime.sendMessage({ action: 'bookmarkChanged' });
});

chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
  if (bookmark.url === undefined) {
    chrome.runtime.sendMessage({ action: 'bookmarkChanged' });
  }
});
