// A helper function to extract keywords from a string
function extractKeywords(str) {
  // Use a simple regex to split by non-alphanumeric characters and filter out short words
  return str
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(word => word.length > 3);
}


chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // You could initialize some data here if needed
});

// A simple function to mimic clustering
function someClusteringFunction(tabs) {
  console.log("First of all, what are the tabs? ", tabs);
  // Group tabs by their domain for simplicity
  const clusters = tabs.reduce((acc, tab) => {
    const domain = new URL(tab.url).hostname;
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(tab);
    return acc;
  }, {});
  // Modify someClusteringFunction to also generate names
  // Replace the return statement of someClusteringFunction with the following:
  return Object.values(clusters).map(cluster => {
    // Flatten titles into one big string
    const allTitles = cluster.map(tab => tab.title).join(' ');

    // Get keywords from all titles
    const keywords = extractKeywords(allTitles);

    // Count keyword occurrences and sort by frequency
    const keywordCounts = keywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {});
    const sortedKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Use the top keyword as the cluster name or default to "Cluster"
    const name = sortedKeywords[0] || 'Cluster';

    // Return cluster with name
    return { name: name.charAt(0).toUpperCase() + name.slice(1), tabs: cluster };
  });

}

let currentClusters = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchClusters') {

    console.log('first click')
    chrome.tabs.query({}, function (tabs) {
      console.log('Currently open tabs:', tabs); // This will log the array of open tabs
      const data = tabs.map(tab => ({ url: tab.url, title: tab.title }));
      currentClusters = someClusteringFunction(data);
      console.log('Clusters formed:', currentClusters);
    });

    console.log("SEnding response ", currentClusters);
    sendResponse({ clusters: currentClusters });
  }
});

function saveClustersAsBookmarks(clusters) {
  // Search for an existing 'All Clusters' folder
  chrome.bookmarks.search({ title: 'All Clusters' }, function (results) {
    if (results.length) {
      // If it exists, use the first one found
      updateClustersFolder(results[0].id, clusters);
    } else {
      // Otherwise, create a new folder
      chrome.bookmarks.create({ title: 'All Clusters' }, function (newFolder) {
        updateClustersFolder(newFolder.id, clusters);
      });
    }
  });
}

function updateClustersFolder(folderId, clusters) {
  // Clear existing bookmarks in the folder
  chrome.bookmarks.getChildren(folderId, function (children) {
    for (let child of children) {
      chrome.bookmarks.removeTree(child.id);
    }
    // ... inside the updateClustersFolder function ...
    clusters.forEach((clusterObj) => {
      // Use the generated name for the cluster
      chrome.bookmarks.create({ parentId: folderId, title: clusterObj.name }, function (clusterFolder) {
        clusterObj.tabs.forEach(tab => {
          chrome.bookmarks.create({ parentId: clusterFolder.id, title: tab.title, url: tab.url });
        });
      });
    });

  });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchClusters') {
    chrome.tabs.query({}, function (tabs) {
      const data = tabs.map(tab => ({ url: tab.url, title: tab.title }));
      currentClusters = someClusteringFunction(data);
      sendResponse({ clusters: currentClusters });
    });
    return true;  // Indicate asynchronous response
  } else if (message.action === 'saveBookmarks') {
    saveClustersAsBookmarks(currentClusters);
    sendResponse({ status: 'Bookmarks saved!' });
  }
});
