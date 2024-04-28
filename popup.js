document.addEventListener('DOMContentLoaded', function () {
  const clustersDiv = document.getElementById('clusters');
  const listViewButton = document.getElementById('listViewButton');
  const graphViewButton = document.getElementById('graphViewButton');
  const saveButton = document.getElementById('saveButton');

  listViewButton.addEventListener('click', function () {
    fetchAndDisplayClusters('list');
  });

  graphViewButton.addEventListener('click', function () {
    fetchAndDisplayClusters('graph');
  });

  saveButton.addEventListener('click', function () {
    chrome.runtime.sendMessage({ action: 'saveBookmarks' }, function (response) {
      console.log(response.status);
    });
  });

  // Fetch and display clusters according to view type
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

  // Function to display clusters as list (reuse or modify your existing function)
  function displayList(clusters) {
    clustersDiv.innerHTML = ''; // Clear existing content
    clusters.forEach(cluster => {
      const clusterElement = document.createElement('div');
      clusterElement.className = 'cluster';
      clusterElement.textContent = cluster.name;
      clustersDiv.appendChild(clusterElement);
    });
  }
});


function drawGraph(clusters) {
  console.log('Drawing graph with clusters:', clusters);
  const clustersDiv = document.getElementById('clusters');
  clustersDiv.innerHTML = ''; // Clear existing content

  clusters.forEach(cluster => {
    // Create a container for each cluster
    const clusterContainer = document.createElement('div');
    clusterContainer.className = 'cluster-container';
    clustersDiv.appendChild(clusterContainer);

    // Create a header for the cluster name
    const clusterName = document.createElement('div');
    clusterName.className = 'cluster-name';
    clusterName.textContent = cluster.name;
    clusterContainer.appendChild(clusterName);

    // Create a container for the tabs within the cluster
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    clusterContainer.appendChild(tabsContainer);

    // Add each tab as an item in the tabs container
    cluster.tabs.forEach(tab => {
      const tabElement = document.createElement('div');
      tabElement.className = 'tab-item';
      tabElement.textContent = `${tab.title} - ${tab.url}`;
      tabsContainer.appendChild(tabElement);
    });
  });
}



document.getElementById('saveButton').addEventListener('click', function () {
  chrome.runtime.sendMessage({ action: 'saveBookmarks' }, function (response) {
    console.log(response.status);
  });
});

document.body.style.height = `${height}px`;
// Or, if you have a specific container in your HTML structure:
document.getElementById('clusters').style.height = `${height}px`;

