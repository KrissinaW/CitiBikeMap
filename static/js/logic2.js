// Coordinates and zoom level for NYC
let newYorkCoords = [40.73, -74.0059];
let mapZoomLevel = 12;

// Function to create the map with layers
function createMap(layers) {
  // Create the tile layer that will be the background of our map
  let lightmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  });

  // Create the map object with options
  let map = L.map('map-id', {
    center: newYorkCoords,
    zoom: mapZoomLevel,
    layers: [
      lightmap,
      layers.comingSoon,
      layers.emptyStations,
      layers.outOfOrder,
      layers.lowStations,
      layers.healthyStations
    ]
  });

  // Create an overlays object to add to the layer control
  let overlays = {
    "Coming Soon": layers.comingSoon,
    "Empty Stations": layers.emptyStations,
    "Out of Order": layers.outOfOrder,
    "Low Stations": layers.lowStations,
    "Healthy Stations": layers.healthyStations
  };

  // Create a layer control, and pass it overlays. Add the layer control to the map
  L.control.layers(null, overlays, {collapsed: false}).addTo(map);

  // Add a legend
  let legend = L.control({position: 'bottomright'});
  legend.onAdd = function() {
    let div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
      <i class="icon" style="background: #ff0000"></i> Coming Soon<br>
      <i class="icon" style="background: #ff7800"></i> Empty Stations<br>
      <i class="icon" style="background: #ffff00"></i> Out of Order<br>
      <i class="icon" style="background: #00ff00"></i> Low Stations<br>
      <i class="icon" style="background: #0000ff"></i> Healthy Stations<br>
    `;
    return div;
  };
  legend.addTo(map);

  return map;
}

// Function to create markers and layers
function createMarkers(stationInfo, stationStatus) {
  // Create layer groups for different station statuses
  let layers = {
    comingSoon: new L.LayerGroup(),
    emptyStations: new L.LayerGroup(),
    outOfOrder: new L.LayerGroup(),
    lowStations: new L.LayerGroup(),
    healthyStations: new L.LayerGroup()
  };

  // Map station status to station info
  let statusMap = {};
  stationStatus.data.stations.forEach(status => {
    statusMap[status.station_id] = status;
  });

  // Loop through the stations array
  stationInfo.data.stations.forEach(station => {
    let status = statusMap[station.station_id];
    if (!status) return;

    // Determine the marker color and layer based on the station status
    let markerOptions, layer;
    if (!status.is_installed) {
      markerOptions = {icon: L.ExtraMarkers.icon({icon: 'fa-coffee', markerColor: 'red', shape: 'square', prefix: 'fa'})};
      layer = layers.comingSoon;
    } else if (status.num_bikes_available === 0) {
      markerOptions = {icon: L.ExtraMarkers.icon({icon: 'fa-times', markerColor: 'orange', shape: 'square', prefix: 'fa'})};
      layer = layers.emptyStations;
    } else if (!status.is_renting) {
      markerOptions = {icon: L.ExtraMarkers.icon({icon: 'fa-ban', markerColor: 'yellow', shape: 'square', prefix: 'fa'})};
      layer = layers.outOfOrder;
    } else if (status.num_bikes_available < 5) {
      markerOptions = {icon: L.ExtraMarkers.icon({icon: 'fa-exclamation', markerColor: 'green', shape: 'square', prefix: 'fa'})};
      layer = layers.lowStations;
    } else {
      markerOptions = {icon: L.ExtraMarkers.icon({icon: 'fa-thumbs-up', markerColor: 'blue', shape: 'square', prefix: 'fa'})};
      layer = layers.healthyStations;
    }

    // Check if markerOptions.icon is defined
    if (!markerOptions.icon) {
      console.error("Marker icon is undefined", markerOptions);
      return;
    }

    // Create a marker, and bind a popup with the station's name and capacity
    let marker = L.marker([station.lat, station.lon], markerOptions)
      .bindPopup(`<h3>${station.name}</h3><p>Capacity: ${station.capacity}</p><p>Bikes Available: ${status.num_bikes_available}</p>`);
    
    // Add the marker to the corresponding layer
    marker.addTo(layer);
  });

  // Create the map with the layers
  createMap(layers);
}

// Perform API calls to the Citi Bike endpoints to get station information and status
d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_information.json").then(stationInfo => {
  d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_status.json").then(stationStatus => {
    createMarkers(stationInfo, stationStatus);
  });
});