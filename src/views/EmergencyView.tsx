import React, { useMemo, useState } from 'react';
import { useAuth, useUid } from '../hooks/useAuth';
import { useCollection } from '../hooks/useFirestore';
import { useLocation } from '../hooks/useLocation';
import { Card } from '../ui/ui';
import type { MapMarker } from '../components/LeafletMap';
import type { Place } from '../lib/nearby';
import type { EmergencyContact } from '../types';
import { SosPanel } from './emergency/SosPanel';
import { LocationCard } from './emergency/LocationCard';
import { ContactsCard } from './emergency/ContactsCard';
import { HelplinesCard } from './emergency/HelplinesCard';
import { KIND_META, NearbyCard } from './emergency/NearbyCard';

export const EmergencyView: React.FC = () => {
  const uid = useUid();
  const { profile, user } = useAuth();
  const loc = useLocation(true);
  const { items: contacts } = useCollection<EmergencyContact>(uid, 'contacts');
  const [places, setPlaces] = useState<Place[]>([]);
  const name = profile?.displayName || user?.displayName || 'A CyberShield user';

  const markers: MapMarker[] = useMemo(
    () => places.filter((p) => p.kind !== 'pharmacy').slice(0, 40).map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, color: KIND_META[p.kind].color, label: `${p.name} (${KIND_META[p.kind].label})` })),
    [places]
  );

  return (
    <div className="max-w-7xl mx-auto font-sans space-y-6">
      <div className="p-4 rounded-xl bg-amber-400 text-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-black text-base uppercase tracking-tight">In danger right now?</div>
          <div className="text-sm font-semibold">Call 112 first. It reaches police, fire and ambulance anywhere in India.</div>
        </div>
        <div className="flex gap-2">
          <a href="tel:112" className="px-6 py-3 rounded-xl bg-black text-amber-300 font-black text-lg text-center">CALL 112</a>
          <a href="tel:1930" className="px-4 py-3 rounded-xl bg-black/80 text-amber-200 font-bold text-sm text-center leading-tight">1930<br /><span className="text-[10px]">Cyber fraud</span></a>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <Card>
            <SosPanel uid={uid} name={name} loc={loc} contacts={contacts} activeId={profile?.activeSosId || null} />
          </Card>
          <ContactsCard uid={uid} contacts={contacts} />
          <HelplinesCard />
        </div>
        <div className="space-y-6">
          <LocationCard loc={loc} name={name} markers={markers} />
          <NearbyCard fix={loc.fix} onPlaces={setPlaces} />
        </div>
      </div>
    </div>
  );
};
