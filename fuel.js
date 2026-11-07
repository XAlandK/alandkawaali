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
    consumption: {
      l100: n => `${n} لیتر بۆ هەر ١٠٠ کیلۆمەتر`,
      kml: n => `${n} کیلۆمەتر بۆ هەر لیترێک`
    },
    hint: {
      l100: 'زیادی بکە بۆ ئەوەی خێرا لێخوڕین و لێخوڕینی قورستر تاقی بکەیتەوە.',
      kml: 'کەمی بکەرەوە بۆ ئەوەی خێرا لێخوڕین و لێخوڕینی قورستر تاقی بکەیتەوە.',
      range: 'هەردوو سنوورەکە دابنێ؛ تێچووەکە وەک خەمڵاندنێکی نزیک پیشان دەدرێت.'
    },
    range: (low, high) => `${low} تا ${high}`,
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
    consumption: {
      l100: n => `${n} L/100 km`,
      kml: n => `${n} km/L`
    },
    hint: {
      l100: 'Raise it to simulate faster acceleration, higher speeds or more demanding driving.',
      kml: 'Lower it to simulate faster acceleration, higher speeds or more demanding driving.',
      range: 'Set both ends; the cost is shown as a rough estimate.'
    },
    range: (low, high) => `${low}–${high}`,
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
  const priceInput = document.getElementById('price');
  const exactInput = document.getElementById('consumption');
  const lowInput = document.getElementById('consumptionLow');
  const highInput = document.getElementById('consumptionHigh');
  const sliders = [exactInput, lowInput, highInput];
  const unitInputs = document.querySelectorAll('input[name="consumptionUnit"]');
  const modeInputs = document.querySelectorAll('input[name="consumptionMode"]');
  const show = (id, value) => { document.getElementById(id).textContent = value; };

  // The sliders work in whichever unit is picked. Litres per 100 km and km per litre are each
  // 100 divided by the other, so the km per litre range is the litres range turned over.
  const SLIDER_RANGE = {
    l100: { min: 1, max: 10 },
    kml: { min: 10, max: 100 }
  };
  // A range starts this far either side of the exact figure.
  const RANGE_SPREAD = 0.1;
  const STORAGE_KEYS = { unit: 'fuelConsumptionUnit', mode: 'fuelConsumptionMode' };
  let unit = 'l100';
  let mode = 'exact';

  const sliderValue = input => Math.max(0, Number(input.value) || 0);
  const toLitresPer100Km = value => unit === 'l100' ? value : (value > 0 ? 100 / value : 0);

  function setUnit(next) {
    if (!SLIDER_RANGE[next] || next === unit) return;
    const [exact, low, high] = sliders.map(sliderValue);
    unit = next;
    sliders.forEach(input => {
      input.min = SLIDER_RANGE[unit].min;
      input.max = SLIDER_RANGE[unit].max;
    });
    // Turning the unit over also turns the range over: the low end becomes the high end.
    const flip = value => value > 0 ? 100 / value : SLIDER_RANGE[unit].min;
    exactInput.value = flip(exact);
    lowInput.value = flip(high);
    highInput.value = flip(low);
    unitInputs.forEach(input => { input.checked = input.value === unit; });
    calculate();
  }

  function setMode(next) {
    if (!['exact', 'range'].includes(next) || next === mode) return;
    mode = next;
    if (mode === 'range') {
      // A range opens around the exact figure, and going back to exact takes its middle.
      const exact = sliderValue(exactInput);
      lowInput.value = exact * (1 - RANGE_SPREAD);
      highInput.value = exact * (1 + RANGE_SPREAD);
    } else {
      exactInput.value = (sliderValue(lowInput) + sliderValue(highInput)) / 2;
    }
    document.getElementById('consumptionExact').hidden = mode !== 'exact';
    document.getElementById('consumptionRange').hidden = mode !== 'range';
    modeInputs.forEach(input => { input.checked = input.value === mode; });
    calculate();
  }

  // One figure, or "low to high" when the two ends still differ once rounded.
  function figure(low, high, places, wrap) {
    const a = decimals(low, places);
    const b = decimals(high, places);
    return wrap(a === b ? a : text.range(a, b));
  }

  function calculate() {
    const distance = Math.max(0, Number(distanceInput.value) || 0);
    const price = Math.max(0, Number(priceInput.value) || 0);
    const chosen = mode === 'exact' ? [exactInput] : [lowInput, highInput];
    const perHundred = chosen.map(input => toLitresPer100Km(sliderValue(input)));
    const least = Math.min(...perHundred);
    const most = Math.max(...perHundred);

    const describe = input => text.consumption[unit](decimals(sliderValue(input), 2));
    show('consumptionValue', mode === 'exact' ? describe(exactInput) : '');
    show('consumptionLowValue', describe(lowInput));
    show('consumptionHighValue', describe(highInput));
    show('consumptionHint', mode === 'range' ? text.hint.range : text.hint[unit]);

    show('cost', figure(distance * least * price / 100, distance * most * price / 100, 0, text.money));
    show('litres', figure(distance * least / 100, distance * most / 100, 2, text.litres));
    show('perKm', figure(least * price / 100, most * price / 100, 2, text.money));
    show('per100', figure(least * price, most * price, 0, text.money));
  }

  // "From" never passes "to": dragging one past the other pushes the other along.
  lowInput.addEventListener('input', () => {
    if (sliderValue(lowInput) > sliderValue(highInput)) highInput.value = lowInput.value;
  });
  highInput.addEventListener('input', () => {
    if (sliderValue(highInput) < sliderValue(lowInput)) lowInput.value = highInput.value;
  });
  [distanceInput, priceInput, ...sliders].forEach(input =>
    input.addEventListener('input', calculate)
  );

  // The chosen unit and mode are remembered in this browser, so they are already picked next time.
  function remember(key, value) {
    try { localStorage.setItem(key, value); } catch (error) { /* not remembered; still works */ }
  }
  function recall(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }
  unitInputs.forEach(input => input.addEventListener('change', () => {
    setUnit(input.value);
    remember(STORAGE_KEYS.unit, unit);
  }));
  modeInputs.forEach(input => input.addEventListener('change', () => {
    setMode(input.value);
    remember(STORAGE_KEYS.mode, mode);
  }));
  setUnit(recall(STORAGE_KEYS.unit));
  setMode(recall(STORAGE_KEYS.mode));
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
    distanceInput.value = 0;
    calculate();
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
