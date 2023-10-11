from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import urllib.request
import json
from pydantic import BaseModel
import math
from datetime import datetime, timedelta
from deta import Deta
import pandas as pd
from io import StringIO
import numpy as np
import requests
import sys
import pyproj
from pyproj import Transformer, CRS
from osgeo import gdal, osr

####################


ndvi_from_API = True
save_modis_to_drive = True

###############################
api_url = "https://api.open-meteo.com/v1/forecast"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# #Middleware hook to check allowed origins
# @app.middleware("http")
# async def check_allowed_origin(request: Request, call_next):
#    allowed_origin_prefix = "https://wildfires-"
#    origin = request.headers.get("Origin")
#    # change for deployment
#    #TODO: delete last orign for final release
#   # if origin and ((origin.startswith('https://wildfires') and origin.endswith('.deta.app')) or origin.endswith(('1:4201'))):
#    if origin and origin.startswith('https://wildfires') and origin.endswith('.deta.app'):
#        response = await call_next(request)
#        response.headers["Access-Control-Allow-Origin"] = origin
#        return response
#    else:
#        return {"Origin not allowed"}

drive_key = "a0g5kqh4m4i_VHKDKLqgj7m4Kpep1VTPer3Z3BpGtBwd"
deta_drive = Deta(drive_key)
deta_file = deta_drive.Drive("modis_fire")
filename = 'MODIS_C6_1_Global_7d.csv'

db_key = "a0ztxrhcebt_SXs1sEfGTSosQzSyLLQdF9D6EZra8EUi"
deta = Deta(db_key)
modis_table_7d = deta.Base("ModisData")


class ActionPayload(BaseModel):
    action: str
    value: int
    url: str


# je näher der index bei 1 umso gesunder und dichter ist die vegetation
# ein index < 0 ist wasser
# ein index um 0 herum -> keine vegetation
# Achtung Unterscheidung Grasland und Wald! Wald dürfte höheren Index haben aber Feuer breitet sich am besten in Graslandschaft aus
# evtl. 0.3 - 0.7 gras
# 0.7 - 1 wald
def calculate_ndvi(nir_band, red_band):
    # Berechnung des NDVI
    ndvi = (nir_band - red_band) / (nir_band + red_band)
    return round(ndvi, 4)


# Offset any lat long by x, y meters
def lat_long_offset(lat, lon, x, y):
    '''
    lat, lon : Provide lat lon coordinates
    x, y : Provide offset of x and y on lat and long respectively
           This needs to be in meters!

    The approximation is taken from an aviation formula from this stack exchange
    https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
    '''

    # Earth’s radius, sphere
    R = 6378137

    # Coordinate offsets in radians
    dLat = x / R
    dLon = y / (R * np.cos(np.pi * lat / 180))

    # OffsetPosition, decimal degrees
    latO = lat + dLat * 180 / np.pi
    lonO = lon + dLon * 180 / np.pi

    return latO, lonO


# Create offset_grid and return coordinates
def get_mesh(lat, lon, dist, coors, value_list):
    #if lat < 0:
    #    lat += 90
    #    minus90 = True
    # calculate min and max range for coordinates over an axis
    mini, maxi = -dist * coors, dist * coors

    # calculate number of points over an axis
    n_coord = coors * 2 + 1

    # create an axis from min to max value with required number of coordinates
    axis = np.linspace(mini, maxi, n_coord)

    # create an "offset_grid" for X and Y values for both axis.
    X, Y = np.meshgrid(axis, axis)

    # calcualte offset coordinates for "offset_grid" in meters
    lat_long_offset_vec = np.vectorize(lat_long_offset)

    mesh = lat_long_offset_vec(lat, lon, X, Y)

    # Transpose to get the (x,y) values for the offset_grid's shape
    poly_list = []
    mesh_x_y_format = np.stack(mesh).transpose(1, 2, 0)

    count = 0
    for item in mesh_x_y_format:
        for it in item:
            poly_dict = {}
            poly_dict['ndvi'] = value_list[count]
            poly_dict['coordinates'] = [it.tolist()]
            poly_list.append(poly_dict)
            count += 1

    return poly_list


def ndviDataToDCoordinatesDict(ndvi_list, lat_center, lng_center):
    # Tanja TODO: ab und zu checken ob schon neueres Datum!
    # Aktuell:2023-08-29
    # cellsize": 231.656358264  in Meters! Is it for one cell ? or 81 cells?
    # 9x9 - 81
    # var middleCell = data[4][4] => value for latitude, longitude
    # polygon 1 = point

    print("calculate new edge coordinates")
    cell_size = 231.656358264/2

    ndvi_matrix = get_mesh(lat_center, lng_center, cell_size, 4, ndvi_list)

    return ndvi_matrix


""""
# Funktion zur Umrechnung von xllcorner und yllcorner in Latitude und Longitude
def umrechnungXYinLatLon(xllcorner, yllcorner, cellsize):
    # Definition des Spatial Reference Systems (SRS) für MODIS Sinusoidal Projection
    modis_srs = osr.SpatialReference()
    modis_srs.ImportFromProj4(
        "+proj=sinu +R=6371007.181 +nadgrids=@null +wktext")

    # Definition des Ziel-SRS für Breitengrad und Längengrad (WGS84)
    latlon_srs = osr.SpatialReference()
    latlon_srs.ImportFromEPSG(4326)  # EPSG-Code für WGS84

    # Erstellen einer Transformation von MODIS Sinusoidal Projection zu WGS84
    transform = osr.CoordinateTransformation(modis_srs, latlon_srs)

    # Umrechnung der xllcorner und yllcorner in Latitude und Longitude
    x, y = float(xllcorner), float(yllcorner)
    x += cellsize / 2  # Anpassung an die Zellmitte (optional)

    delta = cellsize / 2
    # Transformation der Koordinaten
    longitude, latitude, _ = transform.TransformPoint(x - delta, y + delta)
    nordwest = [longitude, latitude]
    longitude, latitude, _ = transform.TransformPoint(x + delta, y - delta)
    suedost = [longitude, latitude]

    return [nordwest, suedost]


# Funktion zur Berechnung der Eckpunkte eines Quadrats um eine gegebene Koordinate
def berechneQuadratEckpunkte(lat, lon, zellGroesseInMetern):

    lat_ = lat
    lon_ = lon
   # if lat > 90:
   #     lat_ = lat - 90


    print(lat, lon)


    eingangs_proj = pyproj.Proj("epsg:4326")
    ausgang_proj = pyproj.Proj("+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs")
    #ausgang_proj = pyproj.Proj(init='epsg:32633')
    #"+proj=sinu +R=6371007.181 +nadgrids=@null +wktext"
    #ausgang_proj = pyproj.Proj("+proj=sinu +lat_0={} +lon_0={} +ellps=WGS84 +datum=WGS84 +units=m".format(lat_, lon_))
    #ausgang_proj = pyproj.Proj("+proj=stere +lat_0={} +lon_0={} +ellps=WGS84 +datum=WGS84 +units=m +no_defs".format(lat_, lon_))
   # ausgang_proj = pyproj.Proj("+proj=sinu +R=6371007.181 +nadgrids=@null +wktext +lon_0={} +x_0=0  +lon_0={} +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs".format(lat_, lon_))

    x, y = pyproj.transform(eingangs_proj, ausgang_proj, lon_, lat_)

   # print(x, y)

    delta = zellGroesseInMetern / 2

    nordwest = list(pyproj.transform(ausgang_proj, eingangs_proj, x - delta, y + delta))
    suedost = list(pyproj.transform(ausgang_proj, eingangs_proj, x + delta, y - delta))


    #print(lon1, lat1)
    #nordwest = list(pyproj.transform(crs_proj, crs_4326, x - delta, y + delta))
    #suedost = list(pyproj.transform(crs_proj, crs_4326, x + delta, y - delta))

  #  if lat > 90:
 #       nordwest[1] += 90
  #      suedost[1] += 90

    return [nordwest, suedost]

"""


# werte mit faktoren aus wetterdaten neu berechnen und in 5 farben einteilen
# dictionary für leaflte
# neues gewichtetes zentrum für neue wetterkoordinate berechnen
def getNVIDataModis():
    cell_size = 231.656358264
    # read NDVI Data from file
    dateiname = "./../frontend/public/data/modis_ndvi_response.geojson"
    df = pd.read_json(dateiname)
    nir_data = df['subset'][2]['data']
    red_data = df['subset'][4]['data']

    print("ndvi for testing")

    ndvi_data = []
    for nir_band, red_band in zip(nir_data, red_data):
        ndvi_band = calculate_ndvi(nir_band, red_band)
        ndvi_data.append(ndvi_band)

    lat_center = 15.2179524
    lng_center = 38.79284

    ndvi_list = ndviDataToDCoordinatesDict(ndvi_data, lat_center, lng_center)

    return ndvi_list


def transform_coordinates(latitude, longitude):
    # Begrenze die Breitengradwerte auf den Bereich von -90 bis 90
    latitude = max(min(latitude, 90.0), -90.0)

    # Begrenze die Längengradwerte auf den Bereich von -180 bis 180
    longitude = max(min(longitude, 180.0), -180.0)

    return [latitude, longitude]


def getNewNDVIDateAPI(latitude, longitude):
    print("start new date")
    header = {'Accept': 'application/json'}
    url_date = "https://modis.ornl.gov/rst/api/v1/MOD13Q1/dates?latitude=" + str(latitude) + "&longitude=" + str(
        longitude)
    try:
        response = requests.get(url_date, header)
        if response.status_code == 200:
            data = response.json()
            newest_date = data['dates'].pop()['modis_date']
            calendar_date = data['dates'].pop()['calendar_date']
            d = {'date_string': [newest_date], 'date': [calendar_date]}
            df = pd.DataFrame.from_dict(d)
            file_date = "../frontend/public/data/modis_ndvi_date.csv"
            df.to_csv(file_date, index=False)
    except Exception as ex:
        print("Ein unerwarteter Fehler ist aufgetreten:", ex)


def getNDVIDataModisAPI(latitude, longitude):
    # cellsize": 231.656358264 meters
    cell_size = 231.656358264
    header = {'Accept': 'application/json'}

    # file_date = "../frontend/public/data/modis_ndvi_date.csv"
    # df_date = pd.read_csv(file_date)
    # newest_date = df_date.iloc[0].tolist()[0]
    # ndvi_date = df_date.iloc[0].tolist()[1]

    newest_date = "A2023241"
    url = "https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?latitude=" + str(longitude) + "&longitude=" + str(
        latitude) + "&startDate=" + newest_date + "&endDate=" + newest_date + "&kmAboveBelow=1&kmLeftRight=1"

    try:
        response = requests.get(url, header)
        # response = urllib.request.urlopen(url).read()
        if response.status_code == 200:
            data = response.json()
            nir_data = data['subset'][2]['data']
            red_data = data['subset'][4]['data']

            ndvi_data = []
            for nir_band, red_band in zip(nir_data, red_data):
                ndvi_band = calculate_ndvi(nir_band, red_band)
                ndvi_data.append(ndvi_band)

            ndvi_list = ndviDataToDCoordinatesDict(ndvi_data, latitude, longitude)
            return ndvi_list

        else:
            print("Fehler beim Abrufen der Daten. Statuscode:", response.status_code)


    except Exception as ex:
        print("Ein unerwarteter Fehler ist aufgetreten:", ex)


def getModisCSV7days():
    print("start collection new modis data")
    # latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, confidence, version, bright_t31, frp, daynight
    url = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_7d.csv'
    spalten_zu_behalten = ['latitude', 'longitude', 'acq_date', 'acq_time', 'confidence']
    # local_file = 'data/MODIS_C6_1_Global_7d.csv'

    try:
        df = pd.read_csv(url, usecols=spalten_zu_behalten, encoding='utf-8')
        # df_csv = df.to_csv(local_file, index=False, encoding="utf-8")
        # df = pd.read_csv(local_file)
        # keep only values with confidence over 50
        df = df[df['confidence'] > 50]
        df['acq_time'] = df['acq_time'].astype(str).str.rjust(4, '0')
        numpy_array = df.to_numpy()
        numpy_array = np.vstack([spalten_zu_behalten, numpy_array])
        csv_text = StringIO()
        np.savetxt(csv_text, numpy_array, delimiter=',', fmt='%s')
        csv_string = csv_text.getvalue()

        if save_modis_to_drive:
            deta_file.put(filename, csv_string)
            print(f'Die Datei wurde erfolgreich im deta drive gespeichert.')

        else:
            dict_send = df.to_dict('records')
            # takes to long and removing all items befor new data is not possible/impractical!
        # for item in dict_send:
        #     print(item)
        #     modis_table_7d.put(item)

    except Exception as e:
        print(f'Fehler beim Speichern der HTML-Seite: {e}')


def getModisCSV24h():
    url = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_24h.csv"
    # dateiname = "../frontend/public/data/MODIS_C6_1_Global_24h.csv";
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


def calculate_new_coordinates(lat, lon, meteo_data, ndvi_value):
    speed_kmh = meteo_data['windspeed']
    direction_degrees = meteo_data['winddirection']
    relativehumidity = meteo_data['relativehumidity']
    evapotranspiration = meteo_data['evapotranspiration']
    rain = meteo_data['rain']
    soil_temperature = meteo_data['soil_temperature_0cm']
    soil_moisture = meteo_data['soil_moisture_0_1cm']
    temperature_2m = meteo_data['temperature_2m']

    ndvi_factor = 1

    # evapotranspiration: hohe werte -> Verringerung des Feuchtigkeitsgehalts im Boden

    # 500 m/h, kann aber auf über 1 Km/h ansteigen
    R = 6371000  # Durchschnittlicher Erdradius in Metern
    direction_rad = math.radians(direction_degrees - 180)
    # pro 2 Stunden berechnet km/h -> km/2h
    distance_m = 500 + speed_kmh * 10  # Distanz = Geschwindigkeit * Zeit / in Meter umgerechenet
    # distance_m = distance_m * 0.5  # Annahme: Feuer breitet sich nicht mit Windgeschwindigkeit aus

    if rain > 2 or ndvi_value == None:
        distance_m = 0
        ndvi_factor = 1
    else:
        if ndvi_value < 0.05:
            return lat, lon, ndvi_value
        else:
            if 0.3 > ndvi_value >= 0.05:
                ndvi_factor = 0.5
            elif 0.7 > ndvi_value >= 0.3:
                ndvi_factor = 1.75
            elif 1 > ndvi_value >= 0.7:
                ndvi_factor = 1.25

        slow_down_factor = soil_moisture + relativehumidity
        speed_factor = evapotranspiration
        temp_factor = temperature_2m / 40 + soil_temperature / 40
        factor = (1 + speed_factor) / slow_down_factor
        distance_m = 500 + distance_m * factor * temp_factor * ndvi_factor

    # Neue Koordinaten berechnen
    new_lat = round(math.degrees(math.asin(math.sin(math.radians(lat)) * math.cos(distance_m / R) +
                                           math.cos(math.radians(lat)) * math.sin(distance_m / R) * math.cos(
        direction_rad))), 5)

    new_lon = round(
        lon + math.degrees(math.atan2(math.sin(direction_rad) * math.sin(distance_m / R) * math.cos(math.radians(lat)),
                                      math.cos(distance_m / R) - math.sin(math.radians(lat)) * math.sin(
                                          math.radians(new_lat)))), 5)

    return new_lat, new_lon, ndvi_value


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

    # print(url_windspeed)
    # print(str(lat))
    # print(str(lng))

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
    time_str = time_str[time_str.index("T") + 1:len(time_str) - 3]

    time_obj = datetime.strptime(time_str, '%H:%M')

    if time_obj.minute >= 30:
        rounded_time_obj = time_obj.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    else:
        rounded_time_obj = time_obj.replace(minute=0, second=0, microsecond=0)

    rounded_hour = rounded_time_obj.hour
    return rounded_hour


def get_new_ndvi(lat, lng):
    if ndvi_from_API:
        ndvi = getNDVIDataModisAPI(lat, lng)
    else:
        ndvi = getNVIDataModis()
    return ndvi


def find_nearest_coordinate(data, new_coord):
    min_distance = float('inf')
    nearest_value = None

    for item in data:
       # distance = haversine_distance(item['coordinates'][0][1], item['coordinates'][0][0], new_coord[0], new_coord[1])

        distance = math.sqrt((item['coordinates'][0][1] - new_coord[0]) ** 2 + (item['coordinates'][0][0] - new_coord[1]) ** 2)
        if distance < min_distance:
            min_distance = distance
            nearest_value = item['ndvi']

            if min_distance > 300:
                return None

    return nearest_value


def get_new_coordinate(lat, lng, date, time_str, ndvi_included):
    day = {}

    time = round_to_next_hour(time_str)
    noNewValues = False
    meteo_data_hour = {}
    meteo_data = {}
    hour_counter = 0

    if ndvi_included:
        ndvi = get_new_ndvi(lng, lat)
    else:
        ndvi = None

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

        new_coord = {"latitude": lat, "longitude": lng, "dateAquired": date, "startTime": time}
        day[hour_no] = new_coord

        ndvi_value = find_nearest_coordinate(ndvi, [lat, lng])
        new_lat, new_lng, ndvi_value = calculate_new_coordinates(lat, lng, meteo_data, ndvi_value)

        meteo_data_hour[hour_no]['ndvi'] = ndvi_value
        if ndvi_value and ndvi_value < 0.05:
            return day, meteo_data_hour, ndvi

        distance = haversine_distance(lat, lng, new_lat, new_lng)
        lat = new_lat
        lng = new_lng

        if distance <= 500 and hour_counter == 0:
            noNewValues = True
            hour_counter += 1
        else:
            noNewValues = False
            hour_counter = 0

    return day, meteo_data_hour, ndvi


def get_location_info(latitude, longitude):
    url = f"https://geocode.maps.co/reverse?lat=" + str(latitude) + "&lon=" + str(longitude)
    # url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude}&lon={longitude}&zoom=18&addressdetails=1"

    try:
        response = requests.get(url)
        data = response.json()
        address = data.get("address", {})
        State = address.get("state", "")
        Country = address.get("country", "")
        return State, Country
    except Exception as e:
        print(f"Fehler beim Abrufen von Daten: {e}")
        return None, None


def get_greatest_burning_areas():
    print("start top list")
    response = deta_file.get(filename)
    df = pd.read_csv(response, usecols=['latitude', 'longitude', 'confidence', 'acq_date'])
    current_date = datetime.now().date()
    vorgestern = current_date - timedelta(days=2)
    df['acq_date'] = pd.to_datetime(df['acq_date'])
    vorgestern = pd.to_datetime(vorgestern)
    filtered_df = df[df['acq_date'] > vorgestern]
    filtered_coordinates = filtered_df[filtered_df['confidence'] > 90]

    if not filtered_coordinates.empty:
        coordinate_groups = {}
        for i, row1 in filtered_coordinates.iterrows():
            if i not in coordinate_groups:
                coordinate_groups[i] = [i]

            for j, row2 in filtered_coordinates.iterrows():
                if i != j:
                    distance = haversine_distance(row1['latitude'], row1['longitude'], row2['latitude'],
                                                  row2['longitude'])
                    if distance < 3000:
                        if j not in coordinate_groups:
                            coordinate_groups[i].append(j)
                            coordinate_groups[j] = coordinate_groups[i]
                        elif j != i:
                            group_i = coordinate_groups[i]
                            group_j = coordinate_groups[j]
                            coordinate_groups[i] = group_i + group_j
                            for coord_id in group_j:
                                coordinate_groups[coord_id] = group_i

        result_data = []
        for key, value in coordinate_groups.items():
            if value:
                num_coords = len(value)
                if num_coords >= 20:
                    first_coord = df.loc[key, ['latitude', 'longitude']].values.tolist()
                    first_date = df.loc[key, ['acq_date']].values.tolist()
                    confidence_values = df.loc[value, 'confidence'].values
                    average = confidence_values.mean()
                    result_data.append([first_coord[0], first_coord[1], num_coords, average, first_date])

        result_df = pd.DataFrame(result_data,
                                 columns=['Latitude', 'Longitude', 'NumberOfPoints', 'AverageConfidence', 'AcqDate'])
        if not result_df.empty:
            result_df['AcqDate'] = result_df['AcqDate'].astype(str)
            duplizierte_df = result_df.drop_duplicates(subset=['NumberOfPoints', 'AverageConfidence', 'AcqDate'],
                                                       keep='first')
            duplizierte_df = duplizierte_df.sort_values(by=['NumberOfPoints'], ascending=[False])
            final_df = duplizierte_df.head(200)
            final_df['State'], final_df['Country'] = zip(
                *final_df.apply(lambda row: get_location_info(row['Latitude'], row['Longitude']), axis=1))
            final_df = final_df.dropna(subset=['Country'])
            final_df = final_df.dropna(subset=['Country']).replace("", np.nan).dropna(subset=['Country'])
            final_df = final_df.dropna(subset=['State']).replace("", np.nan).dropna(subset=['State'])
            final_df = final_df.drop_duplicates(subset=['State', 'Country'], keep='first')
            final_df.to_csv('../frontend/public/data/greatestBurningAreas.csv', index=False)
        else:
            print("no data for country list")
    else:
        print("top country list: no filtered date data")
    print("end top list")


@app.post("/process_data1")
async def receive_data(data: dict):
    sys.stdout.flush()
    sys.stderr.flush()
    coordinates = data['coordinates']
    ndvi_included = data['ndvi']
    if not coordinates:
        return {}
    print("starting processing data")
    coordinates_dict = {}
    meteo_dict = {}
    ndvi_dict = {}
    for key, value in coordinates.items():
        latitude = value["latitude"]
        longitude = value["longitude"]
        date = value["dateAquired"]
        time = value["time"]
        # confidence = value["confidence"]
        coordinates, meteo, ndvi = get_new_coordinate(longitude, latitude, date, time, ndvi_included)
        if ndvi_included:
            ndvi_dict[key] = ndvi
        else:
            ndvi_dict[key] = {}
        meteo_dict[key] = meteo
        coordinates_dict[key] = coordinates
    #   if ndvi_included:
    #       lng2 = list(coordinates.values())[1]['latitude']
    #       lat2 = list(coordinates.values())[1]['longitude']
    #       ndvi = get_new_ndvi(lat2, lng2)
    #       ndvi_dict[key] = ndvi
    #   else:
    #       ndvi_dict = {}

    return {"coordinates": coordinates_dict, "meteo_data": meteo_dict, 'ndvi_data': ndvi_dict}


@app.post("/process_data2")
async def receive_data(data: dict):
    sys.stdout.flush()
    sys.stderr.flush()
    coordinates = data['coordinates']
    ndvi_included = data['ndvi']
    if not coordinates:
        return {}
    print("starting processing data")
    coordinates_dict = {}
    meteo_dict = {}
    ndvi_dict = {}
    for key, value in coordinates.items():
        latitude = value["latitude"]
        longitude = value["longitude"]
        date = value["dateAquired"]
        time = value["time"]
        # confidence = value["confidence"]
        coordinates, meteo, ndvi = get_new_coordinate(longitude, latitude, date, time, ndvi_included)
        if ndvi_included:
            ndvi_dict[key] = ndvi
        else:
            ndvi_dict[key] = {}
        meteo_dict[key] = meteo
        coordinates_dict[key] = coordinates

    return {"coordinates": coordinates_dict, "meteo_data": meteo_dict, 'ndvi_data': ndvi_dict}


@app.post("/process_data3")
async def receive_data(data: dict):
    sys.stdout.flush()
    sys.stderr.flush()
    coordinates = data['coordinates']
    ndvi_included = data['ndvi']
    if not coordinates:
        return {}
    print("starting processing data")
    coordinates_dict = {}
    meteo_dict = {}
    ndvi_dict = {}
    for key, value in coordinates.items():
        latitude = value["latitude"]
        longitude = value["longitude"]
        date = value["dateAquired"]
        time = value["time"]
        # confidence = value["confidence"]
        coordinates, meteo, ndvi = get_new_coordinate(longitude, latitude, date, time, ndvi_included)
        if ndvi_included:
            ndvi_dict[key] = ndvi
        else:
            ndvi_dict[key] = {}
        meteo_dict[key] = meteo
        coordinates_dict[key] = coordinates
    return {"coordinates": coordinates_dict, "meteo_data": meteo_dict, 'ndvi_data': ndvi_dict}


@app.post("/process_data4")
async def receive_data(data: dict):
    sys.stdout.flush()
    sys.stderr.flush()
    coordinates = data['coordinates']
    ndvi_included = data['ndvi']
    if not coordinates:
        return {}
    print("starting processing data")
    coordinates_dict = {}
    meteo_dict = {}
    ndvi_dict = {}
    for key, value in coordinates.items():
        latitude = value["latitude"]
        longitude = value["longitude"]
        date = value["dateAquired"]
        time = value["time"]
        # confidence = value["confidence"]
        coordinates, meteo, ndvi = get_new_coordinate(longitude, latitude, date, time, ndvi_included)
        if ndvi_included:
            ndvi_dict[key] = ndvi
        else:
            ndvi_dict[key] = {}
        meteo_dict[key] = meteo
        coordinates_dict[key] = coordinates
    return {"coordinates": coordinates_dict, "meteo_data": meteo_dict, 'ndvi_data': ndvi_dict}


@app.post("/modis_offline")
async def modis_offline(data: dict):
    print("get ndvi data offline")
    return getNVIDataModis()


@app.post("/__space/v0/actions")
def actions(action: dict):
    sys.stdout.flush()
    sys.stderr.flush()
    print(action)
    getModisCSV7days()
    # if action['event']['id'] == "getModisCSV7days":
    #    print("can be moved here")


# getModisCSV7days()
@app.get("/")
def nothing_here():
    print("there is nothing here")


# Download alle 3 Stunden planen
# getModisCSV24h()
# getModisCSV7days()
# get_greatest_burning_areas()
# schedule.every(3).hours.do(getModisCSV24h)

# schedule.every(5).seconds.do(get_greatest_burning_areas)
# getNewNDVIDateAPI(10.23, 3.002)
# get_greatest_burning_areas()

print("starting backend")
# getModisCSV7days()
# getModisCSV7days()
# schedule.every(3).hours.do(getModisCSV7days)
# schedule.every(12).hours.do(get_greatest_burning_areas)
# getModisCSV7days()
# app.run(debug=True)

# def starte_scheduler():
#    print("started scheduler")
#    schedule.every(3).hours.do(getModisCSV7days)
# schedule.every(12).hours.do(get_greatest_burning_areas)

#    while True:
#        schedule.run_pending()
#        time.sleep(1)

# scheduler_thread = threading.Thread(target=starte_scheduler)
# scheduler_thread.start()

if __name__ == '__main__':
    app.run(debug=True)
    # while True:
    #    schedule.run_pending()
    #    time.sleep(1)
