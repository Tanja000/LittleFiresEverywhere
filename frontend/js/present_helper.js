

export function parseTime(text){
    const index = text.indexOf('Time');
    if (index !== -1) {
        return text.substring(index + 6, index + 15);
    }
    return null;
}


export function getStartAndEndDate(){
    const day = new Date();
    const today = new Date(day);
    today.setDate(today.getDate());
    const dayBeforeYesterday = new Date(day);
    dayBeforeYesterday.setDate(day.getDate() - 2);
    const formattedToday = formatDate(today);
    const formattedDayBeforeYesterday = formatDate(dayBeforeYesterday);
    console.log(formattedDayBeforeYesterday + " - " + formattedToday);
    return [formattedDayBeforeYesterday, formattedToday];
}

export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


export function parseDate(text){
    const index = text.indexOf('Date Acquired');
    if (index !== -1) {
        return text.substring(index + 16, index + 26);
    }
    return null;
}

export function parseConfidence(text){
    const index = text.indexOf('Confidence');
    if (index !== -1) {
        return parseInt(text.substring(index + 21, index + 23));
    }
    return null;
}

export function parseCoordinates(text) {
  const parts = text.split(',');

  if (parts.length !== 2) {
    console.error("Der Text enthält nicht genau ein Komma.");
    return null;
  }

  const firstHalf = parseFloat(parts[0], 10);
  const secondHalf = parseFloat(parts[1], 10);

  if (isNaN(firstHalf) || isNaN(secondHalf)) {
    console.error("Ungültige Zahlen gefunden.");
    return null;
  }

  return {latitude: firstHalf, longitude: secondHalf};
}


export async function fetchKMLContent(kmlUrl) {
  const response = await fetch(kmlUrl);
  if (!response.ok) {
    throw new Error('Fehler beim Laden der KML-Datei');
  }

  const kmlContent = await response.text();
  return kmlContent;
}

export async function fetchEffiKMLContent(kmlUrl) {
  const response = await fetch(kmlUrl);
  if (!response.ok) {
    throw new Error('Fehler beim Laden der KML-Datei');
  }

  const kmlContent = await response.text();
  return kmlContent;
}


export function getRectangleData(confidenceThreshhold, confidence, parsedValues, dateAquired, time, count, parsedCoordinates){
    if(confidence >= confidenceThreshhold) {
        let rectangleValues = parsedValues;
        rectangleValues["confidence"] = confidence;
        rectangleValues["dateAquired"] = dateAquired;
        rectangleValues["time"] = time;
        parsedCoordinates[count] = rectangleValues;
    }
    return parsedCoordinates
}


export function parseCDATA(data){
    const substringToRemove1 = "To subscribe to fire email alerts, visit <a href='https://earthdata.nasa.gov/data/nrt-data/firms/email-alerts'>https://earthdata.nasa.gov/data/nrt-data/firms/email-alerts/</a> <br><br>&bull; <a href='https://earthdata.nasa.gov/data/nrt-data/disclaimer'>FIRMS Disclaimer</a><br><br>";
    const substringToRemove2 = " and <a href=\"https://earthdata.nasa.gov/faq/firms-faq\">https://earthdata.nasa.gov/faq/firms-faq </a>";
    const replaceSubstring = "href='https://earthdata.nasa.gov/data/nrt-data/firms'";
    if (data.includes(replaceSubstring)) {
        data = data.replace(replaceSubstring, replaceSubstring + " target='_blank'");
    }
    if (data.includes(substringToRemove1)) {
        data = data.replace(substringToRemove1, "");
    }
    if (data.includes(substringToRemove2)) {
        data = data.replace(substringToRemove2, "");
    }
    return data;
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