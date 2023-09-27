import {
    getForcastLayer,
    createWheelWaiting,
    handIcon,
    deleteWheelWaiting,
} from "./forcast.js";
import {
    getRectangleData, pointToLayer, convertCSVTextToGeoJSONTimeDimension, extract24Hours
} from "./present_helper.js";
import {responseDataManual} from "./weatherResponse.js";

import { Deta} from 'https://cdn.deta.space/js/deta@latest/deta.mjs';

//////////////////////////////////////////////////////////////////
/*change here for local application or deployment*/
//const backendURL = "https://wildfirebackend-1-q4366666.deta.app";
const backendURL = "http://127.0.0.1:8000";
/*For deployment set to true!*/
const driveData = false;
const forecast = false;
//////////////////////////////////////////////////////////////////

const modis_active_World = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/kml/MODIS_C6_1_Global_24h.kml";
const drive_key = "a0g5kqh4m4i_VHKDKLqgj7m4Kpep1VTPer3Z3BpGtBwd";
const deta = Deta(drive_key);
const drive = deta.Drive('modis_fire');
const filename = 'MODIS_C6_1_Global_7d.csv'

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

let timeSeries24hours = null;
let timeSeries7days = null;
let timeDimensionControl = null;
let geoJSONTimeSeries7days = null;
let controlMarkersSet = false;
let controlAreasSet = false;
let timeDimension;
let zoomForTimeSeries = false;
let timeSeriesInControl = false;
let showTimeSeries = true;

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
    const start = Date.now();

    const response = await drive.get(filename);
    const csvData = await response.text();

    const end = Date.now();
    const executionTime = end - start;
    console.log('file download from drive: ' + executionTime + ' ms');

    timeSeries7days = convertCSVTextToGeoJSONTimeDimension(csvData);
    timeSeries24hours = extract24Hours(timeSeries7days);
    console.log("got modis data");
}


async function getModis7daysDataFromFile(){
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
        console.log("got modis data");

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

     timeDimension = new L.TimeDimension({
        fullscreenControl: true,
        timeDimensionControl: true,
        timeDimensionControlOptions: {
        position: 'bottomleft',
        autoPlay: true,
        timeSlider: false,
        loopButton: true,
        playerOptions: {
            transitionTime: 125,
            loop: true,
        }
    },
    timeDimension: true,
    });

    map = L.map('map', {
        center: originalCenter,
        zoom: originalZoom,
        layers: [Esri_WorldImagery],
    });
    map.timeDimension = timeDimension;


    const elements = document.getElementsByClassName("leaflet-bar leaflet-bar-horizontal leaflet-bar-timecontrol leaflet-control");
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
    map.setMinZoom(3);

    const minLatLng = L.latLng(-90, -180);
    const maxLatLng = L.latLng(90, 180);
    const bounds = L.latLngBounds(minLatLng, maxLatLng);
    map.setMaxBounds(bounds);

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
            if (timeSeries7days === null) {
                console.log("wait for 3 seconds");
                setTimeout(function () {
                    startClick();
                }, 3000);
            }

            const bounds = rectangle.getBounds();
            map.removeLayer(rectangle);
            map.removeLayer(textLabel);

            map.setView(center, 4);

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

      map.on('dragend', function (e) {
        if(zoomForTimeSeries && showTimeSeries){
            ControlLayer.removeLayer(geoJSONTimeSeries7days);
            map.removeLayer(geoJSONTimeSeries7days);
            map.removeControl(timeDimensionControl);
            getTimeDimension(true, true);
        }
        });

      map.on('zoomend', handleZoomChange);

      map.on('overlayadd', function (e) {
          if (zoomForTimeSeries && e.layer === geoJSONTimeSeries7days) {
               ControlLayer.removeLayer(geoJSONTimeSeries7days);
            map.removeLayer(geoJSONTimeSeries7days);
            map.removeControl(timeDimensionControl);
            getTimeDimension(true, true);
               showTimeSeries = true;
          }
        });

     map.on('overlayremove', function (e) {
         if (e.layer === geoJSONTimeSeries7days) {
             map.removeControl(timeDimensionControl);
             showTimeSeries = false;
         }
    });

      if(driveData) {
          await getModis7daysDataFromDrive();
      }
      else {
          await getModis7daysDataFromFile();
      }
}

function deleteZoom(){
    const elements = document.getElementsByClassName("leaflet-bar leaflet-bar-horizontal leaflet-bar-timecontrol leaflet-control");
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}
function deleteZoomLayers(){
    if (zoomForTimeSeries) {
        ControlLayer.removeLayer(geoJSONTimeSeries7days);
        map.removeLayer(geoJSONTimeSeries7days);
    }

}



function get24hoursLayer(bounds){
    if (timeSeries24hours === null) {
        console.log("wait for 3 seconds")
        setTimeout(function () {
            get24hoursLayer(bounds);
        }, 3000);
    }
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
         if(timeSeriesInControl) {
             ControlLayer.removeLayer(geoJSONTimeSeries7days);
             timeSeriesInControl = false;
         }
         zoomForTimeSeries = false;
     }

     if (currentZoom >= 7) {
         if (timeSeries7days === null) {
             console.log("wait for 3 seconds");
             setTimeout(function () {
                 handleZoomChange();
             }, 3000);
        }
         if(!zoomForTimeSeries){
             getTimeDimension(true, true);
         }
         zoomForTimeSeries = true;
     }
}

function getTimeDimension(addToControl, getNewData){
    if(timeDimensionControl === null) {
        const player = new L.TimeDimension.Player({
            transitionTime: 1000,
            loop: false,
            startOver: true
        }, timeDimension);

        var timeDimensionControlOptions = {
            player: player,
            autoPlay: true,
            minSpeed: 1,
            speedStep: 1,
            maxSpeed: 15,
            timeSliderDragUpdate: true,
        };
        timeDimensionControl = new L.Control.TimeDimension(timeDimensionControlOptions);
    }

    map.addControl(timeDimensionControl);

    if(getNewData) {
        //Tanja ToDo:
        //1.) Punkte in 1h Zeit einteilen und Zeit runden
        //2.) Alle Punkte innerhalb 1h? in einem Abstand von einem 2km als Polygon und Punkt löschen. Zeitpunkt Mittelwert setzen
        let timeSeriesLayer = L.geoJSON(timeSeries7days, {
            pointToLayer: pointToLayer,
            filter: function (feature) {
                return map.getBounds().contains(L.geoJSON(feature).getBounds());
            }
        });

        geoJSONTimeSeries7days = L.timeDimension.layer.geoJson(timeSeriesLayer, {
            updateTimeDimension: true,
            updateTimeDimensionMode: 'replace',
            addlastPoint: false,
            duration: 'PT20M',
        });
    }
    geoJSONTimeSeries7days.addTo(map);

    if(addToControl) {
        ControlLayer.addOverlay(geoJSONTimeSeries7days, 'Timeseries');
    }
    timeSeriesInControl = true;
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

    let postData = [];
    let counter = 0;
    //if less or equal than 4 fires for forecast
    if (dataLength < 4){
        for (const key  in parsedCoordinates) {
            let tempDict = {};
            tempDict[key] = parsedCoordinates[key];
            postData.push(tempDict);
            if(counter == dataLength - 1){
                await processAndMapData(postData, true);
                firstTimeWheel = true;
                return;
            }
            counter++;
        }
    }


    counter = 0;
    let entireCount = 0;
    let postData2 = [];
    // more than 4 fires for forecast
    for (const key in parsedCoordinates) {;
        let tempDict = {};
        tempDict[key] = parsedCoordinates[key];
        postData2.push(tempDict);
        counter++;
        entireCount++;

        //process 4 fires and map those
        if (counter === 4 || dataLength === entireCount) {
            if(entireCount === dataLength){
                lastCall = true;
                firstTimeWheel = true;
            }
            else {lastCall = false;}
            await processAndMapData(postData2, lastCall);
            if(entireCount === dataLength){
                return;
            }
            postData2 = [];
            counter = 0;
        }
    }
}

function isNullOrEmptyObject(obj) {
  if (obj === null || obj === undefined) {
    return true;
  }

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }

  return true;
}

function fetchWeatherData(url, parsedCoordinates){
    console.log(url);
    if(isNullOrEmptyObject(parsedCoordinates)){
        console.log("object is empty")
        return {};
    }

    return fetch(url, {
        method: "POST",
        mode: 'cors',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(parsedCoordinates)
    }).then(response => response.json());
}

async function processAndMapData(postData, lastCall) {

    const urls = [
       backendURL + "/process_data1",
       backendURL + "/process_data2",
       backendURL + "/process_data3",
       backendURL + "/process_data4",
    ];

    if(!forecast){
       const responses = responseDataManual;
       for (const key in responses) {
           let responseDataAll = {};
           let coordinatesData = {};
           let meteoData = {};
           if (!isNullOrEmptyObject(responses)) {
               coordinatesData = responses[key]['coordinates'];
               meteoData = responses[key]['meteo_data'];
               responseDataAll[dataCounter] = coordinatesData;
               meteoDataAll[dataCounter] = meteoData;
               console.log("starting forecast item")
               getForcastLayer(responseDataAll, map, meteoDataAll, ControlLayer, lastCall);
               dataCounter++;
           }
       }

       return;
    }

    const fetchPromises = await urls.map((url, index) => fetchWeatherData(url, postData[index]));
    Promise.all(fetchPromises)
      .then(responses => {
          for (const key in responses) {
              let responseDataAll = {};
              let coordinatesData = {};
              let meteoData = {};
              if(!isNullOrEmptyObject(responses)) {
                  coordinatesData = responses[key]['coordinates'];
                  meteoData = responses[key]['meteo_data'];
                  responseDataAll[dataCounter] = coordinatesData;
                  meteoDataAll[dataCounter] = meteoData;
                  console.log("starting forecast item")
                  console.log(responseDataAll);
                  getForcastLayer(responseDataAll, map, meteoDataAll, ControlLayer, lastCall);
                  dataCounter++;
              }
          }
      })
      .catch(error => {
        console.error('Ein Fehler ist aufgetreten:', error);
      });
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
                    "color": "#deb6de",
                    "weight": 5,
                    "opacity": 0.65,
                    "smoothFactor": 0.5,
                    "fillColor": "#5c3369",
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

console.log("starting app...")
getMap();
