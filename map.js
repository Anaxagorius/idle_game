/* ==========================================================================
   Idle Empire Ultimate - map.js
   Nova Scotia county data: SVG polygons, resource zones, terrain requirements.
   viewBox coordinate space: "0 0 780 400"
   Mainland: x≈20–550, Cape Breton Island: x≈555–775
   ========================================================================== */

(function () {
  var GameMap = {};

  /* --------------------------------------------------------------------------
     Building → terrain requirements
     null = no terrain constraint (space-age buildings).
  -------------------------------------------------------------------------- */
  GameMap.BUILDING_TERRAIN = {
    worker:        ['forest', 'farmland', 'urban'],
    farm:          ['farmland'],
    mine:          ['mine'],
    factory:       ['urban'],
    bank:          ['urban'],
    corporation:   ['urban'],
    laboratory:    ['urban'],
    powerplant:    ['urban', 'coastal'],
    refinery:      ['mine', 'coastal'],
    shipyard:      ['coastal'],
    university:    ['urban'],
    datacenter:    ['urban'],
    spaceport:     ['urban'],
    orbital:       null,
    mooncolony:    null,
    marscolony:    null,
    dysonswarm:    null,
    galacticnexus: null,
  };

  /* --------------------------------------------------------------------------
     Terrain type display info
  -------------------------------------------------------------------------- */
  GameMap.TERRAIN_INFO = {
    farmland: { label: 'Farmland', icon: '🌾', markerColor: '#8bc34a', markerBorder: '#558b2f' },
    forest:   { label: 'Forest',   icon: '🌲', markerColor: '#2e7d32', markerBorder: '#1b5e20' },
    mine:     { label: 'Mine',     icon: '⛏',  markerColor: '#795548', markerBorder: '#4e342e' },
    urban:    { label: 'Urban',    icon: '🏙',  markerColor: '#546e7a', markerBorder: '#263238' },
    coastal:  { label: 'Coastal',  icon: '⚓',  markerColor: '#0288d1', markerBorder: '#01579b' },
  };

  /* --------------------------------------------------------------------------
     Building pin icons (first letter fallback used in SVG text)
  -------------------------------------------------------------------------- */
  GameMap.BUILDING_ICONS = {
    worker:        '👷', farm:       '🌾', mine:     '⛏',
    factory:       '🏭', bank:       '🏦', corporation: '🏢',
    laboratory:    '🔬', powerplant: '⚡', refinery: '🛢',
    shipyard:      '⚓', university: '🎓', datacenter: '💾',
    spaceport:     '🚀', orbital:    '🛰', mooncolony: '🌙',
    marscolony:    '🔴', dysonswarm: '☀', galacticnexus: '🌌',
  };

  /* --------------------------------------------------------------------------
     Nova Scotia Counties
     Each county has:
       id, name, color, textColor  — identity & display
       center [x, y]               — label anchor (approx polygon centroid)
       points (SVG polygon string) — boundary polygon
       description                 — flavour text shown in selector
       resources []                — { type, x, y } zones for building placement
  -------------------------------------------------------------------------- */
  GameMap.COUNTIES = [

    /* ===================================================================
       MAINLAND
       =================================================================== */
    {
      id: 'cumberland', name: 'Cumberland',
      color: '#c0392b', textColor: '#fff',
      center: [122, 93],
      points: '40,35 195,22 218,82 198,132 118,148 55,142 30,92',
      description: 'Coal mines and boreal forests — gateway to New Brunswick.',
      resources: [
        { type: 'mine',     x: 90,  y: 68  },
        { type: 'mine',     x: 158, y: 52  },
        { type: 'forest',   x: 65,  y: 108 },
        { type: 'forest',   x: 128, y: 118 },
        { type: 'farmland', x: 158, y: 115 },
        { type: 'urban',    x: 175, y: 88  },
      ],
    },
    {
      id: 'colchester', name: 'Colchester',
      color: '#e67e22', textColor: '#fff',
      center: [258, 75],
      points: '195,22 302,16 328,72 306,128 198,132 218,82',
      description: 'Fertile farmland and the urban hub of Truro.',
      resources: [
        { type: 'farmland', x: 228, y: 52  },
        { type: 'farmland', x: 272, y: 48  },
        { type: 'farmland', x: 255, y: 100 },
        { type: 'urban',    x: 292, y: 102 },
        { type: 'forest',   x: 215, y: 108 },
      ],
    },
    {
      id: 'pictou', name: 'Pictou',
      color: '#f39c12', textColor: '#fff',
      center: [349, 53],
      points: '302,16 382,8 402,55 372,96 328,72 306,72',
      description: 'Birthplace of Nova Scotia\'s coal industry.',
      resources: [
        { type: 'mine',    x: 338, y: 38 },
        { type: 'mine',    x: 370, y: 55 },
        { type: 'urban',   x: 350, y: 72 },
        { type: 'coastal', x: 316, y: 44 },
        { type: 'forest',  x: 358, y: 88 },
      ],
    },
    {
      id: 'antigonish', name: 'Antigonish',
      color: '#27ae60', textColor: '#fff',
      center: [413, 55],
      points: '382,8 458,16 468,68 432,102 396,88 375,65 378,38',
      description: 'Rural county of mixed farmland and highland forests.',
      resources: [
        { type: 'farmland', x: 415, y: 38 },
        { type: 'farmland', x: 440, y: 55 },
        { type: 'forest',   x: 420, y: 78 },
        { type: 'urban',    x: 435, y: 65 },
      ],
    },
    {
      id: 'guysborough', name: 'Guysborough',
      color: '#16a085', textColor: '#fff',
      center: [474, 150],
      points: '432,102 474,85 536,93 546,152 518,202 464,212 422,162 398,115',
      description: 'Vast wilderness, rugged coastline and deep forests.',
      resources: [
        { type: 'forest',  x: 462, y: 112 },
        { type: 'forest',  x: 502, y: 125 },
        { type: 'forest',  x: 485, y: 175 },
        { type: 'coastal', x: 528, y: 150 },
        { type: 'coastal', x: 508, y: 192 },
        { type: 'mine',    x: 440, y: 138 },
      ],
    },
    {
      id: 'digby', name: 'Digby',
      color: '#d4ac0d', textColor: '#333',
      center: [67, 203],
      points: '28,178 92,162 116,194 93,240 33,244 16,212 18,182',
      description: 'Famous for scallops — Bay of Fundy tides and orchards.',
      resources: [
        { type: 'coastal',  x: 35,  y: 196 },
        { type: 'farmland', x: 82,  y: 180 },
        { type: 'coastal',  x: 55,  y: 234 },
        { type: 'farmland', x: 88,  y: 215 },
        { type: 'urban',    x: 68,  y: 200 },
      ],
    },
    {
      id: 'annapolis', name: 'Annapolis',
      color: '#8e44ad', textColor: '#fff',
      center: [98, 202],
      points: '55,142 118,148 168,185 148,252 82,265 44,228 32,178 55,155',
      description: 'Historic Annapolis Valley with orchards and heritage farms.',
      resources: [
        { type: 'farmland', x: 85,  y: 162 },
        { type: 'farmland', x: 118, y: 178 },
        { type: 'farmland', x: 108, y: 220 },
        { type: 'forest',   x: 64,  y: 195 },
        { type: 'urban',    x: 130, y: 202 },
        { type: 'coastal',  x: 48,  y: 214 },
      ],
    },
    {
      id: 'kings', name: 'Kings',
      color: '#2ecc71', textColor: '#fff',
      center: [157, 191],
      points: '118,148 198,132 208,185 185,228 148,235 128,218 115,192',
      description: 'Heart of the Annapolis Valley — apple orchards and farms.',
      resources: [
        { type: 'farmland', x: 148, y: 162 },
        { type: 'farmland', x: 178, y: 162 },
        { type: 'farmland', x: 168, y: 202 },
        { type: 'farmland', x: 142, y: 220 },
        { type: 'urban',    x: 182, y: 194 },
      ],
    },
    {
      id: 'hants', name: 'Hants',
      color: '#2980b9', textColor: '#fff',
      center: [249, 172],
      points: '198,132 306,128 318,170 280,210 206,213 188,170',
      description: 'Tidal shores, farming communities and mixed forests.',
      resources: [
        { type: 'farmland', x: 222, y: 155 },
        { type: 'farmland', x: 268, y: 148 },
        { type: 'forest',   x: 245, y: 188 },
        { type: 'forest',   x: 292, y: 168 },
        { type: 'coastal',  x: 208, y: 148 },
      ],
    },
    {
      id: 'halifax', name: 'Halifax',
      color: '#3498db', textColor: '#fff',
      center: [335, 181],
      points: '282,128 392,102 420,152 396,206 355,234 306,237 272,215 260,170',
      description: 'Provincial capital. Major port, urban core and industrial hub.',
      resources: [
        { type: 'urban',   x: 338, y: 145 },
        { type: 'urban',   x: 366, y: 158 },
        { type: 'urban',   x: 356, y: 185 },
        { type: 'urban',   x: 340, y: 215 },
        { type: 'coastal', x: 388, y: 178 },
        { type: 'coastal', x: 320, y: 207 },
        { type: 'forest',  x: 298, y: 162 },
      ],
    },
    {
      id: 'lunenburg', name: 'Lunenburg',
      color: '#9b59b6', textColor: '#fff',
      center: [303, 272],
      points: '272,222 352,232 374,276 344,316 285,322 244,282 248,252',
      description: 'UNESCO heritage port — fishing, forests and coast.',
      resources: [
        { type: 'coastal',  x: 362, y: 260 },
        { type: 'coastal',  x: 318, y: 300 },
        { type: 'forest',   x: 278, y: 270 },
        { type: 'farmland', x: 302, y: 255 },
        { type: 'urban',    x: 330, y: 272 },
      ],
    },
    {
      id: 'queens', name: 'Queens',
      color: '#1abc9c', textColor: '#fff',
      center: [209, 275],
      points: '185,238 258,228 278,272 248,312 192,322 154,285 158,262',
      description: 'Forested interior with rugged Atlantic coastline.',
      resources: [
        { type: 'forest',   x: 195, y: 262 },
        { type: 'forest',   x: 235, y: 255 },
        { type: 'coastal',  x: 252, y: 295 },
        { type: 'coastal',  x: 196, y: 310 },
        { type: 'farmland', x: 218, y: 278 },
      ],
    },
    {
      id: 'shelburne', name: 'Shelburne',
      color: '#d35400', textColor: '#fff',
      center: [111, 300],
      points: '92,258 163,268 172,308 148,340 94,346 52,308 54,278',
      description: 'Coastal fishing heritage and deep wild forests.',
      resources: [
        { type: 'coastal', x: 72,  y: 285 },
        { type: 'coastal', x: 148, y: 298 },
        { type: 'forest',  x: 108, y: 278 },
        { type: 'forest',  x: 132, y: 320 },
        { type: 'urban',   x: 118, y: 302 },
      ],
    },
    {
      id: 'yarmouth', name: 'Yarmouth',
      color: '#7f8c8d', textColor: '#fff',
      center: [56, 272],
      points: '30,228 96,245 94,278 66,312 26,300 14,265 24,243',
      description: 'Southwest tip — fishing fleets and the ferry gateway.',
      resources: [
        { type: 'coastal',  x: 28,  y: 258 },
        { type: 'coastal',  x: 68,  y: 260 },
        { type: 'coastal',  x: 42,  y: 295 },
        { type: 'farmland', x: 75,  y: 272 },
        { type: 'urban',    x: 55,  y: 272 },
      ],
    },

    /* ===================================================================
       CAPE BRETON ISLAND
       =================================================================== */
    {
      id: 'richmond', name: 'Richmond',
      color: '#e74c3c', textColor: '#fff',
      center: [601, 236],
      points: '572,205 635,192 652,245 615,272 570,265 558,238',
      description: 'Coastal gateway to the Bras d\'Or Lakes, rich forests.',
      resources: [
        { type: 'coastal',  x: 575, y: 225 },
        { type: 'coastal',  x: 638, y: 232 },
        { type: 'forest',   x: 598, y: 250 },
        { type: 'forest',   x: 620, y: 260 },
        { type: 'farmland', x: 608, y: 222 },
      ],
    },
    {
      id: 'inverness', name: 'Inverness',
      color: '#00b894', textColor: '#fff',
      center: [600, 165],
      points: '565,128 635,112 658,162 645,198 578,208 555,182 550,152',
      description: 'Coal seams, coastal cliffs and scenic highlands.',
      resources: [
        { type: 'mine',     x: 578, y: 148 },
        { type: 'mine',     x: 622, y: 138 },
        { type: 'coastal',  x: 558, y: 168 },
        { type: 'forest',   x: 605, y: 180 },
        { type: 'farmland', x: 632, y: 165 },
      ],
    },
    {
      id: 'victoria', name: 'Victoria',
      color: '#6c5ce7', textColor: '#fff',
      center: [660, 111],
      points: '618,78 692,70 710,124 683,147 648,138 622,113',
      description: 'Northern Cape Breton highlands — forests and coast.',
      resources: [
        { type: 'forest',  x: 640, y: 100 },
        { type: 'forest',  x: 672, y: 96  },
        { type: 'coastal', x: 692, y: 118 },
        { type: 'coastal', x: 648, y: 130 },
      ],
    },
    {
      id: 'cape_breton', name: 'Cape Breton',
      color: '#0984e3', textColor: '#fff',
      center: [710, 162],
      points: '682,108 752,92 771,162 757,208 710,218 680,193 660,152 658,120',
      description: 'Coal mines and the urban centre of Sydney.',
      resources: [
        { type: 'mine',    x: 695, y: 128 },
        { type: 'mine',    x: 732, y: 118 },
        { type: 'urban',   x: 718, y: 158 },
        { type: 'urban',   x: 742, y: 175 },
        { type: 'coastal', x: 755, y: 145 },
        { type: 'coastal', x: 755, y: 188 },
      ],
    },
  ];

  /* --------------------------------------------------------------------------
     Fast lookup by id
  -------------------------------------------------------------------------- */
  GameMap.COUNTY_MAP = {};
  GameMap.COUNTIES.forEach(function (c) { GameMap.COUNTY_MAP[c.id] = c; });

  Game.Map = GameMap;
})();
