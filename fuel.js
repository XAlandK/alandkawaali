// Fuel cost calculator, shared by fuel.html (Kurdish) and fuel-en.html (English).
(function () {
  'use strict';

  const kurdish = document.documentElement.lang === 'ckb';

  const text = kurdish ? {
    pickStart: 'کرتە لەسەر نەخشەکە بکە بۆ دیاریکردنی خاڵی دەستپێک.',
    pickEnd: 'ئێستا کرتە لەسەر شوێنی مەبەست بکە.',
    finding: 'گەڕان بەدوای ڕێگادا…',
    found: km => `${km} کیلۆمەتر بە ڕێگادا. بۆ گۆڕینی ڕێگاکە، نیشانەیەک ڕابکێشە.`,
    noRoute: 'ڕێگای ئۆتۆمبێل لە نێوان ئەم دوو خاڵەدا نەدۆزرایەوە. نیشانەیەک بجووڵێنە، یان درێژیی ڕێگا خۆت بنووسە.',
    failed: 'ئێستا ناتوانرێت ڕێگا بدۆزرێتەوە. دووبارە هەوڵ بدەرەوە، یان درێژیی ڕێگا خۆت بنووسە.',
    noMap: 'نەخشەکە نەکرایەوە. درێژیی ڕێگا خۆت لە خوارەوە بنووسە.',
    start: 'دەستپێک',
    end: 'مەبەست',
    consumption: n => `${n} لیتر بۆ هەر ١٠٠ کیلۆمەتر`,
    litres: n => `${n} لیتر`,
    money: n => `${n} دینار`
  } : {
    pickStart: 'Tap the map to set the start.',
    pickEnd: 'Now tap the destination.',
    finding: 'Finding the route…',
    found: km => `${km} km by road. Drag a pin to change the route.`,
    noRoute: 'No driving route between these points. Move a pin, or type the distance yourself.',
    failed: "Couldn't get a route right now. Try again, or type the distance yourself.",
    noMap: "The map couldn't load. Type the distance below.",
    start: 'Start',
    end: 'Destination',
    consumption: n => `${n} L/100 km`,
    litres: n => `${n} L`,
    money: n => `${n} IQD`
  };

  // Numbers are built in en-US, then written in Kurdish digits on the Kurdish page.
  const localise = value => kurdish
    ? value.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]).replace(/,/g, '٬').replace(/\./g, '٫')
    : value;
  const decimals = (value, places) => localise(value.toLocaleString('en-US', {
    minimumFractionDigits: places, maximumFractionDigits: places
  }));

  // ---------- Calculator ----------

  const distanceInput = document.getElementById('distance');
  const consumptionInput = document.getElementById('consumption');
  const priceInput = document.getElementById('price');
  const show = (id, value) => { document.getElementById(id).textContent = value; };

  function calculate() {
    const distance = Math.max(0, Number(distanceInput.value) || 0);
    const consumption = Math.max(0, Number(consumptionInput.value) || 0);
    const price = Math.max(0, Number(priceInput.value) || 0);
    const litres = distance * consumption / 100;

    show('consumptionValue', text.consumption(decimals(consumption, 2)));
    show('cost', text.money(decimals(litres * price, 0)));
    show('litres', text.litres(decimals(litres, 2)));
    show('perKm', text.money(decimals(consumption * price / 100, 2)));
    show('per100', text.money(decimals(consumption * price, 0)));
  }

  [distanceInput, consumptionInput, priceInput].forEach(input =>
    input.addEventListener('input', calculate)
  );
  calculate();

  // ---------- Map ----------

  const mapElement = document.getElementById('map');
  const status = document.getElementById('mapStatus');
  const clearButton = document.getElementById('clearRoute');

  if (!window.L) {
    mapElement.hidden = true;
    status.textContent = text.noMap;
    return;
  }

  // The second server is only used when the first one is down or too slow.
  const ROUTERS = [
    'https://router.project-osrm.org/route/v1/driving/',
    'https://routing.openstreetmap.de/routed-car/route/v1/driving/'
  ];
  const ROUTER_TIMEOUT_MS = 8000;

  // Opens over Erbil, Sulaymaniyah, Duhok and Kirkuk. The wheel only zooms once
  // the map has been clicked, so scrolling down the page doesn't get caught by it.
  const map = L.map(mapElement, { scrollWheelZoom: false }).setView([36.1, 44.4], 8);
  map.attributionControl.setPrefix(false);

  // On desktop the map's height follows the column beside it, so it can change without
  // the window being resized. Leaflet is told to re-measure whenever that happens.
  if ('ResizeObserver' in window) new ResizeObserver(() => map.invalidateSize()).observe(mapElement);

  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  // OpenStreetMap's own tiles; styles.css turns them grey (and dark in dark mode).
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> — ' +
      '<a href="https://project-osrm.org">OSRM</a>'
  }).addTo(map);

  let startPin = null;
  let endPin = null;
  let routeLine = null;
  let pendingRequest = null;

  function dropPin(latlng, className, title) {
    return L.marker(latlng, {
      draggable: true,
      title,
      icon: L.divIcon({ className: `pin ${className}`, iconSize: [32, 32] })
    }).on('dragend', findRoute).addTo(map);
  }

  map.on('click', event => {
    if (!startPin) {
      startPin = dropPin(event.latlng, 'pin-start', text.start);
      status.textContent = text.pickEnd;
      clearButton.hidden = false;
      return;
    }
    if (endPin) endPin.setLatLng(event.latlng);
    else endPin = dropPin(event.latlng, 'pin-end', text.end);
    findRoute();
  });

  clearButton.addEventListener('click', () => {
    if (pendingRequest) pendingRequest.abort();
    [startPin, endPin, routeLine].forEach(layer => { if (layer) layer.remove(); });
    startPin = endPin = routeLine = null;
    status.textContent = text.pickStart;
    clearButton.hidden = true;
  });

  // Returns the router's answer, which is either a route or a clear "no route".
  // Anything else (server down, timeout, bad reply) moves on to the next server.
  async function askRouters(path, signal) {
    let lastError;
    for (const router of ROUTERS) {
      try {
        const response = await fetch(router + path, {
          signal: AbortSignal.any([signal, AbortSignal.timeout(ROUTER_TIMEOUT_MS)])
        });
        const answer = await response.json();
        if (['Ok', 'NoRoute', 'NoSegment'].includes(answer.code)) return answer;
        lastError = new Error(answer.code);
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        lastError = error;
      }
    }
    throw lastError;
  }

  async function findRoute() {
    if (!startPin || !endPin) return;

    if (pendingRequest) pendingRequest.abort();
    const request = pendingRequest = new AbortController();
    status.textContent = text.finding;

    const from = startPin.getLatLng();
    const to = endPin.getLatLng();
    const path = `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

    try {
      const answer = await askRouters(path, request.signal);

      if (answer.code !== 'Ok') {
        removeRouteLine();
        status.textContent = text.noRoute;
        return;
      }

      // Move the pins onto the roads the route actually starts and ends on.
      const [snappedStart, snappedEnd] = answer.waypoints.map(point => [point.location[1], point.location[0]]);
      startPin.setLatLng(snappedStart);
      endPin.setLatLng(snappedEnd);

      const route = answer.routes[0];
      const points = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      if (routeLine) routeLine.setLatLngs(points);
      else routeLine = L.polyline(points, { className: 'route', interactive: false }).addTo(map);

      const bounds = routeLine.getBounds();
      if (!map.getBounds().contains(bounds)) map.fitBounds(bounds, { padding: [32, 32] });

      const km = route.distance / 1000;
      distanceInput.value = km.toFixed(1);
      calculate();
      status.textContent = text.found(decimals(km, 1));
    } catch (error) {
      if (error.name === 'AbortError') return;
      removeRouteLine();
      status.textContent = text.failed;
    }
  }

  function removeRouteLine() {
    if (routeLine) routeLine.remove();
    routeLine = null;
  }

  status.textContent = text.pickStart;
})();
