import {getForcastLayer, createWheelWaiting, deleteWheelWaiting, handIcon,  popupOptions, initialRadius} from "./forcast.js";
import {parseTime, getStartAndEndDate, parseDate, parseConfidence, parseCoordinates, getRectangleData,
    fetchEffiKMLContent, fetchKMLContent, parseCDATA, responseDataManual} from "./present_helper.js";

//////////////////////////////////////////////////////////////////
/*change here for local application or deployment*/
//const backendURL = "https://wildfirebackend-1-q4366666.deta.app";
const backendURL = "http://127.0.0.1:8000";
/*For deployment set to true!*/
const EFfiData = true;
const NASAData = true;
const weatherApi = true;
//////////////////////////////////////////////////////////////////

const activeFireConfidenceThreshold = 65;
const modis_active_World = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/kml/MODIS_C6_1_Global_24h.kml";
const modis_backup_World= "/data/MODIS_C6_1_Global_24h.kml";
let effis_fires =  "";
let map;
let confidenceThreshhold = 90;
let markers = [];
let meteoDataAll = {};
let dataCounter = 0;
let day_start;
let day_end;
const originalZoom = 3;
const originalCenter = [23, 8];
let clickCluster;
let circlesRemoved = false;

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

function setEffiUrl(){
    [day_start, day_end] = getStartAndEndDate();
    effis_fires = "https://maps.effis.emergency.copernicus.eu/gwis?LAYERS=modis.hs&FORMAT=kml&TRANSPARENT=true&SINGLETILE=true&SERVICE=wms&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG:4326&BBOX=-18.0,27.0,42.0,72.0&WIDTH=1600&HEIGHT=1200&TIME=" + day_start + "/" + day_end;
}


function updateCircles(){
   const zoomLevel = map.getZoom();
   const minZoomToDelete = 10;
    if (clickCluster) {
        if (zoomLevel >= minZoomToDelete) {
            map.removeLayer(clickCluster);
            circlesRemoved = true;
        } else if (zoomLevel < minZoomToDelete) {
            if (circlesRemoved) {
                clickCluster.addTo(map);
                circlesRemoved = false;
            }
            map.closePopup();
        }
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
        map.panInsideBounds(bounds, { animate: false });
    });

    Esri_WorldTopoMap.addTo(map);
    map.on('zoom', updateCircles);

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
    L.control.layers(baseMaps, overlayMaps).addTo(map);

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
            let corner1 = bounds.getSouthWest();
            let corner2 = bounds.getNorthEast();

            map.removeLayer(rectangle);
            map.removeLayer(textLabel);

            if (NASAData) {
                getKMLLayer(modis_active_World, corner1, corner2);
            } else {
                getKMLLayer(modis_backup_World, corner1, corner2);
            }
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

}


function iconsAtFireOrigin(title, location, confidence, dateAquired, time){
    const customIcon = L.icon({
        iconUrl: './icons/fire.png',
        iconSize: [32, 32],
        iconAnchor: [0, 0],
        popupAnchor: [0, -32]
    });
    const marker = L.marker([location.longitude, location.latitude], {icon: customIcon});
    const popupContent = title + "<br> <br> Date Acquired: " + dateAquired + "<br> Time Acquired: " + time +
        " <br> <br> Confidence: " + confidence;
       //+ " <br> <br>  <br> <a style='color: black' href='https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms' target='_blank'> <b>More Info </b> </a> ";
    marker.bindPopup(popupContent,  popupOptions);
    markersCluster.addLayer(marker)

    return marker;
}


function processKMLData(kmlData, corner1, corner2){
        let parsedValues = {};
          const parser = new DOMParser();
          let  xmlDoc = parser.parseFromString(kmlData, 'text/xml');
          const descLength = xmlDoc.getElementsByTagName("description").length;
          let parsedCoordinates = {};
          let count = 0;
          for (let i = 0; i < descLength; i++) {
            //  if(count>=2){break;}
              const description = xmlDoc.getElementsByTagName("description")[i].innerHTML;
              const confidence = parseConfidence(description);
              const dateAquired = parseDate(description);
              const time = parseTime(description);
             let coordinatesDiv = xmlDoc.getElementsByTagName("coordinates")[i];
              if (coordinatesDiv != null) {
                } else {
                  console.log("data with null detected");
                  continue;
                }
              let coordinates = xmlDoc.getElementsByTagName("coordinates")[i].innerHTML;
              parsedValues = parseCoordinates(coordinates);

              if(parsedValues.longitude > corner1.lat && parsedValues.longitude < corner2.lat && parsedValues.latitude > corner1.lng && parsedValues.latitude < corner2.lng){
                  parsedCoordinates = getRectangleData(confidenceThreshhold, confidence, parsedValues, dateAquired, time, count, parsedCoordinates);

                  if (confidence >= activeFireConfidenceThreshold) {
                      let marker = iconsAtFireOrigin("MODIS FIRE", parsedValues, confidence, dateAquired, time);
                      markers.push(marker);
                      count++;
                  }
              }

              let desc = xmlDoc.getElementsByTagName("description")[i].innerHTML;
              desc = parseCDATA(desc);
              xmlDoc.getElementsByTagName("description")[i].innerHTML = desc;
          }

          if(Object.keys(parsedCoordinates).length === 0){
              console.log("no Data");
               if(confidenceThreshhold >= 80){
                    confidenceThreshhold -= 5;
                    [parsedValues, parsedCoordinates] = processKMLData(kmlData, corner1, corner2)
                    return [parsedValues, parsedCoordinates];
                }
              return [parsedValues, parsedCoordinates];
          }
          return [parsedValues, parsedCoordinates];
}

function processEffiKMLData(kmlData, corner1, corner2) {
    let count = 0;
    let parsedValues = {};
    let parsedCoordinates = {};
    const parser = new DOMParser();
    let  xmlDoc = parser.parseFromString(kmlData, 'text/xml');
    const descLength = xmlDoc.getElementsByTagName("Placemark").length;
    for (let i = 0; i < descLength; i++) {
        const description = "Effi - Modis Fire";
        const confidence = 90;
        const dateAquired = day_start;
        const time = "00:00 UTC";
        let coordinates = xmlDoc.getElementsByTagName("coordinates")[i].innerHTML;
        parsedValues = parseCoordinates(coordinates);
        //Europa: [71.5, -33.0], [34.5, 44.0]
        if (parsedValues.longitude > corner1.lat && parsedValues.longitude < corner2.lat && parsedValues.latitude > corner1.lng && parsedValues.latitude < corner2.lng) {
            parsedCoordinates = getRectangleData(confidenceThreshhold, confidence, parsedValues, dateAquired, time, count, parsedCoordinates);
            let marker = iconsAtFireOrigin("MODIS FIRE from EFFI", parsedValues, confidence, dateAquired, time);
            markers.push(marker);
            count++;
        }
    }
    if(Object.keys(parsedCoordinates).length === 0){
        console.log("no Data");
        return parsedValues;
    }
    return [parsedValues, parsedCoordinates];
}


async function processAndMapData(parsedValues, parsedCoordinates) {
    let responseDataAll = {};
    let responseData = {};
    let coordinatesData = {};
    let meteoData = {};
    if(weatherApi) {
        try {
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
    clickCluster = await getForcastLayer(responseDataAll, map, meteoDataAll);
    dataCounter++;
    return parsedValues;
}

async function catchMODISArchiveData(kmlData, corner1, corner2) {
    let parsedCoordinates = {};
    let parsedValues = {};
    try {
        kmlData = await fetchKMLContent(modis_backup_Europe);
        [parsedValues, parsedCoordinates] = processKMLData(kmlData, corner1, corner2);
    } catch (error) {
        console.error(error);
    }
    confidenceThreshhold = 90;
    return [parsedValues, parsedCoordinates]
}

async function loadForcastInBackground(parsedValues, parsedCoordinates) {
    const coordinatesLength = Object.keys(parsedCoordinates).length;
    console.log(coordinatesLength);
    if ( coordinatesLength <= 4){
        await processAndMapData(parsedValues, parsedCoordinates);
        return;
    }

    let tempDict = {};
    let count = 0;
    let entireCount = 0;

    for (const key in parsedCoordinates) {
        tempDict[key] = parsedCoordinates[key];
        count++;

        if (count === 4 || coordinatesLength === count) {
            await processAndMapData(parsedValues, tempDict);
            tempDict = {};
            count = 0;
        }

        if (entireCount === coordinatesLength - 1 && count !== 0){
            await processAndMapData(parsedValues, tempDict);
            return;
        }
        entireCount++;

  }
}


async function getKMLLayer(kmlData, corner1, corner2){
    createWheelWaiting(map);
    await fetch(kmlData)
        .then(response => response.text())
        .then(async data => {
            //let kmlData;
            let parsedValues = {};
            let parsedCoordinates = {};
            if (data.length < 500) {
                console.log("no Modis data");
                //try effis data first!
                if (EFfiData) {
                    try {
                        setEffiUrl();
                        kmlData = await fetchEffiKMLContent(effis_fires);
                        [parsedValues, parsedCoordinates] = processEffiKMLData(kmlData, corner1, corner2);
                    } catch (error) {console.error(error);}
                }
                //archive Modis Data if both kml not available
                const parsedValuesLength = Object.keys(parsedValues).length;
                if (parsedValuesLength == 0) {
                    [parsedValues, parsedCoordinates] = catchMODISArchiveData(kmlData, corner1, corner2)
                }
            } else {
                kmlData = data;
                [parsedValues, parsedCoordinates] = processKMLData(kmlData, corner1, corner2);
                confidenceThreshhold = 90;
            }

            map.addLayer(markersCluster);
            console.log(backendURL + "/process_data");
            await loadForcastInBackground(parsedValues, parsedCoordinates);
            deleteWheelWaiting();
            console.log("FINISHED");
        }).catch(error => console.error('Fehler beim Laden der KML-Datei:', error));
}

function checkForNewVisible(){
    let isTabActive = true;

    // Eventlistener für Sichtbarkeitswechsel
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        if (!isTabActive) {
          isTabActive = true;
          location.reload();
        }
      } else {
        isTabActive = false;
      }
    });
}

//checkForNewVisible();
console.log("starting map...")
getMap();

