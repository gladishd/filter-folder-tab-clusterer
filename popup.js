document.addEventListener('DOMContentLoaded', function () {
  const clustersDiv = document.getElementById('clusters');

  chrome.runtime.sendMessage({ action: 'fetchClusters' }, function (response) {
    if (response && response.clusters) {
      response.clusters.forEach((cluster, index) => {
        const clusterDiv = document.createElement('div');
        clusterDiv.className = 'cluster';
        clusterDiv.textContent = `Cluster ${index + 1}: ${cluster.map(tab => tab.title).join(', ')}`;
        clustersDiv.appendChild(clusterDiv);
      });
    } else {
      clustersDiv.textContent = 'No clusters available.';
    }
  });
});
