/**
 * Spotted - Quest System, Story Campaigns, NPCs, and Evidence Corkboard
 * Protagonist: Cole Welps
 * Goal: Infiltrate Area 51 with an insider's keycard, see the live alien, and get busted by the Feds!
 */

class SpottedQuests {
  constructor() {
    this.playerName = "Cole Welps";
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = 100;
    this.title = "Amateur Spotter";

    this.inventory = [
      {
        id: 'magnifier',
        name: "Detective Magnifier",
        desc: "A vintage brass glass. Great for inspecting suspicious footprints and tire tracks.",
        icon: 'icon_magnifier',
        usable: true
      }
    ];

    this.evidenceBoard = [
      {
        id: 'clue_cole_clippings',
        title: "Newspaper Clipping: 'Bizarre Lights Over Oakhaven'",
        type: 'photo',
        desc: "The article Cole read on the late-night bus that prompted him to pack everything and move to Oakhaven.",
        date: "October 19, 2026",
        x: 60, y: 50,
        connectedTo: []
      }
    ];

    this.mainStoryStep = 1; // 1 to 5
    this.activeQuest = null;
    this.completedQuestIds = new Set();
    this.initMainQuest();
  }

  getXpForLevel(lvl) {
    return Math.floor(100 * Math.pow(1.5, lvl - 1));
  }

  addXp(amount, reason = "") {
    this.xp += amount;
    if (window.spottedGame) {
      window.spottedGame.showNotification(`+${amount} XP ${reason ? '(' + reason + ')' : ''}`);
    }

    while (this.xp >= this.xpNeeded && this.level < 10) {
      this.xp -= this.xpNeeded;
      this.level++;
      this.xpNeeded = this.getXpForLevel(this.level);
      this.updateTitle();
      if (window.spottedAudio) window.spottedAudio.playLevelUp();
      if (window.spottedGame) {
        window.spottedGame.showLevelUpModal(this.level, this.title);
      }
    }
  }

  updateTitle() {
    const titles = [
      "Amateur Spotter",             // 1
      "Tin Foil Apprentice",        // 2
      "Crop Circle Sleuth",         // 3
      "Radio Static Decoder",       // 4
      "Cryptid Scout",              // 5
      "Men-in-Beige Evader",        // 6
      "Senior Anomaly Analyst",     // 7
      "Paranormal Whistleblower",   // 8
      "Area 51 Infiltrator",        // 9
      "Public Enemy #1 (Busted!)"   // 10
    ];
    this.title = titles[Math.min(this.level - 1, titles.length - 1)];
  }

  hasItem(id) {
    return this.inventory.some(item => item.id === id);
  }

  addItem(item) {
    if (!this.hasItem(item.id)) {
      this.inventory.push(item);
      if (window.spottedAudio) window.spottedAudio.playItemGet();
      if (window.spottedGame) {
        window.spottedGame.showNotification(`Acquired: ${item.name}!`);
      }
    }
  }

  removeItem(id) {
    this.inventory = this.inventory.filter(item => item.id !== id);
  }

  addEvidence(clue) {
    if (!this.evidenceBoard.some(c => c.id === clue.id)) {
      this.evidenceBoard.push(clue);
      if (window.spottedAudio) window.spottedAudio.playItemGet();
      if (window.spottedGame) {
        window.spottedGame.showNotification(`New Evidence Pinned: "${clue.title}"!`);
      }
    }
  }

  initMainQuest() {
    this.startCaseFile(this.mainStoryStep);
  }

  startCaseFile(step) {
    this.mainStoryStep = step;

    if (step === 1) {
      this.activeQuest = {
        id: 'case_1',
        title: "Case #1: The Scrambled Airwaves",
        category: "Main Story",
        chapter: 1,
        desc: "Cole Welps has arrived in Oakhaven. Speak to landlady Mrs. Gable outside, then locate a frequency detector to investigate the scrambled broadcast.",
        step: 0,
        targetDesc: "Talk to Mrs. Gable in front of your flat in Sector [0, 0].",
        targetCoords: { x: 8, y: 13 },
        rewardXp: 150
      };
    } 
    else if (step === 2) {
      this.activeQuest = {
        id: 'case_2',
        title: "Case #2: The Bovine Phenomenon",
        category: "Main Story",
        chapter: 2,
        desc: "Reports claim Bessie the Cow is levitating! Find Bessie or a Crop Circle in neighboring sectors and scan it with your EMF Meter.",
        step: 0,
        targetDesc: "Scan a Crop Circle Anomaly with your EMF Detector.",
        targetCoords: { x: 13, y: 14 },
        rewardXp: 250
      };
    }
    else if (step === 3) {
      this.activeQuest = {
        id: 'case_3',
        title: "Case #3: The Department of Weather Balloons",
        category: "Main Story",
        chapter: 3,
        desc: "The shadowy 'Men in Beige' are seizing appliances. Infiltrate a Department of Weather Balloons office and search their filing cabinet.",
        step: 0,
        targetDesc: "Enter a Dept. of Weather Balloons office and search the Top-Secret filing cabinet.",
        targetCoords: { x: 11, y: 11 },
        rewardXp: 350
      };
    }
    else if (step === 4) {
      this.activeQuest = {
        id: 'case_4',
        title: "Case #4: The Government Insider",
        category: "Main Story",
        chapter: 4,
        desc: "Find Agent Miller (The Insider) near Sector [1, 1]. Hand over the Radioactive Clover and classified dossier to prove you're a serious investigator and gain access to Area 51.",
        step: 0,
        targetDesc: "Talk to Agent Miller outside the classified facility in Sector [1, 1].",
        targetCoords: { x: 9, y: 13 },
        rewardXp: 500
      };
    }
    else if (step === 5) {
      this.activeQuest = {
        id: 'case_5',
        title: "Case #5: Infiltrating Area 51",
        category: "Main Story",
        chapter: 5,
        desc: "Use the Area 51 Keycard to unlock the Sub-Vault in Sector [1, 1]. Look directly into the cryogenic stasis pod to finally see a living alien!",
        step: 0,
        targetDesc: "Enter the Area 51 Vault in Sector [1, 1] and inspect the Alien Pod.",
        targetCoords: { x: 11, y: 11 },
        rewardXp: 1000
      };
    }
  }

  advanceMainStory() {
    if (this.mainStoryStep < 5) {
      this.mainStoryStep++;
      this.startCaseFile(this.mainStoryStep);
      if (window.spottedAudio) window.spottedAudio.playQuestAccepted();
    }
  }

  handleInteraction(type, target) {
    if (!this.activeQuest) return null;

    // Case 1
    if (this.activeQuest.id === 'case_1') {
      if (type === 'talk' && target.id === 'npc_mrs_gable') {
        if (this.activeQuest.step === 0) {
          this.activeQuest.step = 1;
          this.activeQuest.targetDesc = "Search the dumpster behind The Area Fifty-Bun for an EMF Meter.";
          this.activeQuest.targetCoords = { x: 16, y: 12 };
          return 'mrs_gable_intro';
        } else if (this.hasItem('emf')) {
          this.addXp(150, "Case #1 Solved");
          this.addEvidence({
            id: 'clue_case1_recording',
            title: "Audio Tape: Encoded Lullaby",
            type: 'clue',
            desc: "Recorded behind the diner. Radio broadcast contains coordinates pointing towards Sector [1, 1].",
            date: "October 20, 2026",
            x: 180, y: 70,
            connectedTo: ['clue_cole_clippings']
          });
          if (window.spottedAudio) window.spottedAudio.playQuestComplete();
          this.advanceMainStory();
          return 'mrs_gable_complete';
        }
      }

      if (type === 'trash_can' && this.activeQuest.step === 1 && !this.hasItem('emf')) {
        this.addItem({
          id: 'emf',
          name: "Pocket EMF Detector",
          desc: "Bleeps and flashes near electromagnetic anomalies. Hold it to scan hot spots!",
          icon: 'icon_emf',
          usable: true
        });
        this.activeQuest.step = 2;
        this.activeQuest.targetDesc = "Report back to Mrs. Gable with your new EMF Detector!";
        this.activeQuest.targetCoords = { x: 8, y: 13 };
        return 'found_emf';
      }
    }

    // Case 2 (Bessie & Crop Circle)
    if (this.activeQuest.id === 'case_2') {
      if (type === 'anomaly' && this.hasItem('emf')) {
        this.addItem({
          id: 'clover',
          name: "Radioactive 4-Leaf Clover",
          desc: "A glowing green clover plucked from the crop circle. It hums with extraterrestrial energy.",
          icon: 'icon_clover',
          usable: true
        });
        this.addEvidence({
          id: 'clue_case2_clover',
          title: "Specimen: Phosphorescent Clover",
          type: 'photo',
          desc: "Glowing crop sample proving non-terrestrial propulsion exhaust.",
          date: "October 20, 2026",
          x: 290, y: 120,
          connectedTo: ['clue_case1_recording']
        });
        this.addXp(250, "Case #2 Solved");
        this.addItem({
          id: 'camera',
          name: "Instant Polaroid Camera",
          desc: "Snaps photos of suspicious spooks and UFOs for your Evidence Board.",
          icon: 'icon_camera',
          usable: true
        });
        if (window.spottedAudio) window.spottedAudio.playQuestComplete();
        this.advanceMainStory();
        return 'anomaly_scanned';
      }

      if (type === 'talk' && target.type === 'cow') {
        return 'cow_dialogue';
      }
    }

    // Case 3 (Infiltrate Weather Bureau)
    if (this.activeQuest.id === 'case_3') {
      if (type === 'filing_cabinet' && !this.hasItem('dossier')) {
        this.addItem({
          id: 'dossier',
          name: "Redacted Top-Secret Dossier",
          desc: "Marked: 'DWBDNE INTERNAL MEMO #42'. Details a rogue insider nicknamed Agent Miller!",
          icon: 'icon_dossier',
          usable: true
        });
        this.addEvidence({
          id: 'clue_case3_dossier',
          title: "Dossier: Project Greyskin",
          type: 'document',
          desc: "Classified memo revealing a subterranean facility in Sector [1, 1] housing a live specimen.",
          date: "October 20, 2026",
          x: 120, y: 220,
          connectedTo: ['clue_case2_clover']
        });
        this.addXp(350, "Case #3 Solved");
        this.addItem({
          id: 'tinfoil',
          name: "Tin Foil Fedora",
          desc: "Stylish cranial shielding. Blocks telepathic brainwaves.",
          icon: 'icon_tinfoil',
          usable: true
        });
        if (window.spottedAudio) window.spottedAudio.playQuestComplete();
        this.advanceMainStory();
        return 'filing_cabinet_found';
      }
    }

    // Case 4 (Agent Miller - The Insider)
    if (this.activeQuest.id === 'case_4') {
      if (type === 'talk' && target.id === 'npc_agent_insider') {
        if (this.hasItem('clover') && this.hasItem('dossier')) {
          this.addItem({
            id: 'keycard',
            name: "Area 51 Security Keycard",
            desc: "Golden Level-5 Clearance Card. Opens the subterranean vault blast doors in Sector [1, 1]!",
            icon: 'icon_keycard',
            usable: true
          });
          this.addEvidence({
            id: 'clue_case4_keycard',
            title: "Access Granted: Area 51 Keycard",
            type: 'clue',
            desc: "Agent Miller provided the security card to the subterranean bunker. The specimen is inside!",
            date: "October 20, 2026",
            x: 240, y: 260,
            connectedTo: ['clue_case3_dossier']
          });
          this.addXp(500, "Insider Recruited");
          if (window.spottedAudio) window.spottedAudio.playQuestComplete();
          this.advanceMainStory();
          return 'agent_insider_keycard';
        } else {
          return 'agent_insider_need_proof';
        }
      }
    }

    // Case 5 (Area 51 Door & Alien Pod Takedown!)
    if (this.activeQuest.id === 'case_5') {
      if (type === 'door' && target.building && target.building.type === 'area51') {
        if (!this.hasItem('keycard')) {
          return 'door_locked_area51';
        }
      }

      if (type === 'alien_pod') {
        // TRIGGER CLIMAX: Cole sees the alien, then feds bust in!
        if (window.spottedGame) {
          window.spottedGame.triggerAlienBustedClimax();
        }
        return 'see_alien_climax';
      }
    }

    return null;
  }

  getDialogue(key, target) {
    const dialogues = {
      mrs_gable_intro: {
        speaker: "Mrs. Gable",
        type: "tinfoil",
        voice: "lady",
        lines: [
          "Well if it isn't my new tenant, Cole Welps! Welcome to Oakhaven.",
          "Ever since last Tuesday, my television set only receives backwards accordion music and glowing green static!",
          "The news says it's just 'weather balloons,' but I'm wearing three layers of heavy-duty Reynolds Wrap under my bonnet just in case.",
          "I dropped my frequency meter behind the diner dumpster when an eerie light chased me. Go fetch it and see what's out there!"
        ]
      },
      mrs_gable_complete: {
        speaker: "Mrs. Gable",
        type: "tinfoil",
        voice: "lady",
        lines: [
          "You found the frequency meter! And you recorded the static?",
          "I knew it! That's no weather balloon—that's an F-sharp minor tractor frequency!",
          "Word is, Bessie the cow in the next pasture has been floating again. Take your scanner and investigate!"
        ]
      },
      found_emf: {
        speaker: "Cole Welps",
        type: "player",
        voice: "normal",
        lines: [
          "*Rummaging through the diner bin...*",
          "Aha! A Pocket EMF Anomaly Detector! Still has 3 bars of battery.",
          "The needle is already twitching towards the nearest crop circle. Better report back to Mrs. Gable!"
        ]
      },
      chef_luigi_street: {
        speaker: "Chef Luigi",
        type: "chef",
        voice: "quirky",
        lines: [
          "Buon appetito, friend! Welcome to The Area Fifty-Bun!",
          "Our special today is the Roswell Rare Burger with Cosmic BBQ Glaze.",
          "Don't listen to those Men in Beige across the street—our secret sauce is 100% earthly! Mostly mayonnaise and smoked paprika!"
        ]
      },
      cow_dialogue: {
        speaker: "Bessie the Cow",
        type: "cow",
        voice: "cow",
        lines: [
          "Moooooo.... *Bessie floats 4 inches off the grass*",
          "*She stares at Cole with calm, bovine eyes, chewing on a piece of neon glowing clover.*",
          "*Her bell tinkles in a sequence that sounds distinctly like Morse Code.*"
        ]
      },
      anomaly_scanned: {
        speaker: "Cole Welps",
        type: "player",
        voice: "normal",
        lines: [
          "*EMF Meter sings wildly with rhythmic chirping!*",
          "The crop circle grass is glowing with faint luminescence! You carefully harvest a Radioactive 4-Leaf Clover.",
          "Underneath the turf, you spot a high-tech Polaroid Instant Camera dropped by an earlier investigator! Added to inventory."
        ]
      },
      agent_dialogue: {
        speaker: "Special Agent Smithson",
        type: "agent",
        voice: "agent",
        lines: [
          "Move along, citizen. Nothing to see here.",
          "That silver disc you saw hovering at 50,000 feet was merely swamp gas refracting off a flock of Canadian geese.",
          "Now please surrender your toaster for routine government recalibration."
        ]
      },
      filing_cabinet_found: {
        speaker: "Cole Welps",
        type: "player",
        voice: "normal",
        lines: [
          "*Click... lock picks successfully!*",
          "Inside the drawer is a heavy folder stamped: 'TOP SECRET - PROJECT GREYSKIN'.",
          "It reveals that a disillusioned government insider named Agent Miller is stationing near Sector [1, 1]!",
          "Plus, whoever owned this left a Tin Foil Fedora on top! Added to inventory."
        ]
      },
      agent_insider_need_proof: {
        speaker: "Agent Miller (The Insider)",
        type: "agent",
        voice: "agent",
        lines: [
          "Psst! You there in the trenchcoat! Back off unless you have real business.",
          "I don't talk to tourists. If you want proof of what's inside that bunker, bring me real evidence: a Radioactive Clover and the classified dossier from the Weather Bureau!"
        ]
      },
      agent_insider_keycard: {
        speaker: "Agent Miller (The Insider)",
        type: "agent",
        voice: "agent",
        lines: [
          "You actually got the irradiated clover... and the classified Greyskin file?!",
          "I've been working for the Department for 15 years, Cole. I've had enough of the lies.",
          "Here—take my Area 51 Level-5 Security Keycard. The blast doors are right behind me.",
          "Go down to the sub-vault. The live extraterrestrial specimen is in the cryogenic observation chamber.",
          "Be careful, Welps... the moment you look at it, there's no turning back."
        ]
      },
      door_locked_area51: {
        speaker: "Security Terminal",
        type: "agent",
        voice: "typewriter",
        lines: [
          "[ACCESS DENIED - LEVEL 5 CLEARANCE REQUIRED]",
          "Please swipe authorized Area 51 Keycard."
        ]
      },
      see_alien_climax: {
        speaker: "Cole Welps",
        type: "player",
        voice: "normal",
        lines: [
          "*GASP!*",
          "Great Scott... it's real. A living, breathing extraterrestrial floating in stasis fluid!",
          "The almond eyes... the emerald glow... humanity is NOT alone in the universe!",
          "I have to take a photo—this will blow the lid off the entire world—"
        ]
      },
      scientist_dialogue: {
        speaker: "Dr. Hubert Vance",
        type: "scientist",
        voice: "scientist",
        lines: [
          "Fascinating! The ionization levels in this sector are off the charts!",
          "My ex-colleagues at NASA laughed when I said the town water smelled like rocket propellant.",
          "Keep your eyes peeled, Cole. The truth is closer than anyone thinks!"
        ]
      },
      resident_gossip: {
        speaker: target ? target.name : "Resident",
        type: target ? target.type : "tinfoil",
        voice: "normal",
        lines: [
          "Did you hear? The feds have been patrolling the perimeter of Sector [1, 1] day and night.",
          "They say if you step within 50 feet of the research annex, they wipe your memory with a blinking red pen!"
        ]
      },
      rude_dialogue_1: {
        speaker: target ? target.name : "Grumpy Resident",
        type: target ? target.type : "rude_local_m",
        voice: "deep",
        lines: [
          "Beat it, Columbo! I'm late for work and I couldn't care less about your flying saucers.",
          "Go peddle your tin foil theories somewhere else!"
        ]
      },
      rude_dialogue_2: {
        speaker: target ? target.name : "Annoyed Resident",
        type: target ? target.type : "rude_local_f",
        voice: "lady",
        lines: [
          "Does that damp trenchcoat come with a certificate of sanity, young man?",
          "Can't you see I'm busy ignoring you? Leave me alone before I call the sheriff!"
        ]
      },
      rude_dialogue_3: {
        speaker: target ? target.name : "Busy Local",
        type: target ? target.type : "rude_local_m",
        voice: "deep",
        lines: [
          "I don't have time for your UFO podcast, buddy. My microwave is already talking to me and I have laundry to do.",
          "Scram!"
        ]
      },
      rude_dialogue_4: {
        speaker: target ? target.name : "Furious Resident",
        type: target ? target.type : "rude_local_f",
        voice: "lady",
        lines: [
          "Stop breathing on my sidewalk! If you mention 'weather balloons' one more time, I'm throwing a toaster at you!",
          "Get lost, fedora boy!"
        ]
      },
      cat_dialogue: {
        speaker: "Cosmo the 3-Eyed Cat",
        type: "alien_cat",
        voice: "lady",
        lines: [
          "Meow... *purrs in a resonant 432 Hz frequency*",
          "*Its third eye blinks in synchrony with the hum from the underground bunker.*"
        ]
      },
      gym_dialogue: {
        speaker: "Chad the Spotter",
        type: "gymbro",
        voice: "quirky",
        lines: [
          "Bro! You gotta hit those tractor beam deadlifts!",
          "When the Men in Black come sprinting, you don't wanna pull a hamstring, bro!"
        ]
      },
      chef_diner: {
        speaker: "Chef Marco",
        type: "chef",
        voice: "quirky",
        lines: [
          "Welcome to The Area Fifty-Bun! Order up!",
          "The grease on this grill sizzles in harmonic frequencies. One bite of the Crater Burger and you'll believe!",
          "Watch out for the feds in beige suits—they keep ordering black coffee and whispering into their lapels."
        ]
      },
      waitress_diner: {
        speaker: "Brenda the Waitress",
        type: "waitress",
        voice: "lady",
        lines: [
          "More coffee, hon? Or can I interest you in our famous Martian Milkshake?",
          "Folks around here think Mrs. Gable is batty, but last week my tip jar started levitating three inches off the table!",
          "Keep your eyes peeled, detective. Weird things happen after sunset in Oakhaven."
        ]
      },
      diner_customer: {
        speaker: target ? target.name : "Diner Patron",
        type: target ? target.type : "shopper",
        voice: "normal",
        lines: [
          "Mmm... you haven't lived until you've tried their Cosmic Chili Fries.",
          "I saw a fleet of silent green orbs over the lake last night. Or maybe it was just indigestion."
        ]
      },
      shopkeeper_dialogue: {
        speaker: "Barnaby the Clerk",
        type: "alien_disguised",
        voice: "quirky",
        lines: [
          "Greetings, fellow... er... biological biped! Yes! What human merchandise may I exchange for your paper currency?",
          "We have fresh Grade-A tin foil, batteries, and canned Slime-Cola on aisle three!",
          "*He adjusts his trenchcoat collar uncomfortably as his antennae twitch under his fedora.*"
        ]
      },
      shopper_dialogue: {
        speaker: target ? target.name : "Shopper",
        type: target ? target.type : "shopper",
        voice: "lady",
        lines: [
          "I'm stocking up on canned peaches and triple-ply foil. You never know when the mothership is dropping by!",
          "Did you see the milk cartons? They have pictures of missing weather balloons on the side!"
        ]
      },
      bartender_dialogue: {
        speaker: "Gus the Barkeep",
        type: "informant",
        voice: "deep",
        lines: [
          "What'll it be, stranger? A pint of Meteor Ale or a shot of Rocket Fuel?",
          "If you're asking about the government sub-vault, talk to the guy in the back corner by the jukebox.",
          "Just keep your voice down. The coasters have microchips in them."
        ]
      },
      barfly_dialogue: {
        speaker: "Barfly Hank",
        type: "tinfoil",
        voice: "quirky",
        lines: [
          "I'm tellin' ya, Cole! The radio towers aren't broadcasting country music—it's backwards Martian binary code!",
          "Every time the bartender pours a stout, my fillings pick up Morse Code from Sector [1, 1]!"
        ]
      },
      pool_player_dialogue: {
        speaker: "Slick Sal",
        type: "informant",
        voice: "deep",
        lines: [
          "Eight ball in the corner pocket. You looking for information, fedora?",
          "Agent Miller used to drink here every Friday until they reassigned him to perimeter security.",
          "Bring him real proof from the Weather Bureau and he might just hand you the keys to the kingdom."
        ]
      },
      coach_dialogue: {
        speaker: "Coach Rex",
        type: "gymbro",
        voice: "quirky",
        lines: [
          "Drop and give me twenty, Welps! You can't outrun black helicopters with calves like that!",
          "We train for the abduction Olympics here! Cardio, squats, and anti-gravity lunges! FEEL THE BURN!"
        ]
      },
      gym_member: {
        speaker: target ? target.name : "Gym Member",
        type: target ? target.type : "gymnast",
        voice: "normal",
        lines: [
          "*Pant... wheeze...* Trying to burn off that Area Fifty-Bun burger...",
          "I swear the treadmill speed was controlled by a tractor beam just now!"
        ]
      },
      office_agent_dialogue: {
        speaker: "Bureaucrat Jenkins",
        type: "agent",
        voice: "agent",
        lines: [
          "Please take a ticket and have a seat in the waiting vestibule. Your request for Form 1040-EXTRATERRESTRIAL will be processed in 6 to 8 business weeks.",
          "Any unauthorized perusal of the gray filing cabinets will result in an immediate audit of your tax returns since 1994."
        ]
      },
      office_worker: {
        speaker: target ? target.name : "Office Analyst",
        type: target ? target.type : "businessman",
        voice: "normal",
        lines: [
          "I've been redacting documents with black marker for nine hours straight. Look, this memo just says 'REDACTED REDACTED REDACTED'!",
          "If anyone asks, we are the Department of Agricultural Meteorology. Definitely NOT alien containment."
        ]
      },
      mrs_gable_flat: {
        speaker: "Mrs. Gable (Landlady)",
        type: "tinfoil",
        voice: "lady",
        lines: [
          "Just checking on the radiator, Cole! Make sure you don't plug in any unauthorized oscilloscopes.",
          "Remember: rent is due on the first, and please keep your tin foil scraps off the hallway carpet!"
        ]
      },
      resident_house: {
        speaker: target ? target.name : "Resident",
        type: target ? target.type : "rude_local_f",
        voice: "lady",
        lines: [
          "How did you get in here?! Oh, you're the new tenant from next door.",
          "If you hear rumbling under the floorboards at 3 AM, don't worry—it's just the government digging subterranean mag-lev tunnels. Happens every Tuesday."
        ]
      },
      area51_scientist: {
        speaker: target ? target.name : "Senior Researcher",
        type: target ? target.type : "scientist",
        voice: "scientist",
        lines: [
          "Careful around the biohazard valves! The specimen's telepathic resonance increases during lunar apogee.",
          "The military thinks they can weaponize it, but the creature is communicating in pure prime number Fibonacci sequences!",
          "Document everything, Cole—the public needs to see what they've hidden here!"
        ]
      },
      dog_dialogue: {
        speaker: target ? target.name : "Good Boy",
        type: "dog",
        voice: "quirky",
        lines: [
          "Woof! *Wags tail vigorously and offers a paw*",
          "*He tilts his head at Cole's tin foil hat and sniffs inquisitively.*",
          "Arf! *Gives a friendly canine bark of encouragement.*"
        ]
      }
    };

    return dialogues[key] || dialogues.resident_gossip;
  }
}

// Global quests singleton
window.spottedQuests = new SpottedQuests();
