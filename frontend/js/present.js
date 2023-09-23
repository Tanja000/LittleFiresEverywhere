import {
    getForcastLayer,
    createWheelWaiting,
    handIcon,
    deleteWheelWaiting,
} from "./forcast.js";
import {
    getRectangleData, swapCoordinates,
    pointToLayer, convertCSVTextToGeoJSONTimeDimension, extract24Hours, responseDataManual
} from "./present_helper.js";

import { Deta} from 'https://cdn.deta.space/js/deta@latest/deta.mjs';

//////////////////////////////////////////////////////////////////
/*change here for local application or deployment*/
const backendURL = "https://wildfirebackend-1-q4366666.deta.app";
//const backendURL = "http://127.0.0.1:8000";
/*For deployment set to true!*/
const driveData = true;
const weatherApi = true;
//////////////////////////////////////////////////////////////////

const modis_active_World = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/kml/MODIS_C6_1_Global_24h.kml";


let map;
let confidenceThreshhold = 90;
let markers = [];
let meteoDataAll = {};
let dataCounter = 0;
const originalZoom = 3;
const originalCenter = [23, 8];
let burningAreas = L.markerClusterGroup();
let ControlLayer;
let firstTimeWheel = true;

let timeSeries24hours;
let modis7daysFinished = false;
let zoomDeleted = false;
let timeSeries7days;
let timeDimensionControl;
let geoJSONTimeSeries7days = null;
let controlTimeSeriesSet = false;
let controlMarkersSet = false;
let controlAreasSet = false;

const popupOptions = {
            'maxWidth': '500',
            'className': 'marker-popup'
};

const customClusterIcon = L.divIcon({
            className: 'custom-cluster-icon',
            iconSize: [50, 50],
            html: '<img src="./icons/fire.png" alt="Cluster Icon" />'
        });

const markersCluster = L.markerClusterGroup({
            iconCreateFunction: (cluster) => {
                return customClusterIcon;
            },
			spiderfyOnMaxZoom: true,
			showCoverageOnHover: false,
			zoomToBoundsOnClick: true
		});

async function getModis7daysDataFromDrive() {
    console.log("starting with modis data");
    const drive_key = "a0g5kqh4m4i_VHKDKLqgj7m4Kpep1VTPer3Z3BpGtBwd";
    const deta = Deta(drive_key);
    const drive = deta.Drive('modis_fire');
    const filename = 'MODIS_C6_1_Global_7d.csv'

    const response = await drive.get(filename);
    const csvData = await response.text();
    timeSeries7days = convertCSVTextToGeoJSONTimeDimension(csvData);
    timeSeries24hours = extract24Hours(timeSeries7days);
    modis7daysFinished = true;
    console.log("got modis data");
}


async function getModis7daysData(){
    //latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,confidence,version,bright_t31,frp,daynight
    console.log("start reading 7 days data");
    const url= "/data/MODIS_C6_1_Global_7d.csv";
    return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.text();
    })
    .then(async (csvData) => {
        timeSeries7days = convertCSVTextToGeoJSONTimeDimension(csvData);
        timeSeries24hours = extract24Hours(timeSeries7days);
        modis7daysFinished = true;
        console.log("7 days modis data ready!")

    })
    .catch((error) => {
      console.error('Fehler beim Laden der CSV-Datei:', error);
    });
}



function deletePopup(){
   const zoomLevel = map.getZoom();
   const minZoomToDelete = 10;
   if (zoomLevel < minZoomToDelete){
       map.closePopup();
   }
}

async function getMap() {

  /*  const osm = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 21,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    });*/
    const Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    });
    const Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    const Esri_WorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    });
    const WaymarkedTrails_hiking = L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://waymarkedtrails.org">waymarkedtrails.org</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    /*    const wmsUrlLakes = 'https://geowebservices.stanford.edu/geoserver/wms';
       const wmsLayerNameLakes  = 'druid:hx872sp6848';
       const wmsLayerLakes  = L.tileLayer.wms(wmsUrlLakes, {
           layers: wmsLayerNameLakes ,
           format: 'image/png',
           transparent: true
       });*/

    map = L.map('map', {
        center: originalCenter,
        zoom: originalZoom,
        layers: [Esri_WorldTopoMap]
    });
    map.setMinZoom(3);

    const minLatLng = L.latLng(-90, -180);
    const maxLatLng = L.latLng(90, 180);
    const bounds = L.latLngBounds(minLatLng, maxLatLng);
    map.setMaxBounds(bounds);
    map.on('drag', () => {
        deleteZoomLayers();
        deleteZoom();
        handleZoomChange();
    });

    Esri_WorldTopoMap.addTo(map);
    map.on('zoom', deletePopup);

    const baseMaps = {
        "Esri Topo Map": Esri_WorldTopoMap,
        "Esri Satellite Image": Esri_WorldImagery,
        "Esri Street Map": Esri_WorldStreetMap
    };
    var overlayMaps = {
        "Hiking Trails": WaymarkedTrails_hiking,
        //    "Rivers": wmsLayerRiver,
        //    "Lakes": wmsLayerLakes
    };
    ControlLayer = L.control.layers(baseMaps, overlayMaps).addTo(map);

    const rectangles = [
        //Europa
        {bounds: [[72, -26], [60, 53]]},
        {bounds: [[60, -15], [48, 20]]},
        {bounds: [[48, -15], [35, 20]]},
        {bounds: [[60, 20], [48, 53]]},
        {bounds: [[48, 20], [35, 53]]},
        //America
        {bounds: [[70, -170], [55.89, -138.38]]},
        {bounds: [[70, -138.38], [55.89, -95.14]]},
        {bounds: [[70, -95.14], [55.89, -52.07]]},
        {bounds: [[55.89, -138.38], [44.47, -95.14]]},
        {bounds: [[55.89, -95.14], [44.47, -52.07]]},
        {bounds: [[44.47, -127.38], [30.93, -95.14]]},
        {bounds: [[44.47, -95.14], [30.93, -70.07]]},
        {bounds: [[30.93, -118.38], [10.93, -95.14]]},
        {bounds: [[30.93, -95.14], [10.93, -60.07]]},
        {bounds: [[10.93, -87.14], [0.93, -45.07]]},
        {bounds: [[0.93, -83.14], [-10.93, -60.07]]},
        {bounds: [[-10.93, -83.14], [-20.93, -60.07]]},
        {bounds: [[0.93, -60.07], [-10.93, -30.07]]},
        {bounds: [[-10.93, -60.07], [-20.93, -30.07]]},
        {bounds: [[-20.93, -80.07], [-35.93, -60.07]]},
        {bounds: [[-20.93, -60.07], [-35.93, -40.07]]},
        {bounds: [[-35.93, -80.07], [-58.93, -50.07]]},
        //Africa
        {bounds: [[35, -20], [20, 20]]},
        {bounds: [[35, 20], [20, 53]]},
        {bounds: [[20, -20], [3, 0]]},
        {bounds: [[20, 0], [3, 20]]},
        {bounds: [[20, 20], [3, 37]]},
        {bounds: [[20, 37], [3, 53]]},
        {bounds: [[3, 5], [-7, 25]]},
        {bounds: [[-7, 5], [-15, 25]]},
        {bounds: [[3, 25], [-7, 53]]},
        {bounds: [[-7, 25], [-15, 53]]},
        {bounds: [[-15, 5], [-25, 25]]},
        {bounds: [[-25, 5], [-37, 25]]},
        {bounds: [[-15, 25], [-25, 53]]},
        {bounds: [[-25, 25], [-37, 53]]},
        //Euroasia
        {bounds: [[75, 53], [60, 100]]},
        {bounds: [[75, 100], [60, 150]]},
        {bounds: [[75, 150], [60, 180]]},
        {bounds: [[60, 53], [45, 100]]},
        {bounds: [[60, 100], [45, 150]]},
        {bounds: [[60, 150], [45, 180]]},
        {bounds: [[45, 53], [18, 100]]},
        {bounds: [[45, 100], [18, 150]]},
        {bounds: [[18, 70], [0, 100]]},
        {bounds: [[18, 100], [0, 130]]},
        {bounds: [[0, 85], [-20, 125]]},
        {bounds: [[0, 125], [-10, 140]]},
        {bounds: [[-10, 125], [-20, 140]]},
        {bounds: [[0, 140], [-20, 170]]},
        {bounds: [[-20, 110], [-30, 135]]},
        {bounds: [[-20, 135], [-30, 170]]},
        {bounds: [[-30, 110], [-60, 140]]},
        {bounds: [[-30, 140], [-60, 180]]},
    ];


    rectangles.forEach(function (rectangleData) {
        const rectangle = L.rectangle(rectangleData.bounds, {color: 'darkred', weight: 2}).addTo(map);
        const center = L.latLng(
            (rectangleData.bounds[0][0] + rectangleData.bounds[1][0]) / 2,
            (rectangleData.bounds[0][1] + rectangleData.bounds[1][1]) / 2
        );

        const textLabel = L.marker([center.lat, center.lng], {
            icon: handIcon,
            zIndexOffset: 1000
        }).addTo(map);
        textLabel.bindTooltip('Click me!', {
            permanent: false,
            direction: 'top',
            className: 'text-labels'
        });


        async function startClick() {
            const bounds = rectangle.getBounds();
            map.removeLayer(rectangle);
            map.removeLayer(textLabel);

            map.setView(center, 4);

            while (modis7daysFinished == false) {
                    setTimeout(function () {
                        console.log("wait for 3 seconds")
                    }, 3000);
            }

            get24hoursLayer(bounds);
            await loadForcastInBackground(bounds);
        }
        textLabel.on('click', startClick);
        rectangle.on('click', startClick);
    });

    L.control.custom({
            position: 'bottomright',
            content: '<button id="custom-button-leave"><img src="./icons/leave.png" alt="Leave"></button>',
            classes: 'custom-button-container',
            style: {
                width: '40px',
                height: '40px'
            },
            events: {
                click: () => {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    const jumpTarget = document.getElementById('data');
                    jumpTarget.scrollIntoView({behavior: 'smooth', block: 'start'});
                }
            }
        }).addTo(map);

      L.control.custom({
            position: 'bottomright',
            content: '<button id="custom-button-zoom"><img src="./icons/zoom_out.png" alt="Zoom out"></button>',
            classes: 'custom-button-container',
            style: {
                width: '40px',
                height: '40px'
            },
            events: {
                click: () => {
                    map.setView(originalCenter, originalZoom);
                }
            }
        }).addTo(map);


      L.control.custom({
            position: 'bottomright',
            content: '<button id="custom-button-fullscreen"><img src="./icons/fullscreen.png" alt="Fullscreen"></button>',
            classes: 'custom-button-container',
            style: {
                width: '40px',
                height: '40px'
            },
            events: {
                click: () => {
                    const mapContainer = document.getElementById('map');

                    if (!document.fullscreenElement) {
                        mapContainer.requestFullscreen().catch(err => {
                            alert(`Fullscreen error: ${err.message}`);
                        });
                    } else {
                        document.exitFullscreen();
                    }
                }
            }
        }).addTo(map);

      map.on('zoomend', handleZoomChange);
      if(driveData) {
          await getModis7daysDataFromDrive();
      }
      else {
          await getModis7daysData();
      }
}

function deleteZoom(){
    const elements = document.getElementsByClassName("leaflet-bar leaflet-bar-horizontal leaflet-bar-timecontrol leaflet-control");
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
    zoomDeleted = false;
}
function deleteZoomLayers(){
    if (geoJSONTimeSeries7days !== null) {
        map.removeLayer(geoJSONTimeSeries7days);
        geoJSONTimeSeries7days = null;
    }
}



function get24hoursLayer(bounds){
    timeSeries24hours.features.forEach(function(feature) {
        const coordinate = feature.geometry.coordinates;
        const point = L.latLng(coordinate[1], coordinate[0]);
        if (bounds.contains(point)) {
            const properties = feature.properties;
            let marker = iconsAtFireOrigin("MODIS FIRE", [coordinate[1], coordinate[0]], properties.confidence, properties.date, properties.time);
            markers.push(marker);
        }
    });

    if (!controlMarkersSet) {
        ControlLayer.addOverlay(markersCluster, 'Active Fires');
        controlMarkersSet = true;
    }
    map.addLayer(markersCluster);

    calculateBurningAreas(bounds);
}


async function handleZoomChange(){
    const currentZoom = map.getZoom();

     if(currentZoom < 7) {
         deleteZoom();
         deleteZoomLayers();
     }

     if (currentZoom >= 7) {
         while (modis7daysFinished == false) {
             setTimeout(function () {
                 console.log("wait for 3 seconds")
             }, 3000);
         }

         if(!zoomDeleted) {
              var timeDimension = new L.TimeDimension({
                 period: "PT1H",
             });
             map.timeDimension = timeDimension;

             var player = new L.TimeDimension.Player({
                 transitionTime: 100,
                 loop: false,
                 startOver: true
             }, timeDimension);
             var timeDimensionControlOptions = {
                 player: player,
                 timeDimension: timeDimension,
                 position: 'bottomleft',
                 autoPlay: true,
                 minSpeed: 1,
                 speedStep: 1,
                 maxSpeed: 15,
                 timeSliderDragUpdate: true
             };
             timeDimensionControl = new L.Control.TimeDimension(timeDimensionControlOptions);
             map.addControl(timeDimensionControl);

             let timeSeriesLayer = L.geoJSON(timeSeries7days, {
                 pointToLayer: pointToLayer,
                 filter: function (feature) {
                     return map.getBounds().contains(L.geoJSON(feature).getBounds());
                 }
             });

             geoJSONTimeSeries7days = L.timeDimension.layer.geoJson(timeSeriesLayer, {updateTimeDimensionMode: 'replace'});
             geoJSONTimeSeries7days.addTo(map)


             if (!controlTimeSeriesSet) {
                ControlLayer.addOverlay(geoJSONTimeSeries7days, 'Timeseries');
                controlTimeSeriesSet = true;
            }

             zoomDeleted = true;
         }
     }
}

function iconsAtFireOrigin(title, coordinates, confidence, date, time){
    const customIcon = L.icon({
        iconUrl: './icons/fire.png',
        iconSize: [32, 32],
        iconAnchor: [0, 0],
        popupAnchor: [0, -32]
    });

    const localDate = new Date(time);
    const dateAndTime = localDate.toString();

    const marker = L.marker(coordinates, {icon: customIcon});
    const popupContent = title + "<br> <br> " + dateAndTime +
        " <br> <br> Confidence: " + confidence +
        " <br> <br> Coordinates: " + coordinates;
       //+ " <br> <br>  <br> <a style='color: black' href='https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms' target='_blank'> <b>More Info </b> </a> ";
    marker.bindPopup(popupContent,  popupOptions);
    markersCluster.addLayer(marker);

    return marker;
}


async function loadForcastInBackground(bounds){
    let parsedCoordinates = {};
    let counterData = 0;

    timeSeries24hours.features.forEach(function(feature) {
        const properties = feature.properties;
        const geometry = feature.geometry.coordinates;
        parsedCoordinates = getRectangleData(confidenceThreshhold, [geometry[1], geometry[0]], properties.confidence, properties.date, properties.time, counterData, parsedCoordinates, bounds);
        counterData++;
    });

    let dataLength = Object.keys(parsedCoordinates).length;
    if (dataLength == 0){
        deleteWheelWaiting();
        return;
    }
    let lastCall = false;

    if(firstTimeWheel){
        createWheelWaiting(map);
        firstTimeWheel = false;
    }

    //if less or equal than 4 fires for forecast
    if (dataLength <= 4){
        await processAndMapData(parsedCoordinates, true);
        return;
    }

    let tempDict = {};
    let counter = 0;
    let entireCount = 0;

    // more than 4 fires for forecast
    for (const key in parsedCoordinates) {
        tempDict[key] = parsedCoordinates[key];
        counter++;

        //process 4 fires and map those
        if (counter === 4 || dataLength === counter) {
            if(entireCount === dataLength - 1){
                lastCall = true;
            }
            else {lastCall = false;}
            await processAndMapData(tempDict, lastCall);
            tempDict = {};
            counter = 0;
        }

        if (entireCount === dataLength - 1 && counter !== 0){
            await processAndMapData(tempDict, true);
            return;
        }
        entireCount++;
    }

}

async function processAndMapData(parsedCoordinates, lastCall) {
    let responseDataAll = {};
    let responseData = {};
    let coordinatesData = {};
    let meteoData = {};
    if(weatherApi) {
        try {
            console.log(backendURL + "/process_data");
            const response = await fetch(backendURL + "/process_data", {
                method: "POST",
                mode: 'cors',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(parsedCoordinates)
            });
            responseData = await response.json();
            if (Object.keys(responseData).length === 0) {
                console.log("error. no data")
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return 'Request was aborted';
            } else {
                return 'An error occurred: ' + error.message;
            }
        }
    }
     else{
        responseData = responseDataManual;
    }
    coordinatesData = responseData['coordinates'];
    meteoData = responseData['meteo_data'];
    responseDataAll[dataCounter] = coordinatesData;
    meteoDataAll[dataCounter] = meteoData;
    await getForcastLayer(responseDataAll, map, meteoDataAll, ControlLayer, lastCall);
    dataCounter++;
    return;
}


function calculateBurningAreas(bounds){
    let featureGroups = {};
    let coordinatesAll = [];
    timeSeries24hours.features.forEach(function(feature) {
        const coordinate = feature.geometry.coordinates;
        const point = L.latLng(coordinate[1], coordinate[0]);
        if (bounds.contains(point)) {
            coordinatesAll.push(coordinate);
        }
    });
     var turfPoints = coordinatesAll.map(function(coordinate) {
      return turf.point(coordinate);
    });

    const options = {units: 'kilometers', cluster: true};
    const featureCollectionTurf = turf.featureCollection(turfPoints);
    const nearestPoints = turf.clustersDbscan(featureCollectionTurf, 5, options);

    nearestPoints.features.forEach(cluster => {
            const prop = cluster.properties;
            if ("cluster" in prop){
                const groupProperty = prop.cluster;
                if (!featureGroups[groupProperty]) {
                    featureGroups[groupProperty] = [];
                }
                featureGroups[groupProperty].push(cluster);
            }
        });


    for (let [key, value] of Object.entries(featureGroups)){
        const polyCoordinates = [];
        if (Object.keys(value).length >= 4 ) {
            for (let [key1, value1] of Object.entries(value)) {
                polyCoordinates.push([value1.geometry.coordinates[0], value1.geometry.coordinates[1]]);
            }

            let turfPoints = [];
            for (const coord of polyCoordinates){
                turfPoints.push(turf.point(coord))
            }
            const points = turf.featureCollection(turfPoints);
            const boundingPolygon = turf.convex(points);
            const bufferedPolygon = turf.buffer(boundingPolygon, 100, { units: 'meters' });

            const leafletPolygon = L.geoJSON(bufferedPolygon, {
                style: {
                    "color": "#a049e3",
                    "weight": 3,
                    "opacity": 0.65,
                    "smoothFactor": 0.5,
                }
            });

            burningAreas.addLayer(leafletPolygon);
            burningAreas.addTo(map);

            if (!controlAreasSet) {
                ControlLayer.addOverlay(burningAreas, 'Burning Areas');
                controlAreasSet = true;
            }
        }
    }
}

console.log("starting map...")
getMap();
