from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import urllib.request
import json
from pydantic import BaseModel
import math
from datetime import datetime, timedelta
import time
import schedule
from deta import Deta
import pandas as pd
from io import StringIO
import numpy as np


####################
#chane for deployment
origins = [
    # Tanja TODO: local host später löschen!!!
    "http://127.0.0.1:4201",
    "https://wildfires-1-f7510945.deta.app"
]
###############################
api_url = "https://api.open-meteo.com/v1/forecast"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

drive_key = "a0g5kqh4m4i_VHKDKLqgj7m4Kpep1VTPer3Z3BpGtBwd"
deta_drive = Deta(drive_key)
deta_file = deta_drive.Drive("modis_fire")
filename = 'MODIS_C6_1_Global_7d.csv'

db_key = "a0ztxrhcebt_SXs1sEfGTSosQzSyLLQdF9D6EZra8EUi"
deta = Deta(db_key)
modis_table_7d = deta.Base("ModisData")

drive = False

class ActionPayload(BaseModel):
    action: str
    value: int
    url: str


def getModisCSV7days():
    # latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, confidence, version, bright_t31, frp, daynight
    url = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_7d.csv'
    spalten_zu_behalten = ['latitude', 'longitude', 'acq_date', 'acq_time', 'confidence']
    #local_file = 'data/MODIS_C6_1_Global_7d.csv'

    try:
        df = pd.read_csv(url, usecols=spalten_zu_behalten, encoding='utf-8')
        #df_csv = df.to_csv(local_file, index=False, encoding="utf-8")
        #df = pd.read_csv(local_file)
        df['acq_time'] = df['acq_time'].astype(str).str.rjust(4, '0')
        numpy_array = df.to_numpy()
        numpy_array = np.vstack([spalten_zu_behalten, numpy_array])
        csv_text = StringIO()
        np.savetxt(csv_text, numpy_array, delimiter=',', fmt='%s')
        csv_string = csv_text.getvalue()

        if drive:
            deta_file.put(filename, csv_string)
            print(f'Die Datei wurde erfolgreich im deta drive gespeichert.')

        else:
            dict_send = df.to_dict('records')
            #takes to long and removing all items befor new data is not possible/impractical!
           # for item in dict_send:
           #     print(item)
           #     modis_table_7d.put(item)

    except Exception as e:
        print(f'Fehler beim Speichern der HTML-Seite: {e}')


def getModisCSV24h():
    url = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_24h.csv"
    #dateiname = "../frontend/public/data/MODIS_C6_1_Global_24h.csv";
    try:
        response = urllib.request.urlopen(url)
        html = response.read().decode('utf-8')
        deta_file.put(filename, html)
       # with open(dateiname, 'w', encoding='utf-8') as datei:
       #     datei.write(html)
        print(f'Die HTML-Seite wurde erfolgreich im deta drive gespeichert.')
    except Exception as e:
        print(f'Fehler beim Speichern der HTML-Seite: {e}')


# https://open-meteo.com/ resolution 1km:
# coordinates estimated in center of cell. if a new coordinate is closer than 500m to the previous -> take previous data
def haversine_distance(lat1, lon1, lat2, lon2):
    # Radius of the Earth in meters
    R = 6371000  # in meters

    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Calculate differences in coordinates
    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad

    # Haversine formula
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # Calculate distance
    distance = R * c
    return distance


def calculate_new_coordinates(lat, lon, meteo_data):
    speed_kmh = meteo_data['windspeed']
    direction_degrees = meteo_data['winddirection']
    relativehumidity = meteo_data['relativehumidity']
    evapotranspiration = meteo_data['evapotranspiration']
    rain = meteo_data['rain']
    soil_temperature = meteo_data['soil_temperature_0cm']
    soil_moisture = meteo_data['soil_moisture_0_1cm']
    temperature_2m = meteo_data['temperature_2m']

    # evapotranspiration: hohe werte -> Verringerung des Feuchtigkeitsgehalts im Boden

    R = 6371000  # Durchschnittlicher Erdradius in Metern
    direction_rad = math.radians(direction_degrees - 180)
    # pro 2 Stunden berechnet km/h -> km/2h
    distance_m = speed_kmh * 2 * 1000  # Distanz = Geschwindigkeit * Zeit / in Meter umgerechenet
    distance_m = distance_m * 0.5 #Annahme: Feuer breitet sich nicht mit Windgeschwindigkeit aus
    if rain > 2:
        distance_m = 0

    else:
        slow_down_factor = soil_moisture + relativehumidity
        speed_factor = evapotranspiration
        temp_factor = temperature_2m / 40 + soil_temperature / 40
        factor = (1 + speed_factor) / slow_down_factor
        distance_m = distance_m * factor * temp_factor

    # Neue Koordinaten berechnen
    new_lat = round(math.degrees(math.asin(math.sin(math.radians(lat)) * math.cos(distance_m / R) +
                                           math.cos(math.radians(lat)) * math.sin(distance_m / R) * math.cos(
        direction_rad))), 5)

    new_lon = round(
        lon + math.degrees(math.atan2(math.sin(direction_rad) * math.sin(distance_m / R) * math.cos(math.radians(lat)),
                                      math.cos(distance_m / R) - math.sin(math.radians(lat)) * math.sin(
                                          math.radians(new_lat)))), 5)

    return new_lat, new_lon


def add_days(date_str, no_days):
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    new_date_obj = date_obj + timedelta(days=no_days)
    new_date_str = new_date_obj.strftime('%Y-%m-%d')
    return new_date_str


def get_meteo_data(lat, lng, date, hour_no):
    # windspeed in km/h
    # winddirection in degrees
    # evapotranspiration Preceding hour sum in mm
    # relativehumidity_2m %
    # soil_temperature_0cm in °C
    # soil_moisture_0_1cm m³/m³
    # windgusts_10m km/h
    # rain mm
    # hourly=temperature_2m °C


    date_start = date
    date_end = add_days(date, 2)
    url_windspeed = "https://api.open-meteo.com/v1/forecast?latitude=" + str(lat) + "&longitude=" + str(
        lng) + "&start_date=" + date_start + \
                    "&end_date=" + date_end + "&hourly=windspeed_10m&hourly=winddirection_10m&hourly=relativehumidity_2m&hourly=temperature_2m" \
                                              "&hourly=evapotranspiration&hourly=rain&hourly=soil_temperature_0cm&hourly=soil_moisture_0_1cm"

    #print(url_windspeed)
    #print(str(lat))
    #print(str(lng))

    try:
        response = urllib.request.urlopen(url_windspeed).read()
        response = json.loads(response)
        data_dict = {}

        data_dict['windspeed'] = response["hourly"]["windspeed_10m"][hour_no]
        data_dict['winddirection'] = response["hourly"]["winddirection_10m"][hour_no]
        data_dict['relativehumidity'] = response["hourly"]["relativehumidity_2m"][hour_no]
        data_dict['evapotranspiration'] = response["hourly"]["evapotranspiration"][hour_no]
        data_dict['rain'] = response["hourly"]["rain"][hour_no]
        data_dict['soil_temperature_0cm'] = response["hourly"]["soil_temperature_0cm"][hour_no]
        data_dict['soil_moisture_0_1cm'] = response["hourly"]["soil_moisture_0_1cm"][hour_no]
        data_dict['temperature_2m'] = response["hourly"]["temperature_2m"][hour_no]
        return data_dict
    except urllib.error.URLError as e:
        print("Fehler beim Öffnen der URL:", e)
        return {}
    except Exception as ex:
        print("Ein unerwarteter Fehler ist aufgetreten:", ex)
        return {}



def round_to_next_hour(time_str):
    from datetime import datetime, timedelta
    time_str = time_str.replace(" UTC", "")
    time_str = time_str[time_str.index("T")+1:len(time_str)-3]

    time_obj = datetime.strptime(time_str, '%H:%M')

    if time_obj.minute >= 30:
        rounded_time_obj = time_obj.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    else:
        rounded_time_obj = time_obj.replace(minute=0, second=0, microsecond=0)

    rounded_hour = rounded_time_obj.hour
    return rounded_hour


def get_new_coordinate(lat, lng, date, time_str):
    day = {}
    meteo = {}
    wind_speed_max = 0
    relativehumidity_max = 0
    evapotranspiration_max = 0
    soil_temperature_max = 0
    soil_moisture_max = 0
    temperature_max = 0
    rain_max = 0

    time = round_to_next_hour(time_str)
    noNewValues = False
    meteo_data_hour = {}
    meteo_data = {}
    hour_counter = 0
    for hour_no in range(time, time + 23, 2):
        if not noNewValues:
            meteo_data_hour[hour_no] = get_meteo_data(lat, lng, date, hour_no)
            if not meteo_data_hour[hour_no]:
                return day, meteo_data_hour
            meteo_data = meteo_data_hour[hour_no]
        else:
            meteo_data_hour[hour_no] = meteo_data_hour[hour_no - 2]
            if not meteo_data_hour[hour_no]:
                return day, meteo_data_hour
        new_lat, new_lng = calculate_new_coordinates(lat, lng, meteo_data)
        distance = haversine_distance(lat, lng, new_lat, new_lng)
        lat = new_lat
        lng = new_lng
        new_coord = {"latitude": new_lat, "longitude": new_lng, "dateAquired": date, "startTime": time}
        day[hour_no] = new_coord
        if distance <= 500 and hour_counter == 0:
            noNewValues = True
            hour_counter += 1
        else:
            noNewValues = False
            hour_counter = 0

    return day, meteo_data_hour


@app.post("/process_data1")
async def receive_data(coordinates: dict):
    if not coordinates:
        return {}
    print("starting processing data")
    response_dict = {}
    meteo_dict = {}
    for key, value in coordinates.items():
        latitude = value["latitude"]
        longitude = value["longitude"]
        date = value["dateAquired"]
        time = value["time"]
        # confidence = value["confidence"]
        response_coordinates, meteo = get_new_coordinate(longitude, latitude, date, time)
        meteo_dict[key] = meteo
        response_dict[key] = response_coordinates
    return {"coordinates": response_dict, "meteo_data": meteo_dict}

@app.post("/process_data2")
async def receive_data(coordinates: dict):
    if not coordinates:
        return {}
    print("starting processing data")
    response_dict = {}
    meteo_dict = {}
    for key, value in coordinates.items():
        latitude = value["latitude"]
        longitude = value["longitude"]
        date = value["dateAquired"]
        time = value["time"]
        # confidence = value["confidence"]
        response_coordinates, meteo = get_new_coordinate(longitude, latitude, date, time)
        meteo_dict[key] = meteo
        response_dict[key] = response_coordinates
    return {"coordinates": response_dict, "meteo_data": meteo_dict}

@app.post("/process_data3")
async def receive_data(coordinates: dict):
    if not coordinates:
        return {}
    print("starting processing data")
    response_dict = {}
    meteo_dict = {}
    for key, value in coordinates.items():
        latitude = value["latitude"]
        longitude = value["longitude"]
        date = value["dateAquired"]
        time = value["time"]
        # confidence = value["confidence"]
        response_coordinates, meteo = get_new_coordinate(longitude, latitude, date, time)
        meteo_dict[key] = meteo
        response_dict[key] = response_coordinates
    return {"coordinates": response_dict, "meteo_data": meteo_dict}

@app.post("/process_data4")
async def receive_data(coordinates: dict):
    if not coordinates:
        return {}
    print("starting processing data")
    response_dict = {}
    meteo_dict = {}
    for key, value in coordinates.items():
        latitude = value["latitude"]
        longitude = value["longitude"]
        date = value["dateAquired"]
        time = value["time"]
        # confidence = value["confidence"]
        response_coordinates, meteo = get_new_coordinate(longitude, latitude, date, time)
        meteo_dict[key] = meteo
        response_dict[key] = response_coordinates
    return {"coordinates": response_dict, "meteo_data": meteo_dict}


# Download alle 3 Stunden planen
#getModisCSV24h()
#getModisCSV7days()
#schedule.every(3).hours.do(getModisCSV24h)
#schedule.every(3).hours.do(getModisCSV7days)

if __name__ == '__main__':
    app.run(debug=True)
    while True:
        schedule.run_pending()
        time.sleep(1)