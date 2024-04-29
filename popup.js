document.addEventListener('DOMContentLoaded', function () {
  const clustersDiv = document.getElementById('clusters');
  const toggleViewButton = document.getElementById('toggleViewButton');
  const saveButton = document.getElementById('saveButton');
  const timestampCheckbox = document.getElementById('timestampCheckbox');
  let isSaving = false; // Flag to prevent multiple save actions

  toggleViewButton.addEventListener('click', function () {
    const currentView = toggleViewButton.textContent.includes('List') ? 'graph' : 'list';
    fetchAndDisplayClusters(currentView);
    toggleViewButton.textContent = `Toggle View (${currentView.charAt(0).toUpperCase() + currentView.slice(1)})`;
  });

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
        tabElement.textContent = `${tab.title} - ${tab.url}`;
        tabsContainer.appendChild(tabElement);
      });
      clustersDiv.appendChild(clusterContainer);
    });
  }

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
