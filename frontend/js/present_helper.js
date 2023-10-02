export let dates = [];
export let burningAreasPolygons = [];




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

    let filteredFeatures = {
        "type": "FeatureCollection",
        "features": []
    };

    for (let i = 0; i < timeSeries7days.features.length; i++) {
        const feature = timeSeries7days.features[i];
        //show only fires with confidence over 50
        if(parseInt(feature.properties.confidence) >= 50) {
            if (feature.properties.date === dates[8] || feature.properties.date === dates[7] || feature.properties.date === dates[6]) {
                filteredFeatures.features.push(feature);
            }
        }
    }

    //select largest areas
  /*  filteredFeatures.features.forEach(function(feature) {
        const coordinate = feature.geometry.coordinates;
        const confidence = feature.properties.confidence;
        if(confidence >= 80) {
            coordinatesAll.push([coordinate, confidence]);
        }
    });
    const turfPoints = coordinatesAll.map(function (coordinate) {
        const turfP = turf.point(coordinate[0]);
        turfP.properties.confidence = coordinate[1];
        return turfP;
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

    for (let [key, value] of Object.entries(featureGroups)) {
        let polyCoordinates1 = [];
        let polyCoordinates2 = [];
        if (Object.keys(value).length >= 20) {
            let noOfFires = 0;
            let averageConfidence = 0;
            for (let [key1, value1] of Object.entries(value)) {
                polyCoordinates1.push([value1.geometry.coordinates[0], value1.geometry.coordinates[1]]);
                noOfFires += 1;
                averageConfidence += parseInt(value1.properties.confidence);
            }
            averageConfidence = averageConfidence / noOfFires;
            pointsInGroups.push([polyCoordinates1, averageConfidence, noOfFires]);
        }
        if (Object.keys(value).length >= 5) {
            let turfPoints = [];
            for (let [key1, value1] of Object.entries(value)) {
                polyCoordinates2.push([value1.geometry.coordinates[0], value1.geometry.coordinates[1]]);
            }
            for (const coord of polyCoordinates2){
                const newTurfPoint = turf.point(coord);
                turfPoints.push(newTurfPoint);
            }
            const points = turf.featureCollection(turfPoints);
            const boundingPolygon = turf.convex(points);
            const bufferedPolygon = turf.buffer(boundingPolygon, 100, { units: 'meters' });
            burningAreasPolygons.push(bufferedPolygon);
        }
    }

    console.log(pointsInGroups);*/

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
