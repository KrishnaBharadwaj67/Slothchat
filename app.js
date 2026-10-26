/**
 * SlothChat Digest - Main Application Logic
 * Local AI Group Chat Digest Engine
 * 100% Production-Ready Implementation
 */

const SlothChat = (function() {
  'use strict';

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const state = {
    isConnected: false,
    selectedModel: 'llama3.2:latest',
    chatText: '',
    targetUser: '@YourMajesty',
    isProcessing: false,
    availableModels: []
  };

  // DOM Elements Cache
  const dom = {};

  // ==========================================
  // 2. OLLAMA CLIENT
  // ==========================================
  const ollama = {
    baseUrl: 'http://localhost:11434',

    /**
     * Check connection to local Ollama instance (timeout 3000ms)
     */
    async checkConnection() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(`${this.baseUrl}/api/tags`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          state.isConnected = true;
          ui.updateConnectionBadge(true);
          await this.fetchModels();
          return true;
        } else {
          throw new Error(`HTTP error ${response.status}`);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        state.isConnected = false;
        ui.updateConnectionBadge(false);
        return false;
      }
    },

    /**
     * Fetch all locally installed models from Ollama
     */
    async fetchModels() {
      try {
        const response = await fetch(`${this.baseUrl}/api/tags`);
        if (!response.ok) throw new Error('Failed to fetch models');
        
        const data = await response.json();
        const models = Array.isArray(data.models) ? data.models.map(m => m.name) : [];
        state.availableModels = models;

        if (dom.modelSelect && models.length > 0) {
          const currentVal = dom.modelSelect.value || state.selectedModel;
          dom.modelSelect.innerHTML = '';

          let matched = false;
          models.forEach(modelName => {
            const option = document.createElement('option');
            option.value = modelName;
            option.textContent = modelName;
            if (modelName === currentVal || (!matched && modelName.includes('llama3'))) {
              option.selected = true;
              state.selectedModel = modelName;
              matched = true;
            }
            dom.modelSelect.appendChild(option);
          });

          if (!matched && models.length > 0) {
            dom.modelSelect.value = models[0];
            state.selectedModel = models[0];
          }
        }
      } catch (err) {
        console.warn('Ollama fetchModels warning:', err.message);
      }
    },

    /**
     * Send prompt to Ollama with JSON formatting requirement
     * Timeout: 120,000ms (2 minutes)
     */
    async generate(prompt, model) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model || state.selectedModel || 'llama3.2:latest',
            prompt: prompt,
            stream: false,
            format: 'json'
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ollama generation error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Ollama generate error:', err);
        throw err;
      }
    }
  };

  // ==========================================
  // 3. PRESET CHAT LOGS
  // ==========================================
  const presets = {
    preset1: `[11:30 PM] @FragileDemon: bro I swear to god Lies of P parry window is literally 2 frames. It's objectively broken.
[11:31 PM] @ParryGod69: skill issue detected. It's 8 frames at 60fps. Git gud or go back to animal crossing.
[11:32 PM] @FragileDemon: Sekiro has 30 frames deflect window!! THIRTY FRAMES!! Why does Neowiz hate human fingers?!
[11:34 PM] @SleepIsForTheWeak: Sekiro is 12 frames active if you don't spam L1, 7 if you do. Don't cite deep magic to me, I have 1,400 hours in Ashina.
[11:36 PM] @ParryGod69: Fragile is just mashing his bumper like a toddler playing bop-it.
[11:38 PM] @NoobSlayer420: Honestly I beat nameless puppet on NG+3 without taking a single hit. First try. Easy game.
[11:39 PM] @FragileDemon: @NoobSlayer420 you streamed that fight and your task manager had WeMod running in background with infinite stamina turned on stfu 💀
[11:41 PM] @NoobSlayer420: That was for testing purposes!! I was benchmarking my RAM timings!!
[11:43 PM] @SleepIsForTheWeak: Benchmarking your RAM timings while fighting a gothic Pinocchio at midnight lmfao.
[11:47 PM] @FragileDemon: Anyway I'm at Swamp Monster phase 2. If this tentacle blob charges across the arena one more time I am going to become the joker.
[11:50 PM] @ParryGod69: Just dodge lol.
[11:51 PM] @FragileDemon: "jUsT dOdGe LoL" - someone who has a 240Hz OLED monitor with 0.03ms grey-to-grey latency.
[11:55 PM] @SleepIsForTheWeak: Okay but monitor latency actually matters. What polling rate is your controller set to?
[11:57 PM] @FragileDemon: I don't know, it's plugged into the USB port in the front of my case??
[12:02 AM] @SleepIsForTheWeak: FRONT USB?! Are you insane?! Front panel headers add 4 to 7 milliseconds of mother-board trace delay! Overclock your DualSense to 8000Hz right now using LordOfMice hidusbf driver.
[12:06 AM] @ParryGod69: 8000Hz on Windows 11 causes DPC latency spikes in directinput, you want 1000Hz stable with bInterval set to 1.
[12:09 AM] @FragileDemon: I AM DYING TO A SLIME MONSTER NOT LAUNCHING A SPACEX FALCON 9 ROCKET WHY ARE WE TALKING ABOUT DPC LATENCY
[12:15 AM] @NoobSlayer420: Guys is it true Robert Downey Jr is playing Doctor Doom?
[12:16 AM] @SleepIsForTheWeak: Yes and it completely shatters the sacred timeline continuity.
[12:18 AM] @NoobSlayer420: What if Doom is just an evil Tony Stark variant from Earth-838 who built an armored suit powered by dark magic?
[12:22 AM] @ParryGod69: That completely ruins Victor Von Doom's Latverian heritage and Romani roots. Marvel writers are on bath salts.
[12:28 AM] @FragileDemon: CAN WE FOCUS. SWAMP MONSTER JUST BURIED ME UNDERGROUND FOR THE 19TH TIME.
[12:35 AM] @FragileDemon: I am sweating through my chair. My heart rate is 142 bpm.
[12:42 AM] @ParryGod69: Have you tried using fire grindstone?
[12:44 AM] @FragileDemon: HE IS RESISTANT TO FIRE IN PHASE TWO HE TURNS INTO CORRODED STEEL
[12:45 AM] @ParryGod69: Oh yeah forgot lol. Use electric blitz then.
[12:55 AM] @NoobSlayer420: I'm getting hungry. Anyone want to order 40 McNuggets on DoorDash?
[12:58 AM] @SleepIsForTheWeak: DoorDash driver at 1 AM will just eat 12 of your nuggets and text you 'sorry bro bag was ripped'.
[01:10 AM] @FragileDemon: Phase 2 down to 10% HP...
[01:11 AM] @FragileDemon: NO NO NO HE DID THE OVERHEAD FLIP
[01:12 AM] @FragileDemon: YOU HAVE DIED.
[01:13 AM] @ParryGod69: 💀
[01:14 AM] @SleepIsForTheWeak: F in the chat.
[01:15 AM] @NoobSlayer420: 💀💀💀
[01:25 AM] @FragileDemon: I'm not playing this anymore. I am uninstalling.
[01:32 AM] @SleepIsForTheWeak: You won't. You have the sickness. You will boot it back up in 4 minutes.
[01:36 AM] @FragileDemon: Booting it back up.
[01:45 AM] @GamerGrandma: hello how do I turn off the microphone my grandson said this is where the recipes are
[01:47 AM] @SleepIsForTheWeak: Wait who invited grandma to the sweatlord parry discord??
[01:50 AM] @GamerGrandma: ????????????????????????????????????????????
[01:51 AM] @GamerGrandma: ??????????????????
[01:51 AM] @GamerGrandma: ?????
[01:52 AM] @ParryGod69: Grandma what is your opinion on deflect frame windows in Soulslike games?
[01:55 AM] @GamerGrandma: I make apple crumble with cinnamon on Tuesdays dear. Stop shouting.
[02:08 AM] @FragileDemon: Grandma can you deflect Green Monster of the Swamp for me?
[02:15 AM] @NoobSlayer420: Grandma could probably beat Malenia blindfolded with a dance pad.
[02:22 AM] @SleepIsForTheWeak: I should sleep. I have a standup meeting with my VP of Engineering in 6 hours.
[02:25 AM] @ParryGod69: Just call in sick and say your DualSense had an IRQ conflict.
[02:35 AM] @FragileDemon: 2:35 AM. Attempt #38.
[02:48 AM] @FragileDemon: @YourMajesty PLEASE TELL ME YOU ARE AWAKE BRO. I NEED YOU.
[02:49 AM] @FragileDemon: @YourMajesty summon in as a specter or share play and beat this abomination before I jump out my first-floor window into the rhododendrons.
[02:52 AM] @FragileDemon: @YourMajesty wake uppppppp
[03:00 AM] @SleepIsForTheWeak: @YourMajesty is snoring like a cartoon chainsaw right now, give it up.
[03:10 AM] @ParryGod69: Check this out Fragile: https://youtu.be/dQw4w9WgXcQ - 40 second guide to perfect parrying Swamp Monster.
[03:12 AM] @FragileDemon: Did you just send me a 2012 guide with unregistered hypercam 2 and 009 Sound System Dreamscape playing in 240p?!
[03:15 AM] @ParryGod69: Timeless wisdom never dies.
[03:25 AM] @NoobSlayer420: Okay confession time... on my Elden Ring no-hit run, I accidentally fell off a cliff in Liurnia, so I Alt+F4'd and restored a backup save from 10 minutes prior.
[03:26 AM] @SleepIsForTheWeak: I KNEW IT. I LITERALLY BET MY GPU ON IT. YOU FRAUD!
[03:28 AM] @ParryGod69: Revoke his gamer card immediately. Strip him of his RGB lights.
[03:42 AM] @FragileDemon: THAT IS IT. THAT IS ABSOLUTELY IT.
[03:43 AM] @FragileDemon: THE BOSS DID A 360 NO SCOPE ROTATION ON FRAME 1 WHILE I WAS DRINKING MY PULSE CELL.
[03:44 AM] @FragileDemon: MY CONTROLLER IS CURRENTLY EMBEDDED INSIDE MY DRYWALL. IT IS LODGED NEXT TO THE FIBERGLASS INSULATION. MY WALL HAS AN ENCOUNTER HAZARD.
[03:45 AM] @FragileDemon: I AM SELLING MY RIG. I AM MOVING TO AN OFF-GRID MONASTERY IN TIBET TO WEAVE BASKETS. GOODBYE CRUEL WORLD.
[03:48 AM] @SleepIsForTheWeak: Photos or it didn't happen.
[03:50 AM] @ParryGod69: Just patch the drywall with ramen and superglue lol.
[04:02 AM] @NoobSlayer420: Anyone down for Helldivers 2 right now? Bots on Malevelon Creek?
[04:05 AM] @SleepIsForTheWeak: ...booting up Helldivers.
[04:08 AM] @ParryGod69: For democracy. Inv me.
[04:15 AM] @GamerGrandma: sweet dreams my little warriors don't forget your vitamins`,

    preset2: `[10:00 PM] @Sharma_ji: Guys, final reminder. Tomorrow is Digital Signal Processing (EC8553). Passing mark is 23 out of 70. Please tell me everyone finished the DFT filter numericals.
[10:02 PM] @BunkKing: Wait which syllabus PDF are we using?? I have Syllabus_2024_Final.pdf and Syllabus_Rev_Updated_v2(1).pdf and they have completely different chapters!
[10:04 PM] @ProxyQueen: Neither of those. HOD sent a new circular on WhatsApp last Tuesday with Annexure B which dropped Unit 5 and added IIR Chebyshev filters.
[10:06 PM] @BunkKing: WHAT?! WHO HAS ANNEXURE B?? WHY WAS THIS NOT ON THE PORTAL?!
[10:09 PM] @LastBencher: Chill bro, portal has been showing 404 Error since 2019.
[10:14 PM] @BunkKing: Guys I just calculated my attendance. Semester had 78 working days. I attended 38 days. But if the sports day counts as 3 days and blood donation camp counts as 2 days...
[10:17 PM] @ProxyQueen: Sports day was on a Sunday you illiterate donkey.
[10:20 PM] @BunkKing: What about the college annual cultural fest?! That was 3 days!
[10:22 PM] @Sharma_ji: Fest was cancelled due to budget cuts! You spent those three days in the canteen playing BGMI!
[10:25 PM] @BunkKing: Okay wait if HOD accepts my medical certificate from 2022 for jaundice...
[10:28 PM] @MuggerMax: [Photo: IMG_9821.JPG] (Tilted 90 degrees left, blurry, notebook page with 400 lines of complex differential equations written in 0.3mm blue ballpoint pen)
[10:30 PM] @MuggerMax: [Photo: IMG_9822.JPG] (Another blurry sideways photo with coffee stains covering the formula for Butterworth pole placement)
[10:32 PM] @LastBencher: Max bro thank you for the photos, I can now fail with 4K visual clarity.
[10:38 PM] @ProxyQueen: Reminder: If anyone needs morning attendance proxy in Block C, fee is 50 rupees per head or one plate chicken shawarma.
[10:45 PM] @Sharma_ji: Proxy on semester exam day?! The external squad will hand you over to the police!
[10:52 PM] @Chintu_Cool: [Sticker: Cat dancing to Punjabi dhol beats]
[10:53 PM] @Chintu_Cool: oops wrong group sry guys
[10:54 PM] [System: @Chintu_Cool has left the group]
[11:05 PM] @BunkKing: Bro who has the lab record with the external examiner's green signature from last week? The photocopy shop guy said he will only duplicate from the original.
[11:12 PM] @ProxyQueen: I have it. Bidding starts at 200 rupees.
[11:18 PM] @LastBencher: Can someone summarize Unit 3 FFT algorithms in one sentence?
[11:22 PM] @Sharma_ji: You divide the N-point sequence into successive smaller DFTs using decimation-in-time or decimation-in-frequency butterfly diagrams.
[11:25 PM] @LastBencher: Why are there butterflies in signal processing?! Are they migrating?!
[11:35 PM] @MuggerMax: [Voice Note: 4 minutes 12 seconds of rapid-fire whispering of formula proofs while panting heavily]
[11:42 PM] @BunkKing: Listening to Max's voice note gave me a migraine and an ear infection at the same time.
[12:15 AM] @Sharma_ji: Guys, is anyone awake? I just found out from mechanical section that Question 4 in 2021 was an out-of-syllabus 16-marker on bilinear transformation with frequency warping!
[12:20 AM] @BunkKing: Frequency warping sounds like an ability Doctor Strange uses to fight aliens.
[12:45 AM] @LastBencher: Guys... big question.
[12:46 AM] @Sharma_ji: What formula?
[01:02 AM] @LastBencher: What subject is tomorrow's exam?
[01:03 AM] @Sharma_ji: ARE YOU JOKING?! IT IS DSP!! WE HAVE BEEN TALKING ABOUT DSP FOR THREE HOURS!!
[01:05 AM] @LastBencher: ...bro I swear to god I have been reading Microprocessors 8086 architecture since 8 PM.
[01:06 AM] @ProxyQueen: 💀💀💀💀💀💀💀
[01:07 AM] @BunkKing: BRO HAS BEEN MEMORIZING PIN DIAGRAMS FOR AN EXAM THAT IS IN MAY LMAOOOOO
[01:10 AM] @LastBencher: I am looking at the 40 pins of 8086 right now. What is life. Why do we exist.
[01:25 AM] @Sharma_ji: STOP LAUGHING! HOD JUST SENT AN EMAIL AT 1:20 AM!
[01:27 AM] @Sharma_ji: "Due to water leakage on 1st floor, Exam Hall for Roll Nos 1 to 60 shifted from Main Block Room 102 to Mechanical Workshop Block C Room 410."
[01:30 AM] @BunkKing: Room 410?! The 4th floor with no elevator where pigeons build nests inside the tube lights?!
[01:35 AM] @ProxyQueen: The benches in 410 have rusted nails sticking out, wear thick jeans or get a tetanus shot beforehand.
[01:50 AM] @LastBencher: Okay here is my 23-mark survival blueprint for tomorrow:
[01:52 AM] @LastBencher: Part A: 10 questions x 2 marks = 20 marks. If I guess 'C' for all MCQs and write 'Hence proved' for short definitions = 6 marks.
[01:54 AM] @LastBencher: Part B: Draw big circular butterfly diagram with arrows in 4 colors = 8 marks for effort.
[01:56 AM] @LastBencher: Write neat handwriting so invigilator feels emotional pity = 5 marks.
[01:58 AM] @LastBencher: Total = 19 marks. Need 4 marks grace from university moderation. WE ARE PASSING BOYS!
[02:10 AM] @BunkKing: The math is undisputed. Isaac Newton could never.
[02:25 AM] @LastBencher: Wait, where are the previous 5 years solved university papers?! Who has the PDF?!
[02:28 AM] @BunkKing: Only ONE person in our entire batch scanned the golden solved paper from the university topper archive.
[02:30 AM] @BunkKing: @YourMajesty BHAI PLEASE WAKE UP!!
[02:32 AM] @LastBencher: @YourMajesty Bhai our careers, our degrees, our family honor depends on you!! Please send the DSP 5-year solved PDF!!
[02:35 AM] @ProxyQueen: @YourMajesty If you upload the PDF right now I will give you free attendance proxy for the rest of your engineering degree.
[02:40 AM] @Sharma_ji: @YourMajesty Please send it, even I need to verify Question 7b from 2019!!
[03:00 AM] @BunkKing: He's offline. Probably sleeping in air conditioning with his phone on silent while our lives burn down.
[03:15 AM] @Sharma_ji: Guys I'm so scared. I only revised the entire syllabus four times. I think I'm going to get an 8.5 GPA instead of 9.2. My life is ruined.
[03:18 AM] @LastBencher: Sharma ji if you say one more word I will throw you off Mechanical Block C 4th floor.
[03:25 AM] @BunkKing: Setting alarm for 6:15 AM. May Lord have mercy on our souls.
[03:30 AM] @MuggerMax: [Photo: IMG_9823.JPG] (Formula for Hamming Window filter at 3:30 AM)`,

    preset3: `[06:00 PM] @GymBro_Mike: Attention household: Who took my Optimum Nutrition Gold Standard Whey Protein from the kitchen counter?
[06:08 PM] @GymBro_Mike: I weigh my tub every morning on my digital jeweler scale. This morning it was 2,140 grams. It is currently 2,046 grams.
[06:12 PM] @GymBro_Mike: Exactly 94 grams of micro-filtered whey isolate has vanished into thin air. That is 72 grams of pure protein and 360 calories stolen from my daily anabolic window.
[06:18 PM] @CleanFreak_Sara: Mike, nobody wants your powdery chemical chalk that smells like artificial cardboard chocolate.
[06:22 PM] @CleanFreak_Sara: More importantly: Whose energy is this on the stainless steel sink? [Photo: macro close-up of a 3mm dried yellow oat flake adhering to the faucet handle]
[06:25 PM] @NightOwl_Alex: Sara that is literally a sub-atomic particle of breakfast from three days ago.
[06:28 PM] @CleanFreak_Sara: Dried oatmeal contains gluten starch which acts like cement on chrome fixtures! I spent 45 minutes buffing that faucet with microfiber and vinegar!
[06:35 PM] @Chef_Pat: Can everyone please maintain culinary composure? I am in the middle of preparing a delicate duck confit reduction with caramelized shallots and truffle essence.
[06:40 PM] @CleanFreak_Sara: Pat, you have utilized every single ceramic bowl in this house. The drying rack looks like a Jenga tower constructed by a lunatic.
[06:44 PM] @Chef_Pat: True gastronomy requires mise en place, Sara. You cannot rush the creative process. The pots are currently soaking.
[06:47 PM] @CleanFreak_Sara: "Soaking" does not mean filling both sink basins to the brim with tepid grease-water and leaving submerged spatulas for seventy-two consecutive hours!
[07:15 PM] @GymBro_Mike: I don't care about the ducks or the sink. Whoever took 94g of protein needs to Venmo me $8.45 immediately or I will deadlift without my lifting belt in the hallway at 11 PM.
[07:22 PM] @NightOwl_Alex: That sounds like a threat to the foundation of this building.
[07:45 PM] @CleanFreak_Sara: Also: Why is the hallway air conditioner set to 16°C while the front balcony sliding door is wide open?!
[07:48 PM] @CleanFreak_Sara: Our electric bill last month was $412!! We are cooling the entire metropolitan neighborhood!
[07:55 PM] @NightOwl_Alex: I had to open the balcony door because Pat's duck reduction set off the smoke detector and Mike's gym sneakers smelled like an ancient crypt.
[08:10 PM] @Chef_Pat: The smoke was simply aromatic vapor releasing from the Maillard reaction!
[08:30 PM] @CleanFreak_Sara: We need to renegotiate fridge boundaries right now.
[08:32 PM] @CleanFreak_Sara: Rule 1: The bottom crisper drawer is for VEGETABLES ONLY. It is NOT for Mike's 18 Tupperwares of unseasoned grey boiled chicken breasts stacked like cinder blocks.
[08:38 PM] @GymBro_Mike: Those chicken breasts represent 540 grams of lean mass preservation! Where else am I supposed to put my meal prep?!
[08:42 PM] @NightOwl_Alex: In your stomach, ideally all at once.
[08:55 PM] @CleanFreak_Sara: WHO ATE MY THAI GREEN CURRY LEFTOVERS?!
[08:56 PM] @CleanFreak_Sara: It was in a glass Pyrex container labeled 'SARA - DO NOT TOUCH - CONTAINS NUTS & ANTHRAX'.
[08:58 PM] @NightOwl_Alex: ...I thought the anthrax part was a joke.
[09:00 PM] @CleanFreak_Sara: YOU ATE IT?! Alex, you are allergic to peanuts!
[09:02 PM] @NightOwl_Alex: I wondered why my lips felt spicy and my tongue went numb. I thought it was authentic Bangkok street style seasoning.
[09:15 PM] @GymBro_Mike: Did Alex eat my protein powder too?! Alex are your quadriceps growing exponentially?!
[09:30 PM] @CleanFreak_Sara: Has anyone seen my grandmother's vintage cast-iron skillet?!
[09:32 PM] @CleanFreak_Sara: @YourMajesty did you borrow the cast iron pan?!
[09:35 PM] @CleanFreak_Sara: @YourMajesty If someone put that 80-year-old seasoned skillet in the Bosch dishwasher with citrus Cascade detergent I am filing a police report for domestic property destruction!!
[09:40 PM] @CleanFreak_Sara: @YourMajesty Answer me!! I can hear your air purifier running from behind your bedroom door!!
[10:05 PM] @NightOwl_Alex: Why is Netflix saying 'Too many people are using your account right now'?
[10:08 PM] @Chef_Pat: Mike, is your ex-girlfriend from 2021 still streaming The Great British Baking Show on our 4K plan?
[10:12 PM] @GymBro_Mike: Brenda has access for emergency purposes only.
[10:15 PM] @CleanFreak_Sara: EMERGENCY BAKING SHOW STREAMING?! Change the password right now!
[10:30 PM] @TheLandlord: Good evening Unit 4B tenants.
[10:32 PM] @NightOwl_Alex: oh god the raid boss has spawned
[10:33 PM] @TheLandlord: The elderly couple in Unit 3B below have submitted a formal complaint regarding seismic vibrations occurring every evening between 10 PM and midnight, accompanied by heavy groaning and the pungent aroma of burnt duck grease in the central ventilation duct.
[10:36 PM] @TheLandlord: Furthermore, building security footage shows someone walking through the lobby at 2 AM wearing a dinosaur onesie carrying an air fryer.
[10:38 PM] @NightOwl_Alex: It was a cold night and I needed mozzarella sticks from the 7-Eleven.
[10:41 PM] @TheLandlord: Please be advised that any further structural tremors will result in a $250 noise citation per occurrence. Also, standard annual lease renewal will reflect a $75 monthly adjustment. Have a pleasant evening.
[10:45 PM] [System: @TheLandlord has left the group]
[10:50 PM] @GymBro_Mike: Great. Now my deadlifts are classified as seismic events.
[11:05 PM] @CleanFreak_Sara: Tomorrow morning at 7:00 AM I am placing blue painter's tape across the kitchen floor dividing it into four equal sovereign quadrants. Anyone who steps over the blue perimeter with unwashed footwear will face tribunal.
[11:20 PM] @Chef_Pat: Can the quadrant include the stove? I have beef bourguignon scheduled for a 6-hour simmer.
[11:35 PM] @NightOwl_Alex: I'm ordering pizza and eating it on the fire escape. Goodnight roommates.`
  };

  // ==========================================
  // 4. PROMPT BUILDER
  // ==========================================
  function buildPrompt(chatText, targetUser) {
    return `You are SlothChat Digest AI. Analyze this group chat and return ONLY valid JSON (no markdown, no explanation, ONLY the JSON object).

Target user to check for pings/mentions: ${targetUser}

Chat log:
${chatText}

Return this exact JSON structure:
{
  "sloth_summary": "Two punchy, funny sentences summarizing the entire chat chaos. Be witty and sarcastic.",
  "pings": {
    "found": true or false,
    "details": "Description of any mentions, questions, or tasks directed at ${targetUser}. If none found, say 'You were blissfully unbothered. Keep sleeping.'"
  },
  "drama": {
    "level": <number 0-100>,
    "description": "One sentence about who started the drama and what the core conflict was."
  },
  "lazy_replies": {
    "ghost": "A short, casual, gen-z reply that acknowledges nothing specific (like 'damn that's crazy 💀')",
    "diplomat": "A context-aware neutral agreement that sounds like you read everything",
    "sloth_king": "A sassy excuse for sleeping through everything, referencing something specific from the chat"
  },
  "stats": {
    "messages_skipped": <count of messages in the chat>,
    "words_not_read": <approximate word count>
  }
}`;
  }

  // ==========================================
  // 5. RESPONSE PARSER
  // ==========================================
  const parser = {
    /**
     * Robust multi-tier parsing to handle raw LLM text
     */
    parseResponse(rawText) {
      return this.parse(rawText);
    },

    parse(rawText) {
      if (typeof rawText === 'object' && rawText !== null) {
        return this.normalizeSchema(rawText);
      }
      if (!rawText || typeof rawText !== 'string') {
        return fallback.getGenericFallback(state.targetUser, 0, 0);
      }

      // Try 1: Direct JSON.parse
      try {
        const obj = JSON.parse(rawText.trim());
        return this.normalizeSchema(obj);
      } catch (e) {}

      // Try 2: Extract JSON from markdown code blocks
      const codeBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlock && codeBlock[1]) {
        try {
          const obj = JSON.parse(codeBlock[1].trim());
          return this.normalizeSchema(obj);
        } catch (e) {}
      }

      // Try 3: Find first { and last } to extract JSON object
      const first = rawText.indexOf('{');
      const last = rawText.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        try {
          const obj = JSON.parse(rawText.slice(first, last + 1));
          return this.normalizeSchema(obj);
        } catch (e) {}
      }

      // Try 4: Clean common LLM artifacts and retry
      try {
        let cleaned = rawText
          .replace(/[\x00-\x1F\x7F]/g, ' ')
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
        const f2 = cleaned.indexOf('{');
        const l2 = cleaned.lastIndexOf('}');
        if (f2 !== -1 && l2 !== -1 && l2 > f2) {
          const obj = JSON.parse(cleaned.slice(f2, l2 + 1));
          return this.normalizeSchema(obj);
        }
      } catch (e) {}

      // Give up: Generate smart contextual fallback
      return fallback.generate(rawText, state.targetUser);
    },

    /**
     * Validate and fill missing fields in schema
     */
    normalizeSchema(obj) {
      if (!obj || typeof obj !== 'object') {
        return fallback.getGenericFallback(state.targetUser, 50, 600);
      }

      return {
        sloth_summary: obj.sloth_summary || "An unholy barrage of messages occurred while you preserved your precious brain cells.",
        pings: {
          found: Boolean(obj.pings && obj.pings.found),
          details: (obj.pings && obj.pings.details) || "You were blissfully unbothered. Keep sleeping."
        },
        drama: {
          level: Math.min(Math.max(Number(obj.drama && obj.drama.level) || 50, 0), 100),
          description: (obj.drama && obj.drama.description) || "Spontaneous chaos erupted over negligible matters."
        },
        lazy_replies: {
          ghost: (obj.lazy_replies && obj.lazy_replies.ghost) || "damn that's crazy 💀",
          diplomat: (obj.lazy_replies && obj.lazy_replies.diplomat) || "Sounds like everyone made valid points, let's reconvene later.",
          sloth_king: (obj.lazy_replies && (obj.lazy_replies.sloth_king || obj.lazy_replies.sloth)) || "I was in an intense 10-hour hibernation coma and refuse to acknowledge this."
        },
        stats: {
          messages_skipped: Number(obj.stats && obj.stats.messages_skipped) || 50,
          words_not_read: Number(obj.stats && obj.stats.words_not_read) || 800
        }
      };
    }
  };

  // ==========================================
  // 6. FALLBACK / DEMO MODE
  // ==========================================
  const fallback = {
    /**
     * Fallback digest generator (alias matching specification)
     */
    async generateFallbackDigest(chatText, targetUser) {
      return this.generate(chatText, targetUser);
    },

    getFallbackDigest() {
      return this.getGenericFallback(state.targetUser, 50, 750);
    },

    /**
     * Detect chat type and return contextual demo data
     */
    generate(chatText, targetUser) {
      const text = chatText || '';
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const messageCount = Math.max(lines.length, 1);
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

      if (text.includes('ParryGod') || text.includes('FragileDemon') || text.includes('Sekiro') || text.includes('DualSense')) {
        return this.getGamingFallback(targetUser, messageCount, wordCount);
      } else if (text.includes('BunkKing') || text.includes('Sharma') || text.includes('DSP') || text.includes('HOD')) {
        return this.getCollegeFallback(targetUser, messageCount, wordCount);
      } else if (text.includes('GymBro') || text.includes('CleanFreak') || text.includes('Pat') || text.includes('cast iron')) {
        return this.getRoommateFallback(targetUser, messageCount, wordCount);
      } else {
        return this.getGenericFallback(targetUser, messageCount, wordCount);
      }
    },

    getGamingFallback(targetUser, messageCount, wordCount) {
      return {
        sloth_summary: "Four hyper-caffeinated gamers spent five uninterrupted hours arguing over eight milliseconds of parry window latency until FragileDemon launched their controller directly into drywall insulation. GamerGrandma accidentally infiltrated the server asking for apple crumble recipes and spammed forty question marks.",
        pings: {
          found: true,
          details: `@FragileDemon pinged ${targetUser} in all-caps at 2:48 AM begging you to summon in and tank the Green Monster of the Swamp before their remaining sanity evaporated.`
        },
        drama: {
          level: 92,
          description: "ParryGod69 posted an elitist 'just dodge lol' tutorial right as FragileDemon was mid-existential breakdown after 38 consecutive wipes."
        },
        lazy_replies: {
          ghost: "damn that's crazy 💀 skill issue fr",
          diplomat: "Honestly both games have incredible combat design, but sleep offers the highest frames per second.",
          sloth_king: `I was literally on my way to carry ${targetUser}, but my duvet activated an unbreakable 9-hour hyperarmor frame.`
        },
        stats: {
          messages_skipped: messageCount || 62,
          words_not_read: wordCount || 980
        }
      };
    },

    getCollegeFallback(targetUser, messageCount, wordCount) {
      return {
        sloth_summary: "Pre-exam mass hysteria reached critical mass as six engineering students realized they had been studying contradictory syllabus revisions while BunkKing recalculated their 62% attendance twelve times. LastBencher discovered at 1:05 AM that they had spent five hours memorizing 8086 microprocessor pins for a digital signal processing exam.",
        pings: {
          found: true,
          details: `Both BunkKing and LastBencher tagged ${targetUser} at 2:30 AM demanding the holy 5-year solved question paper PDF, stating their entire future bloodline depended on your upload.`
        },
        drama: {
          level: 96,
          description: "Sharma_ji announced at 1:20 AM that the exam hall was relocated to Mechanical Block C 4th floor with rusted nail desks and no elevator."
        },
        lazy_replies: {
          ghost: "gg bro we're cooked 💀 see you in supplementary",
          diplomat: "Just focus strictly on Unit 3 butterfly diagrams and the curve will take care of everyone who remains calm.",
          sloth_king: "My cerebral cortex went on airplane mode at 10 PM. If the passing mark is 23, I have already secured zero with maximum efficiency."
        },
        stats: {
          messages_skipped: messageCount || 67,
          words_not_read: wordCount || 1140
        }
      };
    },

    getRoommateFallback(targetUser, messageCount, wordCount) {
      return {
        sloth_summary: "Passive-aggressive domestic warfare erupted after GymBro_Mike discovered 94 grams of missing chocolate whey via jeweler scale and CleanFreak_Sara waged psychological jihad over an oat flake adhering to the faucet. The landlord then descended like an unholy raid boss warning about 2 AM dinosaur onesie sightings and midnight seismic deadlifts.",
        pings: {
          found: true,
          details: `CleanFreak_Sara aggressively tagged ${targetUser} at 9:35 PM threatening a police report if you placed her 80-year-old heirloom cast-iron skillet inside the dishwasher.`
        },
        drama: {
          level: 98,
          description: "Sara threatened to lay color-coded blue painter's tape across the kitchen floor to establish sovereign quarantine quadrants by 7 AM."
        },
        lazy_replies: {
          ghost: "nah wasn't me bro i literally just woke up 🤷",
          diplomat: "Let's label the fridge shelves clearly and declare a 24-hour dish amnesty period so everyone can coexist in peace.",
          sloth_king: "I cannot be held legally or spiritually liable for kitchen crimes committed while I was in a 12-hour REM hibernation coma."
        },
        stats: {
          messages_skipped: messageCount || 61,
          words_not_read: wordCount || 1020
        }
      };
    },

    getGenericFallback(targetUser, messageCount, wordCount) {
      return {
        sloth_summary: "An endless stream of runaway banter, conflicting opinions, and side conversations that could have easily been resolved in a thirty-second email. Thousands of keystrokes were expended to arrive at absolutely zero tangible conclusions.",
        pings: {
          found: false,
          details: `You were blissfully unbothered. Nobody pinged ${targetUser}, meaning your sloth hibernation protocol was 100% victorious.`
        },
        drama: {
          level: 45,
          description: "Low-voltage friction and confusing chatter that faded away once people got tired."
        },
        lazy_replies: {
          ghost: "damn that's crazy 💀 fr",
          diplomat: "That's an interesting perspective, let's circle back once everyone gets some rest.",
          sloth_king: "I just woke up from an elite nap and refuse to absorb the emotional energy of this thread."
        },
        stats: {
          messages_skipped: messageCount || 48,
          words_not_read: wordCount || 750
        }
      };
    }
  };

  // ==========================================
  // 7. UI CONTROLLER
  // ==========================================
  const ui = {
    /**
     * Cache all DOM elements matching index.html IDs
     */
    cacheElements() {
      // Navbar
      dom.connectionBadge = document.getElementById('connection-badge');
      dom.connectionDot = document.getElementById('connection-dot');
      dom.connectionText = document.getElementById('connection-text');
      dom.modelSelect = document.getElementById('model-select');
      dom.refreshModelsBtn = document.getElementById('refresh-models-btn');

      // Input Section
      dom.inputSection = document.getElementById('input-section');
      dom.chatTextarea = document.getElementById('chat-textarea');
      dom.fileDropZone = document.getElementById('file-drop-zone');
      dom.fileInfo = document.getElementById('file-info');
      dom.targetUsername = document.getElementById('target-username');
      dom.presetBtn1 = document.getElementById('preset-btn-1');
      dom.presetBtn2 = document.getElementById('preset-btn-2');
      dom.presetBtn3 = document.getElementById('preset-btn-3');
      dom.digestBtn = document.getElementById('digest-btn');
      dom.charCount = document.getElementById('char-count');

      // Loading Section
      dom.loadingSection = document.getElementById('loading-section');
      dom.loadingStatus = document.getElementById('loading-status');

      // Output Section
      dom.outputSection = document.getElementById('output-section');
      dom.summaryText = document.getElementById('summary-text');
      dom.pingFound = document.getElementById('ping-found');
      dom.pingDetails = document.getElementById('ping-details');
      dom.dramaPercentage = document.getElementById('drama-percentage');
      dom.dramaBarFill = document.getElementById('drama-bar-fill');
      dom.dramaDescription = document.getElementById('drama-description');
      dom.replyGhost = document.getElementById('reply-ghost');
      dom.replyDiplomat = document.getElementById('reply-diplomat');
      dom.replySloth = document.getElementById('reply-sloth');
      dom.copyGhost = document.getElementById('copy-ghost');
      dom.copyDiplomat = document.getElementById('copy-diplomat');
      dom.copySloth = document.getElementById('copy-sloth');
      dom.statMessages = document.getElementById('stat-messages');
      dom.statWords = document.getElementById('stat-words');
      dom.statCalories = document.getElementById('stat-calories');
      dom.statCost = document.getElementById('stat-cost');
      dom.newDigestBtn = document.getElementById('new-digest-btn');

      // Toast Container
      dom.toastContainer = document.getElementById('toast-container');
    },

    /**
     * Switch view between 'input', 'loading', and 'output'
     */
    showSection(sectionName) {
      const sections = {
        input: dom.inputSection,
        loading: dom.loadingSection,
        output: dom.outputSection
      };

      Object.entries(sections).forEach(([name, el]) => {
        if (!el) return;
        if (name === sectionName) {
          el.classList.remove('hidden', 'd-none');
          el.style.display = '';
        } else {
          el.classList.add('hidden');
          el.style.display = 'none';
        }
      });

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    /**
     * Update connection badge indicator in navbar
     */
    updateConnectionBadge(connected) {
      if (dom.connectionText) {
        dom.connectionText.textContent = connected ? 'Connected' : 'Offline (Demo Mode)';
      }
      if (dom.connectionDot) {
        if (connected) {
          dom.connectionDot.style.backgroundColor = '#10b981';
          dom.connectionDot.style.boxShadow = '0 0 8px #10b981';
        } else {
          dom.connectionDot.style.backgroundColor = '#ef4444';
          dom.connectionDot.style.boxShadow = '0 0 6px #ef4444';
        }
      }
      if (dom.connectionBadge) {
        if (connected) {
          dom.connectionBadge.classList.add('badge-connected');
          dom.connectionBadge.classList.remove('badge-offline');
        } else {
          dom.connectionBadge.classList.add('badge-offline');
          dom.connectionBadge.classList.remove('badge-connected');
        }
      }
    },

    /**
     * Render the digest JSON into the DOM
     */
    renderDigest(data) {
      if (!data) return;

      // Summary
      if (dom.summaryText) {
        dom.summaryText.textContent = data.sloth_summary || '';
      }

      // Pings
      if (dom.pingFound) {
        const isSummoned = Boolean(data.pings && data.pings.found);
        const baseClass = 'flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium';
        if (isSummoned) {
          dom.pingFound.className = `${baseClass} bg-amber-500/10 text-amber-400 border border-amber-500/20`;
          dom.pingFound.innerHTML = '<span>⚠️</span><span>Yes, you were summoned!</span>';
        } else {
          dom.pingFound.className = `${baseClass} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`;
          dom.pingFound.innerHTML = '<span>😴</span><span>Nope, sleep in peace</span>';
        }
      }
      if (dom.pingDetails) {
        dom.pingDetails.textContent = (data.pings && data.pings.details) || 'You were blissfully unbothered. Keep sleeping.';
      }

      // Drama meter
      const dramaLevel = Math.min(Math.max(Number(data.drama && data.drama.level) || 0, 0), 100);
      if (dom.dramaPercentage) {
        dom.dramaPercentage.textContent = `${dramaLevel}`;
      }
      if (dom.dramaBarFill) {
        dom.dramaBarFill.style.width = `${dramaLevel}%`;
        let barColor = '#10b981'; // Green < 30
        if (dramaLevel >= 80) {
          barColor = '#ef4444'; // Red > 80
        } else if (dramaLevel >= 60) {
          barColor = '#f97316'; // Orange 60-80
        } else if (dramaLevel >= 30) {
          barColor = '#f59e0b'; // Yellow 30-60
        }
        dom.dramaBarFill.style.backgroundColor = barColor;
      }
      if (dom.dramaDescription) {
        dom.dramaDescription.textContent = (data.drama && data.drama.description) || '';
      }

      // Lazy replies
      const replies = data.lazy_replies || {};
      if (dom.replyGhost) {
        dom.replyGhost.textContent = replies.ghost || "damn that's crazy 💀";
      }
      if (dom.replyDiplomat) {
        dom.replyDiplomat.textContent = replies.diplomat || "Makes sense to me, let's touch base tomorrow.";
      }
      if (dom.replySloth) {
        dom.replySloth.textContent = replies.sloth_king || replies.sloth || "I was in an intense 10-hour hibernation coma and refuse to acknowledge this.";
      }

      // Stats
      const msgCount = Number(data.stats && data.stats.messages_skipped) || 0;
      const wordCount = Number(data.stats && data.stats.words_not_read) || 0;
      const caloriesBurned = (wordCount * 0.01).toFixed(1);

      if (dom.statMessages) {
        dom.statMessages.textContent = msgCount.toLocaleString();
      }
      if (dom.statWords) {
        dom.statWords.textContent = wordCount.toLocaleString();
      }
      if (dom.statCalories) {
        dom.statCalories.textContent = `${caloriesBurned} kcal`;
      }
      if (dom.statCost) {
        dom.statCost.textContent = '$0.00 — 100% Local';
      }

      // Animate card entrance
      this.animateCards();

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    /**
     * Staggered slide-up animation for cards in the output section
     */
    animateCards() {
      if (!dom.outputSection) return;
      const cards = dom.outputSection.querySelectorAll('.card, .stat-card, .output-card, .digest-card, [data-animate]');
      cards.forEach((card, index) => {
        card.classList.remove('slide-up');
        card.style.animationDelay = `${index * 90}ms`;
        // Force reflow
        void card.offsetWidth;
        card.classList.add('slide-up');
      });
    },

    /**
     * Display a floating toast notification
     */
    showToast(message, type = 'info') {
      const container = dom.toastContainer || document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast-message toast-${type}`;
      toast.textContent = message;

      // Inline styles ensuring consistent appearance
      Object.assign(toast.style, {
        padding: '12px 18px',
        margin: '8px 0',
        borderRadius: '10px',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        border: '1px solid #334155',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: '0',
        transform: 'translateY(12px)',
        zIndex: '9999'
      });

      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-8px)';
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 320);
      }, 3000);
    },

    /**
     * Update character and word counter on textarea input
     */
    updateCharCount() {
      if (!dom.chatTextarea || !dom.charCount) return;
      const text = dom.chatTextarea.value || '';
      const chars = text.length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      dom.charCount.textContent = `${chars.toLocaleString()} characters · ${words.toLocaleString()} words`;
    },

    /**
     * Copy text safely with clipboard API + fallback
     */
    async copyToClipboard(text) {
      if (!text) return;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const tempArea = document.createElement('textarea');
          tempArea.value = text;
          tempArea.style.position = 'fixed';
          tempArea.style.left = '-999999px';
          tempArea.style.top = '-999999px';
          document.body.appendChild(tempArea);
          tempArea.focus();
          tempArea.select();
          document.execCommand('copy');
          tempArea.remove();
        }
        this.showToast('Copied to clipboard! 📋');
      } catch (err) {
        console.error('Clipboard copy error:', err);
        this.showToast('Failed to copy ❌');
      }
    }
  };

  // ==========================================
  // 8. SIMULATED TYPING & GENERATION RUNNER
  // ==========================================
  async function runDigestProcess() {
    const rawChat = (dom.chatTextarea ? dom.chatTextarea.value : state.chatText).trim();
    if (!rawChat) {
      ui.showToast('Please paste a chat log or pick a preset first! 😴');
      if (dom.chatTextarea) dom.chatTextarea.focus();
      return;
    }

    state.isProcessing = true;
    ui.showSection('loading');

    const loadingStages = [
      'Sloth AI stretching... 🦥',
      'Scanning for drama... 🔥',
      'Calculating laziness ROI... 📊',
      'Almost done napping... 💤'
    ];

    let stageIndex = 0;
    if (dom.loadingStatus) {
      dom.loadingStatus.textContent = loadingStages[0];
    }

    const stageInterval = setInterval(() => {
      stageIndex++;
      if (stageIndex < loadingStages.length && dom.loadingStatus) {
        dom.loadingStatus.textContent = loadingStages[stageIndex];
      }
    }, 850);

    let parsedResult = null;

    try {
      if (state.isConnected) {
        const prompt = buildPrompt(rawChat, state.targetUser);
        const [rawResponse] = await Promise.all([
          ollama.generate(prompt, state.selectedModel),
          new Promise(resolve => setTimeout(resolve, 3400)) // Ensure full fun loading sequence
        ]);
        parsedResult = parser.parse(rawResponse);
      } else {
        // Fallback / Demo simulation with realistic 3.4s delay
        await new Promise(resolve => setTimeout(resolve, 3400));
        parsedResult = fallback.generate(rawChat, state.targetUser);
      }
    } catch (err) {
      console.warn('Ollama unavailable or errored out. Smoothly falling back to Demo Mode:', err);
      parsedResult = fallback.generate(rawChat, state.targetUser);
    } finally {
      clearInterval(stageInterval);
      state.isProcessing = false;
    }

    ui.showSection('output');
    ui.renderDigest(parsedResult);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================
  // 9. EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // Preset buttons
    if (dom.presetBtn1) {
      dom.presetBtn1.addEventListener('click', () => {
        loadPreset('preset1', '3 AM Gaming & Boss-Parry Server 🎮');
      });
    }
    if (dom.presetBtn2) {
      dom.presetBtn2.addEventListener('click', () => {
        loadPreset('preset2', 'Engineering College Exam Panic 📚');
      });
    }
    if (dom.presetBtn3) {
      dom.presetBtn3.addEventListener('click', () => {
        loadPreset('preset3', 'Roommate Fridge & Chores Cold War 🧊');
      });
    }

    function loadPreset(key, label) {
      if (!presets[key]) return;
      if (dom.chatTextarea) {
        dom.chatTextarea.value = presets[key];
        state.chatText = presets[key];
      }
      if (dom.fileInfo) {
        dom.fileInfo.textContent = `Preset loaded: ${label}`;
        dom.fileInfo.style.display = 'block';
      }
      ui.updateCharCount();
      ui.showToast(`Loaded ${label}!`);
    }

    // Digest Button
    if (dom.digestBtn) {
      dom.digestBtn.addEventListener('click', () => {
        if (!state.isProcessing) runDigestProcess();
      });
    }

    // New Digest Button
    if (dom.newDigestBtn) {
      dom.newDigestBtn.addEventListener('click', () => {
        ui.showSection('input');
        if (dom.chatTextarea) {
          dom.chatTextarea.focus();
        }
        ui.showToast('Ready for the next group chat! 🦥');
      });
    }

    // Copy buttons
    if (dom.copyGhost && dom.replyGhost) {
      dom.copyGhost.addEventListener('click', () => {
        ui.copyToClipboard(dom.replyGhost.textContent);
      });
    }
    if (dom.copyDiplomat && dom.replyDiplomat) {
      dom.copyDiplomat.addEventListener('click', () => {
        ui.copyToClipboard(dom.replyDiplomat.textContent);
      });
    }
    if (dom.copySloth && dom.replySloth) {
      dom.copySloth.addEventListener('click', () => {
        ui.copyToClipboard(dom.replySloth.textContent);
      });
    }

    // Textarea input
    if (dom.chatTextarea) {
      dom.chatTextarea.addEventListener('input', () => {
        state.chatText = dom.chatTextarea.value;
        ui.updateCharCount();
      });
    }

    // Target username input
    if (dom.targetUsername) {
      dom.targetUsername.addEventListener('input', () => {
        state.targetUser = dom.targetUsername.value.trim() || '@YourMajesty';
      });
      dom.targetUsername.addEventListener('change', () => {
        state.targetUser = dom.targetUsername.value.trim() || '@YourMajesty';
      });
    }

    // Model Selector
    if (dom.modelSelect) {
      dom.modelSelect.addEventListener('change', () => {
        state.selectedModel = dom.modelSelect.value;
        ui.showToast(`Active model: ${state.selectedModel}`);
      });
    }

    // Refresh Models Button
    if (dom.refreshModelsBtn) {
      dom.refreshModelsBtn.addEventListener('click', async () => {
        ui.showToast('Scanning local Ollama models... 🔄');
        await ollama.checkConnection();
        if (state.isConnected) {
          ui.showToast(`Connected! Found ${state.availableModels.length} models. ✅`);
        } else {
          ui.showToast('Ollama offline. Running in Demo Mode. 💤');
        }
      });
    }

    // File Drag and Drop Zone
    if (dom.fileDropZone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dom.fileDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dom.fileDropZone.classList.add('drop-zone-active');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dom.fileDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dom.fileDropZone.classList.remove('drop-zone-active');
        });
      });

      dom.fileDropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          handleFileInput(files[0]);
        }
      });

      // Also allow clicking drop zone to choose file
      dom.fileDropZone.addEventListener('click', (e) => {
        // Prevent recursive trigger if clicked on textarea or buttons
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
          return;
        }
        let fileInput = dom.fileDropZone.querySelector('input[type="file"]');
        if (!fileInput) {
          fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.txt,.json,.log';
          fileInput.style.display = 'none';
          fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
              handleFileInput(fileInput.files[0]);
            }
          });
          dom.fileDropZone.appendChild(fileInput);
        }
        fileInput.click();
      });
    }

    function handleFileInput(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        if (dom.chatTextarea) {
          dom.chatTextarea.value = content;
          state.chatText = content;
        }
        if (dom.fileInfo) {
          const sizeKb = (file.size / 1024).toFixed(1);
          dom.fileInfo.textContent = `📄 ${file.name} (${sizeKb} KB)`;
          dom.fileInfo.style.display = 'block';
        }
        ui.updateCharCount();
        ui.showToast(`Loaded ${file.name} 📂`);
      };
      reader.onerror = () => {
        ui.showToast('Could not read file! ❌');
      };
      reader.readAsText(file);
    }

    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to digest
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!state.isProcessing) {
          e.preventDefault();
          runDigestProcess();
        }
      }
    });
  }

  // ==========================================
  // 10. INITIALIZATION
  // ==========================================
  function init() {
    ui.cacheElements();

    // Set default target username from DOM if provided
    if (dom.targetUsername && dom.targetUsername.value) {
      state.targetUser = dom.targetUsername.value.trim();
    } else if (dom.targetUsername) {
      dom.targetUsername.value = state.targetUser;
    }

    // Initial character count update
    ui.updateCharCount();

    // Attach event listeners
    setupEventListeners();

    // Show initial section
    ui.showSection('input');

    // Initial Ollama connection check
    ollama.checkConnection();

    // Poll Ollama every 15 seconds
    setInterval(() => {
      ollama.checkConnection();
    }, 15000);
  }

  // Public API
  return {
    state,
    ollama,
    presets,
    parser,
    fallback,
    ui,
    init,
    buildPrompt,
    parseResponse: (text) => parser.parse(text),
    generateFallbackDigest: (text, user) => fallback.generate(text, user)
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    SlothChat.init();
  });
} else {
  SlothChat.init();
}

// Global exposure for debugging or extension
window.SlothChat = SlothChat;
