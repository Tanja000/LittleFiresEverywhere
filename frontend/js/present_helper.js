export let dates = [];




export function getRectangleData(confidenceThreshhold, coordinate, confidence, date, time, count, parsedCoordinates, bounds){
    if(confidence >= confidenceThreshhold) {
        if (bounds.contains(L.latLng(coordinate))) {
            let rectangleValues = {};
            rectangleValues["latitude"] = coordinate[1];
            rectangleValues["longitude"] = coordinate[0];
            rectangleValues["confidence"] = confidence;
            rectangleValues["dateAquired"] = date;
            rectangleValues["time"] = time;
            parsedCoordinates[count] = rectangleValues;
        }
    }
    return parsedCoordinates
}


export const responseDataManual = {
    "coordinates": {
        "0": {
            "13": {
                "latitude": 11.53568,
                "longitude": 53.13425,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "15": {
                "latitude": 11.52163,
                "longitude": 53.13094,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "17": {
                "latitude": 11.50772,
                "longitude": 53.12818,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "19": {
                "latitude": 11.49581,
                "longitude": 53.12446,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "21": {
                "latitude": 11.48492,
                "longitude": 53.11997,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "23": {
                "latitude": 11.47372,
                "longitude": 53.11439,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "25": {
                "latitude": 11.46117,
                "longitude": 53.10786,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "27": {
                "latitude": 11.44829,
                "longitude": 53.10028,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "29": {
                "latitude": 11.43391,
                "longitude": 53.09146,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "31": {
                "latitude": 11.41963,
                "longitude": 53.082,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "33": {
                "latitude": 11.40506,
                "longitude": 53.07342,
                "dateAquired": "2023-08-23",
                "startTime": 13
            },
            "35": {
                "latitude": 11.38992,
                "longitude": 53.06622,
                "dateAquired": "2023-08-23",
                "startTime": 13
            }
        },
        "8": {
            "9": {
                "latitude": 10.37008,
                "longitude": 57.29477,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "11": {
                "latitude": 10.36218,
                "longitude": 57.28486,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "13": {
                "latitude": 10.35555,
                "longitude": 57.27559,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "15": {
                "latitude": 10.34833,
                "longitude": 57.26772,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "17": {
                "latitude": 10.34007,
                "longitude": 57.26068,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "19": {
                "latitude": 10.33084,
                "longitude": 57.25411,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "21": {
                "latitude": 10.3202,
                "longitude": 57.24735,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "23": {
                "latitude": 10.30895,
                "longitude": 57.24101,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "25": {
                "latitude": 10.29845,
                "longitude": 57.2351,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "27": {
                "latitude": 10.28792,
                "longitude": 57.22788,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "29": {
                "latitude": 10.27784,
                "longitude": 57.21958,
                "dateAquired": "2023-08-24",
                "startTime": 9
            },
            "31": {
                "latitude": 10.26844,
                "longitude": 57.21184,
                "dateAquired": "2023-08-24",
                "startTime": 9
            }
        }
    },
    "meteo_data": {
        "0": {
            "windspeed": 51.2,
            "relativehumidity": 89,
            "evapotranspiration": 0.23,
            "rain": 0,
            "soil_temperature_0cm": 26.8,
            "soil_moisture_0_1cm": 0,
            "temperature_2m": 26.9
        },
        "8": {
            "windspeed": 40.5,
            "relativehumidity": 88,
            "evapotranspiration": 0.16,
            "rain": 0,
            "soil_temperature_0cm": 26.9,
            "soil_moisture_0_1cm": 0,
            "temperature_2m": 27.5
        }
    }
};


function validateGeoJSON(geoJSON) {

  if (!geoJSON) {
    return 'GeoJSON-Objekt fehlt.';
  }

  if (geoJSON.type !== 'FeatureCollection') {
    return 'Das GeoJSON-Objekt muss vom Typ "FeatureCollection" sein.';
  }

  if (!Array.isArray(geoJSON.features)) {
    return 'Das GeoJSON-Objekt muss ein Array von Features enthalten.';
  }

  for (const feature of geoJSON.features) {
    if (feature.type !== 'Feature') {
      return 'Jedes Feature im GeoJSON muss vom Typ "Feature" sein.';
    }

    if (!feature.geometry) {
      return 'Jedes Feature im GeoJSON muss eine "geometry"-Eigenschaft haben.';
    }

    if (!feature.properties) {
      return 'Jedes Feature im GeoJSON muss eine "properties"-Eigenschaft haben.';
    }
  }

  return 'Das GeoJSON-Objekt ist gültig.';
}

export function extract24Hours(timeSeries7days){
    var filteredFeatures = {
      "type": "FeatureCollection",
      "features": []
    };

    for (var i = 0; i < timeSeries7days.features.length; i++) {
      var feature = timeSeries7days.features[i];

      if (feature.properties.date === dates[8] || feature.properties.date === dates[7] || feature.properties.date === dates[6]) {
        filteredFeatures.features.push(feature);
      }
    }
    return filteredFeatures;
}


export function convertCSVTextToGeoJSONTimeDimension(csvText){
    let geoJSON = {type: 'FeatureCollection', features: []};
    let lines = csvText.trim().split('\n');
    //lines = lines.slice(0, 1000);
    const headers = lines[0].split(',');
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
            const latitude = parseFloat(values[1]);
            const longitude = parseFloat(values[0]);

            if (!isNaN(latitude) && !isNaN(longitude)) {
                const properties = {
                    date: values[2],
                    time: values[2] + "T" + values[3].substring(0,2) + ":" + values[3].substring(2,4) + ":00",
                    confidence: values[4],
                };

                if (dates.indexOf(values[2]) === -1){
                    dates.push(values[2]);
                }

                const geometry = {
                    type: 'Point',
                    coordinates: [latitude, longitude],
                };
                geoJSON.features.push({
                    type: 'Feature',
                    properties: properties,
                    geometry: geometry,
                });
            }
        }
    }
    return geoJSON;
}


export function pointToLayer(feature, latlng) {
  return L.circleMarker(latlng, {
    radius: 5,
    color: 'red',
    fillColor: 'red',
    fillOpacity: 0.5,
    opacity: 1,
  });
}
