#!/usr/bin/env python3
"""
Build language -> ISO2 country lists for VisitedPlaces-style maps.

Data source:
- Wikidata entity search (to resolve language QIDs automatically)
- Wikidata Query Service (SPARQL) to fetch countries with ISO2 codes (P297)
  where language is official (P37) OR spoken/written/signed (P1412).

Output:
- languageMaps.json (display name keyed)
- languageMaps_debug.json (includes raw labels for sanity checking)
"""

from __future__ import annotations
import json
import time
import urllib.parse
from typing import Dict, List, Optional, Tuple

import requests


WIKIDATA_SEARCH_API = "https://www.wikidata.org/w/api.php"
WDQS_ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "language-map-builder/1.0 (local script; contact: you@example.com)"

# --------- CONFIG (edit this list to add languages) ----------
LANGUAGES = [
    {"display": "Spanish",            "search": "Spanish",     "preferred": []},
    {"display": "French",             "search": "French",      "preferred": []},
    {"display": "German",             "search": "German",      "preferred": []},
    {"display": "Chinese (Mandarin)", "search": "Chinese",     "preferred": ["CN", "TW", "SG"]},
    {"display": "Japanese",           "search": "Japanese",    "preferred": ["JP"]},
    {"display": "Korean",             "search": "Korean",      "preferred": ["KR", "KP"]},
    {"display": "Italian",            "search": "Italian",     "preferred": ["IT", "SM", "CH"]},
    {"display": "Portuguese (BR)",    "search": "Portuguese",  "preferred": ["BR"]},
]

MODE = "official_or_spoken"  # fixed to what you chose

# Countries to exclude from highlighting (e.g., your home country)
EXCLUDE_ISO2 = {"US"}

# --------- VisitedPlaces URL generation ----------
VISITED_BASE = "https://visitedplaces.com/world/"
VISITED_SETTINGS = {
    "map": "world",
    "projection": "geoOrthographic",
    "theme": "dark-green",
    "water": "1",
    "graticule": "1",
    "names": "0",
    "duration": "700",
    "placeduration": "600",
    "slider": "0",
    "autoplay": "1",
    "autozoom": "step",
    "autostep": "1",
    "home": "-",
}


def default_pos(lon: float = 0.0, lat: float = 0.0, zoom: float = 1.8) -> str:
    """
    VisitedPlaces position payload format (observed from their generated URLs):
    zoom_lon_lat_-lon_-lat

    Using per-country lon/lat makes autozoom=step actually move the camera.
    """
    return f"{zoom}_{lon:.4f}_{lat:.4f}_{-lon:.4f}_{-lat:.4f}"

def parse_wkt_point(wkt: str) -> Optional[Tuple[float, float]]:
    """
    Parse a WKT Point string like: 'Point(-97.0 38.0)'
    Returns (lon, lat) or None.
    """
    if not wkt:
        return None
    wkt = wkt.strip()
    if not wkt.lower().startswith("point(") or not wkt.endswith(")"):
        return None
    inner = wkt[wkt.find("(")+1:-1].strip()
    parts = inner.split()
    if len(parts) != 2:
        return None
    try:
        lon = float(parts[0])
        lat = float(parts[1])
        return lon, lat
    except Exception:
        return None

def build_visitedplaces_url(step_name: str, iso2_list: List[str], coord_by_iso2: Dict[str, Tuple[float, float]]) -> str:
    """
    Build a VisitedPlaces URL.

    IMPORTANT:
    - The `places` parameter uses special delimiters: `*` between steps, `~` between fields, and `_` between ISO2 codes.
    - We must NOT percent-encode these delimiters, or VisitedPlaces will not parse the steps correctly.
    """
    # Build steps: one country per step so animation moves country-by-country.
    # VisitedPlaces step format: Label~CC~pos
    # The 3rd segment (~pos) is important for step-based camera movement.
    steps: List[str] = []
    for code in iso2_list:
        safe_label = urllib.parse.quote(code, safe="")  # label in step list (hidden since names=0)
        lonlat = coord_by_iso2.get(code)
        if lonlat:
            lon, lat = lonlat
            pos = default_pos(lon, lat)
        else:
            pos = default_pos()
        steps.append(f"{safe_label}~{code}~{pos}")

    # If there are no countries, fall back to a no-op step (prevents empty places param)
    if not steps:
        safe_lang = urllib.parse.quote(step_name, safe="")
        steps = [f"{safe_lang}~~{default_pos()}"]

    # Build the full places string (keep delimiters unescaped)
    places_value = "*".join(steps)

    # Assemble query params, ensuring delimiters stay intact
    params = {k: str(v) for k, v in VISITED_SETTINGS.items()}
    params["places"] = places_value

    # Encode values but keep VisitedPlaces delimiters safe
    safe_chars = "~*_-.,+"
    query = "&".join(
        f"{urllib.parse.quote(k)}={urllib.parse.quote(v, safe=safe_chars)}"
        for k, v in params.items()
    )
    return VISITED_BASE + "?" + query


def wd_search_qid(search_term: str, session: requests.Session) -> Tuple[str, str]:
    """
    Resolve a search term to a Wikidata entity QID (best match).
    Returns (qid, label).
    """
    params = {
        "action": "wbsearchentities",
        "search": search_term,
        "language": "en",
        "format": "json",
        "limit": 5,
        "origin": "*",
    }
    r = session.get(WIKIDATA_SEARCH_API, params=params, headers={"User-Agent": USER_AGENT}, timeout=30)
    r.raise_for_status()
    data = r.json()
    hits = data.get("search", [])
    if not hits:
        raise RuntimeError(f'No Wikidata entity found for search "{search_term}"')

    # Pick the first hit; if you ever see a wrong QID, change "search" term above.
    top = hits[0]
    qid = top.get("id")
    label = top.get("label") or search_term
    if not qid:
        raise RuntimeError(f'Bad search response for "{search_term}" (missing id)')
    return qid, label


def wdqs_search_qid_fallback(search_term: str, session: requests.Session) -> Tuple[str, str]:
    """
    Fallback resolver using WDQS (SPARQL) + wikibase:mwapi EntitySearch.
    Filters results to entities that are (subclass of) language (Q34770).
    Returns (qid, label).
    """
    sparql = f"""
SELECT ?item ?itemLabel WHERE {{
  SERVICE wikibase:mwapi {{
    bd:serviceParam wikibase:api "EntitySearch" .
    bd:serviceParam wikibase:endpoint "www.wikidata.org" .
    bd:serviceParam mwapi:search {json.dumps(search_term)} .
    bd:serviceParam mwapi:language "en" .
    ?item wikibase:apiOutputItem mwapi:item .
  }}
  ?item wdt:P31/wdt:P279* wd:Q34770 .
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
LIMIT 5
""".strip()

    headers = {
        "Accept": "application/sparql-results+json",
        "Content-Type": "application/sparql-query; charset=utf-8",
        "User-Agent": USER_AGENT,
    }
    r = session.post(WDQS_ENDPOINT, data=sparql.encode("utf-8"), headers=headers, timeout=60)
    r.raise_for_status()
    js = r.json()

    bindings = js.get("results", {}).get("bindings", [])
    if not bindings:
        raise RuntimeError(f'No language entity found via WDQS fallback for "{search_term}"')

    uri = bindings[0].get("item", {}).get("value", "")
    label = bindings[0].get("itemLabel", {}).get("value", "") or search_term
    qid = uri.rsplit("/", 1)[-1] if uri else ""
    if not qid:
        raise RuntimeError(f'Bad WDQS fallback response for "{search_term}" (missing QID)')
    return qid, label


def wdqs_countries_for_language(qid: str, session: requests.Session) -> List[Dict[str, str]]:
    """
    Query countries that have ISO2 codes (P297) where language is:
    - official language (P37) OR
    - language spoken/written/signed (P1412)
    """
    sparql = f"""
SELECT DISTINCT ?iso2 ?countryLabel ?coord WHERE {{
  # Countries with ISO2 codes
  ?country wdt:P31/wdt:P279* wd:Q6256 .
  ?country wdt:P297 ?iso2 .
  OPTIONAL {{ ?country wdt:P625 ?coord . }}

  # Keep only countries where at least one official/spoken language is the root language OR a subclass of it.
  FILTER EXISTS {{
    ?country (wdt:P37|wdt:P1412) / wdt:P279* wd:{qid} .
  }}

  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
ORDER BY ?iso2
""".strip()

    headers = {
        "Accept": "application/sparql-results+json",
        "Content-Type": "application/sparql-query; charset=utf-8",
        # Give WDQS a UA (helps avoid 429s/blocks)
        "User-Agent": USER_AGENT,
    }
    r = session.post(WDQS_ENDPOINT, data=sparql.encode("utf-8"), headers=headers, timeout=60)
    r.raise_for_status()
    js = r.json()

    rows: List[Dict[str, str]] = []
    for b in js.get("results", {}).get("bindings", []):
        iso2 = (b.get("iso2", {}).get("value") or "").strip().upper()
        country_label = (b.get("countryLabel", {}).get("value") or "").strip()
        coord_wkt = (b.get("coord", {}).get("value") or "").strip()
        if iso2:
            rows.append({"iso2": iso2, "country": country_label, "coord_wkt": coord_wkt})
    # Deduplicate by iso2
    seen = set()
    out = []
    for row in rows:
        if row["iso2"] not in seen:
            out.append(row)
            seen.add(row["iso2"])
    return out


def order_iso2(iso2: List[str], preferred: List[str]) -> List[str]:
    """
    Put preferred codes first (in the order provided), then the rest alphabetically.
    """
    preferred_upper = [p.upper() for p in preferred]
    iso2_set = set(iso2)

    head = [p for p in preferred_upper if p in iso2_set]
    tail = sorted([c for c in iso2 if c not in set(head)])
    return head + tail


def main() -> None:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    output: Dict[str, Dict[str, object]] = {}
    debug: Dict[str, Dict[str, object]] = {}

    for i, cfg in enumerate(LANGUAGES, start=1):
        display = cfg["display"]
        search_term = cfg["search"]
        preferred = cfg.get("preferred", [])

        print(f"[{i}/{len(LANGUAGES)}] Resolving: {display}  (search='{search_term}')")
        try:
            qid, resolved_label = wd_search_qid(search_term, session)
        except Exception as e:
            print(f"      ! REST resolver failed ({type(e).__name__}: {e}); trying WDQS fallback...")
            qid, resolved_label = wdqs_search_qid_fallback(search_term, session)

        print(f"      -> QID {qid} ({resolved_label})")
        # small delay to be polite to APIs
        time.sleep(0.2)

        rows = wdqs_countries_for_language(qid, session)
        coord_by_iso2: Dict[str, Tuple[float, float]] = {}
        for r in rows:
            wkt = r.get("coord_wkt", "")
            lonlat = parse_wkt_point(wkt) if wkt else None
            if lonlat:
                coord_by_iso2[r["iso2"]] = lonlat

        iso2 = [r["iso2"] for r in rows]
        iso2 = [c for c in iso2 if c not in EXCLUDE_ISO2]
        iso2 = order_iso2(iso2, preferred)

        output[display] = {
            "qid": qid,
            "resolved_label": resolved_label,
            "mode": MODE,
            "preferred": [p.upper() for p in preferred],
            "iso2": iso2,
            "visitedplaces_url": build_visitedplaces_url(display, iso2, coord_by_iso2),
        }
        debug[display] = {
            "qid": qid,
            "resolved_label": resolved_label,
            "mode": MODE,
            "preferred": [p.upper() for p in preferred],
            "countries": rows,  # iso2 + country label for sanity checking
        }

        print(f"      -> {len(iso2)} countries")

    BASE_PATH = "/Users/hotcocks/Desktop/spenceleyyy.github.io"

    with open(f"{BASE_PATH}/languageMaps.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    globe_urls = {name: data["visitedplaces_url"] for name, data in output.items()}
    with open(f"{BASE_PATH}/languageGlobes.json", "w", encoding="utf-8") as f:
        json.dump(globe_urls, f, ensure_ascii=False, indent=2)

    with open(f"{BASE_PATH}/languageMaps_debug.json", "w", encoding="utf-8") as f:
        json.dump(debug, f, ensure_ascii=False, indent=2)

    print("\nWrote: languageMaps.json")
    print("Wrote: languageGlobes.json (VisitedPlaces URLs per language)")
    print("Wrote: languageMaps_debug.json (includes country labels for review)")


if __name__ == "__main__":
    main()