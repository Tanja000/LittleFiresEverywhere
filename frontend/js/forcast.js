import {ndviIncluded} from "./config";

const fillOpacity = 0.25;
let allPolygons = {};
let ndviControl = false;
let ndviSquares = L.markerClusterGroup();
export let forcastPolygons = L.markerClusterGroup();
export const handIcon = L.icon({
            iconUrl: './icons/click_finger.png',
            iconSize: [24, 24],
            iconAnchor: [0, 0]
});

let forecastControl = false;
let WheelWaitingActiv = false;
const pointerIcon = L.icon({
            iconUrl: './icons/click_finger_black.png',
            iconSize: [20, 20],
            iconAnchor: [0, 0]
});

const popupOptions = {
    'maxWidth': '500',
    'className': 'marker-popup'
};


export let arrowSymbolForcast = L.markerClusterGroup({
          /*  iconCreateFunction: (cluster) => {
                return pointerClusterIcon;
            },*/
			spiderfyOnMaxZoom: false,
			showCoverageOnHover: false,
			zoomToBoundsOnClick: true
		});

export function createWheelWaiting(map){
    const wheelButtonOptions = {
        'text': 'Loading data',
        'iconUrl': '/icons/wheel.gif',
        'onClick': buttonClick,
        'hideText': true,
        'maxWidth': 10,
        'doToggle': false,
        'toggleStatus': false,
    };
    if(!WheelWaitingActiv) {
        const wheelButton = new L.Control.Button(wheelButtonOptions).addTo(map);
        WheelWaitingActiv = true;
    }
}

export function utcTimeToDate(date, time){
    if (Number.isInteger(time)) {
        if (time < 10) {
          time = "0" + time.toString() + ":00";
        }
        else {
          time = time.toString() + ":00";
        }
    }

    if (time.includes("UTC")){
        time = time.slice(0, -4)
    }
    const dateTime = date + "T" + time + "Z";
    const localDate = new Date(dateTime);
    return localDate.toString();
}

function buttonClick(){
    console.log("button clicked");
}


function addOneDay(dateStr) {
    var date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    var year = date.getFullYear();
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var day = date.getDate().toString().padStart(2, '0');

    return year + '-' + month + '-' + day;
}

function calculateCircleCoordinates(center, radius, numPoints) {
    var circleCoordinates = [];
    for (var i = 0; i < numPoints; i++) {
        var angle = (i / numPoints) * Math.PI * 2; // Berechne den Winkel
        var x = center[0] + radius * Math.cos(angle); // x-Koordinate berechnen
        var y = center[1] + radius * Math.sin(angle); // y-Koordinate berechnen
        circleCoordinates.push([x, y]);
    }

    return circleCoordinates;
}

export function deleteWheelWaiting(){
    console.log("delete wheel")
    let elements = document.getElementsByClassName('leaflet-control-button leaflet-control');
    if(elements) {
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
        }
    }
    WheelWaitingActiv = false;
}


function getSmoothedPolygon(convexHull, color){
    const smoothed = turf.polygonSmooth(convexHull, {iterations: 5});
    const hullLayer = L.geoJSON(smoothed, {
                style: {
                    color: "black",
                    fillColor: color,
                    fillOpacity: fillOpacity,
                    weight: 1,
                }
            })
    return hullLayer;
}

function trajectoryToMap(map, meteoData){
    meteoData.forEach(coord => {
    L.circle([coord.latitude, coord.longitude], {
        color: 'black',
        fillColor: 'green',
        fillOpacity: fillOpacity,
        radius: 50,
      }).addTo(map);
    });
    const trajectory = L.polyline(meteoData.map(coord => [coord.latitude, coord.longitude]), { color: 'blue' }).addTo(map);
}

function isCoordinateInRectangle(coord, rectangle) {
  return rectangle.getBounds().contains(coord);
}

function getCone(map, coordData, meteoData){
    const distanceMeters = 30;
    let coneTipLatLngPrevious = L.latLng();
    let radiusMeters = 0.001;
    const numPoints = 40;
    let count = 0;
    let semiSpherePrevious = [];
    let semiSphereCoordinates = [];
    let hullLayers = [];
    let oldValue = "";
    let radiusAdd = 0.001;

    for (const [key, value] of Object.entries(coordData)) {
        if(value.latitude == oldValue.latitude && value.longitude == oldValue.longitude){
            return hullLayers;
        }
        let coneBaseCenterLatLng = [value.latitude, value.longitude];
        let hullCoordinates = turf.featureCollection([]);
        semiSphereCoordinates = [];

        let ndviValue = 0.5
        if(meteoData[count]['ndvi']) {
            let ndviValue = meteoData[count]['ndvi'].substring(0, 6);
            ndviValue = parseFloat(ndviValue);
        }

        if(count != 0) {
            for (let i = 0; i < numPoints; i++) {
                hullCoordinates.features.push(semiSpherePrevious[i]);
            }
        }
        if (ndviValue < 0.1) {
            radiusAdd = 0;
            radiusMeters = 0;
        }
        else if (0.2 > ndviValue >= 0.1) {
            radiusAdd = 0.0001;
        }
        else if (0.4 > ndviValue >= 0.2) {
            radiusAdd = 0.005;
        }
        else if (0.7 > ndviValue >= 0.4) {
            radiusAdd = 0.0025;
        }
        else if (1 >= ndviValue >= 0.7) {
            radiusAdd = 0.001;
        }
        radiusMeters += radiusAdd;
        oldValue = value;

        for (let i = 0; i < numPoints; i++)
        {
            const angle = (i / numPoints) * 2 * Math.PI;
            const x = radiusMeters * Math.cos(angle) + coneBaseCenterLatLng[1];
            const y = radiusMeters * Math.sin(angle) + coneBaseCenterLatLng[0];

            const newPoint = turf.point([x, y]);
            semiSphereCoordinates.push(newPoint);
            hullCoordinates.features.push(newPoint);
        }

        if(count === 0){
            coneTipLatLngPrevious = coneBaseCenterLatLng;
            semiSpherePrevious = semiSphereCoordinates;
            count += 1;
            continue;
         }


        const latDiff = coneBaseCenterLatLng[0] - coneTipLatLngPrevious[0];
        const lngDiff = coneBaseCenterLatLng[1] - coneTipLatLngPrevious[1];
        const length = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        let unitLat = 0;
        let unitLng = 0;
        if(coneBaseCenterLatLng[0] != coneTipLatLngPrevious[0] && coneBaseCenterLatLng[1] != coneTipLatLngPrevious[1]){
            unitLat = latDiff / length;
            unitLng = lngDiff / length;
        }
        let y1 = coneBaseCenterLatLng[0] + (unitLng * (distanceMeters / 111319));
        let x1 = coneBaseCenterLatLng[1] - (unitLat * (distanceMeters / 111319));
        let y2 = coneBaseCenterLatLng[0] - (unitLng * (distanceMeters / 111319));
        let x2 = coneBaseCenterLatLng[1] + (unitLat * (distanceMeters / 111319));
        let newPoint = turf.point([x1, y1]);
        hullCoordinates.features.push(newPoint);
        newPoint = turf.point([x2, y2]);
        hullCoordinates.features.push(newPoint);

        const convexHull = turf.convex(hullCoordinates);
        const hullLayer = getSmoothedPolygon(convexHull, 'darkred').addTo(map);
        hullLayers.push(hullLayer);

        coneTipLatLngPrevious = coneBaseCenterLatLng;
        semiSpherePrevious = semiSphereCoordinates;
        count ++;
       // if(count == 4){ return hullLayers;}
    }
    return hullLayers;
}


function getNDVIMatrixLayer(ndviData, map, realForcast) {

    const squareSize = 231.656358264;
    const colorRanges = [
        {color: 'blue', min: -1, max: 0.1},
        {color: 'yellow', min: 0.1, max: 0.2},
        {color: 'darkred', min: 0.2, max: 0.4},
        {color: 'orange', min: 0.4, max: 0.7},
        {color: 'red', min: 0.7, max: 1},
    ];
    let count = 0;
    if (!realForcast) {
        ndviData = Object.values(ndviData);
    }


    ndviData.forEach(data => {
            if (data) {
                const value = data.ndvi;
                let lng = data.coordinate[0];
               /* if (minus90) {
                    lng -= 90;
                }*/
                let lat = data.coordinate[1];
              //  var marker = L.marker([lat, lng]).addTo(map);
                let color = 'gray'; // Standardfarbe
                for (const range of colorRanges) {
                    if (value >= range.min && value < range.max) {
                        color = range.color;
                        break;
                    }
                }

                const centerCoordinate = [lat, lng];

                //L * 180 / (π * R) = a
                const sizeInDegrees = squareSize * 180 /(Math.PI * 6378137)
                const northwestCoordinate = [centerCoordinate[0] + sizeInDegrees, centerCoordinate[1] - sizeInDegrees];
                const southeastCoordinate = [centerCoordinate[0] - sizeInDegrees, centerCoordinate[1] + sizeInDegrees];

               const square = L.rectangle([
                    northwestCoordinate ,
                    southeastCoordinate
                ], {
                    fillColor: color,
                    color: 'black',
                    weight: 1,
                    fillOpacity: fillOpacity,
                });
               ndviSquares.addLayer(square);
            }
            count += 1;
        });
}


function getPopupForCones(polyLayers, meteoData,  key, startTime_, date_, map, controlLayer, lastCall){
    const dataLength = polyLayers.length - 1;
    const stepIncrement = 2;
    const hours = Object.keys(meteoData);
    let step = 2;
    let currentIndex = 0;
    let timeStep = 0;
    let startTime = startTime_;
    let date = date_;
    let newStartTime = startTime;
    let dates = [];
    let times = [];
    let polygonsList = [];
    let slider;

    for (const poly of polyLayers) {
        let textLabel;
        newStartTime = startTime + timeStep;
        if (newStartTime >= 24) {
            newStartTime -= 24;
            startTime = 0;
            timeStep = stepIncrement;
            date = addOneDay(date);
        }
        const hour = hours[currentIndex]

        dates.push(date);
        times.push(newStartTime);

        polygonsList.push(poly);
        allPolygons[key] = polygonsList;
        forcastPolygons.addLayer(poly);

        let dateAndTime = utcTimeToDate(date, newStartTime);
        const gmtIndex = dateAndTime.indexOf("GMT");
        dateAndTime = dateAndTime.substring(0, gmtIndex);

        let popupContent = "<div id='popup-content'>" +
            "<b>FIRE SPREAD FORECAST: </b><br><br>" + dateAndTime +
            "<br>Windspeed: " + meteoData[hour]['windspeed'] + "km/h" +
            "<br>Humidity: " + meteoData[hour]['relativehumidity'] + "%" +
            "<br>Evapotranspiration: " + meteoData[hour]['evapotranspiration'] + "mm" +
            "<br>Rain: " + meteoData[hour]['rain'] + "mm" +
            "<br>Soil Temperature: " + meteoData[hour]['soil_temperature_0cm'] + "°C" +
            "<br>Soil Moisture: " + meteoData[hour]['soil_moisture_0_1cm'] + "m³/m³" +
            "<br>Temperature: " + meteoData[hour]['temperature_2m'] + "°C  +" +
            "<br> NDVI: " + meteoData[hour]['ndvi'] + "</div>" ;


        let idSlider = "time-slider" + key;
        let sliderValue = dataLength - currentIndex;
        let sliderContent = popupContent + '<br><div id="slider-container">' +
            '<input id=' + idSlider + ' type="range" min="0" max="10" step="1" value=' + sliderValue + '></div>';

        let popupHull = L.popup({
            offset: [75, -75],
            autoPan: true,
        }).setContent(sliderContent);


        poly.bindPopup(popupHull, popupOptions);

        poly.on('popupopen', function () {
            poly.setStyle({
                fillColor: 'orange',
                fillOpacity: fillOpacity,
                weight: 1,
                color: 'black'
            });
            slider = document.getElementById(idSlider);
            slider.addEventListener('input', sliderChanged);

            if (!textLabel) {
                poly.closePopup();
            }
        });

         map.on('overlayremove', function (eventLayer) {
            if (eventLayer.layer._leaflet_id === 1) {
                map.removeLayer(popupHull);
            }
        })


    function sliderChanged() {
        sliderValue = slider.value;
        const indexMeteo = hours[dataLength - sliderValue];

        dateAndTime = utcTimeToDate(dates[dataLength - sliderValue], times[dataLength - sliderValue]);
        dateAndTime = dateAndTime.substring(0, gmtIndex);
        const popupContent = "<div id='popup-content'>" +
                    "<b>FIRE SPREAD FORECAST: </b><br><br>" + dateAndTime +
                    "<br>Windspeed: " + meteoData[indexMeteo]['windspeed'] + "km/h" +
                    "<br>Humidity: " + meteoData[indexMeteo]['relativehumidity'] + "%" +
                    "<br>Evapotranspiration: " + meteoData[indexMeteo]['evapotranspiration'] + "mm" +
                    "<br>Rain: " + meteoData[indexMeteo]['rain'] + "mm" +
                    "<br>Soil Temperature: " + meteoData[indexMeteo]['soil_temperature_0cm'] + "°C" +
                    "<br>Soil Moisture: " + meteoData[indexMeteo]['soil_moisture_0_1cm'] + "m³/m³" +
                    "<br>Temperature: " + meteoData[indexMeteo]['temperature_2m'] + "°C + " +
                    "<br> NDVI: " + meteoData[indexMeteo]['ndvi'] + "</div>";

        document.getElementById("popup-content").innerHTML = popupContent;
        const sliderPolygon = allPolygons[key][dataLength - sliderValue];
        for (const poly2 of allPolygons[key]) {
            poly2.setStyle({
                fillColor: 'darkred',
                fillOpacity: fillOpacity,
                weight: 1,
                color: 'black'
            });
        }
        sliderPolygon.setStyle({
            fillColor: 'orange',
            fillOpacity: fillOpacity,
            weight: 2,
            color: 'black'
        });
        sliderPolygon.bringToFront();
    }

    if (currentIndex == dataLength) {
        const polygonCenter = poly.getBounds().getCenter();
        const textCenter =  L.latLng(polygonCenter.lat, polygonCenter.lng);
        textLabel = L.marker(textCenter, {
            icon: pointerIcon,
            zIndexOffset: 1000
        });
        textLabel.bindTooltip('Click me!', {
            permanent: false,
            direction: 'top',
            className: 'text-labels'
        });

        textLabel.on('click', clickTextLabel);
        arrowSymbolForcast.addLayer(textLabel);
        forcastPolygons.addLayer(textLabel);
        forcastPolygons.addTo(map);


        if (!forecastControl) {
            controlLayer.addOverlay(forcastPolygons, " Forecast <img src='./icons/click_finger_black.png' alt='Icon' width='20' height='20'>");
            forecastControl = true;
        }

        function clickTextLabel() {
            poly.bindPopup(popupHull).openPopup();
            map.setView(textCenter, 13);
        }
        if(lastCall){
            console.log("FINISHED");
            deleteWheelWaiting();
        }
    }

    currentIndex++;
    step += stepIncrement;
    timeStep += stepIncrement;
    }
}

export function getForcastLayer(map, ndviData, coordData, meteoData, key, ControlLayer, lastCall, realForecast, ndviIncluded) {

    let startTime = coordData[0]['startTime'];
    let date = coordData[0]['dateAquired'];
    if(ndviIncluded) {
        getNDVIMatrixLayer(ndviData, map, realForecast);
         if (!ndviControl) {
               ControlLayer.addOverlay(ndviSquares, " NDVI <img src='./icons/ndvi.png' alt='Icon' width='20' height='20'>");
               ndviControl = true;
         }
    }
  //  trajectoryToMap(map, coordData);
    const polyLayers = getCone(map, coordData, meteoData);
    if(polyLayers.length > 0) {
        getPopupForCones(polyLayers, meteoData, key, startTime, date, map, ControlLayer, lastCall)
    }
    else{
        deleteWheelWaiting();
    }
    return;
}

