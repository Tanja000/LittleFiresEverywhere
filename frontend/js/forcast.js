
let animations = [];
let circles = [];
export let initialRadius = 100000;

export const popupOptions = {
            'maxWidth': '500',
            'className': 'another-popup'};

export function deleteWheelWaiting(){
    console.log("delete wheel")
    let elements = document.getElementsByClassName('leaflet-control-button leaflet-control');
    if(elements) {
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
        }
    }
}

function buttonClick(){
    console.log("button clicked");
}

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
    if (!document.getElementById("leaflet-bottom")) {
        const wheelButton = new L.Control.Button(wheelButtonOptions).addTo(map);
    }
}

function circleExistsAtCenter(center, circles) {
    for (let i = 0; i < circles.length; i++) {
        if (circles[i].getLatLng().equals(center)) {
            return true;
        }
    }
    return false;
}

function addRedCircleToIcon(latitude, longitude, map){
    const center = L.latLng(longitude, latitude);
    const redCircle = L.circle([longitude, latitude], {
                color: 'darkred',
                fillColor: '#f03',
                fillOpacity: 0.0,
                radius: initialRadius,
    }).on('click', function () {
            map.setView(center, 13);
        });
    if(circles.length > 0) {
        const exist = circleExistsAtCenter(center, circles);
        if (!exist) {
            redCircle.addTo(map);
            circles.push(redCircle);
            return circles;
        }
    }
    else if (circles.length == 0) {
        redCircle.addTo(map);
        circles.push(redCircle);
        return circles;
    }
}


function swapCoordinates(coordinates) {
    return coordinates.map(coord => [coord[1], coord[0]]);
}


function calculatePerpendicularCoordinates(pathCoordinates, distance) {
    var perpendicularCoordinates = [];

    for (var i = 0; i < pathCoordinates.length; i++) {
        var currentCoord = pathCoordinates[i];
        var nextCoord = pathCoordinates[i + 1] || pathCoordinates[i - 1];

        var dx = nextCoord[0] - currentCoord[0];
        var dy = nextCoord[1] - currentCoord[1];

        var length = Math.sqrt(dx * dx + dy * dy);

        var perpendicularVector = [-dy, dx];

        var normalizedPerpendicularVector = [
            perpendicularVector[0] / length,
            perpendicularVector[1] / length
        ];

        var offsetX = normalizedPerpendicularVector[0] * distance;
        var offsetY = normalizedPerpendicularVector[1] * distance;
        var newCoord1 = [
            currentCoord[0] + offsetX,
            currentCoord[1] + offsetY
        ];
        var newCoord2 = [
            currentCoord[0] - offsetX,
            currentCoord[1] - offsetY
        ];

        perpendicularCoordinates.push(newCoord1, newCoord2);

    }

    return perpendicularCoordinates;
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

function pathToPolygonAnimated(pathCoordinates, date_, startTime_, map, meteoData){

    const distance = 0.001; // 100 Meter in Grad (angenommen)
    const points = calculatePerpendicularCoordinates(pathCoordinates, distance);
    const stepIncrement = 2;
    const hours = Object.keys(meteoData);
    let step = 2;
    let currentIndex = 0;
    let timeStep = step;
    let startTime = startTime_;
    let date = date_;
    let newStartTime = startTime;
    const numPoints = 45;
    let loopCounter = 0;
    let initialCircleRadius = 0.005;

    function animateConvexHull(hullPolygon) {
        /*
           if (step > points.length) {
               //started die Animation von vorne

               map.eachLayer(function(layer) {
                  for (const polygon of polygons){
                     map.removeLayer(polygon);
                  }
                  polygons = [];
               });
               currentIndex = 0;
               step = 2;
               startTime = startTime_;
               date = date_;
               timeStep = step;
               loopCounter = 0;
               initialRadius = 0;
            }*/
        let radius;
        if (step < points.length) {
            const hullCoordinates = turf.featureCollection([]);
            newStartTime = startTime + timeStep;
            if (newStartTime >= 24) {
                newStartTime -= 24;
                startTime = 0;
                timeStep = stepIncrement;
                date = addOneDay(date);
            }

            let rectanglePoints = [];
            for (let i = step - stepIncrement; i < step + stepIncrement; i++) {
                const newPoint = turf.point(points[i]);
                hullCoordinates.features.push(newPoint);
                rectanglePoints.push(points[i]);
            }


            const hour = hours[currentIndex]
            let slowDownFactor = meteoData[hour]['soil_temperature_0cm'] + meteoData[hour]['relativehumidity'];
            let speedFactor = meteoData[hour]['evapotranspiration'];
            let rain = meteoData[hour]['rain'];
            let temp_factor = meteoData[hour]['soil_temperature_0cm'] / 40 + meteoData[hour]['temperature_2m'] / 40;
            let factor = (1 + speedFactor) / slowDownFactor;


            let radius = factor * temp_factor * initialCircleRadius + initialCircleRadius;
            if (rain > 0) {
                radius = radius / (1 + rain);
            }
            initialCircleRadius += 0.002;

            const center = pathCoordinates[loopCounter];
            const circleCoordinates = calculateCircleCoordinates(center, radius, numPoints);
            for (const circleCoord of circleCoordinates) {
                const newPoint = turf.point(circleCoord);
                hullCoordinates.features.push(newPoint);
            }

            loopCounter++;

            const convexHull = turf.convex(hullCoordinates);
            const hullPolygon = new L.polygon(convexHull.geometry.coordinates, {
                color: '#8b0000',
                fillOpacity: 0.5,
                name: 'forcast-polygon'
            }).addTo(map);

            convexHull.properties.windspeed = meteoData[hour]['windspeed'];
            convexHull.properties.relativehumidity = meteoData[hour]['relativehumidity'];
            convexHull.properties.evapotranspiration = meteoData[hour]['evapotranspiration'];
            convexHull.properties.rain = meteoData[hour]['rain'];
            convexHull.properties.soil_temperature_0cm = meteoData[hour]['soil_temperature_0cm'];
            convexHull.properties.soil_moisture_0_1cm = meteoData[hour]['soil_moisture_0_1cm'];
            convexHull.properties.temperature_2m = meteoData[hour]['temperature_2m'];

            const popupContent = "Date: " + date + "<br>Time: " + newStartTime + " UTC" +
                "<br> <br><b>Maxium Values: </b>" +
                "<br>Windspeed: " + convexHull.properties.windspeed + "km/h" +
                "<br>Humidity: " + convexHull.properties.relativehumidity + "%" +
                "<br>Evapotranspiration: " + convexHull.properties.evapotranspiration + "mm" +
                "<br>Rain: " + convexHull.properties.rain + "mm" +
                "<br>Soil Temperature: " + convexHull.properties.soil_temperature_0cm + "°C" +
                "<br>Soil Moisture: " + convexHull.properties.soil_moisture_0_1cm + "m³/m³" +
                "<br>Temperature: " + convexHull.properties.temperature_2m + "°C";
            hullPolygon.bindPopup(popupContent, popupOptions);
            currentIndex++;
            step += stepIncrement;
            timeStep += stepIncrement;
            const animation = setTimeout(function () {
                hullPolygon.setStyle({
                    color: '#eb8334'
                });
                animateConvexHull(hullPolygon);
            }, 1000); // 1 Sekunde Verzögerung zwischen den Schritten
            animations.push(animation);
        }
        }

        animateConvexHull();
}


function getLayers(responseData, map, meteoData){
    for (const key in responseData) {
        let coordinatesArray = [];
        let dictCoordinates =  responseData[key];
        for (const key in dictCoordinates) {
            if (dictCoordinates.hasOwnProperty(key)) {
                const coordinate = dictCoordinates[key];
                coordinatesArray.push([coordinate.latitude, coordinate.longitude, coordinate.dateAquired, coordinate.time]);
            }
        }
        let startTime = Object.values(dictCoordinates)[0].startTime;
        let date = Object.values(dictCoordinates)[0].dateAquired;
        coordinatesArray = swapCoordinates(coordinatesArray);
        pathToPolygonAnimated(coordinatesArray, date, startTime, map, meteoData[key]);
    }
}

export function getForcastLayer(responseData, map, circles, meteoData) {
    if (animations.length > 0) {
        for (let i = 0; i < animations.length; i++) {
            clearInterval(animations[i]);
        }
        animations = [];
    }
    for (const key in responseData) {
        const response = responseData[key];
        const meteo = meteoData[key];
        let firstCoordinate;
        for (const key in response) {
            const first = Object.values(response[key]);
            firstCoordinate = Object.values(first['0']);
            circles = addRedCircleToIcon(firstCoordinate[0], firstCoordinate[1], map);
            continue;
        }
        getLayers(response, map, meteo);
    }
  //  map.on('zoomend', updateCircleRadius(map));

    return circles;
}


