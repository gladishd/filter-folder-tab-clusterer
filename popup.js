document.addEventListener('DOMContentLoaded', function () {
  const clustersDiv = document.getElementById('clusters');
  const saveButton = document.getElementById('saveButton');

  // Fetch clusters and draw a simple graph
  saveButton.addEventListener('click', function () {
    console.log("Event")
    chrome.runtime.sendMessage({ action: 'fetchClusters' }, function (response) {
      console.log('Response received', response); // Check if the response is as expected
      if (response && response.clusters) {
        drawGraph(response.clusters);
      } else {
        clustersDiv.textContent = 'No clusters available.';
      }
    });
  });
});

// Placeholder for graph drawing function
function drawGraph(clusters) {
  console.log('Drawing graph with clusters:', clusters);
  // For each cluster, draw a circle or some other graph element
  const clustersDiv = document.getElementById('clusters');
  clustersDiv.innerHTML = ''; // Clear existing content
  const svg = d3.select(clustersDiv).append('svg')
    .attr('width', 400)
    .attr('height', 400);

  // Example: Draw a circle for each cluster
  svg.selectAll('circle')
    .data(clusters)
    .enter()
    .append('circle')
    .attr('cx', (d, i) => i * 80 + 40) // Spacing out the circles
    .attr('cy', 200) // Align horizontally
    .attr('r', 20) // Radius of the circles
    .attr('fill', 'orange');
}
