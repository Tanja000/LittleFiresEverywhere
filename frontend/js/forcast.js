
let circles = [];
let allPolygons = {};
let circleText = [];


export let initialRadius = 100000;

export const popupOptions = {
            'maxWidth': '500',
            'className': 'another-popup'};

export const handIcon = L.icon({
            iconUrl: './icons/click_finger.png',
            iconSize: [24, 24],
            iconAnchor: [0, 0]
});

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
    const center = L.latLng(latitude, longitude);
    const redCircle = L.circle([latitude, longitude], {
                color: 'darkred',
                fillColor: '#f03',
                fillOpacity: 0.0,
                radius: initialRadius,
    }).on('click', function () {
            map.setView(center, 13);
        });

    const textLabel = L.marker(center, {
            icon: handIcon,
            zIndexOffset: 1000
        }).addTo(map);
        textLabel.bindTooltip('Click me!', {
            permanent: false,
            direction: 'top',
            className: 'text-labels'
        });


    textLabel.on('click', clickTextLabel);

    function clickTextLabel(){
        map.removeLayer(textLabel);
        map.setView(center, 13);
    }

    circleText.push(textLabel);

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

/*async function fetchMapAsync() {
  const response = await fetch('https://unpkg.com/@geo-maps/earth-seas-10m/map.geo.json');
  const data = await response.json();
  return data;
}*/

async function pathToPolygonAnimated(pathCoordinates, date_, startTime_, map, meteoData, key){
    const distance = 0.001; // 100 Meter in Grad (angenommen)
    const points = calculatePerpendicularCoordinates(pathCoordinates, distance);
    const stepIncrement = 2;
    const hours = Object.keys(meteoData);
    let step = 2;
    let currentIndex = 0;
    let timeStep = 0;
    let startTime = startTime_;
    let date = date_;
    let newStartTime = startTime;
    const numPoints = 45;
    let initialCircleRadius = 0.005;
    let dates = [];
    let times = [];
    let polygonsList = [];
    let textLabel;

    async function animateConvexHull() {
        if (step < points.length) {
            const hullCoordinates = turf.featureCollection([]);
            let textLabel;
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

            const center = pathCoordinates[currentIndex];
            const circleCoordinates = calculateCircleCoordinates(center, radius, numPoints);
            for (const circleCoord of circleCoordinates) {
                const newPoint = turf.point(circleCoord);
                hullCoordinates.features.push(newPoint);
            }

            const convexHull = turf.convex(hullCoordinates);
            const hullPolygon = new L.polygon(convexHull.geometry.coordinates, {
                color: 'orange',//'#8b0000',
                fillOpacity: 0.5,
                name: 'forcast-polygon'
            }).addTo(map);

            dates.push(date);
            times.push(newStartTime);

            polygonsList.push(hullPolygon);

            //wegen Koordinaten rectangle Berechnung - ersten meteo Wert geglassen
            allPolygons[key] = polygonsList;

            let idContent = "popupContent" + key;
            let popupContent = "<div id=" + idContent + ">" +
                "<b>FIRE SPREAD FORECAST: </b><br><br> Date: " + date + "<br>Time: " + newStartTime + " UTC" +
                "<br>Windspeed: " + meteoData[hour]['windspeed'] + "km/h" +
                "<br>Humidity: " + meteoData[hour]['relativehumidity'] + "%" +
                "<br>Evapotranspiration: " + meteoData[hour]['evapotranspiration'] + "mm" +
                "<br>Rain: " + meteoData[hour]['rain'] + "mm" +
                "<br>Soil Temperature: " + meteoData[hour]['soil_temperature_0cm'] + "°C" +
                "<br>Soil Moisture: " + meteoData[hour]['soil_moisture_0_1cm'] + "m³/m³" +
                "<br>Temperature: " + meteoData[hour]['temperature_2m'] + "°C" + "</div>";

            let idSlider = "time-slider" + key;
            let idSliderText = "slider-value" + key;
            let sliderValue = 10 - currentIndex;
            let sliderContent = popupContent + '<br><div id="slider-container">' +
                '<input id=' + idSlider + ' type="range" min="0" max="10" step="1" value=' + sliderValue + '>' +
                '<div class="value-display" id=' + idSliderText + '>Date: ' + date + ' Time: ' + newStartTime + ' UTC</div>' +
                '</div>';

            let popup = L.popup({
                offset: [75, -75],
                autoPan: true,
            }).setContent(sliderContent);

            //  hullPolygon.bindPopup(popup).openPopup();
            hullPolygon.bindPopup(popup);
            hullPolygon.on('popupopen', function () {
                hullPolygon.setStyle({
                    fillColor: 'orange',
                    fillOpacity: 0.5,
                    weight: 2,
                    color: 'orange'
                });
                const slider = document.getElementById(idSlider);
                slider.addEventListener('change', sliderChanged);
                map.removeLayer(textLabel);
            });
            hullPolygon.on('popupclose', function () {
                for (const poly of allPolygons[key]) {
                    poly.setStyle({
                        fillColor: 'darkred',
                        fillOpacity: 0.5,
                        weight: 1,
                        color: 'darkred'
                    });
                }
            });

            function sliderChanged() {
                const idSlider = "time-slider" + key;
                const slider = document.getElementById(idSlider);
                const sliderValue = slider.value;
                const indexMeteo = hours[11 - sliderValue];
                const idSliderText = "slider-value" + key;
                const sliderText = document.getElementById(idSliderText);
                sliderText.innerHTML = "Date: " + dates[10 - sliderValue] + " Time: " + times[10 - sliderValue] + " UTC";
                const popupContent =
                    "<b>FIRE SPREAD FORECAST: </b><br><br> Date: " + dates[10 - sliderValue] + "<br>Time: " + times[10 - sliderValue] + " UTC" +
                    "<br>Windspeed: " + meteoData[indexMeteo]['windspeed'] + "km/h" +
                    "<br>Humidity: " + meteoData[indexMeteo]['relativehumidity'] + "%" +
                    "<br>Evapotranspiration: " + meteoData[indexMeteo]['evapotranspiration'] + "mm" +
                    "<br>Rain: " + meteoData[indexMeteo]['rain'] + "mm" +
                    "<br>Soil Temperature: " + meteoData[indexMeteo]['soil_temperature_0cm'] + "°C" +
                    "<br>Soil Moisture: " + meteoData[indexMeteo]['soil_moisture_0_1cm'] + "m³/m³" +
                    "<br>Temperature: " + meteoData[indexMeteo]['temperature_2m'] + "°C";

                idContent = "popupContent" + key;
                document.getElementById(idContent).innerHTML = popupContent;
                const sliderPolygon = allPolygons[key][10 - sliderValue];
                for (const poly of allPolygons[key]) {
                    poly.setStyle({
                        fillColor: 'darkred',
                        fillOpacity: 0.5,
                        weight: 1,
                        color: 'darkred'
                    });
                }
                sliderPolygon.setStyle({
                    fillColor: 'orange',
                    fillOpacity: 0.5,
                    weight: 2,
                    color: 'orange'
                });
                sliderPolygon.bringToFront();

            }

            const slider = document.getElementById(idSlider);
            if (slider) {
                slider.addEventListener('change', sliderChanged);
            }

            if (currentIndex == 10) {
                const textCenter =  L.latLng(center[0], center[1]);
                textLabel = L.marker(textCenter, {
                    icon: handIcon,
                    zIndexOffset: 1000
                }).addTo(map);
                textLabel.bindTooltip('Click me!', {
                    permanent: false,
                    direction: 'top',
                    className: 'text-labels'
                });
                textLabel.on('click', clickTextLabel);

                function clickTextLabel() {
                    hullPolygon.bindPopup(popup).openPopup();
                    map.removeLayer(textLabel);
                    map.setView(textCenter, 13);
                }
            }


            currentIndex++;
            step += stepIncrement;
            timeStep += stepIncrement;
            const animation = setTimeout(function () {
                hullPolygon.setStyle({
                    color: 'darkred',//'#eb8334'
                });
                animateConvexHull(hullPolygon);
            }, 1000); // 1 Sekunde Verzögerung zwischen den Schritten
        }
    }
    animateConvexHull();
}



async function getLayers(responseData, map, meteoData) {
    for (const key in responseData) {
        let coordinatesArray = [];
        let dictCoordinates = responseData[key];
        for (const key in dictCoordinates) {
            if (dictCoordinates.hasOwnProperty(key)) {
                const coordinate = dictCoordinates[key];
                coordinatesArray.push([coordinate.latitude, coordinate.longitude, coordinate.dateAquired, coordinate.startTime]);
            }
        }

        if(Object.values(dictCoordinates).length > 0) {
            let startTime = Object.values(dictCoordinates)[0].startTime;
            let date = Object.values(dictCoordinates)[0].dateAquired;
           // coordinatesArray = swapCoordinates(coordinatesArray);
            await pathToPolygonAnimated(coordinatesArray, date, startTime, map, meteoData[key], key);
        }
    }
}

export async function getForcastLayer(responseData, map, circles, meteoData) {
    console.log("new forcast for rectangle selected");
    for (const key in responseData) {
        const response = responseData[key];
        const meteo = meteoData[key];
        let firstCoordinate;
        for (const key in response) {
            const first = Object.values(response[key]);
            if(first.length > 0) {
                firstCoordinate = Object.values(first['0']);
                circles = addRedCircleToIcon(firstCoordinate[0], firstCoordinate[1], map);
            }

        }
        await getLayers(response, map, meteo);
    }

    return [circles, circleText];
}


