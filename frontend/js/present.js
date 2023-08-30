import {getForcastLayer, createWheelWaiting, deleteWheelWaiting, popupOptions, initialRadius} from "./forcast.js";
import {parseTime, getStartAndEndDate, parseDate, parseConfidence, parseCoordinates, getRectangleData,
    fetchEffiKMLContent, fetchKMLContent, minimizeDictionary, parseCDATA, responseDataManual} from "./present_helper.js";

//////////////////////////////////////////////////////////////////
/*change here for local application or deployment*/
//const backendURL = "https://wildfirebackend-1-q4366666.deta.app";
const backendURL = "http://127.0.0.1:8000";
/*For deployment set to true!*/
const EFfiData = true;
const NASAData = true;
const weatherApi = true;
//////////////////////////////////////////////////////////////////



const modis_active = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/kml/MODIS_C6_1_Europe_24h.kml";
const modis_backup = "/data/MODIS_C6_1_Europe_24h.kml";
let effis_fires =  "";
let map;
let osm;
let confidenceThreshhold = 90;
let markers = [];
let meteoDataAll = {};
let dataCounter = 0;
let day_start;
let day_end;
const originalZoom = 4;
const originalCenter = [57, 0];
let circles = [];
let circlesRemoved = false;

function setEffiUrl(){
    [day_start, day_end] = getStartAndEndDate();
    effis_fires = "https://maps.effis.emergency.copernicus.eu/gwis?LAYERS=modis.hs&FORMAT=kml&TRANSPARENT=true&SINGLETILE=true&SERVICE=wms&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG:4326&BBOX=-18.0,27.0,42.0,72.0&WIDTH=1600&HEIGHT=1200&TIME=" + day_start + "/" + day_end;
}


function updateCircles(){
   const zoomLevel = map.getZoom();
   for (const circle of circles){
          const adjustedRadius = initialRadius - (zoomLevel * 5000) ; // initialRadius / Math.pow(2, zoomLevel - 10); // Adjust as needed
          circle.setRadius(adjustedRadius);
    }

   const minZoomToDelete = 11;
    if (circles) {
        if (zoomLevel >= minZoomToDelete) {
            for (let i = 0; i < circles.length; i++) {
                map.removeLayer(circles[i]);
            }
            circlesRemoved = true;
        } else if (zoomLevel < minZoomToDelete) {
            if (circlesRemoved) {
                for (let i = 0; i < circles.length; i++) {
                    circles[i].addTo(map);
                }
                circlesRemoved = false;
            }
            map.closePopup();
        }
    }
}

function getMap(){
    osm = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 21,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    });
    map = L.map('map', {
        center: originalCenter,
        zoom: originalZoom,
        layers: [osm]
    });
    map.setMinZoom(3);
    osm.addTo(map);
    map.on('zoom', updateCircles);

    //Europa: [71.5, -33.0], [34.5, 44.0]
    const distLat = (71.5 - 34.5)/2;
    const distLng = (44.0 + 33.0)/2;
    const rectangles = [
       // {bounds: [[71.5 - distLat, -33.0], [34.5, 44.0 - distLng]]},
        {bounds: [[71.5 - distLat, -13], [34.5, 44.0 - distLng]]},

        {bounds: [[71.5, -33.0 + distLng], [34.5 + distLat, 44.0]]},
        {bounds: [[68.5, -26], [34.5 + distLat, 44.0 - distLng]]},
       // {bounds: [[71.5 - distLat, -33.0 + distLng], [34.5, 44.0]]},
        {bounds: [[71.5 - distLat, distLng - 15], [34.5, 44.0]]},
     //   {bounds: [[71.5 - distLat, -33.0 + distLng], [34.5, distLng - 15]]},
        {bounds: [[71.5 - distLat - 7, -33.0 + distLng], [34.5, distLng - 15]]},
        {bounds: [[71.5 - distLat, -33.0 + distLng], [64.5 - distLat, distLng - 15]]},
    ];

      rectangles.forEach(function(rectangleData) {
          const rectangle = L.rectangle(rectangleData.bounds, {color: 'darkred', weight: 2}).addTo(map);
          rectangle.on('click', function(event) {
              const bounds = rectangle.getBounds();
              let corner1 = bounds.getSouthWest();
              let corner2 = bounds.getNorthEast();

              map.removeLayer(rectangle);

              if(NASAData){
                  getKMLLayer(modis_active, corner1, corner2);
              }
              else{
                  getKMLLayer(modis_backup, corner1, corner2);
              }
            });
      });

    L.control.custom({
        position: 'topright',
        content : '<button type="button" class="btn-zoomout">'+
                  '    <p>ZOOM</p>'+
                  '</button>',
        events:
        {
            click: function(data)
            {
                map.setView(originalCenter, originalZoom);
            },
        }
    }).addTo(map);

    L.control.custom({
        position: 'topright',
        content : '<button type="button" class="btn-zoomout">'+
                  '    <p>LEAVE</p>'+
                  '</button>',
        events:
        {
            click: function(data)
            {
                const jumpTarget = document.getElementById('map_section');
                jumpTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
            },
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
    const marker = L.marker([location.longitude, location.latitude], {icon: customIcon}).addTo(map);
    const popupContent = title + "<br> <br> Date Acquired: " + dateAquired + "<br> Time Acquired: " + time +
        " <br> <br> Confidence: " + confidence +
        " <br> <br>  <br> <a style='color: black' href='https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms' target='_blank'> <b>More Info </b> </a> ";
    marker.bindPopup(popupContent,  popupOptions);
   /* marker.on('click', function() {
            map.setView(marker.getLatLng(), 13);
    });*/

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
              //Europa: [71.5, -33.0], [34.5, 44.0]
              if(parsedValues.longitude > corner1.lat && parsedValues.longitude < corner2.lat && parsedValues.latitude > corner1.lng && parsedValues.latitude < corner2.lng){
                  parsedCoordinates = getRectangleData(confidenceThreshhold, confidence, parsedValues, dateAquired, time, count, parsedCoordinates);

                  let marker = iconsAtFireOrigin("MODIS FIRE", parsedValues, confidence, dateAquired, time);
                  markers.push(marker);
                  count++;
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

              deleteWheelWaiting();
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
    circles = getForcastLayer(responseDataAll, map, circles, meteoDataAll);
    dataCounter++;
    return parsedValues;
}

async function catchMODISArchiveData(kmlData, corner1, corner2) {
    let parsedCoordinates = {};
    let parsedValues = {};
    try {
        kmlData = await fetchKMLContent(modis_backup);
        [parsedValues, parsedCoordinates] = processKMLData(kmlData, corner1, corner2);
    } catch (error) {
        console.error(error);
    }
    confidenceThreshhold = 90;
    return [parsedValues, parsedCoordinates]
}

async function loadForcastInBackground(parsedValues, parsedCoordinates) {
    const origParsedCoordinates = parsedCoordinates;
    let noStart = 0;
    let noEnd = 4;
    createWheelWaiting(map);

    while (noStart < Object.keys(origParsedCoordinates).length) {
        parsedCoordinates = minimizeDictionary(origParsedCoordinates, noStart, noEnd);
        await processAndMapData(parsedValues, parsedCoordinates);
        noStart += 4;
        noEnd += 4;
    }
    deleteWheelWaiting();
}


function getKMLLayer(kmlData, corner1, corner2){
    fetch(kmlData)
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

            console.log(backendURL + "/process_data");

            async function waitToFinish(){
                await loadForcastInBackground(parsedValues, parsedCoordinates);
            };

            await waitToFinish();
           // deleteWheelImage();
            console.log("FINISHED")
        }).catch(error => console.error('Fehler beim Laden der KML-Datei:', error));
}

console.log("starting map...")
getMap();

