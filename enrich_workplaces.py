import csv
import json
import urllib.request
import time
import os

# To run this script, you need to have GoogleMapsAPIKey set in your environment or hardcoded
# Since I can't easily read Encore secrets from here, I'll assume the user might want to provide it
# or I can try to get it if I had a way.
# Wait, I can't get the secret directly. I'll ask the user to provide it or use a placeholder.
# Actually, I can use the same approach as before but I need the API key.
# The user just added it to Encore.

API_URL = "http://127.0.0.1:4000/workplaces"
CSV_FILE = "data/maps/Çalışmaya Gidilecek Yerler.csv"

# I'll try to get the API key from the user's environment or ask them.
# For now, I'll write the script to expect it as an argument or env var.
GOOGLE_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")

def get_google_details(name, api_key):
    if not api_key:
        return None
    
    try:
        # 1. Find Place
        query = urllib.parse.quote(f"{name} İstanbul Turkey")
        fields = "place_id,geometry,formatted_address,name,rating,user_ratings_total,photos"
        find_url = f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={query}&inputtype=textquery&fields={fields}&key={api_key}"
        
        with urllib.request.urlopen(find_url) as resp:
            data = json.loads(resp.read().decode())
            if data['status'] != 'OK' or not data.get('candidates'):
                return None
            candidate = data['candidates'][0]
            place_id = candidate['place_id']
            
        # 2. Get Details
        fields = "address_components,formatted_address,geometry,name,photos,rating,user_ratings_total,url,website,international_phone_number,opening_hours"
        details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields={fields}&key={api_key}&language=tr"
        
        with urllib.request.urlopen(details_url) as resp:
            data = json.loads(resp.read().decode())
            if data['status'] != 'OK':
                return None
            result = data['result']
            
            # Extract district (ilçe)
            district = ""
            for component in result.get('address_components', []):
                if "administrative_area_level_2" in component['types']:
                    district = component['long_name']
                    break
            
            # Get photo URL if available
            image_url = ""
            if result.get('photos'):
                photo_ref = result['photos'][0]['photo_reference']
                image_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo_ref}&key={api_key}"
            
            return {
                "latitude": result['geometry']['location']['lat'],
                "longitude": result['geometry']['location']['lng'],
                "address": result.get('formatted_address'),
                "district": district,
                "image_url": image_url,
                "rating": result.get('rating'),
                "user_ratings_total": result.get('user_ratings_total'),
                "url": result.get('url'),
                "metadata": {
                    "website": result.get('website'),
                    "phone": result.get('international_phone_number'),
                    "opening_hours": result.get('opening_hours'),
                    "google_place_id": place_id
                }
            }
    except Exception as e:
        print(f"Error fetching Google details for {name}: {e}")
        return None

def seed(api_key):
    with open(CSV_FILE, mode='r', encoding='utf-8') as f:
        lines = f.readlines()
        header_idx = 0
        for i, line in enumerate(lines):
            if "Başlık,Not,URL,Etiketler,Yorum" in line:
                header_idx = i
                break
        
        csv_reader = csv.DictReader(lines[header_idx:])
        
        for row in csv_reader:
            name = row.get('Başlık')
            if not name:
                continue
            
            print(f"Processing: {name}...")
            google_data = get_google_details(name, api_key)
            
            note = row.get('Not')
            tags_str = row.get('Etiketler', '')
            tags = [t.strip() for t in tags_str.split(',')] if tags_str else []
            
            payload = {
                "name": name,
                "note": note,
                "tags": tags,
                "wifi": True if "wifi" in tags_str.lower() else False,
                "parking": True if "otopark" in tags_str.lower() else False,
                "power_outlets": True if "priz" in tags_str.lower() else False,
                "quiet_level": 3,
                "suggested_by": "System Enrichment"
            }
            
            if google_data:
                payload.update(google_data)
            
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(API_URL, data=data, method='POST')
            req.add_header('Content-Type', 'application/json')
            
            try:
                with urllib.request.urlopen(req) as response:
                    if response.status == 200:
                        print(f"  Updated: {name}")
                    else:
                        print(f"  Failed to update {name}: {response.status}")
            except Exception as e:
                print(f"  Error updating {name}: {e}")
            
            # Avoid hitting rate limits too hard
            time.sleep(0.2)

if __name__ == "__main__":
    import sys
    key = GOOGLE_API_KEY
    if len(sys.argv) > 1:
        key = sys.argv[1]
    
    if not key:
        print("Please provide Google Maps API Key as argument or GOOGLE_MAPS_API_KEY env var.")
    else:
        seed(key)
