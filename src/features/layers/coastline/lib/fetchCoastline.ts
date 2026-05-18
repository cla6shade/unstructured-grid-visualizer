import { fetchTile } from '@/lib/network/fetchTile';

export const fetchCoastlineTile = fetchTile<GeoJSON.FeatureCollection>({
  endpoint: ({ z, x, y }) => `/api/coastline/${z}/${x}/${y}`,
  fallback: { type: 'FeatureCollection', features: [] },
  label: 'coastline',
});
