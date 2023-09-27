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
    color: '#cc1414',
    fillColor: '#cc1414',
    fillOpacity: 0.5,
    opacity: 1,
  });
}
