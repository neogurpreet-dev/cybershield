import { distanceKm } from './geo';

export type PlaceKind = 'hospital' | 'police' | 'fire' | 'pharmacy' | 'clinic';

export interface Place {
  id: string;
  kind: PlaceKind;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  phone?: string;
  address?: string;
  emergency?: boolean;
}

const KIND_OF: Record<string, PlaceKind> = {
  hospital: 'hospital',
  police: 'police',
  fire_station: 'fire',
  pharmacy: 'pharmacy',
  clinic: 'clinic',
  doctors: 'clinic',
};

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

/** Real nearby emergency services from OpenStreetMap (Overpass API). */
export async function findNearby(lat: number, lng: number, radiusM = 5000): Promise<Place[]> {
  const q = `[out:json][timeout:20];
(
  nwr["amenity"~"^(hospital|police|fire_station|pharmacy|clinic|doctors)$"](around:${radiusM},${lat},${lng});
);
out center tags 80;`;
  let data: any = null;
  let lastErr = 'Map service unavailable';
  for (const url of ENDPOINTS) {
    try {
      const r = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }) });
      if (!r.ok) {
        lastErr = `Map service busy (${r.status})`;
        continue;
      }
      data = await r.json();
      break;
    } catch (e: any) {
      lastErr = e?.message || lastErr;
    }
  }
  if (!data) throw new Error(lastErr);

  const places: Place[] = (data.elements || [])
    .map((el: any) => {
      const t = el.tags || {};
      const plat = el.lat ?? el.center?.lat;
      const plng = el.lon ?? el.center?.lon;
      const kind = KIND_OF[t.amenity];
      if (!kind || plat === undefined || plng === undefined) return null;
      const address = [t['addr:housenumber'], t['addr:street'], t['addr:suburb'], t['addr:city']].filter(Boolean).join(', ');
      return {
        id: `${el.type}/${el.id}`,
        kind,
        name: t.name || t['name:en'] || defaultName(kind),
        lat: plat,
        lng: plng,
        distanceKm: distanceKm({ lat, lng }, { lat: plat, lng: plng }),
        phone: t.phone || t['contact:phone'] || t['emergency:phone'] || undefined,
        address: address || undefined,
        emergency: t.emergency === 'yes',
      } as Place;
    })
    .filter(Boolean) as Place[];

  return places.sort((a, b) => a.distanceKm - b.distanceKm);
}

function defaultName(kind: PlaceKind) {
  return { hospital: 'Hospital', police: 'Police station', fire: 'Fire station', pharmacy: 'Pharmacy', clinic: 'Clinic' }[kind];
}
