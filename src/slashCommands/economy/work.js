const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { updateProfile, getProfile } = require("../../utils/economy");

const jobOptions = [
  { name: "Barista", minEarnings: 20, maxEarnings: 38, xp: 12, tier: 1 },
  { name: "Cashier", minEarnings: 18, maxEarnings: 32, xp: 10, tier: 1 },
  { name: "Dog Walker", minEarnings: 22, maxEarnings: 40, xp: 12, tier: 1 },
  {
    name: "Delivery Driver",
    minEarnings: 25,
    maxEarnings: 45,
    xp: 14,
    tier: 1,
  },
  { name: "Janitor", minEarnings: 20, maxEarnings: 36, xp: 10, tier: 1 },
  {
    name: "Warehouse Worker",
    minEarnings: 22,
    maxEarnings: 40,
    xp: 12,
    tier: 1,
  },
  { name: "Fast Food Cook", minEarnings: 18, maxEarnings: 34, xp: 10, tier: 1 },
  {
    name: "Grocery Stocker",
    minEarnings: 19,
    maxEarnings: 33,
    xp: 10,
    tier: 1,
  },
  { name: "Security Guard", minEarnings: 24, maxEarnings: 42, xp: 13, tier: 1 },
  { name: "Landscaper", minEarnings: 22, maxEarnings: 40, xp: 12, tier: 1 },
  { name: "Housekeeper", minEarnings: 20, maxEarnings: 38, xp: 11, tier: 1 },
  {
    name: "Car Wash Attendant",
    minEarnings: 18,
    maxEarnings: 32,
    xp: 10,
    tier: 1,
  },
  { name: "Dishwasher", minEarnings: 16, maxEarnings: 28, xp: 8, tier: 1 },
  { name: "Farmhand", minEarnings: 18, maxEarnings: 32, xp: 10, tier: 1 },
  { name: "Street Sweeper", minEarnings: 18, maxEarnings: 30, xp: 9, tier: 1 },
  {
    name: "Parking Attendant",
    minEarnings: 18,
    maxEarnings: 32,
    xp: 10,
    tier: 1,
  },
  {
    name: "Movie Theater Usher",
    minEarnings: 16,
    maxEarnings: 28,
    xp: 8,
    tier: 1,
  },
  { name: "Pool Cleaner", minEarnings: 20, maxEarnings: 36, xp: 11, tier: 1 },
  {
    name: "Recycling Sorter",
    minEarnings: 17,
    maxEarnings: 30,
    xp: 9,
    tier: 1,
  },
  {
    name: "Newspaper Deliverer",
    minEarnings: 15,
    maxEarnings: 26,
    xp: 7,
    tier: 1,
  },
  { name: "Electrician", minEarnings: 55, maxEarnings: 90, xp: 28, tier: 2 },
  { name: "Plumber", minEarnings: 55, maxEarnings: 95, xp: 30, tier: 2 },
  { name: "Carpenter", minEarnings: 48, maxEarnings: 82, xp: 25, tier: 2 },
  { name: "Welder", minEarnings: 45, maxEarnings: 78, xp: 23, tier: 2 },
  { name: "Mechanic", minEarnings: 50, maxEarnings: 85, xp: 26, tier: 2 },
  { name: "Hairdresser", minEarnings: 38, maxEarnings: 65, xp: 20, tier: 2 },
  { name: "Chef", minEarnings: 50, maxEarnings: 88, xp: 27, tier: 2 },
  { name: "Firefighter", minEarnings: 58, maxEarnings: 95, xp: 30, tier: 2 },
  { name: "Police Officer", minEarnings: 55, maxEarnings: 92, xp: 28, tier: 2 },
  { name: "EMT", minEarnings: 48, maxEarnings: 78, xp: 25, tier: 2 },
  { name: "Truck Driver", minEarnings: 50, maxEarnings: 85, xp: 26, tier: 2 },
  {
    name: "HVAC Technician",
    minEarnings: 52,
    maxEarnings: 88,
    xp: 27,
    tier: 2,
  },
  { name: "Photographer", minEarnings: 45, maxEarnings: 80, xp: 24, tier: 2 },
  { name: "Paralegal", minEarnings: 50, maxEarnings: 82, xp: 26, tier: 2 },
  {
    name: "Real Estate Agent",
    minEarnings: 52,
    maxEarnings: 110,
    xp: 30,
    tier: 2,
  },
  {
    name: "Flight Attendant",
    minEarnings: 50,
    maxEarnings: 85,
    xp: 26,
    tier: 2,
  },
  { name: "Surveyor", minEarnings: 55, maxEarnings: 90, xp: 28, tier: 2 },
  { name: "Locksmith", minEarnings: 42, maxEarnings: 72, xp: 22, tier: 2 },
  { name: "Tailor", minEarnings: 38, maxEarnings: 65, xp: 20, tier: 2 },
  { name: "Jeweler", minEarnings: 48, maxEarnings: 82, xp: 25, tier: 2 },
  { name: "Tattoo Artist", minEarnings: 50, maxEarnings: 88, xp: 27, tier: 2 },
  {
    name: "Personal Trainer",
    minEarnings: 45,
    maxEarnings: 78,
    xp: 24,
    tier: 2,
  },
  {
    name: "Dental Hygienist",
    minEarnings: 58,
    maxEarnings: 95,
    xp: 30,
    tier: 2,
  },
  {
    name: "Pharmacy Technician",
    minEarnings: 38,
    maxEarnings: 65,
    xp: 20,
    tier: 2,
  },
  {
    name: "Radiologic Technician",
    minEarnings: 55,
    maxEarnings: 90,
    xp: 28,
    tier: 2,
  },
  {
    name: "Aircraft Mechanic",
    minEarnings: 60,
    maxEarnings: 98,
    xp: 31,
    tier: 2,
  },
  { name: "Mason", minEarnings: 48, maxEarnings: 80, xp: 25, tier: 2 },
  { name: "Roofer", minEarnings: 42, maxEarnings: 72, xp: 22, tier: 2 },
  { name: "Pipefitter", minEarnings: 52, maxEarnings: 88, xp: 27, tier: 2 },
  { name: "Sound Engineer", minEarnings: 48, maxEarnings: 82, xp: 25, tier: 2 },
  { name: "Court Reporter", minEarnings: 50, maxEarnings: 85, xp: 26, tier: 2 },
  { name: "Interpreter", minEarnings: 48, maxEarnings: 82, xp: 25, tier: 2 },
  { name: "Nurse", minEarnings: 80, maxEarnings: 130, xp: 42, tier: 3 },
  { name: "Teacher", minEarnings: 70, maxEarnings: 110, xp: 36, tier: 3 },
  { name: "Accountant", minEarnings: 85, maxEarnings: 130, xp: 44, tier: 3 },
  {
    name: "Software Engineer",
    minEarnings: 100,
    maxEarnings: 160,
    xp: 52,
    tier: 3,
  },
  { name: "Web Developer", minEarnings: 85, maxEarnings: 135, xp: 44, tier: 3 },
  {
    name: "Graphic Designer",
    minEarnings: 65,
    maxEarnings: 105,
    xp: 34,
    tier: 3,
  },
  { name: "Architect", minEarnings: 90, maxEarnings: 145, xp: 47, tier: 3 },
  {
    name: "Marketing Manager",
    minEarnings: 85,
    maxEarnings: 138,
    xp: 45,
    tier: 3,
  },
  {
    name: "Financial Analyst",
    minEarnings: 88,
    maxEarnings: 140,
    xp: 46,
    tier: 3,
  },
  { name: "Journalist", minEarnings: 60, maxEarnings: 100, xp: 32, tier: 3 },
  { name: "Social Worker", minEarnings: 58, maxEarnings: 92, xp: 30, tier: 3 },
  { name: "Librarian", minEarnings: 58, maxEarnings: 90, xp: 29, tier: 3 },
  { name: "Pharmacist", minEarnings: 110, maxEarnings: 158, xp: 56, tier: 3 },
  {
    name: "Physical Therapist",
    minEarnings: 88,
    maxEarnings: 138,
    xp: 45,
    tier: 3,
  },
  {
    name: "Occupational Therapist",
    minEarnings: 82,
    maxEarnings: 128,
    xp: 42,
    tier: 3,
  },
  { name: "Pilot", minEarnings: 95, maxEarnings: 155, xp: 50, tier: 3 },
  { name: "Urban Planner", minEarnings: 75, maxEarnings: 118, xp: 38, tier: 3 },
  { name: "Veterinarian", minEarnings: 95, maxEarnings: 148, xp: 49, tier: 3 },
  { name: "Psychologist", minEarnings: 88, maxEarnings: 138, xp: 45, tier: 3 },
  { name: "Economist", minEarnings: 90, maxEarnings: 145, xp: 47, tier: 3 },
  {
    name: "Cybersecurity Analyst",
    minEarnings: 95,
    maxEarnings: 150,
    xp: 49,
    tier: 3,
  },
  { name: "Data Analyst", minEarnings: 85, maxEarnings: 135, xp: 44, tier: 3 },
  {
    name: "Technical Writer",
    minEarnings: 72,
    maxEarnings: 112,
    xp: 37,
    tier: 3,
  },
  { name: "Meteorologist", minEarnings: 78, maxEarnings: 122, xp: 40, tier: 3 },
  { name: "Geologist", minEarnings: 75, maxEarnings: 118, xp: 38, tier: 3 },
  {
    name: "Marine Biologist",
    minEarnings: 72,
    maxEarnings: 112,
    xp: 36,
    tier: 3,
  },
  { name: "Astronomer", minEarnings: 95, maxEarnings: 148, xp: 49, tier: 3 },
  { name: "Biologist", minEarnings: 72, maxEarnings: 112, xp: 36, tier: 3 },
  { name: "Chemist", minEarnings: 80, maxEarnings: 125, xp: 41, tier: 3 },
  { name: "Zoologist", minEarnings: 68, maxEarnings: 108, xp: 34, tier: 3 },
  { name: "Archaeologist", minEarnings: 65, maxEarnings: 105, xp: 33, tier: 3 },
  {
    name: "Anthropologist",
    minEarnings: 65,
    maxEarnings: 102,
    xp: 32,
    tier: 3,
  },
  { name: "Sociologist", minEarnings: 68, maxEarnings: 108, xp: 34, tier: 3 },
  { name: "Linguist", minEarnings: 62, maxEarnings: 98, xp: 31, tier: 3 },
  { name: "Statistician", minEarnings: 90, maxEarnings: 142, xp: 46, tier: 3 },
  { name: "Dietitian", minEarnings: 65, maxEarnings: 102, xp: 32, tier: 3 },
  {
    name: "Speech Therapist",
    minEarnings: 78,
    maxEarnings: 122,
    xp: 40,
    tier: 3,
  },
  { name: "Optometrist", minEarnings: 95, maxEarnings: 148, xp: 49, tier: 3 },
  { name: "Audiologist", minEarnings: 80, maxEarnings: 125, xp: 41, tier: 3 },
  { name: "Radiographer", minEarnings: 78, maxEarnings: 120, xp: 39, tier: 3 },
  {
    name: "Air Traffic Controller",
    minEarnings: 110,
    maxEarnings: 162,
    xp: 56,
    tier: 3,
  },
  {
    name: "Game Developer",
    minEarnings: 88,
    maxEarnings: 138,
    xp: 45,
    tier: 3,
  },
  { name: "UX Designer", minEarnings: 85, maxEarnings: 132, xp: 43, tier: 3 },
  {
    name: "Database Administrator",
    minEarnings: 90,
    maxEarnings: 140,
    xp: 46,
    tier: 3,
  },
  {
    name: "Network Engineer",
    minEarnings: 88,
    maxEarnings: 138,
    xp: 45,
    tier: 3,
  },
  {
    name: "DevOps Engineer",
    minEarnings: 100,
    maxEarnings: 158,
    xp: 51,
    tier: 3,
  },
  {
    name: "Quantity Surveyor",
    minEarnings: 75,
    maxEarnings: 118,
    xp: 38,
    tier: 3,
  },
  {
    name: "Environmental Scientist",
    minEarnings: 72,
    maxEarnings: 115,
    xp: 37,
    tier: 3,
  },
  { name: "Oceanographer", minEarnings: 75, maxEarnings: 118, xp: 38, tier: 3 },
  { name: "Cartographer", minEarnings: 68, maxEarnings: 108, xp: 34, tier: 3 },
  { name: "Historian", minEarnings: 62, maxEarnings: 98, xp: 31, tier: 3 },
  { name: "Criminologist", minEarnings: 70, maxEarnings: 110, xp: 35, tier: 3 },
  { name: "Doctor", minEarnings: 160, maxEarnings: 220, xp: 80, tier: 4 },
  { name: "Surgeon", minEarnings: 185, maxEarnings: 250, xp: 95, tier: 4 },
  { name: "Dentist", minEarnings: 145, maxEarnings: 205, xp: 75, tier: 4 },
  { name: "Lawyer", minEarnings: 140, maxEarnings: 210, xp: 72, tier: 4 },
  {
    name: "Anesthesiologist",
    minEarnings: 190,
    maxEarnings: 260,
    xp: 98,
    tier: 4,
  },
  {
    name: "Nuclear Engineer",
    minEarnings: 135,
    maxEarnings: 195,
    xp: 68,
    tier: 4,
  },
  {
    name: "Aerospace Engineer",
    minEarnings: 130,
    maxEarnings: 190,
    xp: 65,
    tier: 4,
  },
  {
    name: "Quantum Physicist",
    minEarnings: 130,
    maxEarnings: 185,
    xp: 65,
    tier: 4,
  },
  {
    name: "Neuroscientist",
    minEarnings: 140,
    maxEarnings: 200,
    xp: 70,
    tier: 4,
  },
  {
    name: "Forensic Scientist",
    minEarnings: 95,
    maxEarnings: 148,
    xp: 49,
    tier: 4,
  },
  {
    name: "Investment Banker",
    minEarnings: 150,
    maxEarnings: 220,
    xp: 78,
    tier: 4,
  },
  { name: "Actuary", minEarnings: 125, maxEarnings: 185, xp: 62, tier: 4 },
  { name: "Orthodontist", minEarnings: 160, maxEarnings: 230, xp: 82, tier: 4 },
  {
    name: "Cardiologist",
    minEarnings: 195,
    maxEarnings: 265,
    xp: 100,
    tier: 4,
  },
  { name: "Psychiatrist", minEarnings: 170, maxEarnings: 235, xp: 85, tier: 4 },
  {
    name: "Epidemiologist",
    minEarnings: 120,
    maxEarnings: 175,
    xp: 60,
    tier: 4,
  },
  { name: "Geneticist", minEarnings: 130, maxEarnings: 185, xp: 65, tier: 4 },
  {
    name: "Biomedical Engineer",
    minEarnings: 125,
    maxEarnings: 180,
    xp: 63,
    tier: 4,
  },
  {
    name: "Patent Attorney",
    minEarnings: 155,
    maxEarnings: 225,
    xp: 80,
    tier: 4,
  },
  {
    name: "Hedge Fund Manager",
    minEarnings: 180,
    maxEarnings: 260,
    xp: 95,
    tier: 4,
  },
];

const commuteEvents = [
  {
    weight: 12,
    fn: (base) => ({
      delta: -Math.floor(base * 0.18),
      text: "Your car wouldn't start. You Ubered in. Driver charged surge pricing. **-${n}**",
    }),
  },
  {
    weight: 10,
    fn: (base) => ({
      delta: -Math.floor(base * 0.12),
      text: "Got a parking ticket outside work. Classic. **-${n}**",
    }),
  },
  {
    weight: 8,
    fn: (base) => ({
      delta: -Math.floor(base * 0.25),
      text: "Rear-ended someone at a red light. You were at fault. Insurance goes up next month too. **-${n}**",
    }),
  },
  {
    weight: 9,
    fn: (base) => ({
      delta: -Math.floor(base * 0.08),
      text: "Stopped for gas. Price gouging at its finest. **-${n}**",
    }),
  },
  {
    weight: 7,
    fn: (base) => ({
      delta: -Math.floor(base * 0.35),
      text: "Got pulled over for speeding. Officer was not in a forgiving mood. **-${n}**",
    }),
  },
  {
    weight: 6,
    fn: (base) => ({
      delta: -Math.floor(base * 0.15),
      text: "Bus was late. You took a cab. Driver took the long way. You tipped anyway out of guilt. **-${n}**",
    }),
  },
  {
    weight: 5,
    fn: (base) => ({
      delta: -Math.floor(base * 0.4),
      text: "Your bike tire blew out. Replacement + labor at the shop near your job. **-${n}**",
    }),
  },
  {
    weight: 4,
    fn: (base) => ({
      delta: -Math.floor(base * 0.55),
      text: "Got mugged on the way in. They took your wallet. You still showed up to work because rent is due. **-${n}**",
    }),
  },
  {
    weight: 3,
    fn: (base) => ({
      delta: -Math.floor(base * 0.7),
      text: "Your car got towed from a spot you *swear* was legal. **-${n}**",
    }),
  },
  {
    weight: 2,
    fn: (base) => ({
      delta: -Math.floor(base * 1.1),
      text: "Fender bender + no insurance on your car. You paid out of pocket to avoid a lawsuit. **-${n}**",
    }),
  },
  { weight: 14, fn: () => ({ delta: 0, text: "Commute was fine. Somehow." }) },
  {
    weight: 13,
    fn: () => ({
      delta: 0,
      text: "Green lights the whole way. You got in 8 minutes early. Your boss didn't notice.",
    }),
  },
  {
    weight: 8,
    fn: (base) => ({
      delta: Math.floor(base * 0.05),
      text: "Found a crumpled $10 on the sidewalk. Today might not be awful. **+${n}**",
    }),
  },
  {
    weight: 3,
    fn: (base) => ({
      delta: Math.floor(base * 0.12),
      text: "Helped push a stranger's dead car off the road. They slipped you $20. **+${n}**",
    }),
  },
  {
    weight: 1,
    fn: (base) => ({
      delta: Math.floor(base * 0.5),
      text: "Someone handed you a $50 scratch ticket saying they didn't want it. You won on it. **+${n}**",
    }),
  },
  {
    weight: 6,
    fn: (base) => ({
      delta: -Math.floor(base * 0.06),
      text: "Stopped at Starbucks because you needed to survive the day. $7 latte. **-${n}**",
    }),
  },
  {
    weight: 5,
    fn: (base) => ({
      delta: -Math.floor(base * 0.22),
      text: "Train was delayed 40 minutes. You missed a client meeting. Boss is already texting. **-${n}**",
    }),
  },
  {
    weight: 2,
    fn: (base) => ({
      delta: -Math.floor(base * 0.9),
      text: "Your car was broken into overnight. Window smashed, GPS stolen. **-${n}**",
    }),
  },
  {
    weight: 1,
    fn: (base) => ({
      delta: Math.floor(base * 2.0),
      text: "You saw a guy drop an envelope getting into a limo. It had $200 cash in it. He drove away before you could say anything. **+${n}**",
    }),
  },
];

const bossEvents = [
  {
    weight: 15,
    fn: () => ({
      mult: 1.0,
      text: "Boss didn't look up from their monitor once.",
    }),
  },
  {
    weight: 12,
    fn: () => ({
      mult: 1.0,
      text: "Boss said 'good work' while walking past. You still have no idea if they mean it.",
    }),
  },
  {
    weight: 10,
    fn: () => ({
      mult: 0.8,
      text: "Boss clocked you coming in 6 minutes late and docked your pay. **Pay docked 20%.**",
    }),
  },
  {
    weight: 8,
    fn: () => ({
      mult: 0.65,
      text: "Boss scheduled an 'urgent' performance review. You sat there for 45 minutes and left with less dignity and less pay. **Pay docked 35%.**",
    }),
  },
  {
    weight: 6,
    fn: () => ({
      mult: 0.5,
      text: "Boss caught you on your phone and sent you home two hours early. Unpaid, obviously. **Pay docked 50%.**",
    }),
  },
  {
    weight: 4,
    fn: () => ({
      mult: 0.0,
      text: "Boss fired you mid-shift. Said it was 'restructuring'. Your position is being filled by a contractor tomorrow. **No pay today.**",
    }),
  },
  {
    weight: 3,
    fn: () => ({
      mult: 1.2,
      text: "Boss was in a good mood because the quarterly numbers were up. Handed you a cash bonus on the spot. **+20% pay.**",
    }),
  },
  {
    weight: 2,
    fn: () => ({
      mult: 1.4,
      text: "Boss's boss visited. You said something smart in a meeting you were barely paying attention in. Both bosses were impressed. **+40% pay.**",
    }),
  },
  {
    weight: 1,
    fn: () => ({
      mult: 1.75,
      text: "Boss offered you an unofficial raise effective immediately because someone quit and they need you to cover two roles. No extra benefits though. **+75% pay.**",
    }),
  },
  {
    weight: 9,
    fn: () => ({
      mult: 0.9,
      text: "Boss asked you to redo something you already finished because the format was 'slightly off'. Ate into your billable time. **Pay docked 10%.**",
    }),
  },
  {
    weight: 7,
    fn: () => ({
      mult: 1.0,
      text: "Boss held a mandatory 90-minute meeting that could have been an email. You were paid for it technically. Spiritually you were not.",
    }),
  },
  {
    weight: 5,
    fn: () => ({
      mult: 1.1,
      text: "Boss let everyone leave an hour early. You used it to get ahead. **+10% productivity bonus.**",
    }),
  },
  {
    weight: 4,
    fn: () => ({
      mult: 0.75,
      text: "Boss accused you of stealing office supplies. You didn't. HR was involved. It took three hours to clear your name. **Lost hours. -25% pay.**",
    }),
  },
  {
    weight: 2,
    fn: () => ({
      mult: 1.3,
      text: "Boss got a huge client and thanked the team with a cash envelope. You actually got one. **+30% bonus.**",
    }),
  },
  {
    weight: 1,
    fn: () => ({
      mult: 2.5,
      text: "Boss promoted you on the spot. Old employee cleared their desk by noon. You took their office. **+150% shift pay.**",
    }),
  },
];

const workplaceEvents = [
  { weight: 14, fn: () => ({ delta: 0, text: null }) },
  {
    weight: 10,
    fn: (base) => ({
      delta: Math.floor(base * 0.1),
      text: "A customer left a surprisingly generous tip. You weren't even that nice today. **+${n}**",
    }),
  },
  {
    weight: 8,
    fn: (base) => ({
      delta: Math.floor(base * 0.2),
      text: "A coworker called in sick and you covered their shift. Extra hours, extra cash. **+${n}**",
    }),
  },
  {
    weight: 6,
    fn: (base) => ({
      delta: Math.floor(base * 0.35),
      text: "Corporate did a surprise 'spot excellence' bonus sweep. Your name was pulled. **+${n}**",
    }),
  },
  {
    weight: 4,
    fn: (base) => ({
      delta: Math.floor(base * 0.6),
      text: "A client tipped you directly in cash and told you to 'keep it between us.' **+${n}**",
    }),
  },
  {
    weight: 2,
    fn: (base) => ({
      delta: Math.floor(base * 1.2),
      text: "A mystery envelope appeared in your locker. $100 cash. No note. You don't ask questions. **+${n}**",
    }),
  },
  {
    weight: 1,
    fn: (base) => ({
      delta: Math.floor(base * 3.0),
      text: "The owner of the business was on-site today and personally handed you a $250 bonus for 'being solid.' You didn't even know they knew your name. **+${n}**",
    }),
  },
  {
    weight: 8,
    fn: (base) => ({
      delta: -Math.floor(base * 0.15),
      text: "You broke something expensive on accident. They deducted it from your wages. **-${n}**",
    }),
  },
  {
    weight: 6,
    fn: (base) => ({
      delta: -Math.floor(base * 0.25),
      text: "Register was short at end of shift. You covered it to avoid the writeup. **-${n}**",
    }),
  },
  {
    weight: 5,
    fn: (base) => ({
      delta: -Math.floor(base * 0.3),
      text: "Coworker stole from your bag in the break room. Again. **-${n}**",
    }),
  },
  {
    weight: 4,
    fn: (base) => ({
      delta: -Math.floor(base * 0.4),
      text: "Customer filed a complaint. False. HR doesn't care. You were suspended without pay for the afternoon. **-${n}**",
    }),
  },
  {
    weight: 3,
    fn: (base) => ({
      delta: -Math.floor(base * 0.5),
      text: "You slipped in the back and had to pay the urgent care copay out of pocket. Workers' comp claim is 'pending review.' **-${n}**",
    }),
  },
  {
    weight: 2,
    fn: (base) => ({
      delta: -Math.floor(base * 0.7),
      text: "Got blamed for someone else's inventory error. Write-up AND wage penalty. **-${n}**",
    }),
  },
  {
    weight: 1,
    fn: (base) => ({
      delta: -Math.floor(base * 0.95),
      text: "Health inspector showed up. Your section flagged. You were sent home. No pay. Threatened with termination. **-${n}**",
    }),
  },
  {
    weight: 7,
    fn: (base) => ({
      delta: Math.floor(base * 0.08),
      text: "Sold an upsell without trying. Commission hit. **+${n}**",
    }),
  },
  {
    weight: 3,
    fn: (base) => ({
      delta: Math.floor(base * 0.45),
      text: "Corporate noticed your metrics this week. You got a digital 'excellence badge' AND a cash incentive. **+${n}**",
    }),
  },
];

const afterWorkEvents = [
  { weight: 20, fn: () => ({ delta: 0, text: null }) },
  {
    weight: 10,
    fn: (base) => ({
      delta: -Math.floor(base * 0.12),
      text: "Grabbed food on the way home because you had absolutely nothing left to cook. **-${n}**",
    }),
  },
  {
    weight: 8,
    fn: (base) => ({
      delta: -Math.floor(base * 0.08),
      text: "Stopped at the pharmacy. Two items. $40. This country is something else. **-${n}**",
    }),
  },
  {
    weight: 7,
    fn: (base) => ({
      delta: -Math.floor(base * 0.2),
      text: "Your phone died and you had to buy a charger because the spare is in your other bag. **-${n}**",
    }),
  },
  {
    weight: 5,
    fn: (base) => ({
      delta: -Math.floor(base * 0.3),
      text: "Happy hour happened. You said one drink. Five drinks happened. Uber home was $28. **-${n}**",
    }),
  },
  {
    weight: 4,
    fn: (base) => ({
      delta: -Math.floor(base * 0.5),
      text: "Friend needed to borrow money. You gave it. They said they'd pay you back. They won't. **-${n}**",
    }),
  },
  {
    weight: 3,
    fn: (base) => ({
      delta: -Math.floor(base * 0.8),
      text: "Your landlord slipped a note under the door. Late fee from last month that you thought was waived. It was not waived. **-${n}**",
    }),
  },
  {
    weight: 2,
    fn: (base) => ({
      delta: -Math.floor(base * 0.15),
      text: "Your streaming services auto-renewed all at once this week. Checked your bank. Cried a little. **-${n}**",
    }),
  },
  {
    weight: 6,
    fn: (base) => ({
      delta: Math.floor(base * 0.1),
      text: "Returned something you bought three months ago. They actually accepted it. **+${n}**",
    }),
  },
  {
    weight: 3,
    fn: (base) => ({
      delta: Math.floor(base * 0.25),
      text: "Sold something you listed online months ago. Someone finally bit. **+${n}**",
    }),
  },
  {
    weight: 2,
    fn: (base) => ({
      delta: Math.floor(base * 0.4),
      text: "Found $40 in a jacket you haven't worn since winter. Past you was looking out. **+${n}**",
    }),
  },
  {
    weight: 1,
    fn: (base) => ({
      delta: Math.floor(base * 1.5),
      text: "A stranger on the street asked if you knew where a restaurant was. Turned out to be a restaurant critic. They handed you a referral card worth $100 cash. **+${n}**",
    }),
  },
  {
    weight: 1,
    fn: (base) => ({
      delta: -Math.floor(base * 1.2),
      text: "Got pickpocketed on the way home. You didn't notice until you were at your front door. **-${n}**",
    }),
  },
];

const godTierEvents = [
  {
    chance: 0.001,
    fn: (base) => ({
      delta: Math.floor(base * 80),
      xpBonus: 500,
      title: "🤑 LIFE-CHANGING SHIFT",
      text: `A billionaire left their credit card at your station. You returned it. They handed you **$${Math.floor(base * 80)}** cash and said "buy yourself something real." You stood there for four minutes not moving.`,
    }),
  },
  {
    chance: 0.0015,
    fn: (base) => ({
      delta: Math.floor(base * 55),
      xpBonus: 400,
      title: "💰 ABSURD WINDFALL",
      text: `A talent scout was passing by, saw you working, and offered you a paid sponsorship deal on the spot for a "real worker" ad campaign. You signed a napkin. Cash hit your hand immediately. **+$${Math.floor(base * 55)}**`,
    }),
  },
  {
    chance: 0.002,
    fn: (base) => ({
      delta: Math.floor(base * 40),
      xpBonus: 300,
      title: "📈 MARKET ACCIDENT",
      text: `A coworker whispered a stock ticker to you at lunch. You threw $20 at it on your break. It went up 1,900% before closing bell. You sold. You don't understand what happened. **+$${Math.floor(base * 40)}**`,
    }),
  },
  {
    chance: 0.003,
    fn: (base) => ({
      delta: Math.floor(base * 30),
      xpBonus: 250,
      title: "🎰 VENDING MACHINE MIRACLE",
      text: `The vending machine ate someone's money before yours. It dispensed twelve items in a row. You sold eleven of them in the break room at markup. Net profit: **+$${Math.floor(base * 30)}**`,
    }),
  },
  {
    chance: 0.004,
    fn: (base) => ({
      delta: Math.floor(base * 20),
      xpBonus: 200,
      title: "🧳 SUITCASE SITUATION",
      text: `Someone left a briefcase at your workplace. Turned it in to management. Owner came back and gave you a cash reward. No questions asked. On either side. **+$${Math.floor(base * 20)}**`,
    }),
  },
  {
    chance: 0.005,
    fn: (base) => ({
      delta: Math.floor(base * 15),
      xpBonus: 150,
      title: "📸 YOU WENT VIRAL",
      text: `Someone filmed you doing your job exceptionally well and posted it. Brand DMs started rolling in. One paid you immediately for a single story repost. **+$${Math.floor(base * 15)}**`,
    }),
  },
  {
    chance: 0.006,
    fn: (base) => ({
      delta: Math.floor(base * 12),
      xpBonus: 120,
      title: "🏆 EMPLOYEE OF THE MONTH (CASH PRIZE)",
      text: `In a shocking twist, corporate actually included a cash prize this month and your coworkers nominated you as a joke but you won anyway. **+$${Math.floor(base * 12)}**`,
    }),
  },
];

const disasterEvents = [
  {
    chance: 0.005,
    fn: (base) => ({
      delta: -Math.floor(base * 15),
      text: `You were named in a class action lawsuit by a customer. Your entire shift pay went to the retainer fee. **-$${Math.floor(base * 15)}**`,
    }),
  },
  {
    chance: 0.008,
    fn: (base) => ({
      delta: -Math.floor(base * 10),
      text: `IRS sent a notice. Underpaid taxes from three years ago. They expect payment. Now. **-$${Math.floor(base * 10)}**`,
    }),
  },
  {
    chance: 0.01,
    fn: (base) => ({
      delta: -Math.floor(base * 8),
      text: `Your bank flagged your account for "unusual activity" and froze it for 48 hours. You had to use a payday loan for today's expenses. The fee was brutal. **-$${Math.floor(base * 8)}**`,
    }),
  },
  {
    chance: 0.012,
    fn: (base) => ({
      delta: -Math.floor(base * 6),
      text: `A pipe burst in your apartment building while you were at work. You came home to a soaked floor and an out-of-pocket repair bill because your renter's insurance lapsed. **-$${Math.floor(base * 6)}**`,
    }),
  },
  {
    chance: 0.015,
    fn: (base) => ({
      delta: -Math.floor(base * 4),
      text: `Credit card company retroactively applied interest to a purchase you thought was 0% APR. The fine print was a lie. **-$${Math.floor(base * 4)}**`,
    }),
  },
];

function roll(events) {
  const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const e of events) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return events[events.length - 1];
}

function applyFormat(text, amount) {
  return text.replace("${n}", `$${Math.abs(amount)}`);
}

function rollGodTier(base) {
  for (const e of godTierEvents) {
    if (Math.random() < e.chance) return { event: e, result: e.fn(base) };
  }
  return null;
}

function rollDisaster(base) {
  for (const e of disasterEvents) {
    if (Math.random() < e.chance) return { event: e, result: e.fn(base) };
  }
  return null;
}

module.exports = {
  name: "work",
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Go to work. Try to survive capitalism.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    try {
      const profile = await getProfile({ userID: interaction.user.id });

      if (!profile) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription(
                `You don't have a profile yet!\nUse /register to get started.`,
              ),
          ],
        });
      }

      const COOLDOWN_MS = 30 * 60 * 1000;
      const lastWork = profile.lastWork || profile.cooldowns?.work || 0;
      const remaining = COOLDOWN_MS - (Date.now() - lastWork);

      if (remaining > 0) {
        const timeLeft = Math.round(remaining / 1000);
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setTitle("You're still tired from your last shift.")
              .setDescription(
                `Come back in **${minutes}m ${seconds}s**. Rest, or at least doom scroll.`,
              ),
          ],
          ephemeral: true,
        });
      }

      const level = profile.level || 1;

      let jobPool;
      if (level < 5) {
        jobPool = jobOptions.filter((j) => j.tier <= 1);
      } else if (level < 15) {
        jobPool = jobOptions.filter((j) => j.tier <= 2);
      } else if (level < 30) {
        jobPool = jobOptions.filter((j) => j.tier <= 3);
      } else {
        jobPool = jobOptions;
      }

      const selectedJob = jobPool[Math.floor(Math.random() * jobPool.length)];

      const base = Math.floor(
        Math.random() *
          (selectedJob.maxEarnings - selectedJob.minEarnings + 1) +
          selectedJob.minEarnings,
      );

      const levelMultiplier = 1 + level * 0.02;
      const variance = 0.9 + Math.random() * 0.2;
      const xpMultiplier = 1 + (profile.xp || 0) * 0.0001;

      let baseEarnings = Math.floor(
        base * levelMultiplier * variance * xpMultiplier,
      );
      let xpGained = selectedJob.xp;

      const eventLog = [];
      let totalDelta = 0;
      let godTierResult = null;
      let disasterResult = null;

      const godTierRoll = rollGodTier(baseEarnings);
      const disasterRoll = rollDisaster(baseEarnings);

      if (godTierRoll) {
        godTierResult = godTierRoll.result;
        totalDelta += godTierResult.delta;
        xpGained += godTierResult.xpBonus || 0;
      } else if (disasterRoll) {
        disasterResult = disasterRoll.result;
        totalDelta += disasterResult.delta;
      } else {
        const commuteEvent = roll(commuteEvents);
        const commuteResult = commuteEvent.fn(baseEarnings);
        if (commuteResult.delta !== 0 || commuteResult.text) {
          const formatted = applyFormat(
            commuteResult.text,
            commuteResult.delta,
          );
          eventLog.push({
            phase: "🚗 Commute",
            text: formatted,
            delta: commuteResult.delta,
          });
          totalDelta += commuteResult.delta;
        }

        const bossEvent = roll(bossEvents);
        const bossResult = bossEvent.fn(baseEarnings);
        baseEarnings = Math.floor(baseEarnings * bossResult.mult);
        if (bossResult.text) {
          eventLog.push({
            phase: "👔 Boss",
            text: bossResult.text,
            delta: null,
          });
        }

        const workplaceEvent = roll(workplaceEvents);
        const workplaceResult = workplaceEvent.fn(baseEarnings);
        if (workplaceResult.delta !== 0 && workplaceResult.text) {
          const formatted = applyFormat(
            workplaceResult.text,
            workplaceResult.delta,
          );
          eventLog.push({
            phase: "🏢 On the Job",
            text: formatted,
            delta: workplaceResult.delta,
          });
          totalDelta += workplaceResult.delta;
        }

        const afterEvent = roll(afterWorkEvents);
        const afterResult = afterEvent.fn(baseEarnings);
        if (afterResult.delta !== 0 && afterResult.text) {
          const formatted = applyFormat(afterResult.text, afterResult.delta);
          eventLog.push({
            phase: "🌆 After Work",
            text: formatted,
            delta: afterResult.delta,
          });
          totalDelta += afterResult.delta;
        }

        const taxRate =
          level >= 30 ? 0.28 : level >= 15 ? 0.22 : level >= 5 ? 0.15 : 0.1;
        const taxAmount = Math.floor(baseEarnings * taxRate);
        baseEarnings -= taxAmount;
        eventLog.push({
          phase: "🏛️ Uncle Sam",
          text: `Federal and state taxes withheld. You don't get a say. **-$${taxAmount}**`,
          delta: -taxAmount,
        });

        if (Math.random() < 0.06) {
          const ssDeduct = Math.floor(baseEarnings * 0.062);
          baseEarnings -= ssDeduct;
          eventLog.push({
            phase: "📋 Social Security",
            text: `FICA deduction because you'll definitely get to use it someday. **-$${ssDeduct}**`,
            delta: -ssDeduct,
          });
        }

        if (Math.random() < 0.04 && level >= 10) {
          const unionDues = Math.floor(baseEarnings * 0.03);
          baseEarnings -= unionDues;
          eventLog.push({
            phase: "✊ Union Dues",
            text: `Monthly union dues came out of this check. Worth it. Probably. **-$${unionDues}**`,
            delta: -unionDues,
          });
        }

        if (Math.random() < 0.08) {
          const overtimePay = Math.floor(
            baseEarnings * (0.25 + Math.random() * 0.5),
          );
          totalDelta += overtimePay;
          eventLog.push({
            phase: "⏰ Overtime",
            text: `You got voluntold to stay late. Time-and-a-half hit different. **+$${overtimePay}**`,
            delta: overtimePay,
          });
        }

        if (Math.random() < 0.03) {
          const garnishment = Math.floor(
            baseEarnings * (0.1 + Math.random() * 0.15),
          );
          totalDelta -= garnishment;
          eventLog.push({
            phase: "⚖️ Wage Garnishment",
            text: `Old debt caught up with you. They're taking it straight from your check. **-$${garnishment}**`,
            delta: -garnishment,
          });
        }
      }

      const finalEarnings = Math.max(0, baseEarnings + totalDelta);
      const now = Date.now();

      await updateProfile(
        { userID: interaction.user.id },
        {
          $inc: { wallet: finalEarnings, xp: xpGained },
          $set: { "cooldowns.work": now, lastWork: now },
        },
      );

      const tierLabels = {
        1: "Entry-level",
        2: "Skilled trade",
        3: "Professional",
        4: "Elite",
      };

      if (godTierResult) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("#FFD700")
              .setTitle(godTierResult.title)
              .setDescription(godTierResult.text)
              .addFields(
                {
                  name: "Job",
                  value: `${selectedJob.name} (${tierLabels[selectedJob.tier]})`,
                  inline: true,
                },
                {
                  name: "Total Earned",
                  value: `**$${finalEarnings}**`,
                  inline: true,
                },
                { name: "XP Gained", value: `+${xpGained} XP`, inline: true },
              ),
          ],
        });
      }

      if (disasterResult) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("#8B0000")
              .setTitle("💀 CATASTROPHIC DAY")
              .setDescription(disasterResult.text)
              .addFields(
                {
                  name: "Job",
                  value: `${selectedJob.name} (${tierLabels[selectedJob.tier]})`,
                  inline: true,
                },
                {
                  name: "Net Take-Home",
                  value: `**$${finalEarnings}**`,
                  inline: true,
                },
                { name: "XP Gained", value: `+${xpGained} XP`, inline: true },
              ),
          ],
        });
      }

      const eventLines = eventLog
        .map((e) => `**${e.phase}**\n${e.text}`)
        .join("\n\n");

      const netColor =
        finalEarnings >= baseEarnings * 1.2
          ? "#00FF00"
          : finalEarnings <= baseEarnings * 0.5
            ? "#FF4444"
            : interaction.client.color.green;

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(netColor)
            .setTitle(
              `${interaction.user.username} worked as a ${selectedJob.name}`,
            )
            .setDescription(
              eventLines || "Nothing remarkable happened. Just another day.",
            )
            .addFields(
              {
                name: "Job Tier",
                value: tierLabels[selectedJob.tier],
                inline: true,
              },
              { name: "XP Gained", value: `+${xpGained} XP`, inline: true },
              {
                name: "Take-Home Pay",
                value: `**$${finalEarnings}**`,
                inline: true,
              },
            ),
        ],
      });
    } catch (error) {
      console.error("Work command error:", error);
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("An error occurred while processing the command."),
        ],
      });
    }
  },

  calculateRequiredXP(level) {
    return Math.pow(level * 100, 2);
  },
};
