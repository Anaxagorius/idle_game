/* ==========================================================================
   Idle Empire Ultimate - map.js
   Nova Scotia county data: SVG paths (real boundaries), resource zones, terrain requirements.
   viewBox coordinate space: "0 0 780 400"
   Projection: equirectangular lon [-66.5, -59.55] → x [15, 765], lat [43.35, 47.28] → y [15, 385]
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
       path (SVG path string)      — boundary path (real boundaries, equirectangular projection)
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
      center: [277, 167],
      path: 'M 351.2,158.3 L 367.5,154.1 L 328.8,152.4 L 346.8,152.1 L 340.8,149.8 L 348.0,148.7 L 342.3,147.0 L 319.8,147.4 L 322.6,150.1 L 319.2,151.7 L 320.8,149.6 L 305.5,145.8 L 294.5,137.1 L 268.7,137.4 L 257.3,146.8 L 255.1,150.7 L 258.4,152.1 L 251.9,157.5 L 247.9,157.3 L 251.7,152.1 L 243.2,155.0 L 235.8,165.3 L 193.1,184.6 L 198.9,185.1 L 186.1,189.2 L 183.1,198.8 L 194.6,196.4 L 201.6,198.8 L 201.1,202.2 L 208.2,200.1 L 210.8,194.1 L 222.4,191.5 L 242.4,195.3 L 272.4,191.8 L 270.4,178.1 L 309.6,178.5 L 315.3,183.3 L 333.5,177.8 L 343.9,170.5 L 341.6,164.0 L 351.2,158.3 Z',
      description: 'Coal mines and boreal forests — gateway to New Brunswick.',
      resources: [
        { type: 'mine', x: 275,  y: 167  },
        { type: 'mine', x: 187,  y: 196  },
        { type: 'forest', x: 364,  y: 154  },
        { type: 'forest', x: 320,  y: 180  },
        { type: 'farmland', x: 231,  y: 180  },
        { type: 'urban', x: 305,  y: 146  },
      ],
    },
    {
      id: 'colchester', name: 'Colchester',
      color: '#e67e22', textColor: '#fff',
      center: [336, 184],
      path: 'M 273.6,190.4 L 290.5,192.6 L 295.0,196.6 L 309.1,191.9 L 352.1,195.5 L 340.5,199.9 L 350.1,211.1 L 350.3,226.8 L 423.5,203.7 L 391.8,183.9 L 376.1,158.9 L 369.9,159.4 L 373.7,157.6 L 360.7,161.2 L 349.1,158.0 L 340.9,165.2 L 343.9,170.5 L 315.3,183.3 L 309.6,178.5 L 270.4,178.1 L 273.6,190.4 Z',
      description: 'Fertile farmland and the urban hub of Truro.',
      resources: [
        { type: 'farmland', x: 353,  y: 192  },
        { type: 'farmland', x: 273,  y: 178  },
        { type: 'farmland', x: 420,  y: 203  },
        { type: 'urban', x: 378,  y: 162  },
        { type: 'forest', x: 310,  y: 189  },
      ],
    },
    {
      id: 'pictou', name: 'Pictou',
      color: '#f39c12', textColor: '#fff',
      center: [430, 169],
      path: 'M 475.2,161.7 L 452.9,166.8 L 463.5,165.5 L 446.2,173.3 L 448.9,168.3 L 428.4,165.3 L 425.8,167.4 L 430.8,169.3 L 430.3,174.9 L 430.3,171.0 L 423.2,167.8 L 415.0,168.8 L 430.8,163.8 L 416.8,158.3 L 425.2,157.5 L 380.9,153.6 L 385.1,158.2 L 376.1,158.9 L 391.8,183.9 L 423.5,203.7 L 490.7,193.5 L 475.2,161.7 Z',
      description: 'Birthplace of Nova Scotia\'s coal industry.',
      resources: [
        { type: 'mine', x: 433,  y: 179  },
        { type: 'mine', x: 378,  y: 161  },
        { type: 'urban', x: 488,  y: 193  },
        { type: 'coastal', x: 466,  y: 165  },
        { type: 'forest', x: 401,  y: 189  },
      ],
    },
    {
      id: 'antigonish', name: 'Antigonish',
      color: '#27ae60', textColor: '#fff',
      center: [515, 169],
      path: 'M 490.7,193.5 L 506.7,192.0 L 561.4,168.6 L 547.1,164.5 L 540.9,171.6 L 525.5,168.7 L 522.1,173.2 L 521.9,169.6 L 517.1,169.5 L 523.6,169.0 L 512.8,164.5 L 510.1,171.9 L 504.7,171.2 L 512.2,166.2 L 512.6,160.4 L 508.7,150.1 L 511.7,147.2 L 504.1,146.9 L 475.2,161.7 L 490.7,193.5 Z',
      description: 'Rural county of mixed farmland and highland forests.',
      resources: [
        { type: 'farmland', x: 508,  y: 172  },
        { type: 'farmland', x: 560,  y: 168  },
        { type: 'forest', x: 477,  y: 161  },
        { type: 'urban', x: 491,  y: 193  },
      ],
    },
    {
      id: 'guysborough', name: 'Guysborough',
      color: '#16a085', textColor: '#fff',
      center: [544, 210],
      path: 'M 490.7,193.5 L 423.5,203.7 L 489.5,234.4 L 487.3,232.7 L 502.7,231.8 L 490.0,229.3 L 505.7,228.3 L 503.1,223.2 L 513.1,227.1 L 500.8,216.4 L 516.4,226.2 L 514.9,222.2 L 519.9,223.5 L 517.6,219.6 L 538.0,221.0 L 534.2,218.5 L 538.8,218.0 L 522.0,206.5 L 534.5,214.4 L 536.9,211.5 L 542.9,215.8 L 557.8,215.7 L 574.6,211.7 L 566.9,210.6 L 573.1,205.9 L 587.7,206.2 L 588.1,209.5 L 590.1,201.4 L 595.7,203.5 L 591.1,209.1 L 594.8,210.1 L 603.7,207.0 L 605.9,204.0 L 602.4,201.5 L 610.6,203.9 L 612.2,199.5 L 556.2,195.1 L 554.0,192.1 L 573.9,189.1 L 583.4,183.8 L 561.4,168.6 L 506.7,192.0 L 490.7,193.5 Z',
      description: 'Vast wilderness, rugged coastline and deep forests.',
      resources: [
        { type: 'forest', x: 518,  y: 204  },
        { type: 'forest', x: 427,  y: 204  },
        { type: 'forest', x: 608,  y: 202  },
        { type: 'coastal', x: 563,  y: 170  },
        { type: 'coastal', x: 473,  y: 225  },
        { type: 'mine', x: 563,  y: 212  },
      ],
    },
    {
      id: 'digby', name: 'Digby',
      color: '#d4ac0d', textColor: '#333',
      center: [82, 286],
      path: 'M 102.8,265.4 L 94.3,267.2 L 95.1,261.5 L 91.5,258.8 L 47.8,284.3 L 47.0,288.4 L 75.1,269.5 L 85.6,270.2 L 56.0,291.6 L 53.9,302.4 L 46.0,313.6 L 52.3,323.7 L 81.0,310.8 L 134.0,302.1 L 141.1,294.5 L 102.8,265.4 Z M 45.8,286.0 L 33.7,300.2 L 45.8,286.0 Z',
      description: 'Famous for scallops — Bay of Fundy tides and orchards.',
      resources: [
        { type: 'coastal', x: 90,  y: 291  },
        { type: 'farmland', x: 139,  y: 296  },
        { type: 'coastal', x: 52,  y: 322  },
        { type: 'farmland', x: 52,  y: 283  },
        { type: 'urban', x: 90,  y: 260  },
      ],
    },
    {
      id: 'annapolis', name: 'Annapolis',
      color: '#8e44ad', textColor: '#fff',
      center: [136, 265],
      path: 'M 102.8,265.4 L 141.1,294.5 L 160.5,280.4 L 170.2,281.0 L 201.3,261.3 L 174.8,223.4 L 96.8,256.8 L 97.5,260.9 L 112.1,258.3 L 102.8,265.4 Z',
      description: 'Historic Annapolis Valley with orchards and heritage farms.',
      resources: [
        { type: 'farmland', x: 153,  y: 259  },
        { type: 'farmland', x: 99,  y: 256  },
        { type: 'farmland', x: 199,  y: 262  },
        { type: 'forest', x: 174,  y: 225  },
        { type: 'urban', x: 128,  y: 285  },
        { type: 'coastal', x: 128,  y: 245  },
      ],
    },
    {
      id: 'kings', name: 'Kings',
      color: '#2ecc71', textColor: '#fff',
      center: [234, 221],
      path: 'M 201.3,261.3 L 266.5,222.3 L 252.3,216.7 L 246.0,220.9 L 242.2,218.4 L 240.5,215.5 L 246.9,214.1 L 243.3,210.8 L 248.8,201.5 L 231.7,198.2 L 241.9,202.8 L 174.8,223.4 L 201.3,261.3 Z',
      description: 'Heart of the Annapolis Valley — apple orchards and farms.',
      resources: [
        { type: 'farmland', x: 217,  y: 230  },
        { type: 'farmland', x: 265,  y: 222  },
        { type: 'farmland', x: 177,  y: 225  },
        { type: 'farmland', x: 235,  y: 199  },
        { type: 'urban', x: 202,  y: 260  },
      ],
    },
    {
      id: 'hants', name: 'Hants',
      color: '#2980b9', textColor: '#fff',
      center: [304, 224],
      path: 'M 340.5,199.9 L 307.6,199.8 L 268.0,211.2 L 261.5,218.7 L 266.5,222.3 L 238.1,239.1 L 259.2,252.2 L 301.6,249.5 L 311.1,239.7 L 328.8,234.4 L 335.4,236.0 L 350.9,224.1 L 350.1,211.1 L 340.5,199.9 Z',
      description: 'Tidal shores, farming communities and mixed forests.',
      resources: [
        { type: 'farmland', x: 299,  y: 226  },
        { type: 'farmland', x: 240,  y: 239  },
        { type: 'forest', x: 349,  y: 211  },
        { type: 'forest', x: 267,  y: 213  },
        { type: 'coastal', x: 272,  y: 251  },
      ],
    },
    {
      id: 'halifax', name: 'Halifax',
      color: '#3498db', textColor: '#fff',
      center: [372, 255],
      path: 'M 350.5,224.5 L 335.4,236.0 L 328.8,234.4 L 311.1,239.7 L 301.6,249.5 L 259.2,252.2 L 280.7,264.8 L 296.4,258.8 L 291.7,264.0 L 291.4,276.2 L 300.8,277.5 L 307.4,273.3 L 304.7,278.5 L 309.2,279.1 L 309.0,275.2 L 314.0,281.1 L 316.6,280.3 L 314.3,277.1 L 323.7,279.5 L 322.6,283.1 L 326.8,277.5 L 330.4,280.7 L 336.7,276.4 L 333.2,267.5 L 326.3,264.1 L 331.6,263.4 L 321.6,259.6 L 321.3,255.2 L 343.9,268.3 L 347.8,264.2 L 343.8,259.8 L 362.2,264.5 L 366.8,259.4 L 365.2,254.4 L 370.3,260.3 L 376.1,250.4 L 374.3,259.5 L 382.2,259.5 L 377.3,258.6 L 379.1,249.4 L 387.5,260.5 L 391.8,256.1 L 384.7,249.2 L 391.9,249.1 L 392.8,258.2 L 403.7,254.6 L 412.1,257.0 L 410.1,253.6 L 414.4,251.7 L 405.6,247.0 L 418.3,251.2 L 429.8,249.7 L 427.9,247.8 L 433.7,244.1 L 441.9,249.4 L 439.2,242.2 L 442.7,244.2 L 447.8,239.8 L 442.2,236.8 L 453.3,243.2 L 457.7,241.9 L 455.6,239.0 L 463.3,240.5 L 463.0,236.9 L 471.8,236.3 L 473.1,232.3 L 480.5,235.9 L 483.1,233.4 L 423.5,203.7 L 356.3,226.3 L 350.5,224.5 Z M 717.0,330.8 L 736.0,329.4 L 751.2,321.1 L 731.0,329.4 L 700.7,327.2 L 717.0,330.8 Z',
      description: 'Provincial capital. Major port, urban core and industrial hub.',
      resources: [
        { type: 'urban', x: 371,  y: 240  },
        { type: 'urban', x: 479,  y: 234  },
        { type: 'urban', x: 264,  y: 253  },
        { type: 'urban', x: 425,  y: 205  },
        { type: 'coastal', x: 317,  y: 275  },
        { type: 'coastal', x: 416,  y: 250  },
        { type: 'forest', x: 326,  y: 237  },
      ],
    },
    {
      id: 'lunenburg', name: 'Lunenburg',
      color: '#9b59b6', textColor: '#fff',
      center: [245, 285],
      path: 'M 182.8,273.2 L 192.6,280.5 L 190.5,284.5 L 223.6,308.9 L 231.7,310.7 L 237.2,301.9 L 246.9,296.7 L 254.0,301.0 L 258.8,298.7 L 259.7,296.1 L 252.1,295.7 L 257.0,293.2 L 248.3,293.4 L 247.8,289.6 L 261.5,289.0 L 251.3,287.8 L 257.5,285.8 L 244.0,281.5 L 252.0,279.9 L 251.7,270.5 L 261.0,273.6 L 266.1,268.4 L 275.2,279.6 L 279.7,274.7 L 284.1,276.0 L 277.8,263.9 L 238.1,239.1 L 182.8,273.2 Z',
      description: 'UNESCO heritage port — fishing, forests and coast.',
      resources: [
        { type: 'coastal', x: 229,  y: 275  },
        { type: 'coastal', x: 282,  y: 275  },
        { type: 'forest', x: 185,  y: 272  },
        { type: 'farmland', x: 254,  y: 249  },
        { type: 'urban', x: 254,  y: 301  },
      ],
    },
    {
      id: 'queens', name: 'Queens',
      color: '#1abc9c', textColor: '#fff',
      center: [189, 311],
      path: 'M 141.1,294.5 L 134.2,301.9 L 187.1,343.7 L 190.3,339.7 L 185.7,335.3 L 194.6,341.4 L 200.2,336.1 L 193.6,330.1 L 213.1,324.9 L 207.6,319.5 L 222.9,318.2 L 226.6,314.2 L 217.2,311.1 L 224.7,310.1 L 190.5,284.5 L 192.6,280.5 L 182.8,273.2 L 170.2,281.0 L 160.5,280.4 L 141.1,294.5 Z',
      description: 'Forested interior with rugged Atlantic coastline.',
      resources: [
        { type: 'forest', x: 180,  y: 306  },
        { type: 'forest', x: 225,  y: 314  },
        { type: 'coastal', x: 136,  y: 300  },
        { type: 'coastal', x: 188,  y: 342  },
        { type: 'farmland', x: 184,  y: 275  },
      ],
    },
    {
      id: 'shelburne', name: 'Shelburne',
      color: '#d35400', textColor: '#fff',
      center: [139, 353],
      path: 'M 134.0,302.1 L 106.9,347.6 L 111.0,357.7 L 92.7,361.9 L 95.4,367.6 L 96.9,364.2 L 98.0,371.6 L 106.2,372.4 L 114.8,364.6 L 126.2,375.5 L 123.8,369.7 L 129.7,366.2 L 126.7,361.5 L 140.2,367.4 L 137.0,361.1 L 141.9,360.6 L 141.6,354.1 L 135.8,347.9 L 140.5,349.2 L 141.3,345.5 L 141.9,352.9 L 149.3,356.0 L 153.5,352.1 L 148.9,345.2 L 151.3,343.0 L 157.8,352.3 L 161.5,348.2 L 163.0,355.9 L 166.9,347.4 L 169.2,353.3 L 175.8,349.8 L 172.4,340.5 L 179.2,347.9 L 185.0,343.1 L 134.0,302.1 Z M 109.3,377.0 L 116.7,372.0 L 110.3,370.2 L 111.7,373.7 L 106.6,375.2 L 109.3,377.0 Z',
      description: 'Coastal fishing heritage and deep wild forests.',
      resources: [
        { type: 'coastal', x: 139,  y: 339  },
        { type: 'coastal', x: 98,  y: 371  },
        { type: 'forest', x: 183,  y: 342  },
        { type: 'forest', x: 135,  y: 304  },
        { type: 'urban', x: 109,  y: 345  },
      ],
    },
    {
      id: 'yarmouth', name: 'Yarmouth',
      color: '#7f8c8d', textColor: '#fff',
      center: [76, 343],
      path: 'M 52.3,323.7 L 50.5,336.9 L 53.4,340.9 L 56.2,338.3 L 56.0,348.8 L 59.6,344.8 L 62.4,351.9 L 64.0,347.6 L 66.7,353.7 L 69.9,348.9 L 71.2,352.5 L 72.8,347.8 L 67.4,340.5 L 72.2,334.5 L 69.8,344.1 L 76.4,344.5 L 74.4,341.6 L 77.3,339.4 L 83.2,347.0 L 83.8,341.6 L 89.1,361.2 L 93.0,352.3 L 92.7,361.9 L 98.8,361.3 L 111.0,357.7 L 106.9,347.6 L 134.0,302.1 L 81.0,310.8 L 52.3,323.7 Z',
      description: 'Southwest tip — fishing fleets and the ferry gateway.',
      resources: [
        { type: 'coastal', x: 92,  y: 330  },
        { type: 'coastal', x: 132,  y: 303  },
        { type: 'coastal', x: 52,  y: 339  },
        { type: 'farmland', x: 109,  y: 358  },
        { type: 'urban', x: 119,  y: 327  },
      ],
    },

    /* ===================================================================
       CAPE BRETON ISLAND
       =================================================================== */
    {
      id: 'richmond', name: 'Richmond',
      color: '#e74c3c', textColor: '#fff',
      center: [622, 166],
      path: 'M 643.4,152.3 L 632.3,159.2 L 638.4,160.8 L 636.6,164.7 L 632.8,163.1 L 625.1,168.5 L 621.8,167.2 L 630.1,163.5 L 629.1,160.6 L 614.8,157.1 L 568.4,172.4 L 576.8,177.8 L 583.8,173.7 L 582.7,170.7 L 591.0,176.4 L 621.9,168.1 L 624.7,170.0 L 622.3,171.3 L 643.1,176.0 L 691.8,161.1 L 643.4,152.3 Z M 601.0,181.7 L 608.1,181.4 L 604.9,184.3 L 608.8,185.5 L 613.2,181.6 L 611.6,178.4 L 620.1,175.5 L 593.8,176.6 L 601.0,181.7 Z',
      description: 'Coastal gateway to the Bras d\'Or Lakes, rich forests.',
      resources: [
        { type: 'coastal', x: 630,  y: 165  },
        { type: 'coastal', x: 571,  y: 173  },
        { type: 'forest', x: 689,  y: 161  },
        { type: 'forest', x: 660,  y: 170  },
        { type: 'farmland', x: 600,  y: 162  },
      ],
    },
    {
      id: 'inverness', name: 'Inverness',
      color: '#00b894', textColor: '#fff',
      center: [601, 121],
      path: 'M 563.3,169.0 L 571.1,172.6 L 595.9,160.3 L 591.5,158.7 L 597.5,155.1 L 611.5,149.2 L 614.2,151.1 L 609.7,146.8 L 617.5,148.1 L 606.7,144.6 L 611.6,145.8 L 598.3,148.8 L 597.1,146.3 L 605.3,145.3 L 598.6,144.6 L 608.7,144.4 L 609.6,139.8 L 593.1,140.8 L 610.1,136.2 L 603.0,124.7 L 635.8,87.9 L 656.1,38.5 L 650.1,38.3 L 640.3,50.7 L 622.1,59.8 L 606.9,79.4 L 605.6,74.3 L 602.2,78.8 L 605.3,79.9 L 604.4,85.4 L 597.5,93.4 L 599.9,96.4 L 594.6,94.1 L 556.2,126.5 L 565.8,128.6 L 557.1,127.3 L 548.9,131.7 L 563.3,169.0 Z',
      description: 'Coal seams, coastal cliffs and scenic highlands.',
      resources: [
        { type: 'mine', x: 598,  y: 116  },
        { type: 'mine', x: 654,  y: 41  },
        { type: 'coastal', x: 568,  y: 170  },
        { type: 'forest', x: 633,  y: 84  },
        { type: 'farmland', x: 551,  y: 132  },
      ],
    },
    {
      id: 'victoria', name: 'Victoria',
      color: '#6c5ce7', textColor: '#fff',
      center: [654, 93],
      path: 'M 609.9,134.6 L 621.5,126.6 L 620.3,129.4 L 647.6,124.1 L 671.5,107.8 L 671.7,103.3 L 668.1,103.0 L 650.2,115.2 L 652.7,111.4 L 650.1,107.3 L 651.6,110.2 L 656.8,107.4 L 678.3,77.8 L 669.9,76.2 L 677.3,73.7 L 672.7,72.3 L 679.3,69.6 L 683.7,55.4 L 660.9,50.5 L 674.2,38.6 L 666.1,41.8 L 656.2,38.8 L 635.8,87.9 L 603.0,124.7 L 609.9,134.6 Z M 609.6,140.5 L 611.9,143.5 L 628.7,140.6 L 636.9,129.0 L 616.6,131.9 L 619.6,133.3 L 610.7,135.8 L 609.6,140.5 Z M 677.5,106.6 L 644.5,128.3 L 664.4,119.5 L 661.8,117.6 L 677.5,106.6 Z',
      description: 'Northern Cape Breton highlands — forests and coast.',
      resources: [
        { type: 'forest', x: 647,  y: 90  },
        { type: 'forest', x: 611,  y: 133  },
        { type: 'coastal', x: 660,  y: 41  },
        { type: 'coastal', x: 679,  y: 67  },
      ],
    },
    {
      id: 'cape_breton', name: 'Cape Breton',
      color: '#0984e3', textColor: '#fff',
      center: [699, 131],
      path: 'M 691.8,161.1 L 690.7,158.5 L 707.8,153.7 L 698.4,150.5 L 700.2,147.0 L 715.9,147.1 L 720.6,142.8 L 739.3,140.1 L 733.0,136.1 L 734.8,134.2 L 719.9,132.2 L 728.3,130.0 L 726.9,125.5 L 736.2,118.5 L 722.3,120.4 L 721.3,115.0 L 708.7,115.8 L 712.9,112.6 L 702.7,110.3 L 695.1,115.6 L 692.5,124.7 L 691.8,117.9 L 683.2,121.4 L 694.2,111.8 L 687.7,110.3 L 686.3,105.9 L 682.3,115.5 L 674.5,116.5 L 669.8,122.1 L 630.0,140.8 L 644.5,144.3 L 675.6,133.4 L 643.4,152.3 L 691.8,161.1 Z M 664.4,119.5 L 683.6,112.3 L 685.1,104.3 L 661.8,117.6 L 664.4,119.5 Z',
      description: 'Coal mines and the urban centre of Sydney.',
      resources: [
        { type: 'mine', x: 689,  y: 136  },
        { type: 'mine', x: 632,  y: 140  },
        { type: 'urban', x: 737,  y: 140  },
        { type: 'urban', x: 663,  y: 156  },
        { type: 'coastal', x: 715,  y: 116  },
        { type: 'coastal', x: 663,  y: 127  },
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
