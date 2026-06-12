import { TRIP_DAYS, TOTAL_NIGHTS, ROOMS } from '../constants';

export function computeCostTotal(costData) {
  const defaults = { baseRent: 12000, discountPct: 20, cleaning1: 250, cleaning2: 250, taxPct: 0, extras: [] };
  const cost = { ...defaults, ...(costData || {}) };
  const disc = cost.baseRent * (cost.discountPct / 100);
  const sub = cost.baseRent - disc + (+cost.cleaning1 || 0) + (+cost.cleaning2 || 0)
    + (cost.extras || []).reduce((s, x) => s + (+x.amount || 0), 0);
  const tax = sub * ((+cost.taxPct || 0) / 100);
  return { cost, disc, sub, tax, total: sub + tax };
}

// FIXED: parse dates at midnight (T00:00) so the comparison with TRIP_DAYS
// (which are midnight dates) works correctly. The old noon-parsing bug made
// everyone lose their first night, zeroing out some people's owed amounts.
function parseLocalDate(raw, fallback) {
  if (!raw) return fallback;
  const [y, m, d] = raw.split('-').map(Number);
  return new Date(y, m - 1, d); // local midnight
}

export function calcOwed(users, costData) {
  const { total } = computeCostTotal(costData);
  const nightly = total / TOTAL_NIGHTS;
  const owe = {}, nights = {};
  users.forEach(u => { owe[u.uid] = 0; nights[u.uid] = 0; });

  for (let ni = 0; ni < TOTAL_NIGHTS; ni++) {
    const nightStart = TRIP_DAYS[ni];
    const nightEnd = TRIP_DAYS[ni + 1];
    const roomPresence = {};
    let occupiedRooms = 0;

    ROOMS.forEach(rm => {
      const here = users.filter(u => {
        if (u.room !== rm.id) return false;
        const arr = parseLocalDate(u.arrivalDateRaw, TRIP_DAYS[0]);
        const dep = parseLocalDate(u.departureDateRaw, TRIP_DAYS[TRIP_DAYS.length - 1]);
        // Present for this night if arrived on/before night start AND departing on/after night end
        return arr <= nightStart && dep >= nightEnd;
      });
      roomPresence[rm.id] = here;
      if (here.length > 0) occupiedRooms++;
    });

    if (!occupiedRooms) continue;
    const perRoom = nightly / occupiedRooms;
    ROOMS.forEach(rm => {
      const here = roomPresence[rm.id];
      if (!here.length) return;
      const perPerson = perRoom / here.length;
      here.forEach(u => { owe[u.uid] += perPerson; nights[u.uid]++; });
    });
  }
  return { owe, nights, nightly, total };
}
