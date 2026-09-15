#!/usr/bin/env python3
"""Build the derived parts of the Kuwaiti oil tankers dataset.

Reads the three hand-curated source tables in data/ (vessels, ports,
cargo_types), validates them against the constraints in schema.sql, derives the
builders table, generates the synthetic voyage set, and writes:

    data/builders.csv          derived from vessels.csv
    data/voyages_synthetic.csv generated, seeded, reproducible
    data/*.json                a JSON mirror of every table
    data/fleet.json            one bundle the web page loads
    seed.sql                   INSERT statements for every table

Run it with no arguments from anywhere:

    python3 tankers/build.py

The voyage generator is seeded with SEED below, so the same source tables
always produce the same voyages. Nothing here needs third-party packages.
"""

from __future__ import annotations

import csv
import json
import random
import re
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"

SEED = 20260915
PERIOD_START = date(2023, 1, 1)
PERIOD_END = date(2025, 12, 31)

# Deadweights to fall back on when a hull's own figure is unknown, so a
# synthetic voyage still carries a plausible parcel. Keyed by vessel type.
FALLBACK_DWT = {
    "VLCC": 300_000,
    "Aframax": 110_000,
    "MR Product Tanker": 46_000,
    "VLGC": 54_000,
    "LPG Carrier": 49_000,
    "Bunker Vessel": 5_000,
}

# Which cargoes each class of ship lifts, and how often. Weights are relative.
CARGO_MIX = {
    "crude": [("KEC", 70), ("KHAFJI", 15), ("EOCENE", 10), ("KSLC", 5)],
    "products": [("GASOIL", 30), ("JETA1", 20), ("NAPHTHA", 20),
                 ("GASOLINE", 15), ("FUELOIL", 15)],
    "lpg": [("PROPANE", 60), ("BUTANE", 40)],
}

# Which Kuwaiti terminal each class loads at.
LOAD_PORTS = {
    "crude": [("mina-al-ahmadi", 85), ("mina-al-zour", 15)],
    "products": [("mina-al-ahmadi", 35), ("mina-abdullah", 30),
                 ("mina-al-zour", 25), ("shuaiba", 10)],
    "lpg": [("mina-al-ahmadi", 100)],
}

# Where each class of ship discharges. VLCCs run the long hauls, MRs stay
# regional, gas carriers follow the Asian LPG trade.
DISCHARGE_MIX = {
    "VLCC": [("ningbo-zhoushan", 16), ("qingdao", 13), ("ulsan", 12),
             ("chiba", 10), ("kawasaki", 8), ("yeosu", 8), ("sikka", 9),
             ("rotterdam", 7), ("trieste", 5), ("augusta", 4),
             ("ain-sokhna", 5), ("houston", 3)],
    "Aframax": [("sikka", 14), ("jnpt-mumbai", 12), ("singapore", 14),
                ("fujairah", 12), ("ain-sokhna", 10), ("augusta", 9),
                ("trieste", 8), ("qingdao", 8), ("ulsan", 7), ("durban", 6)],
    "MR Product Tanker": [("fujairah", 20), ("karachi", 14), ("jnpt-mumbai", 13),
                          ("sikka", 11), ("colombo", 11), ("singapore", 12),
                          ("mombasa", 9), ("durban", 6), ("ain-sokhna", 4)],
    "VLGC": [("sikka", 20), ("jnpt-mumbai", 14), ("ningbo-zhoushan", 16),
             ("qingdao", 12), ("chiba", 12), ("ulsan", 10), ("yeosu", 8),
             ("colombo", 8)],
    "LPG Carrier": [("karachi", 20), ("jnpt-mumbai", 18), ("sikka", 16),
                    ("colombo", 14), ("singapore", 12), ("mombasa", 12),
                    ("fujairah", 8)],
}
DISCHARGE_MIX["Bunker Vessel"] = [("fujairah", 100)]

VESSEL_INT = ("imo", "mmsi", "dwt", "capacity_cbm", "built_year")
VESSEL_FLOAT = ("loa_m", "beam_m")
PORT_INT = ("sea_distance_from_ahmadi_nm",)
PORT_FLOAT = ("latitude", "longitude")
CARGO_FLOAT = ("api_gravity", "sulphur_pct")


def read_csv(name: str) -> list[dict]:
    with (DATA / name).open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def coerce(rows: list[dict], ints=(), floats=()) -> list[dict]:
    """Turn blank CSV cells into None and numeric columns into numbers."""
    out = []
    for row in rows:
        clean = {}
        for key, value in row.items():
            value = (value or "").strip()
            if value == "":
                clean[key] = None
            elif key in ints:
                clean[key] = int(value)
            elif key in floats:
                clean[key] = float(value)
            else:
                clean[key] = value
        out.append(clean)
    return out


def slugify(text: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", text.lower())).strip("-")


def weighted(rng: random.Random, pairs: list[tuple[str, int]]) -> str:
    names = [name for name, _ in pairs]
    weights = [weight for _, weight in pairs]
    return rng.choices(names, weights=weights, k=1)[0]


def validate(vessels, ports, cargoes) -> list[str]:
    """Check the source tables against the schema's constraints."""
    problems = []

    seen_imo, seen_id = set(), set()
    for v in vessels:
        vid = v["vessel_id"]
        if vid in seen_id:
            problems.append(f"duplicate vessel_id {vid}")
        seen_id.add(vid)
        if v["imo"] in seen_imo:
            problems.append(f"duplicate IMO {v['imo']} on {vid}")
        seen_imo.add(v["imo"])
        if not 1_000_000 <= v["imo"] <= 9_999_999:
            problems.append(f"{vid}: IMO {v['imo']} is not seven digits")
        if (v["dwt"] is None) != (v["dwt_basis"] is None):
            problems.append(f"{vid}: dwt and dwt_basis must be set together")
        if v["capacity_cbm"] is not None and v["cargo_class"] != "lpg":
            problems.append(f"{vid}: capacity_cbm is only for gas carriers")
        if v["vessel_type"] not in FALLBACK_DWT:
            problems.append(f"{vid}: unknown vessel_type {v['vessel_type']}")
        if not 1950 <= v["built_year"] <= 2100:
            problems.append(f"{vid}: implausible built_year {v['built_year']}")

    port_ids = {p["port_id"] for p in ports}
    if len(port_ids) != len(ports):
        problems.append("duplicate port_id")
    for p in ports:
        if p["role"] not in ("load", "discharge", "bunker"):
            problems.append(f"{p['port_id']}: unknown role {p['role']}")

    cargo_ids = {c["cargo_code"] for c in cargoes}
    if len(cargo_ids) != len(cargoes):
        problems.append("duplicate cargo_code")

    # Every port and cargo the generator can reach has to exist.
    for mix in DISCHARGE_MIX.values():
        for pid, _ in mix:
            if pid not in port_ids:
                problems.append(f"discharge mix references missing port {pid}")
    for mix in LOAD_PORTS.values():
        for pid, _ in mix:
            if pid not in port_ids:
                problems.append(f"load mix references missing port {pid}")
    for mix in CARGO_MIX.values():
        for code, _ in mix:
            if code not in cargo_ids:
                problems.append(f"cargo mix references missing cargo {code}")

    return problems


def derive_builders(vessels: list[dict]) -> list[dict]:
    builders: dict[str, dict] = {}
    for v in vessels:
        if not v["builder"]:
            v["builder_id"] = None
            continue
        bid = slugify(v["builder"])
        builders.setdefault(bid, {
            "builder_id": bid,
            "name": v["builder"],
            "country": v["builder_country"],
        })
        v["builder_id"] = bid
    return sorted(builders.values(), key=lambda b: b["name"])


def generate_voyages(vessels, ports, rng: random.Random) -> list[dict]:
    """Walk each ship through the period, one laden leg and ballast leg at a time."""
    distance = {p["port_id"]: (p["sea_distance_from_ahmadi_nm"] or 0) for p in ports}
    voyages: list[dict] = []

    for vessel in vessels:
        vtype = vessel["vessel_type"]
        cargo_class = vessel["cargo_class"]
        capacity = vessel["dwt"] or FALLBACK_DWT[vtype]

        # Stagger each ship's first sailing so the fleet is not all in step.
        cursor = PERIOD_START + timedelta(days=rng.randint(0, 45))

        while cursor < PERIOD_END:
            discharge = weighted(rng, DISCHARGE_MIX[vtype])
            load = weighted(rng, LOAD_PORTS[cargo_class])
            cargo = weighted(rng, CARGO_MIX[cargo_class])

            nm = distance[discharge]
            if nm <= 0:
                cursor += timedelta(days=7)
                continue

            laden_speed = round(rng.uniform(11.8, 15.2), 1)
            sea_days = max(1, round(nm / (laden_speed * 24)))
            arrival = cursor + timedelta(days=sea_days)
            if arrival > PERIOD_END:
                break

            # Parcels load to a little under deadweight — bunkers, stores and
            # the draught the loading terminal allows all take a share.
            tonnes = int(capacity * rng.uniform(0.90, 0.97))

            # Worldscale points: small parcels on short legs price higher.
            base = {"VLCC": 55, "Aframax": 110, "MR Product Tanker": 165,
                    "VLGC": 85, "LPG Carrier": 95, "Bunker Vessel": 200}[vtype]
            rate = round(base * rng.uniform(0.7, 1.6), 1)

            voyages.append({
                "voyage_id": "",  # assigned once the whole set is sorted
                "vessel_id": vessel["vessel_id"],
                "load_port_id": load,
                "discharge_port_id": discharge,
                "cargo_code": cargo,
                "departure_date": cursor.isoformat(),
                "arrival_date": arrival.isoformat(),
                "sea_days": sea_days,
                "distance_nm": nm,
                "laden_speed_knots": laden_speed,
                "cargo_tonnes": tonnes,
                "freight_rate_ws": rate,
                "data_source": "synthetic",
            })

            # Discharge, then ballast home, then load again.
            discharge_days = rng.randint(2, 5)
            ballast_days = max(1, round(nm / (rng.uniform(12.5, 15.5) * 24)))
            load_days = rng.randint(2, 4)
            cursor = arrival + timedelta(days=discharge_days + ballast_days + load_days)

    voyages.sort(key=lambda r: (r["departure_date"], r["vessel_id"]))
    for i, voyage in enumerate(voyages, start=1):
        year = voyage["departure_date"][:4]
        voyage["voyage_id"] = f"V-{year}-{i:05d}"
    return voyages


def summarise_voyages(voyages, ports, cargoes) -> dict:
    """Roll the synthetic voyages up into the handful of totals the page draws."""
    region = {p["port_id"]: p["region"] for p in ports}
    country = {p["port_id"]: p["country"] for p in ports}
    port_name = {p["port_id"]: p["name"] for p in ports}
    category = {c["cargo_code"]: c["category"] for c in cargoes}

    def roll(key_of):
        out: dict = {}
        for v in voyages:
            key = key_of(v)
            bucket = out.setdefault(key, {"voyages": 0, "tonnes": 0})
            bucket["voyages"] += 1
            bucket["tonnes"] += v["cargo_tonnes"]
        return out

    def as_rows(rolled, label):
        rows = [{label: k, **totals} for k, totals in rolled.items()]
        rows.sort(key=lambda r: r["tonnes"], reverse=True)
        return rows

    return {
        "total_voyages": len(voyages),
        "total_tonnes": sum(v["cargo_tonnes"] for v in voyages),
        "by_region": as_rows(roll(lambda v: region[v["discharge_port_id"]]), "region"),
        "by_country": as_rows(roll(lambda v: country[v["discharge_port_id"]]), "country"),
        "by_port": as_rows(roll(lambda v: port_name[v["discharge_port_id"]]), "port"),
        "by_cargo_category": as_rows(roll(lambda v: category[v["cargo_code"]]), "category"),
        "by_year": sorted(
            as_rows(roll(lambda v: v["departure_date"][:4]), "year"),
            key=lambda r: r["year"]),
    }


def sql_literal(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return repr(value)
    return "'" + str(value).replace("'", "''") + "'"


def insert_block(table: str, columns: list[str], rows: list[dict]) -> str:
    lines = [f"-- {len(rows)} rows", f"INSERT INTO {table} ({', '.join(columns)}) VALUES"]
    body = [f"  ({', '.join(sql_literal(row.get(c)) for c in columns)})" for row in rows]
    lines.append(",\n".join(body) + ";")
    return "\n".join(lines) + "\n"


def write_csv(name: str, columns: list[str], rows: list[dict]) -> None:
    with (DATA / name).open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({c: ("" if row.get(c) is None else row.get(c)) for c in columns})


def write_json(name: str, payload) -> None:
    (DATA / name).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    vessels = coerce(read_csv("vessels.csv"), VESSEL_INT, VESSEL_FLOAT)
    ports = coerce(read_csv("ports.csv"), PORT_INT, PORT_FLOAT)
    cargoes = coerce(read_csv("cargo_types.csv"), floats=CARGO_FLOAT)

    problems = validate(vessels, ports, cargoes)
    if problems:
        print("Source tables failed validation:", file=sys.stderr)
        for problem in problems:
            print(f"  - {problem}", file=sys.stderr)
        return 1

    builders = derive_builders(vessels)
    rng = random.Random(SEED)
    voyages = generate_voyages(vessels, ports, rng)

    builder_cols = ["builder_id", "name", "country"]
    port_cols = list(ports[0].keys())
    cargo_cols = list(cargoes[0].keys())
    vessel_cols = [
        "vessel_id", "name", "name_ar", "imo", "mmsi", "call_sign", "vessel_type",
        "cargo_class", "dwt", "dwt_basis", "capacity_cbm", "loa_m", "beam_m",
        "built_year", "builder_id", "builder", "builder_country", "flag",
        "operator", "status", "notes",
    ]
    voyage_cols = list(voyages[0].keys())

    write_csv("builders.csv", builder_cols, builders)
    write_csv("voyages_synthetic.csv", voyage_cols, voyages)

    write_json("builders.json", builders)
    write_json("ports.json", ports)
    write_json("cargo_types.json", cargoes)
    write_json("vessels.json", [{c: v.get(c) for c in vessel_cols} for v in vessels])
    write_json("voyages_synthetic.json", voyages)

    # One bundle for the web page, so it makes a single request. The voyage
    # table is summarised rather than shipped whole — the page only ever draws
    # the aggregates, and the full set is half a megabyte.
    write_json("fleet.json", {
        "meta": {
            "title": "Kuwaiti Oil Tankers",
            "operator": "Kuwait Oil Tanker Company (KOTC)",
            "generated_by": "tankers/build.py",
            "seed": SEED,
            "voyage_period": [PERIOD_START.isoformat(), PERIOD_END.isoformat()],
            "voyages_are_synthetic": True,
        },
        "vessels": [{c: v.get(c) for c in vessel_cols} for v in vessels],
        "ports": ports,
        "cargo_types": cargoes,
        "builders": builders,
        "voyage_summary": summarise_voyages(voyages, ports, cargoes),
    })

    seed_sql = "\n".join([
        "-- Generated by tankers/build.py — do not edit by hand.",
        "-- Edit data/vessels.csv, data/ports.csv or data/cargo_types.csv and re-run it.",
        "--",
        "-- Load order matters: builders, ports and cargo_types are referenced by",
        "-- vessels and voyages. Rows in `voyages` are SYNTHETIC (see README.md).",
        "",
        "BEGIN;",
        "",
        insert_block("builders", builder_cols, builders),
        insert_block("ports", port_cols, ports),
        insert_block("cargo_types", cargo_cols, cargoes),
        insert_block("vessels", vessel_cols, vessels),
        insert_block("voyages", voyage_cols, voyages),
        "COMMIT;",
        "",
    ])
    (ROOT / "seed.sql").write_text(seed_sql, encoding="utf-8")

    print(f"vessels        {len(vessels):>6}")
    print(f"ports          {len(ports):>6}")
    print(f"cargo types    {len(cargoes):>6}")
    print(f"builders       {len(builders):>6}  (derived)")
    print(f"voyages        {len(voyages):>6}  (synthetic, seed {SEED})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
