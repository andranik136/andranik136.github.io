/**
 * Spotted - Procedural World & Interior Generation Engine
 * Handles infinite chunk-based town generation, rounded sidewalk corners,
 * pun storefronts, and the secret Area 51 containment bunker.
 */

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class SpottedWorld {
  constructor() {
    this.worldSeed = 19470708;
    this.chunkSize = 24;
    this.loadedChunks = new Map();
    this.buildings = new Map();
    this.currentInterior = null;
    this.rummagedObjects = new Set();
    this.anomaliesDiscovered = new Set();

    this.punNames = {
      retail: [
        { name: "Abduct & Buy", sub: "24/7 Convenience Mart" },
        { name: "Bargain Probing", sub: "Deep Discount Liquidators" },
        { name: "Saucer & Sons", sub: "Hardware & Gravity Wrenches" },
        { name: "Glow-in-the-Dark Mart", sub: "Groceries & Isotope Snacks" },
        { name: "Tin Foil Haberdashery", sub: "Bespoke Cranial Shielding" },
        { name: "Close Encounters of the Thrifty Kind", sub: "Vintage Apparel" },
        { name: "Beam Me Up, Scott's", sub: "Rare Books & Curios" },
        { name: "Area 51% Off", sub: "Surplus & Salvage" },
        { name: "Roswell Rollers", sub: "Skates & Anti-Grav Boards" },
        { name: "Extraterrestrial Express", sub: "Bodega & Lottery" }
      ],
      restaurant: [
        { name: "The Area Fifty-Bun", sub: "Gourmet Alien Burgers" },
        { name: "Little Green Men-u", sub: "All-Night Retro Diner" },
        { name: "Crop Circles & Waffles", sub: "Breakfast All Day" },
        { name: "Close Encounters of the Fried Kind", sub: "Crispy Poultry" },
        { name: "Flying Saucer Pizza", sub: "Hand-Tossed Deep Dish" },
        { name: "Probe & Patty Grill", sub: "Mesquite Smoked Meats" },
        { name: "Deep Space Doughnuts", sub: "Glazed & Telepathic" },
        { name: "The Mothership Buffet", sub: "Endless Cosmic Carvery" }
      ],
      bar: [
        { name: "The Tipsy Grey", sub: "Extraterrestrial Dive Bar" },
        { name: "UFO-Bia Speakeasy", sub: "Moonshine & Secret Knocks" },
        { name: "Probe & Pint Tavern", sub: "Local Microbrews" },
        { name: "Cosmic Ray's Saloon", sub: "Live Theremin Music" },
        { name: "The Redacted Rum Bar", sub: "Spirits & Classified Ales" },
        { name: "Event Horizon Lounge", sub: "Cocktails That Bend Light" },
        { name: "Meteor Mash Pub", sub: "Billiards & Brews" }
      ],
      gym: [
        { name: "Ab-Duction Fitness", sub: "High-Intensity Tractor Work" },
        { name: "Anti-Gravity Iron", sub: "Heavy Squats & Deadlifts" },
        { name: "Flesh & Metal Gym", sub: "Bodybuilding & Centrifuge" },
        { name: "Cosmic Cardio Club", sub: "Treadmills to the Stars" },
        { name: "Tractor Beam Lifting", sub: "Pure G-Force Training" }
      ],
      office: [
        { name: "Dept. of Weather Balloons", sub: "DWBDNE (Nothing Else!)" },
        { name: "Men in Beige Insurance", sub: "Actuarial UFO Coverage" },
        { name: "Redacted & Redacted LLC", sub: "Attorneys at Classified Law" },
        { name: "Swamp Gas Research Inst.", sub: "Explaining Away Sightings" },
        { name: "Paranormal Payroll Co.", sub: "Direct Deposit for Spooks" }
      ],
      house: [
        { name: "Cole's Rental Flat", sub: "Investigator Headquarters" },
        { name: "Agnes' Tin-Foil Haven", sub: "Residential Cottage" },
        { name: "Deputy Dale's Quarters", sub: "Sheriff Department Housing" },
        { name: "Professor Vance's Abode", sub: "Ex-NASA Janitor Workshop" },
        { name: "Bessie's Cow Cottage", sub: "Suburban Pasture & Barn" },
        { name: "Marv's UFO Watchtower", sub: "Roof Antenna Headquarters" },
        { name: "Whispering Pines Villa", sub: "Quiet Neighborhood Home" },
        { name: "Agent X's Safehouse", sub: "Unmarked Government Bunker" }
      ]
    };
  }

  getChunkCoords(tx, ty) {
    const cx = Math.floor(tx / this.chunkSize);
    const cy = Math.floor(ty / this.chunkSize);
    return { cx, cy };
  }

  getChunk(cx, cy) {
    const key = `${cx},${cy}`;
    if (this.loadedChunks.has(key)) {
      return this.loadedChunks.get(key);
    }
    const chunk = this.generateChunk(cx, cy);
    this.loadedChunks.set(key, chunk);
    return chunk;
  }

  generateChunk(cx, cy) {
    const chunkSeed = (this.worldSeed ^ (cx * 73856093) ^ (cy * 19349663)) >>> 0;
    const rng = mulberry32(chunkSeed);

    const S = this.chunkSize;
    const tiles = [];
    const solid = [];
    const interactables = [];
    const npcs = [];

    for (let y = 0; y < S; y++) {
      tiles[y] = [];
      solid[y] = [];
      for (let x = 0; x < S; x++) {
        tiles[y][x] = 'sidewalk';
        solid[y][x] = false;
      }
    }

    // --- 1. Road & Rounded Sidewalk Network (Castelia City Style) ---
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const isRoadY = (y <= 3 || y >= 20);
        const isRoadX = (x <= 3 || x >= 20);
        const isSidewalkY = (y === 4 || y === 5 || y === 18 || y === 19);
        const isSidewalkX = (x === 4 || x === 5 || x === 18 || x === 19);

        if (isRoadX || isRoadY) {
          if ((y === 1 || y === 22) && !isRoadX) {
            tiles[y][x] = 'road_stripe_h';
          } else if ((x === 1 || x === 22) && !isRoadY) {
            tiles[y][x] = 'road_stripe_v';
          } else if ((x === 4 || x === 19) && (y <= 3 || y >= 20)) {
            tiles[y][x] = 'road_crosswalk';
          } else if ((y === 4 || y === 19) && (x <= 3 || x >= 20)) {
            tiles[y][x] = 'road_crosswalk';
          } else if (y === 3 && (x === 9 || x === 14)) {
            tiles[y][x] = 'road_stop_kanji';
          } else if (x === 3 && (y === 9 || y === 14)) {
            tiles[y][x] = 'road_stop_kanji';
          } else {
            tiles[y][x] = 'asphalt';
          }
        } else if (isSidewalkX || isSidewalkY) {
          // Rounded corners at the intersection curbs
          if (x === 4 && y === 4) {
            tiles[y][x] = 'sidewalk_corner_tl';
          } else if (x === 19 && y === 4) {
            tiles[y][x] = 'sidewalk_corner_tr';
          } else if (x === 4 && y === 19) {
            tiles[y][x] = 'sidewalk_corner_bl';
          } else if (x === 19 && y === 19) {
            tiles[y][x] = 'sidewalk_corner_br';
          } else if (y === 4) {
            tiles[y][x] = 'sidewalk_curb_t';
          } else if (y === 19) {
            tiles[y][x] = 'sidewalk_curb_b';
          } else {
            tiles[y][x] = 'sidewalk';
          }
        }
      }
    }

    const blockRoll = rng();
    const offX = cx * S;
    const offY = cy * S;

    const isOrigin = (cx === 0 && cy === 0);
    const isArea51Sector = (cx === 1 && cy === 1);
    const isWaterfront = (cy >= 2);

    if (isOrigin) {
      this.generateOriginBlock(tiles, solid, interactables, npcs, offX, offY);
    } else if (isArea51Sector) {
      // High-Security Area 51 Secret Installation in Sector [1, 1]!
      this.generateArea51Block(tiles, solid, interactables, npcs, offX, offY, cx, cy);
    } else if (isWaterfront) {
      this.generateWaterfrontHarborBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy);
    } else if (blockRoll < 0.28) {
      this.generateCommercialBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy);
    } else if (blockRoll < 0.52) {
      this.generateMajorFacilityBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy);
    } else if (blockRoll < 0.76) {
      this.generatePokecenterDistrictBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy);
    } else {
      this.generateParkAnomalyBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy);
    }

    this.populateSidewalkFurniture(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy);

    return {
      cx, cy,
      tiles,
      solid,
      interactables,
      npcs
    };
  }

  // Sector [0, 0]: Cole Welps' Starting Neighborhood
  generateOriginBlock(tiles, solid, interactables, npcs, offX, offY) {
    // 1. Cole's Flat: Modern Skyscraper Apartment Building (Left)
    this.createBuildingStructure(tiles, solid, 5, 5, 6, 7, 'skyscraper_glass', 'roof_kawara', 'door_house');
    const bld1 = {
      id: `bld_0_0_cole`,
      name: "Apartment 101: Cole Welps' Flat",
      sub: "Investigator Headquarters & Landlady",
      type: "house",
      doorX: offX + 8,
      doorY: offY + 11,
      interiorSeed: 101,
      themeColor: 'brick_red'
    };
    this.buildings.set(`${offX + 8},${offY + 11}`, bld1);
    interactables.push({
      type: 'door',
      tx: offX + 8,
      ty: offY + 11,
      prompt: "Enter Cole's Flat",
      building: bld1
    });

    // 2. "The Area Fifty-Bun" Gourmet Alien Burgers (Right)
    this.createBuildingStructure(tiles, solid, 13, 5, 6, 7, 'skyscraper_glass', 'roof_kawara', 'door_store', 'awning_red');
    const bld2 = {
      id: `bld_0_0_burger`,
      name: "The Area Fifty-Bun",
      sub: "Gourmet Alien Burgers & Diner",
      type: "restaurant",
      doorX: offX + 16,
      doorY: offY + 11,
      interiorSeed: 102,
      themeColor: 'brick_red'
    };
    this.buildings.set(`${offX + 16},${offY + 11}`, bld2);
    interactables.push({
      type: 'door',
      tx: offX + 16,
      ty: offY + 11,
      prompt: "Enter The Area Fifty-Bun",
      building: bld2
    });

    // 3. Red Beverage Vending Machine
    tiles[12][11] = 'vending_machine_red';
    solid[12][11] = true;
    interactables.push({
      type: 'vending_machine',
      tx: offX + 11,
      ty: offY + 12,
      prompt: "Buy Slime-Cola ($0.50)"
    });

    // 4. Street Market Vendor Stall
    tiles[12][12] = 'market_stall';
    solid[12][12] = true;

    // 5. Sidewalk Planter Trees & Mint Benches (Placed clear of Cole's walk path)
    tiles[15][5] = 'tree_planter';
    solid[15][5] = true;
    tiles[14][15] = 'bench';

    // 6. Rummageable Bin
    tiles[12][18] = 'trash_can';
    solid[12][18] = true;
    interactables.push({
      type: 'trash_can',
      tx: offX + 18,
      ty: offY + 12,
      prompt: "Rummage in Burger Bin"
    });

    // 7. Parked Cars along Curbs (Stationed against sidewalk curbs, clear of traffic lanes)
    // Cole Welps' Clunker 1986 Woodgrain Station Wagon (Top Curb Left)
    tiles[3][6] = 'car_parked_l_black';
    tiles[3][7] = 'car_parked_r_black';
    solid[3][6] = true;
    solid[3][7] = true;
    const coleCarDesc = "Cole's 1986 Woodgrain Station Wagon. The trunk is loaded with rolls of heavy-duty tin foil, a spare trenchcoat, and high-gain radio antennae.";
    interactables.push({ type: 'car', tx: offX + 6, ty: offY + 3, prompt: "Inspect Cole's Station Wagon", carDesc: coleCarDesc });
    interactables.push({ type: 'car', tx: offX + 7, ty: offY + 3, prompt: "Inspect Cole's Station Wagon", carDesc: coleCarDesc });

    // Yellow Taxicab outside Diner (Top Curb Right)
    tiles[3][15] = 'car_parked_l_yellow';
    tiles[3][16] = 'car_parked_r_yellow';
    solid[3][15] = true;
    solid[3][16] = true;
    const taxiDesc = "Oakhaven Yellow Cab #42. The meter is ticking, and a half-eaten glazed doughnut rests on the passenger seat.";
    interactables.push({ type: 'car', tx: offX + 15, ty: offY + 3, prompt: "Inspect Oakhaven Cab #42", carDesc: taxiDesc });
    interactables.push({ type: 'car', tx: offX + 16, ty: offY + 3, prompt: "Inspect Oakhaven Cab #42", carDesc: taxiDesc });

    // Cherry Red Coupe (Bottom Curb)
    tiles[20][10] = 'car_parked_l_red';
    tiles[20][11] = 'car_parked_r_red';
    solid[20][10] = true;
    solid[20][11] = true;
    const coupeDesc = "A cherry red coupe. The bumper sticker reads: 'HONK IF YOU'VE BEEN ABDUCTED!'";
    interactables.push({ type: 'car', tx: offX + 10, ty: offY + 20, prompt: "Inspect Red Coupe", carDesc: coupeDesc });
    interactables.push({ type: 'car', tx: offX + 11, ty: offY + 20, prompt: "Inspect Red Coupe", carDesc: coupeDesc });

    // Unmarked Blue Government Sedan (Right Curb)
    tiles[6][20] = 'car_parked_t_blue';
    tiles[7][20] = 'car_parked_b_blue';
    solid[6][20] = true;
    solid[7][20] = true;
    const sedanDesc = "An unmarked blue sedan. The glove compartment is locked with a numerical keypad, and two pairs of dark sunglasses sit on the dash.";
    interactables.push({ type: 'car', tx: offX + 20, ty: offY + 6, prompt: "Inspect Government Sedan", carDesc: sedanDesc });
    interactables.push({ type: 'car', tx: offX + 20, ty: offY + 7, prompt: "Inspect Government Sedan", carDesc: sedanDesc });

    // NPCs (High density in Cole's starting neighborhood)
    npcs.push({
      id: 'npc_mrs_gable',
      name: "Mrs. Gable",
      type: "tinfoil",
      tx: offX + 8,
      ty: offY + 13,
      homeX: offX + 8,
      homeY: offY + 13,
      dialogueKey: 'mrs_gable_intro'
    });

    npcs.push({
      id: 'npc_chef_luigi',
      name: "Chef Luigi",
      type: "chef",
      tx: offX + 16,
      ty: offY + 13,
      homeX: offX + 16,
      homeY: offY + 13,
      dialogueKey: 'chef_luigi_street'
    });

    npcs.push({
      id: 'npc_walter_exec',
      name: "Walter the Executive",
      type: "businessman",
      tx: offX + 12,
      ty: offY + 16,
      homeX: offX + 12,
      homeY: offY + 16,
      dialogueKey: 'office_worker'
    });

    npcs.push({
      id: 'npc_brenda_shopper',
      name: "Brenda with Groceries",
      type: "shopper",
      tx: offX + 15,
      ty: offY + 14,
      homeX: offX + 15,
      homeY: offY + 14,
      dialogueKey: 'shopper_dialogue'
    });

    npcs.push({
      id: 'npc_kyle_jogger',
      name: "Kyle the Jogger",
      type: "gymnast",
      tx: offX + 10,
      ty: offY + 17,
      homeX: offX + 10,
      homeY: offY + 17,
      dialogueKey: 'gym_member'
    });

    npcs.push({
      id: 'npc_dog_buster',
      name: "Buster the Terrier",
      type: "dog",
      tx: offX + 6,
      ty: offY + 16,
      homeX: offX + 6,
      homeY: offY + 16,
      dialogueKey: 'dog_dialogue'
    });

    npcs.push({
      id: 'npc_grumpy_stan',
      name: "Grumpy Stan",
      type: "rude_local_m",
      isRude: true,
      tx: offX + 18,
      ty: offY + 15,
      homeX: offX + 18,
      homeY: offY + 15,
      dialogueKey: 'rude_dialogue_1'
    });
  }

  // Sector [1, 1]: AREA 51 Secret Installation Block
  generateArea51Block(tiles, solid, interactables, npcs, offX, offY, cx, cy) {
    // Massive fortified military bunker facade
    this.createBuildingStructure(tiles, solid, 6, 6, 12, 6, 'brick_tan', 'roof_slate', 'door_office');
    const bld = {
      id: `bld_area51_vault`,
      name: "AREA 51 Research Sub-Annex",
      sub: "RESTRICTED CLASSIFIED LEVEL 5",
      type: "area51",
      doorX: offX + 11,
      doorY: offY + 11,
      interiorSeed: 5109,
      themeColor: 'brick_tan'
    };
    this.buildings.set(`${offX + 11},${offY + 11}`, bld);
    interactables.push({
      type: 'door',
      tx: offX + 11,
      ty: offY + 11,
      prompt: "Infiltrate Area 51 Sub-Vault",
      building: bld
    });

    // Parked Government Security Sedans (Outside Fortified Gate)
    tiles[3][6] = 'car_parked_l_black';
    tiles[3][7] = 'car_parked_r_black';
    solid[3][6] = true;
    solid[3][7] = true;
    const fbiCarDesc = "A black government sedan with polarized bulletproof windows and military comms antennas.";
    interactables.push({ type: 'car', tx: offX + 6, ty: offY + 3, prompt: "Inspect Government Patrol Car", carDesc: fbiCarDesc });
    interactables.push({ type: 'car', tx: offX + 7, ty: offY + 3, prompt: "Inspect Government Patrol Car", carDesc: fbiCarDesc });

    tiles[3][16] = 'car_parked_l_black';
    tiles[3][17] = 'car_parked_r_black';
    solid[3][16] = true;
    solid[3][17] = true;
    interactables.push({ type: 'car', tx: offX + 16, ty: offY + 3, prompt: "Inspect Federal Transport Car", carDesc: fbiCarDesc });
    interactables.push({ type: 'car', tx: offX + 17, ty: offY + 3, prompt: "Inspect Federal Transport Car", carDesc: fbiCarDesc });

    // Perimeter Warning Signs
    tiles[5][5] = 'sign_stop';
    solid[5][5] = true;
    tiles[5][18] = 'sign_stop';
    solid[5][18] = true;

    // Armed Guard / Government Insider outside
    npcs.push({
      id: 'npc_agent_insider',
      name: "Agent Miller (The Insider)",
      type: "agent",
      tx: offX + 9,
      ty: offY + 13,
      homeX: offX + 9,
      homeY: offY + 13,
      dialogueKey: 'agent_insider_dialogue'
    });

    // Perimeter Security Agents
    npcs.push({
      id: `npc_guard_vance_${cx}_${cy}`,
      name: "Agent Vance (Security)",
      type: "agent",
      tx: offX + 6,
      ty: offY + 14,
      homeX: offX + 6,
      homeY: offY + 14,
      dialogueKey: 'agent_dialogue'
    });

    npcs.push({
      id: `npc_guard_sterling_${cx}_${cy}`,
      name: "Agent Sterling (Perimeter)",
      type: "agent",
      tx: offX + 17,
      ty: offY + 14,
      homeX: offX + 17,
      homeY: offY + 14,
      dialogueKey: 'agent_dialogue'
    });
  }

  // Commercial Double Storefront Block
  generateCommercialBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy) {
    const types = ['retail', 'restaurant', 'bar'];
    const t1 = types[Math.floor(rng() * types.length)];
    let t2 = types[Math.floor(rng() * types.length)];
    if (t2 === t1) t2 = (t1 === 'bar') ? 'retail' : 'bar';

    const p1 = this.getRandomPun(t1, rng);
    const p2 = this.getRandomPun(t2, rng);

    const bStyle1 = (t1 === 'retail') ? 'brick_blue' : 'brick_red';
    const bStyle2 = (t2 === 'bar') ? 'brick_red' : 'brick_tan';
    const awn1 = (rng() < 0.5) ? 'awning_red' : 'awning_blue';
    const awn2 = (rng() < 0.5) ? 'awning_neon' : 'awning_green';

    this.createBuildingStructure(tiles, solid, 6, 6, 6, 6, bStyle1, 'roof_slate', 'door_store', awn1);
    const bld1 = {
      id: `bld_${cx}_${cy}_1`,
      name: p1.name,
      sub: p1.sub,
      type: t1,
      doorX: offX + 8,
      doorY: offY + 11,
      interiorSeed: (cx * 1000 + cy * 10 + 1) >>> 0,
      themeColor: bStyle1
    };
    this.buildings.set(`${offX + 8},${offY + 11}`, bld1);
    interactables.push({
      type: 'door',
      tx: offX + 8,
      ty: offY + 11,
      prompt: `Enter ${p1.name}`,
      building: bld1
    });

    this.createBuildingStructure(tiles, solid, 12, 6, 6, 6, bStyle2, 'roof_terra', 'door_store', awn2);
    const bld2 = {
      id: `bld_${cx}_${cy}_2`,
      name: p2.name,
      sub: p2.sub,
      type: t2,
      doorX: offX + 14,
      doorY: offY + 11,
      interiorSeed: (cx * 1000 + cy * 10 + 2) >>> 0,
      themeColor: bStyle2
    };
    this.buildings.set(`${offX + 14},${offY + 11}`, bld2);
    interactables.push({
      type: 'door',
      tx: offX + 14,
      ty: offY + 11,
      prompt: `Enter ${p2.name}`,
      building: bld2
    });

    if (rng() < 0.6) {
      const npcType = (t2 === 'bar') ? 'informant' : 'agent';
      npcs.push({
        id: `npc_${cx}_${cy}_comm`,
        name: (npcType === 'agent') ? "Agent Miller" : "Shady Informant",
        type: npcType,
        tx: offX + 11,
        ty: offY + 13,
        homeX: offX + 11,
        homeY: offY + 13,
        dialogueKey: 'resident_gossip'
      });
    }
  }

  // Major Facility: Office (DWBDNE) or Gym
  generateMajorFacilityBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy) {
    const isGym = (rng() < 0.4);
    const bType = isGym ? 'gym' : 'office';
    const pun = this.getRandomPun(bType, rng);

    const wallStyle = isGym ? 'brick_red' : 'brick_tan';
    const doorStyle = isGym ? 'door_store' : 'door_office';

    this.createBuildingStructure(tiles, solid, 6, 6, 12, 6, wallStyle, 'roof_slate', doorStyle);
    const doorLocalX = 11;
    const bld = {
      id: `bld_${cx}_${cy}_major`,
      name: pun.name,
      sub: pun.sub,
      type: bType,
      doorX: offX + doorLocalX,
      doorY: offY + 11,
      interiorSeed: (cx * 1000 + cy * 10 + 3) >>> 0,
      themeColor: wallStyle
    };
    this.buildings.set(`${offX + doorLocalX},${offY + 11}`, bld);
    interactables.push({
      type: 'door',
      tx: offX + doorLocalX,
      ty: offY + 11,
      prompt: `Enter ${pun.name}`,
      building: bld
    });

    tiles[12][7] = 'trash_can';
    solid[12][7] = true;
    interactables.push({
      type: 'trash_can',
      tx: offX + 7,
      ty: offY + 12,
      prompt: "Rummage in Dumpster"
    });

    const guardType = isGym ? 'gymbro' : 'agent';
    npcs.push({
      id: `npc_${cx}_${cy}_guard`,
      name: isGym ? "Chad the Spotter" : "Special Agent Smithson",
      type: guardType,
      tx: offX + doorLocalX + 1,
      ty: offY + 13,
      homeX: offX + doorLocalX + 1,
      homeY: offY + 13,
      dialogueKey: isGym ? 'gym_dialogue' : 'agent_dialogue'
    });
  }

  // Suburban Residential Houses
  generateSuburbanBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy) {
    const pun1 = this.getRandomPun('house', rng);
    const pun2 = this.getRandomPun('house', rng);

    this.createBuildingStructure(tiles, solid, 6, 6, 6, 5, 'brick_red', 'roof_terra', 'door_house');
    const bld1 = {
      id: `bld_${cx}_${cy}_h1`,
      name: pun1.name,
      sub: pun1.sub,
      type: 'house',
      doorX: offX + 8,
      doorY: offY + 10,
      interiorSeed: (cx * 1000 + cy * 10 + 4) >>> 0,
      themeColor: 'brick_red'
    };
    this.buildings.set(`${offX + 8},${offY + 10}`, bld1);
    interactables.push({
      type: 'door',
      tx: offX + 8,
      ty: offY + 10,
      prompt: `Enter ${pun1.name}`,
      building: bld1
    });

    this.createBuildingStructure(tiles, solid, 12, 6, 6, 5, 'brick_tan', 'roof_slate', 'door_house');
    const bld2 = {
      id: `bld_${cx}_${cy}_h2`,
      name: pun2.name,
      sub: pun2.sub,
      type: 'house',
      doorX: offX + 14,
      doorY: offY + 10,
      interiorSeed: (cx * 1000 + cy * 10 + 5) >>> 0,
      themeColor: 'brick_tan'
    };
    this.buildings.set(`${offX + 14},${offY + 10}`, bld2);
    interactables.push({
      type: 'door',
      tx: offX + 14,
      ty: offY + 10,
      prompt: `Enter ${pun2.name}`,
      building: bld2
    });

    tiles[14][9] = 'tree';
    solid[14][9] = true;

    if (rng() < 0.5) {
      npcs.push({
        id: `npc_${cx}_${cy}_cow`,
        name: "Bessie the Cow",
        type: "cow",
        tx: offX + 13,
        ty: offY + 14,
        homeX: offX + 13,
        homeY: offY + 14,
        dialogueKey: 'cow_dialogue'
      });
    } else {
      npcs.push({
        id: `npc_${cx}_${cy}_cat`,
        name: "Cosmo the 3-Eyed Cat",
        type: "alien_cat",
        tx: offX + 14,
        ty: offY + 13,
        homeX: offX + 14,
        homeY: offY + 13,
        dialogueKey: 'cat_dialogue'
      });
    }
  }

  // Town Park / Crop Circle Anomaly Site
  generateParkAnomalyBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy) {
    const trees = [[6, 6], [17, 6], [6, 17], [17, 17]];
    trees.forEach(([tx, ty]) => {
      tiles[ty][tx] = 'tree';
      solid[ty][tx] = true;
    });

    tiles[11][11] = 'crop_circle';
    tiles[11][12] = 'crop_circle';
    tiles[12][11] = 'crop_circle';
    tiles[12][12] = 'crop_circle';

    tiles[10][14] = 'slime_puddle';

    const anomaly = {
      id: `anom_${cx}_${cy}`,
      name: `Crop Circle Anomaly [Sector ${cx}, ${cy}]`,
      tx: offX + 11,
      ty: offY + 11,
      desc: "An intricate geometric swirl burned into the grass. Emits rhythmic microwave radiation!"
    };
    interactables.push({
      type: 'anomaly',
      tx: offX + 11,
      ty: offY + 11,
      prompt: "Scan Mysterious Crop Swirl",
      anomaly: anomaly
    });

    tiles[14][8] = 'bench';
    tiles[14][15] = 'bench';

    npcs.push({
      id: `npc_${cx}_${cy}_researcher`,
      name: "Dr. Hubert Vance",
      type: "scientist",
      tx: offX + 10,
      ty: offY + 13,
      homeX: offX + 10,
      homeY: offY + 13,
      dialogueKey: 'scientist_dialogue'
    });
  }

  createBuildingStructure(tiles, solid, startX, startY, width, height, wallTile, roofTile, doorTile, awningTile = null) {
    const isGlass = (wallTile === 'brick_blue' || wallTile === 'skyscraper_glass' || wallTile === 'brick_tan');
    const facadeTile = isGlass ? 'skyscraper_glass' : 'skyscraper_base';
    const hasKawara = (roofTile === 'roof_terra' || roofTile === 'roof_kawara');

    for (let y = startY; y < startY + height; y++) {
      for (let x = startX; x < startX + width; x++) {
        solid[y][x] = true;
        if (y === startY) {
          tiles[y][x] = (x === startX + 1) ? 'roof_ac' : ((x === startX + width - 2) ? 'roof_satellite' : 'skyscraper_roof');
        } else if (y === startY + 1) {
          tiles[y][x] = hasKawara ? 'roof_kawara' : 'skyscraper_balcony';
        } else if (awningTile && y === startY + height - 2) {
          tiles[y][x] = awningTile;
        } else if (y === startY + height - 1) {
          tiles[y][x] = 'skyscraper_base';
        } else {
          tiles[y][x] = 'skyscraper_glass';
        }
      }
    }

    const doorX = startX + Math.floor(width / 2);
    const doorY = startY + height - 1;
    tiles[doorY][doorX] = doorTile;
    solid[doorY][doorX] = false;
  }

  createPokecenterStructure(tiles, solid, startX, startY) {
    const width = 6;
    const height = 5;
    for (let y = startY; y < startY + height; y++) {
      for (let x = startX; x < startX + width; x++) {
        solid[y][x] = true;
        if (y === startY || y === startY + 1) {
          if (x === startX) tiles[y][x] = 'pokecenter_roof_l';
          else if (x === startX + width - 1) tiles[y][x] = 'pokecenter_roof_r';
          else tiles[y][x] = 'pokecenter_roof_m';
        } else {
          tiles[y][x] = 'pokecenter_wall';
        }
      }
    }
    const doorX = startX + 2;
    const doorY = startY + height - 1;
    tiles[doorY][doorX] = 'door_store';
    solid[doorY][doorX] = false;
  }

  // Waterfront Harbor Pier (Castelia Ocean Docks)
  generateWaterfrontHarborBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy) {
    // North section: Cobblestone wharf promenade with dockside office
    this.createBuildingStructure(tiles, solid, 6, 5, 8, 5, 'skyscraper_glass', 'skyscraper_roof', 'door_office');
    const bld = {
      id: `bld_harbor_${cx}_${cy}`,
      name: "Oakhaven Port Authority & Harbor Pier",
      sub: "Coastal Radar & Oceanic Sightings",
      type: "office",
      doorX: offX + 10,
      doorY: offY + 9,
      interiorSeed: (cx * 1000 + cy * 10 + 9) >>> 0,
      themeColor: 'brick_blue'
    };
    this.buildings.set(`${offX + 10},${offY + 9}`, bld);
    interactables.push({
      type: 'door',
      tx: offX + 10,
      ty: offY + 9,
      prompt: "Enter Harbor Pier Office",
      building: bld
    });

    // Seawall & Stone Stairs (Y = 11)
    for (let x = 4; x <= 19; x++) {
      if (x === 11 || x === 12) {
        tiles[11][x] = 'pier_stairs';
      } else {
        tiles[11][x] = 'pier_seawall';
        solid[11][x] = true;
      }
    }

    // Stone Pier Dock (Y = 12..17)
    for (let y = 12; y <= 16; y++) {
      for (let x = 8; x <= 15; x++) {
        tiles[y][x] = 'pier_stone';
        solid[y][x] = false;
      }
    }

    // Ocean Water (Y = 12..23) outside the pier
    for (let y = 12; y < 24; y++) {
      for (let x = 0; x < 24; x++) {
        if (tiles[y][x] !== 'pier_stone' && tiles[y][x] !== 'pier_stairs' && tiles[y][x] !== 'pier_seawall') {
          tiles[y][x] = 'water';
          solid[y][x] = true;
        }
      }
    }

    // Wooden Mooring Pilings in water
    const posts = [[6, 14], [7, 17], [16, 14], [17, 17], [10, 19], [13, 19]];
    posts.forEach(([px, py]) => {
      tiles[py][px] = 'pier_wood_post';
      solid[py][px] = true;
    });

    // Harbor Lampposts and Benches
    tiles[10][6] = 'street_lamp';
    solid[10][6] = true;
    tiles[10][17] = 'street_lamp';
    solid[10][17] = true;

    // Fisherman NPC
    npcs.push({
      id: `npc_fisherman_${cx}_${cy}`,
      name: "Old Barnaby the Sailor",
      type: "informant",
      tx: offX + 12,
      ty: offY + 14,
      homeX: offX + 12,
      homeY: offY + 14,
      dialogueKey: 'resident_gossip'
    });
  }

  // Pokecenter & Commercial Plaza District
  generatePokecenterDistrictBlock(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy) {
    this.createPokecenterStructure(tiles, solid, 5, 6);
    const bldCenter = {
      id: `bld_center_${cx}_${cy}`,
      name: "Oakhaven Alien Recovery Center",
      sub: "Extraterrestrial First-Aid & Diagnostics",
      type: "restaurant",
      doorX: offX + 7,
      doorY: offY + 10,
      interiorSeed: (cx * 1000 + cy * 10 + 7) >>> 0,
      themeColor: 'brick_red'
    };
    this.buildings.set(`${offX + 7},${offY + 10}`, bldCenter);
    interactables.push({
      type: 'door',
      tx: offX + 7,
      ty: offY + 10,
      prompt: "Enter Alien Recovery Center",
      building: bldCenter
    });

    this.createBuildingStructure(tiles, solid, 12, 5, 7, 7, 'skyscraper_glass', 'skyscraper_roof', 'door_office');
    const pun = this.getRandomPun('office', rng);
    const bldTech = {
      id: `bld_tech_${cx}_${cy}`,
      name: pun.name,
      sub: pun.sub,
      type: "office",
      doorX: offX + 15,
      doorY: offY + 11,
      interiorSeed: (cx * 1000 + cy * 10 + 8) >>> 0,
      themeColor: 'brick_blue'
    };
    this.buildings.set(`${offX + 15},${offY + 11}`, bldTech);
    interactables.push({
      type: 'door',
      tx: offX + 15,
      ty: offY + 11,
      prompt: `Enter ${pun.name}`,
      building: bldTech
    });

    tiles[12][11] = 'vending_machine_red';
    solid[12][11] = true;
    interactables.push({
      type: 'vending_machine',
      tx: offX + 11,
      ty: offY + 12,
      prompt: "Buy Slime-Cola ($0.50)"
    });

    tiles[14][7] = 'bench';
    tiles[14][14] = 'tree_planter';
    solid[14][14] = true;

    // Nurse / Medic NPC outside
    npcs.push({
      id: `npc_nurse_${cx}_${cy}`,
      name: "Nurse Stella",
      type: "waitress",
      tx: offX + 7,
      ty: offY + 12,
      homeX: offX + 7,
      homeY: offY + 12,
      dialogueKey: 'resident_gossip'
    });
  }

  populateSidewalkFurniture(tiles, solid, interactables, npcs, rng, offX, offY, cx, cy) {
    const lamps = [[4, 4], [19, 4], [4, 19], [19, 19]];
    lamps.forEach(([lx, ly]) => {
      tiles[ly][lx] = 'street_lamp';
      solid[ly][lx] = true;
    });

    // Stop sign near crosswalk
    if (rng() < 0.6) {
      tiles[5][4] = 'sign_stop';
      solid[5][4] = true;
    }

    // Sidewalk Trees in planters
    if (rng() < 0.6) {
      tiles[15][5] = 'tree_planter';
      solid[15][5] = true;
    }
    if (rng() < 0.6) {
      tiles[15][18] = 'tree_planter';
      solid[15][18] = true;
    }

    // Benches along the cobblestone promenade
    if (rng() < 0.5) {
      tiles[18][10] = 'bench';
    }

    // Beverage Vending Machines (Red or Blue)
    if (rng() < 0.5) {
      const isRed = rng() < 0.6;
      tiles[18][7] = isRed ? 'vending_machine_red' : 'vending_machine_blue';
      solid[18][7] = true;
      interactables.push({
        type: 'vending_machine',
        tx: offX + 7,
        ty: offY + 18,
        prompt: "Buy Slime-Cola ($0.50)"
      });
    }

    // Market stalls
    if (rng() < 0.35) {
      tiles[18][13] = 'market_stall';
      solid[18][13] = true;
    }

    if (rng() < 0.4) {
      tiles[4][10] = 'hydrant';
      solid[4][10] = true;
    }

    if (rng() < 0.5) {
      tiles[19][10] = 'newspaper_box';
      solid[19][10] = true;
      interactables.push({
        type: 'newspaper',
        tx: offX + 10,
        ty: offY + 19,
        prompt: "Read 'The Oakhaven Inquirer'"
      });
    }

    if (rng() < 0.6) {
      tiles[18][16] = 'trash_can';
      solid[18][16] = true;
      interactables.push({
        type: 'trash_can',
        tx: offX + 16,
        ty: offY + 18,
        prompt: "Rummage in Sidewalk Bin"
      });
    }

    // --- Parked Cars along Curbs (Stationed against sidewalk curbs, clear of traffic lanes) ---
    const colors = ['red', 'blue', 'yellow', 'black'];
    const carFlavorList = [
      "A faded station wagon. A tin foil sunshade is draped across the windshield.",
      "An unmarked government sedan with tinted windows and dual chrome antennas.",
      "A cherry red hatchback. The bumper sticker reads: 'BELIEVE IN SOMETHING (ALIENS)'.",
      "A yellow cab with the engine ticking cool. A doughnut box rests on the passenger seat.",
      "A dust-covered pickup truck. A pair of rubber alien antenna headbands hangs from the rearview mirror.",
      "A black coupe. The radio inside is quietly humming with mysterious static frequencies.",
      "A compact sedan with an 'Area 51 Security - Official Visitor' parking permit on the dash.",
      "A dark blue minivan full of camping gear and a stack of 'Oakhaven UFO Society' newsletters.",
      "A classic beige cruiser. The glove compartment is overflowing with road maps and UFO clippings."
    ];

    const carSlots = [
      { dir: 'h', x: 6, y: 3 },
      { dir: 'h', x: 11, y: 3 },
      { dir: 'h', x: 16, y: 3 },
      { dir: 'h', x: 6, y: 20 },
      { dir: 'h', x: 11, y: 20 },
      { dir: 'h', x: 16, y: 20 },
      { dir: 'v', x: 3, y: 6 },
      { dir: 'v', x: 3, y: 11 },
      { dir: 'v', x: 3, y: 16 },
      { dir: 'v', x: 20, y: 6 },
      { dir: 'v', x: 20, y: 11 },
      { dir: 'v', x: 20, y: 16 }
    ];

    // Shuffle carSlots with rng
    for (let i = carSlots.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [carSlots[i], carSlots[j]] = [carSlots[j], carSlots[i]];
    }

    const numCars = 2 + Math.floor(rng() * 3); // 2 to 4 parked cars per block!
    let placedCars = 0;

    for (const slot of carSlots) {
      if (placedCars >= numCars) break;
      const col = colors[Math.floor(rng() * colors.length)];
      const desc = carFlavorList[Math.floor(rng() * carFlavorList.length)];

      if (slot.dir === 'h') {
        const x = slot.x;
        const y = slot.y;
        if (tiles[y] && tiles[y][x] === 'asphalt' && tiles[y][x + 1] === 'asphalt' && !solid[y][x] && !solid[y][x + 1]) {
          tiles[y][x] = `car_parked_l_${col}`;
          tiles[y][x + 1] = `car_parked_r_${col}`;
          solid[y][x] = true;
          solid[y][x + 1] = true;
          interactables.push({ type: 'car', tx: offX + x, ty: offY + y, prompt: "Inspect Parked Car", carDesc: desc });
          interactables.push({ type: 'car', tx: offX + x + 1, ty: offY + y, prompt: "Inspect Parked Car", carDesc: desc });
          placedCars++;
        }
      } else {
        const x = slot.x;
        const y = slot.y;
        if (tiles[y] && tiles[y + 1] && tiles[y][x] === 'asphalt' && tiles[y + 1][x] === 'asphalt' && !solid[y][x] && !solid[y + 1][x]) {
          tiles[y][x] = `car_parked_t_${col}`;
          tiles[y + 1][x] = `car_parked_b_${col}`;
          solid[y][x] = true;
          solid[y + 1][x] = true;
          interactables.push({ type: 'car', tx: offX + x, ty: offY + y, prompt: "Inspect Parked Car", carDesc: desc });
          interactables.push({ type: 'car', tx: offX + x, ty: offY + y + 1, prompt: "Inspect Parked Car", carDesc: desc });
          placedCars++;
        }
      }
    }

    // --- High Density Sidewalk Pedestrians & Residents (4-6 per block) ---
    const candidateTiles = [];
    for (let y = 4; y <= 19; y++) {
      for (let x = 4; x <= 19; x++) {
        if (!solid[y][x]) {
          const t = tiles[y][x];
          if (t === 'sidewalk' || t === 'cobblestone' || t === 'sidewalk_curb_t' || t === 'sidewalk_curb_b') {
            const isDoorStep = (y === 11 || y === 10 || y === 9) && (x === 8 || x === 16 || x === 7 || x === 15 || x === 10);
            if (!isDoorStep) {
              candidateTiles.push({ x, y });
            }
          }
        }
      }
    }

    // Shuffle candidate locations
    for (let i = candidateTiles.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [candidateTiles[i], candidateTiles[j]] = [candidateTiles[j], candidateTiles[i]];
    }

    const targetPedestrianCount = 4 + Math.floor(rng() * 3); // 4 to 6 pedestrians per block!
    const usedSpots = [];

    for (const pos of candidateTiles) {
      if (usedSpots.length >= targetPedestrianCount) break;

      const tooClose = usedSpots.some(s => Math.hypot(s.x - pos.x, s.y - pos.y) < 2.2);
      if (tooClose) continue;

      usedSpots.push(pos);

      const roll = rng();
      let chosenType, name, dKey, isRude = false;

      if (roll < 0.28) {
        // Rude Resident
        isRude = true;
        chosenType = (rng() < 0.5) ? 'rude_local_m' : 'rude_local_f';
        const rudeNames = [
          "Grumpy Arthur", "Scowling Beatrice", "Irritated Frank", "Mildred the Scowler",
          "Harold the Impatient", "Ethel the Suspicious", "Bitter Bob", "Karen of Oakhaven",
          "Crabby Craig", "Cynical Cindy"
        ];
        name = rudeNames[Math.floor(rng() * rudeNames.length)];
        const rudeKeys = ['rude_dialogue_1', 'rude_dialogue_2', 'rude_dialogue_3', 'rude_dialogue_4'];
        dKey = rudeKeys[Math.floor(rng() * rudeKeys.length)];
      } else if (roll < 0.44) {
        // Businessman
        chosenType = 'businessman';
        const names = ["Walter Vance", "Gordon the Broker", "Accountant Dave", "Executive Higgins", "Mr. Sterling"];
        name = names[Math.floor(rng() * names.length)];
        dKey = 'office_worker';
      } else if (roll < 0.60) {
        // Shopper
        chosenType = 'shopper';
        const names = ["Sally with Groceries", "Mrs. Higgins", "Penny the Bargain Hunter", "Shopper Cora", "Beanie Brenda"];
        name = names[Math.floor(rng() * names.length)];
        dKey = 'shopper_dialogue';
      } else if (roll < 0.74) {
        // Gymnast / Jogger
        chosenType = 'gymnast';
        const names = ["Jogger Todd", "Sprinter Mia", "Crossfit Chad", "Marathoner Max"];
        name = names[Math.floor(rng() * names.length)];
        dKey = 'gym_member';
      } else if (roll < 0.84) {
        // Dog
        chosenType = 'dog';
        const names = ["Buster", "Barnaby", "Rusty", "Waffles", "Ziggy", "Daisy"];
        name = names[Math.floor(rng() * names.length)];
        dKey = 'dog_dialogue';
      } else if (roll < 0.91) {
        // Government Agent
        chosenType = 'agent';
        const names = ["Agent Gray", "Agent Vance", "Agent Sterling", "Field Agent Smith"];
        name = names[Math.floor(rng() * names.length)];
        dKey = 'agent_dialogue';
      } else if (roll < 0.96) {
        // Tin Foil Enthusiast
        chosenType = 'tinfoil';
        const names = ["Radio Ron", "Frequency Fran", "Signal Sid", "Antenna Annie"];
        name = names[Math.floor(rng() * names.length)];
        dKey = 'resident_gossip';
      } else {
        // Alien in Disguise
        chosenType = 'alien_disguised';
        name = "Hugh Mann (Definitely Human)";
        dKey = 'alien_disguised';
      }

      npcs.push({
        id: `npc_street_${cx}_${cy}_${usedSpots.length}`,
        name: name,
        type: chosenType,
        isRude: isRude,
        tx: offX + pos.x,
        ty: offY + pos.y,
        homeX: offX + pos.x,
        homeY: offY + pos.y,
        dialogueKey: dKey
      });
    }
  }

  getRandomPun(type, rng) {
    const list = this.punNames[type] || this.punNames.retail;
    const idx = Math.floor(rng() * list.length);
    return list[idx];
  }

  // ==========================================
  // BUILDING INTERIOR GENERATION
  // ==========================================
  getInterior(building) {
    const W = 16;
    const H = 12;
    const rng = mulberry32(building.interiorSeed);

    const tiles = [];
    const solid = [];
    const interactables = [];
    const npcs = [];

    let floorTile = 'floor_wood';
    let wallTile = 'wall_interior';

    if (building.type === 'restaurant') floorTile = 'floor_checker';
    else if (building.type === 'bar') floorTile = 'floor_wood';
    else if (building.type === 'office') floorTile = 'floor_carpet';
    else if (building.type === 'gym') floorTile = 'floor_gym';
    else if (building.type === 'area51') {
      floorTile = 'floor_area51';
      wallTile = 'wall_area51';
    }

    for (let y = 0; y < H; y++) {
      tiles[y] = [];
      solid[y] = [];
      for (let x = 0; x < W; x++) {
        if (y === 0 || y === 1 || x === 0 || x === W - 1) {
          tiles[y][x] = wallTile;
          solid[y][x] = true;
        } else if (y === H - 1) {
          if (x === 7 || x === 8) {
            tiles[y][x] = 'exit_mat';
            solid[y][x] = false;
          } else {
            tiles[y][x] = wallTile;
            solid[y][x] = true;
          }
        } else {
          tiles[y][x] = floorTile;
          solid[y][x] = false;
        }
      }
    }

    interactables.push({ type: 'exit_door', tx: 7, ty: H - 1, prompt: "Exit to Street" });
    interactables.push({ type: 'exit_door', tx: 8, ty: H - 1, prompt: "Exit to Street" });

    if (building.type === 'area51') {
      this.populateArea51Interior(tiles, solid, interactables, npcs, rng, building);
    } else if (building.type === 'restaurant') {
      this.populateDinerInterior(tiles, solid, interactables, npcs, rng, building);
    } else if (building.type === 'retail') {
      this.populateRetailInterior(tiles, solid, interactables, npcs, rng, building);
    } else if (building.type === 'bar') {
      this.populateBarInterior(tiles, solid, interactables, npcs, rng, building);
    } else if (building.type === 'gym') {
      this.populateGymInterior(tiles, solid, interactables, npcs, rng, building);
    } else if (building.type === 'office') {
      this.populateOfficeInterior(tiles, solid, interactables, npcs, rng, building);
    } else {
      this.populateHouseInterior(tiles, solid, interactables, npcs, rng, building);
    }

    return {
      building,
      width: W,
      height: H,
      tiles,
      solid,
      interactables,
      npcs,
      spawnX: 7.5,
      spawnY: 10
    };
  }

  // --- AREA 51 SUB-VAULT INTERIOR ---
  // --- AREA 51 SUB-VAULT INTERIOR ---
  populateArea51Interior(tiles, solid, interactables, npcs, rng, building) {
    // Center Containment Chamber: LIVE EXTRATERRESTRIAL IN CRYO-STASIS POD!
    tiles[3][7] = 'pod_top';
    tiles[3][8] = 'pod_top';
    tiles[4][7] = 'pod_bottom';
    tiles[4][8] = 'pod_bottom';
    solid[3][7] = true;
    solid[3][8] = true;
    solid[4][7] = true;
    solid[4][8] = true;

    // Trigger point when player inspects the live alien pod!
    interactables.push({
      type: 'alien_pod',
      tx: 7,
      ty: 5,
      prompt: "LOOK INTO THE ALIEN STASIS POD"
    });
    interactables.push({
      type: 'alien_pod',
      tx: 8,
      ty: 5,
      prompt: "LOOK INTO THE ALIEN STASIS POD"
    });

    // Control Mainframe & Radar Arrays
    tiles[2][2] = 'radar_console';
    solid[2][2] = true;
    tiles[2][4] = 'server_rack';
    solid[2][4] = true;
    tiles[2][11] = 'server_rack';
    solid[2][11] = true;
    tiles[2][13] = 'radar_console';
    solid[2][13] = true;

    tiles[4][3] = 'terminal_area51';
    solid[4][3] = true;
    tiles[4][12] = 'terminal_area51';
    solid[4][12] = true;

    // Autopsy & Examination Lab (Left)
    tiles[7][2] = 'autopsy_table';
    solid[7][2] = true;
    tiles[7][3] = 'autopsy_table';
    solid[7][3] = true;
    tiles[8][2] = 'filing_cabinet';
    solid[8][2] = true;

    // Biohazard Toxic Waste Storage (Right)
    tiles[7][12] = 'biohazard_barrel';
    solid[7][12] = true;
    tiles[7][13] = 'biohazard_barrel';
    solid[7][13] = true;
    tiles[8][13] = 'biohazard_barrel';
    solid[8][13] = true;

    // Security Laser Emitters
    tiles[6][5] = 'hazard_laser';
    solid[6][5] = true;
    tiles[6][10] = 'hazard_laser';
    solid[6][10] = true;

    tiles[2][1] = 'water_cooler';
    solid[2][1] = true;

    // NPCs (5 Area 51 Research & Security Staff)
    npcs.push({
      id: `npc_sci_aris_${building.id}`,
      name: "Dr. Aris (Lead Xenobiologist)",
      type: "scientist",
      tx: 5,
      ty: 3,
      homeX: 5,
      homeY: 3,
      dialogueKey: 'area51_scientist'
    });
    npcs.push({
      id: `npc_hazmat_chen_${building.id}`,
      name: "Technician Chen",
      type: "hazmat",
      tx: 10,
      ty: 3,
      homeX: 10,
      homeY: 3,
      dialogueKey: 'area51_scientist'
    });
    npcs.push({
      id: `npc_sci_vance_${building.id}`,
      name: "Dr. Hubert Vance",
      type: "scientist",
      tx: 4,
      ty: 7,
      homeX: 4,
      homeY: 7,
      dialogueKey: 'area51_scientist'
    });
    npcs.push({
      id: `npc_guard_cross_${building.id}`,
      name: "Special Agent Cross",
      type: "fbi_agent",
      tx: 9,
      ty: 8,
      homeX: 9,
      homeY: 8,
      dialogueKey: 'agent_dialogue'
    });
    npcs.push({
      id: `npc_hazmat_sam_${building.id}`,
      name: "Radiation Tech Sam",
      type: "hazmat",
      tx: 11,
      ty: 8,
      homeX: 11,
      homeY: 8,
      dialogueKey: 'area51_scientist'
    });
  }

  // --- DINER / RESTAURANT INTERIOR ("The Area Fifty-Bun") ---
  populateDinerInterior(tiles, solid, interactables, npcs, rng, building) {
    // Kitchen back line (y = 2)
    tiles[2][3] = 'diner_chalkboard';
    solid[2][3] = true;
    tiles[2][5] = 'burger_grill';
    solid[2][5] = true;
    tiles[2][6] = 'burger_grill';
    solid[2][6] = true;
    tiles[2][9] = 'kitchen_sink';
    solid[2][9] = true;
    tiles[2][10] = 'kitchen_fridge';
    solid[2][10] = true;

    // Front Serving Counter (y = 3)
    for (let x = 3; x <= 12; x++) {
      tiles[3][x] = 'counter_wood';
      solid[3][x] = true;
    }
    tiles[3][4] = 'cash_register';
    tiles[3][8] = 'condiments_caddy';
    tiles[3][11] = 'coffee_brewer';

    // Bar stools (y = 4)
    tiles[4][4] = 'bar_stool';
    tiles[4][6] = 'bar_stool';
    tiles[4][8] = 'bar_stool';
    tiles[4][10] = 'bar_stool';
    tiles[4][12] = 'bar_stool';

    // Left Dining Booths (Red leather)
    tiles[7][2] = 'diner_booth';
    solid[7][2] = true;
    tiles[7][3] = 'diner_table';
    solid[7][3] = true;
    tiles[7][4] = 'diner_booth';
    solid[7][4] = true;

    tiles[9][2] = 'diner_booth';
    solid[9][2] = true;
    tiles[9][3] = 'diner_table';
    solid[9][3] = true;
    tiles[9][4] = 'diner_booth';
    solid[9][4] = true;

    // Right Dining Booths
    tiles[7][11] = 'diner_booth';
    solid[7][11] = true;
    tiles[7][12] = 'diner_table';
    solid[7][12] = true;
    tiles[7][13] = 'diner_booth';
    solid[7][13] = true;

    tiles[9][11] = 'diner_booth';
    solid[9][11] = true;
    tiles[9][12] = 'diner_table';
    solid[9][12] = true;
    tiles[9][13] = 'diner_booth';
    solid[9][13] = true;

    // Amenities
    tiles[2][1] = 'jukebox';
    solid[2][1] = true;
    interactables.push({
      type: 'jukebox',
      tx: 1,
      ty: 2,
      prompt: "Play Alien Synth Melody"
    });

    tiles[2][14] = 'potted_plant';
    solid[2][14] = true;
    tiles[8][1] = 'trash_can';
    solid[8][1] = true;

    // NPCs (5 characters in diner!)
    npcs.push({
      id: `npc_chef_${building.id}`,
      name: "Chef Marco",
      type: "chef",
      tx: 6,
      ty: 2,
      homeX: 6,
      homeY: 2,
      dialogueKey: 'chef_diner'
    });
    npcs.push({
      id: `npc_waitress_${building.id}`,
      name: "Brenda the Waitress",
      type: "waitress",
      tx: 5,
      ty: 6,
      homeX: 5,
      homeY: 6,
      dialogueKey: 'waitress_diner'
    });
    npcs.push({
      id: `npc_patron_gus_${building.id}`,
      name: "Trucker Gus",
      type: "rude_local_m",
      tx: 3,
      ty: 6,
      homeX: 3,
      homeY: 6,
      dialogueKey: 'diner_customer'
    });
    npcs.push({
      id: `npc_patron_dottie_${building.id}`,
      name: "Tourist Dottie",
      type: "shopper",
      tx: 12,
      ty: 6,
      homeX: 12,
      homeY: 6,
      dialogueKey: 'diner_customer'
    });
    npcs.push({
      id: `npc_patron_barfly_${building.id}`,
      name: "Stool Regular Phil",
      type: "tinfoil",
      tx: 10,
      ty: 5,
      homeX: 10,
      homeY: 5,
      dialogueKey: 'barfly_dialogue'
    });
  }

  // --- RETAIL STORE / GROCERY INTERIOR ---
  populateRetailInterior(tiles, solid, interactables, npcs, rng, building) {
    // Checkout Counter (Left)
    tiles[3][2] = 'counter_wood';
    solid[3][2] = true;
    tiles[3][3] = 'cash_register';
    solid[3][3] = true;
    tiles[3][4] = 'counter_wood';
    solid[3][4] = true;

    tiles[2][1] = 'shopping_cart';
    solid[2][1] = true;
    tiles[4][1] = 'shopping_cart';
    solid[4][1] = true;
    tiles[5][2] = 'magazine_rack';
    solid[5][2] = true;

    // Upright Beverage Coolers (Back Wall)
    tiles[2][10] = 'retail_cooler_drinks';
    solid[2][10] = true;
    tiles[2][11] = 'retail_cooler_drinks';
    solid[2][11] = true;
    tiles[2][12] = 'retail_cooler_drinks';
    solid[2][12] = true;
    tiles[2][13] = 'retail_cooler_drinks';
    solid[2][13] = true;

    // Snack & Grocery Gondola Aisles
    for (let y = 5; y <= 7; y++) {
      tiles[y][6] = 'retail_shelf_snacks';
      solid[y][6] = true;
      tiles[y][9] = 'retail_shelf_snacks';
      solid[y][9] = true;
      tiles[y][12] = 'bookshelf';
      solid[y][12] = true;
    }

    tiles[9][2] = 'trash_can';
    solid[9][2] = true;
    interactables.push({
      type: 'trash_can',
      tx: 2,
      ty: 9,
      prompt: "Inspect Clearance Discount Bin"
    });

    tiles[2][6] = 'potted_plant';
    solid[2][6] = true;

    // NPCs (5 characters in store!)
    npcs.push({
      id: `npc_shopkeeper_${building.id}`,
      name: "Barnaby the Clerk",
      type: "alien_disguised",
      tx: 3,
      ty: 2,
      homeX: 3,
      homeY: 2,
      dialogueKey: 'shopkeeper_dialogue'
    });
    npcs.push({
      id: `npc_shopper_penny_${building.id}`,
      name: "Penny with Groceries",
      type: "shopper",
      tx: 5,
      ty: 8,
      homeX: 5,
      homeY: 8,
      dialogueKey: 'shopper_dialogue'
    });
    npcs.push({
      id: `npc_biz_arthur_${building.id}`,
      name: "Arthur the Skeptic",
      type: "businessman",
      tx: 10,
      ty: 6,
      homeX: 10,
      homeY: 6,
      dialogueKey: 'shopper_dialogue'
    });
    npcs.push({
      id: `npc_timmy_${building.id}`,
      name: "Tin-Foil Timmy",
      type: "tinfoil",
      tx: 11,
      ty: 8,
      homeX: 11,
      homeY: 8,
      dialogueKey: 'shopper_dialogue'
    });
    npcs.push({
      id: `npc_cat_barnaby_${building.id}`,
      name: "Store Cat Whiskers",
      type: "alien_cat",
      tx: 14,
      ty: 2,
      homeX: 14,
      homeY: 2,
      dialogueKey: 'cat_dialogue'
    });
  }

  // --- BAR & TAVERN INTERIOR ---
  populateBarInterior(tiles, solid, interactables, npcs, rng, building) {
    // Bar Counter & Draft Taps
    for (let x = 2; x <= 8; x++) {
      tiles[3][x] = 'counter_wood';
      solid[3][x] = true;
    }
    tiles[3][3] = 'cash_register';
    tiles[3][5] = 'beer_taps';

    // Bar stools
    tiles[4][2] = 'bar_stool';
    tiles[4][4] = 'bar_stool';
    tiles[4][6] = 'bar_stool';
    tiles[4][8] = 'bar_stool';

    // Back-bar mirrored liquor shelves
    tiles[2][2] = 'liquor_shelf';
    solid[2][2] = true;
    tiles[2][4] = 'liquor_shelf';
    solid[2][4] = true;
    tiles[2][6] = 'liquor_shelf';
    solid[2][6] = true;
    tiles[2][8] = 'liquor_shelf';
    solid[2][8] = true;

    // Games & Entertainment
    tiles[6][11] = 'pool_table';
    solid[6][11] = true;
    tiles[6][12] = 'pool_table';
    solid[6][12] = true;

    tiles[2][12] = 'dartboard';
    solid[2][12] = true;
    tiles[2][14] = 'arcade_cabinet';
    solid[2][14] = true;
    interactables.push({
      type: 'arcade',
      tx: 14,
      ty: 2,
      prompt: "Play 'Alien Invaders 1984' Arcade"
    });

    tiles[2][10] = 'jukebox';
    solid[2][10] = true;
    interactables.push({
      type: 'jukebox',
      tx: 10,
      ty: 2,
      prompt: "Play Cosmic Blues Jukebox"
    });

    // Pub Candle Tables & Seating
    tiles[8][2] = 'candle_table';
    solid[8][2] = true;
    tiles[8][1] = 'couch';
    solid[8][1] = true;
    tiles[8][5] = 'candle_table';
    solid[8][5] = true;

    // NPCs (5 characters in bar!)
    npcs.push({
      id: `npc_bartender_${building.id}`,
      name: "Gus the Barkeep",
      type: "informant",
      tx: 5,
      ty: 2,
      homeX: 5,
      homeY: 2,
      dialogueKey: 'bartender_dialogue'
    });
    npcs.push({
      id: `npc_barfly_${building.id}`,
      name: "Barfly Hank",
      type: "tinfoil",
      tx: 6,
      ty: 4,
      homeX: 6,
      homeY: 4,
      dialogueKey: 'barfly_dialogue'
    });
    npcs.push({
      id: `npc_informant_sal_${building.id}`,
      name: "Slick Sal",
      type: "informant",
      tx: 10,
      ty: 6,
      homeX: 10,
      homeY: 6,
      dialogueKey: 'pool_player_dialogue'
    });
    npcs.push({
      id: `npc_clara_${building.id}`,
      name: "Clara at the Booth",
      type: "rude_local_f",
      tx: 2,
      ty: 8,
      homeX: 2,
      homeY: 8,
      dialogueKey: 'bartender_dialogue'
    });
    npcs.push({
      id: `npc_cat_cosmo_${building.id}`,
      name: "Cosmo the 3-Eyed Cat",
      type: "alien_cat",
      tx: 14,
      ty: 3,
      homeX: 14,
      homeY: 3,
      dialogueKey: 'cat_dialogue'
    });
  }

  // --- GYM INTERIOR ---
  populateGymInterior(tiles, solid, interactables, npcs, rng, building) {
    // Cardio zone
    tiles[3][2] = 'treadmill';
    solid[3][2] = true;
    tiles[3][4] = 'treadmill';
    solid[3][4] = true;
    tiles[3][6] = 'treadmill';
    solid[3][6] = true;

    // Free weights & Bench press
    tiles[3][10] = 'bench_press';
    solid[3][10] = true;
    tiles[3][12] = 'bench_press';
    solid[3][12] = true;
    tiles[2][14] = 'weight_rack';
    solid[2][14] = true;
    tiles[4][14] = 'weight_rack';
    solid[4][14] = true;

    // Functional & boxing zone
    tiles[7][2] = 'punching_bag';
    solid[7][2] = true;
    tiles[7][4] = 'punching_bag';
    solid[7][4] = true;
    tiles[8][11] = 'yoga_mat';
    tiles[8][12] = 'yoga_mat';

    // Facilities & Posters
    tiles[2][1] = 'water_cooler';
    solid[2][1] = true;
    interactables.push({
      type: 'water_cooler',
      tx: 1,
      ty: 2,
      prompt: "Drink Electrolyte Slime-Water"
    });

    tiles[2][8] = 'poster_gains';
    solid[2][8] = true;

    tiles[2][11] = 'lockers';
    solid[2][11] = true;
    tiles[2][12] = 'lockers';
    solid[2][12] = true;
    tiles[2][13] = 'lockers';
    solid[2][13] = true;

    // NPCs (5 characters in gym!)
    npcs.push({
      id: `npc_trainer_${building.id}`,
      name: "Coach Rex",
      type: "gymbro",
      tx: 8,
      ty: 5,
      homeX: 8,
      homeY: 5,
      dialogueKey: 'coach_dialogue'
    });
    npcs.push({
      id: `npc_chad_${building.id}`,
      name: "Chad the Spotter",
      type: "gymbro",
      tx: 10,
      ty: 4,
      homeX: 10,
      homeY: 4,
      dialogueKey: 'gym_dialogue'
    });
    npcs.push({
      id: `npc_cardio_kelly_${building.id}`,
      name: "Cardio Kelly",
      type: "gymnast",
      tx: 4,
      ty: 4,
      homeX: 4,
      homeY: 4,
      dialogueKey: 'gym_member'
    });
    npcs.push({
      id: `npc_sweaty_dan_${building.id}`,
      name: "Sweaty Dan",
      type: "gymnast",
      tx: 3,
      ty: 7,
      homeX: 3,
      homeY: 7,
      dialogueKey: 'gym_member'
    });
    npcs.push({
      id: `npc_dog_buster_${building.id}`,
      name: "Gym Mascot Buster",
      type: "dog",
      tx: 2,
      ty: 2,
      homeX: 2,
      homeY: 2,
      dialogueKey: 'dog_dialogue'
    });
  }

  // --- OFFICE INTERIOR (Weather Bureau / Conspiracy Headquarters) ---
  populateOfficeInterior(tiles, solid, interactables, npcs, rng, building) {
    // Workstations & desks
    tiles[4][3] = 'office_desk';
    solid[4][3] = true;
    tiles[4][5] = 'office_desk';
    solid[4][5] = true;
    tiles[4][10] = 'office_desk';
    solid[4][10] = true;
    tiles[4][12] = 'office_desk';
    solid[4][12] = true;

    tiles[7][3] = 'office_desk';
    solid[7][3] = true;
    tiles[7][5] = 'office_desk';
    solid[7][5] = true;
    tiles[7][10] = 'office_desk';
    solid[7][10] = true;
    tiles[7][12] = 'office_desk';
    solid[7][12] = true;

    // Cubicle dividers
    tiles[3][4] = 'office_cubicle';
    solid[3][4] = true;
    tiles[3][11] = 'office_cubicle';
    solid[3][11] = true;
    tiles[6][4] = 'office_cubicle';
    solid[6][4] = true;
    tiles[6][11] = 'office_cubicle';
    solid[6][11] = true;

    // Archives & Tech Wall
    tiles[2][1] = 'conspiracy_board';
    solid[2][1] = true;
    tiles[2][2] = 'filing_cabinet';
    solid[2][2] = true;
    interactables.push({
      type: 'filing_cabinet',
      tx: 2,
      ty: 2,
      prompt: "Search Redacted Filing Cabinet",
      cabinetId: `cab_${building.id}`
    });
    tiles[2][3] = 'filing_cabinet';
    solid[2][3] = true;

    tiles[2][7] = 'server_rack';
    solid[2][7] = true;
    tiles[2][8] = 'server_rack';
    solid[2][8] = true;

    tiles[2][13] = 'copier_machine';
    solid[2][13] = true;
    tiles[2][14] = 'water_cooler';
    solid[2][14] = true;
    interactables.push({
      type: 'water_cooler',
      tx: 14,
      ty: 2,
      prompt: "Inspect Water Cooler"
    });

    tiles[9][2] = 'potted_plant';
    solid[9][2] = true;
    tiles[9][13] = 'potted_plant';
    solid[9][13] = true;

    // NPCs (5 characters in office!)
    npcs.push({
      id: `npc_agent_jenkins_${building.id}`,
      name: "Bureaucrat Jenkins",
      type: "agent",
      tx: 5,
      ty: 4,
      homeX: 5,
      homeY: 4,
      dialogueKey: 'office_agent_dialogue'
    });
    npcs.push({
      id: `npc_agent_mulder_${building.id}`,
      name: "Special Agent Fox",
      type: "agent",
      tx: 10,
      ty: 4,
      homeX: 10,
      homeY: 4,
      dialogueKey: 'agent_dialogue'
    });
    npcs.push({
      id: `npc_analyst_wendy_${building.id}`,
      name: "Analyst Wendy",
      type: "businessman",
      tx: 3,
      ty: 7,
      homeX: 3,
      homeY: 7,
      dialogueKey: 'office_worker'
    });
    npcs.push({
      id: `npc_intern_kevin_${building.id}`,
      name: "Intern Kevin",
      type: "businessman",
      tx: 13,
      ty: 3,
      homeX: 13,
      homeY: 3,
      dialogueKey: 'office_worker'
    });
    npcs.push({
      id: `npc_shredder_dave_${building.id}`,
      name: "Archivist Dave",
      type: "agent",
      tx: 2,
      ty: 3,
      homeX: 2,
      homeY: 3,
      dialogueKey: 'office_agent_dialogue'
    });
  }

  // --- HOUSE & APARTMENT INTERIOR (Cole's Flat & Residents) ---
  populateHouseInterior(tiles, solid, interactables, npcs, rng, building) {
    const isColeFlat = building.id.includes('cole');

    // Kitchenette (Upper Right)
    tiles[2][11] = 'kitchen_fridge';
    solid[2][11] = true;
    tiles[2][12] = 'kitchen_stove';
    solid[2][12] = true;
    tiles[2][13] = 'kitchen_sink';
    solid[2][13] = true;
    tiles[4][12] = 'diner_table';
    solid[4][12] = true;

    // Living Room (Left)
    tiles[3][4] = 'couch';
    solid[3][4] = true;
    tiles[3][2] = 'armchair';
    solid[3][2] = true;
    tiles[5][3] = 'rug_oval';
    tiles[2][3] = 'tv_static';
    solid[2][3] = true;
    interactables.push({
      type: 'tv',
      tx: 3,
      ty: 2,
      prompt: "Inspect Static Broadcast"
    });

    tiles[2][1] = 'potted_plant';
    solid[2][1] = true;

    // Bedroom / Investigation Corner (Lower Left)
    tiles[8][2] = 'bed_cozy';
    solid[8][2] = true;
    tiles[7][2] = 'nightstand';
    solid[7][2] = true;
    tiles[2][7] = 'bookshelf';
    solid[2][7] = true;
    interactables.push({
      type: 'bookshelf',
      tx: 7,
      ty: 2,
      prompt: "Browse Paranormal Book Collection"
    });

    tiles[2][8] = isColeFlat ? 'conspiracy_board' : 'bookshelf';
    solid[2][8] = true;
    tiles[7][5] = 'office_desk';
    solid[7][5] = true;

    // NPCs (4-5 characters in residential home!)
    if (isColeFlat) {
      npcs.push({
        id: `npc_house_${building.id}`,
        name: "Mrs. Gable (Landlady)",
        type: "tinfoil",
        tx: 4,
        ty: 3,
        homeX: 4,
        homeY: 3,
        dialogueKey: 'mrs_gable_flat'
      });
      npcs.push({
        id: `npc_cat_cosmo_flat_${building.id}`,
        name: "Cosmo the 3-Eyed Cat",
        type: "alien_cat",
        tx: 3,
        ty: 5,
        homeX: 3,
        homeY: 5,
        dialogueKey: 'cat_dialogue'
      });
      npcs.push({
        id: `npc_uncle_barnaby_${building.id}`,
        name: "Uncle Barnaby",
        type: "tinfoil",
        tx: 12,
        ty: 5,
        homeX: 12,
        homeY: 5,
        dialogueKey: 'resident_house'
      });
    } else {
      npcs.push({
        id: `npc_resident_helen_${building.id}`,
        name: "Resident Helen",
        type: "rude_local_f",
        tx: 2,
        ty: 4,
        homeX: 2,
        homeY: 4,
        dialogueKey: 'resident_house'
      });
      npcs.push({
        id: `npc_resident_dave_${building.id}`,
        name: "Resident Dave",
        type: "shopper",
        tx: 12,
        ty: 3,
        homeX: 12,
        homeY: 3,
        dialogueKey: 'resident_house'
      });
      npcs.push({
        id: `npc_dog_bailey_${building.id}`,
        name: "Sleepy Dog Bailey",
        type: "dog",
        tx: 3,
        ty: 5,
        homeX: 3,
        homeY: 5,
        dialogueKey: 'dog_dialogue'
      });
    }
  }
}

// Global world singleton
window.spottedWorld = new SpottedWorld();
