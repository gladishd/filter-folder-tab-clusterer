document.addEventListener('DOMContentLoaded', function () {
  const clustersDiv = document.getElementById('clusters');
  const toggleViewButton = document.getElementById('toggleViewButton');
  const saveButton = document.getElementById('saveButton');
  const timestampCheckbox = document.getElementById('timestampCheckbox');
  let isSaving = false; // Flag to prevent multiple save actions

  // ... other initializations ...

  const scrollUpButton = document.getElementById('scrollUp');
  const scrollDownButton = document.getElementById('scrollDown');
  let currentClusterIndex = 0;

  function scrollToCluster(index) {
    const clusters = document.querySelectorAll('.cluster-container');
    if (index >= 0 && index < clusters.length) {
      currentClusterIndex = index;
      clusters[index].scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollUpButton.addEventListener('click', function () {
    scrollToCluster(currentClusterIndex - 1);
  });

  scrollDownButton.addEventListener('click', function () {
    scrollToCluster(currentClusterIndex + 1);
  });


  let scrollTimeout;

  scrollUpButton.addEventListener('click', function () {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
      scrollTimeout = null;
      // Scroll to the top cluster on double-click
      scrollToCluster(0);
    } else {
      scrollTimeout = setTimeout(() => {
        // scrollToCluster(currentClusterIndex - 1);
        scrollTimeout = null;
      }, 300); // Wait for a potential second click for 300ms
    }
  });

  scrollDownButton.addEventListener('click', function () {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
      scrollTimeout = null;
      // Scroll to the last cluster on double-click
      scrollToCluster(document.querySelectorAll('.cluster-container').length - 1);
    } else {
      scrollTimeout = setTimeout(() => {
        // scrollToCluster(currentClusterIndex + 1);
        scrollTimeout = null;
      }, 300); // Wait for a potential second click for 300ms
    }
  });

  // ... (the rest of your code)

  // The rest of your popup.js code
  // ...

  // Now instead of fetching and displaying clusters,
  // you should call a new function to fetch clusters and setup the initial view:
  setupClustersView();

  function setupClustersView() {
    chrome.runtime.sendMessage({ action: 'fetchClusters' }, function (response) {
      if (response && response.clusters) {
        drawGraph(response.clusters); // This will draw the clusters graphically
        scrollToCluster(0); // This will scroll to the first cluster
      } else {
        clustersDiv.textContent = 'No clusters available.';
      }
    });
  }

  // drawGraph function and other functions remain unchanged
  // ...

  // Removed the listener for the toggle view button since we're loading the list view by default

  saveButton.addEventListener('click', function () {
    if (isSaving) {
      console.log('Save operation already in progress. Please wait.');
      return;
    }
    isSaving = true;
    const addTimestamp = timestampCheckbox.checked;
    chrome.runtime.sendMessage({ action: 'saveBookmarks', addTimestamp: addTimestamp }, function (response) {
      console.log("Bookmark save response:", response.status);
      isSaving = false;
    });
  });

  function fetchAndDisplayClusters(viewType) {
    chrome.runtime.sendMessage({ action: 'fetchClusters' }, function (response) {
      if (response && response.clusters) {
        if (viewType === 'graph') {
          drawGraph(response.clusters);
        } else {
          displayList(response.clusters);
        }
      } else {
        clustersDiv.textContent = 'No clusters available.';
      }
    });
  }

  function displayList(clusters) {
    clustersDiv.innerHTML = '';
    clusters.forEach(cluster => {
      const clusterElement = document.createElement('div');
      clusterElement.className = 'cluster';
      clusterElement.textContent = cluster.name;
      clustersDiv.appendChild(clusterElement);
    });
  }

  function drawGraph(clusters) {
    clustersDiv.innerHTML = '';
    clusters.forEach(cluster => {
      const clusterContainer = document.createElement('div');
      clusterContainer.className = 'cluster-container';

      const clusterName = document.createElement('div');
      clusterName.className = 'cluster-name';
      clusterName.textContent = cluster.name;
      clusterContainer.appendChild(clusterName);

      const tabsContainer = document.createElement('div');
      tabsContainer.className = 'tabs-container';
      clusterContainer.appendChild(tabsContainer);

      cluster.tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-item';

        const titleElement = document.createElement('span');
        titleElement.textContent = tab.title;
        tabElement.appendChild(titleElement);

        const urlElement = document.createElement('a');
        urlElement.textContent = tab.url;
        urlElement.style.display = 'block'; // URL on a new line
        urlElement.style.cursor = 'pointer'; // Make it look clickable
        urlElement.addEventListener('dblclick', function () {
          chrome.runtime.sendMessage({ action: 'switchToTab', url: tab.url });
        });
        tabElement.appendChild(urlElement);

        tabsContainer.appendChild(tabElement);
      });

      clustersDiv.appendChild(clusterContainer);
    });
  }




  fetchAndDisplayClusters('graph');


  fetchAndDisplayBookmarkFolders(); // Call this to populate folders on load

  function fetchAndDisplayBookmarkFolders() {
    chrome.bookmarks.getTree(function (bookmarkNodes) {
      const foldersList = document.getElementById('foldersList');
      foldersList.innerHTML = ''; // Clear existing list
      processNode(bookmarkNodes); // Start processing from the root
    });

    function processNode(nodes) {
      nodes.forEach(node => {
        if (node.children && node.title.includes('All Clusters')) {
          const listItem = document.createElement('li');
          listItem.textContent = node.title;
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.onclick = function () {
            chrome.bookmarks.removeTree(node.id, () => {
              listItem.remove();
              console.log(`Deleted folder: ${node.title}`);
            });
          };
          listItem.appendChild(deleteButton);
          foldersList.appendChild(listItem);
        }
        if (node.children) {
          processNode(node.children);
        }
      });
    }
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'bookmarkChanged') {
      fetchAndDisplayBookmarkFolders();
    }
  });
});

document.getElementById('saveButton').addEventListener('click', function () {
  const addTimestamp = timestampCheckbox.checked;
  chrome.runtime.sendMessage({ action: 'saveBookmarks', addTimestamp: addTimestamp }, function (response) {
    console.log("Bookmark save response:", response.status);
  });
});

document.body.style.height = '580px'; // Set this to the fixed height you want
// Remove the following line if you are not dynamically setting the height based on content
// document.getElementById('clusters').style.height = `${height}px`;
