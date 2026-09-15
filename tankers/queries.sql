-- ---------------------------------------------------------------------------
-- Worked queries against the Kuwaiti oil tankers database.
--
--   sqlite3 kotc.db < schema.sql && sqlite3 kotc.db < seed.sql
--   sqlite3 kotc.db < queries.sql
--
-- Queries 1-6 read only real, sourced data. Queries 7-11 touch `voyages`,
-- which is synthetic — they show what the schema supports, not what the
-- fleet actually did.
-- ---------------------------------------------------------------------------


-- 1. The fleet by type: how many hulls, how much deadweight, how old.
SELECT vessel_type,
       COUNT(*)                          AS hulls,
       SUM(dwt)                          AS total_dwt,
       MIN(built_year)                   AS oldest,
       MAX(built_year)                   AS newest,
       ROUND(AVG(2026 - built_year), 1)  AS avg_age
FROM vessels
GROUP BY vessel_type
ORDER BY total_dwt DESC;


-- 2. Every ship, newest first, with the age it will reach this year.
SELECT name, vessel_type, imo, built_year, 2026 - built_year AS age_years,
       dwt, flag, status
FROM vessels
ORDER BY built_year DESC, name;


-- 3. Which yards built the fleet. DSME and the Hyundai yards dominate.
SELECT b.name                AS shipyard,
       b.country,
       COUNT(v.vessel_id)    AS hulls,
       SUM(v.dwt)            AS total_dwt,
       MIN(v.built_year)     AS first_delivery,
       MAX(v.built_year)     AS last_delivery
FROM builders b
JOIN vessels  v ON v.builder_id = b.builder_id
GROUP BY b.name, b.country
ORDER BY hulls DESC, total_dwt DESC;


-- 4. The newbuilding programme, year by year. The 2011, 2014 and 2019-2021
--    clusters are the phased fleet-renewal contracts.
SELECT built_year,
       COUNT(*)   AS delivered,
       SUM(dwt)   AS dwt_added,
       GROUP_CONCAT(name, ', ') AS vessels   -- Postgres: STRING_AGG(name, ', ')
FROM vessels
GROUP BY built_year
ORDER BY built_year;


-- 5. Where the deadweight figure is carried over from a sister ship rather
--    than published for that hull. Worth knowing before quoting a total.
SELECT name, vessel_type, dwt, dwt_basis, notes
FROM vessels
WHERE dwt_basis = 'sister_vessel_class'
ORDER BY vessel_type, name;


-- 6. Hulls whose AIS registration disagrees with the recorded flag. These are
--    the rows to re-check before the register is used for anything binding.
SELECT name, imo, mmsi, flag, status, notes
FROM vessels
WHERE status <> 'in_service'
ORDER BY name;


-- 7. SYNTHETIC. Where the cargo goes, by region and country.
SELECT p.region,
       p.country,
       COUNT(*)                        AS voyages,
       SUM(y.cargo_tonnes)             AS tonnes,
       ROUND(AVG(y.sea_days), 1)       AS avg_days_at_sea
FROM voyages y
JOIN ports   p ON p.port_id = y.discharge_port_id
GROUP BY p.region, p.country
ORDER BY tonnes DESC;


-- 8. SYNTHETIC. Cargo mix by year — crude against products against gas.
SELECT SUBSTR(y.departure_date, 1, 4) AS year,   -- Postgres: EXTRACT(YEAR FROM ...)
       c.category,
       COUNT(*)            AS voyages,
       SUM(y.cargo_tonnes) AS tonnes
FROM voyages     y
JOIN cargo_types c ON c.cargo_code = y.cargo_code
GROUP BY year, c.category
ORDER BY year, tonnes DESC;


-- 9. SYNTHETIC. Which Kuwaiti terminal loads what.
SELECT p.name AS load_terminal,
       c.category,
       COUNT(*)            AS voyages,
       SUM(y.cargo_tonnes) AS tonnes
FROM voyages     y
JOIN ports       p ON p.port_id   = y.load_port_id
JOIN cargo_types c ON c.cargo_code = y.cargo_code
GROUP BY p.name, c.category
ORDER BY p.name, tonnes DESC;


-- 10. SYNTHETIC. Per-ship productivity: tonne-miles, the measure that lets a
--     small ship on a long haul be compared with a big one on a short run.
SELECT v.name,
       v.vessel_type,
       COUNT(y.voyage_id)                      AS voyages,
       SUM(y.cargo_tonnes)                     AS tonnes,
       SUM(y.cargo_tonnes * y.distance_nm)     AS tonne_miles,
       SUM(y.sea_days)                         AS laden_days
FROM vessels v
JOIN voyages y ON y.vessel_id = v.vessel_id
GROUP BY v.name, v.vessel_type
ORDER BY tonne_miles DESC;


-- 11. SYNTHETIC. Long-haul against regional work, split at 3,000 miles.
SELECT v.vessel_type,
       CASE WHEN y.distance_nm >= 3000 THEN 'long haul' ELSE 'regional' END AS leg,
       COUNT(*)                          AS voyages,
       ROUND(AVG(y.sea_days), 1)         AS avg_days,
       ROUND(AVG(y.freight_rate_ws), 1)  AS avg_worldscale
FROM voyages y
JOIN vessels v ON v.vessel_id = y.vessel_id
GROUP BY v.vessel_type, leg
ORDER BY v.vessel_type, leg;
