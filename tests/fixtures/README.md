# Road route fixture

`isabela-road-route.json` is a successful response fetched from the public OSRM demo service on 2026-10-28 using the fictional demo starting point (6.7048, 121.9654) and Demo Hospital A (6.7022, 121.9761). It contains 80 road geometry points, 2239.1 metres of road distance, and 244.6 seconds of estimated driving time. Synthetic points snap roughly 110 m and 103 m to the nearest road; no connector is drawn between those roads and the synthetic pins.

Browser tests intercept routing requests with this fixture so repeated tests do not query the public service. Attribution: OSRM / FOSSGIS, OpenStreetMap contributors. Service policy: https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server.
