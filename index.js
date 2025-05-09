/* ─────────────────────────────────────────
 *  Venille AI – WhatsApp Chat-bot  (text only)
 *  npm i whatsapp-web.js qrcode-terminal better-sqlite3
 * ───────────────────────────────────────── */

const qrcode  = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const Database = require('better-sqlite3');
const cron = require('node-cron');
const puppeteer = require('puppeteer');
const launchArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
];
// Removed duplicate client declaration to avoid redeclaration error


/* ═══════ 1. SQLite bootstrap ═══════ */
const db = new Database('venille.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    wa_name TEXT,
    first_seen TEXT,
    last_seen TEXT,
    language TEXT DEFAULT 'English',
    last_period TEXT,
    next_period TEXT
  );
  CREATE TABLE IF NOT EXISTS symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    symptom TEXT,
    logged_at TEXT
  );
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    response1 TEXT,
    response2 TEXT,
    submitted_at TEXT
  );
`);
try {
  db.exec(`ALTER TABLE users ADD COLUMN wants_reminder INTEGER DEFAULT 0`);
} catch (e) {
  if (!e.message.includes("duplicate column")) {
    console.error("Failed to add wants_reminder column:", e.message);
  }
}
try {
  db.exec(`ALTER TABLE users ADD COLUMN wants_reminder INTEGER DEFAULT 0`);
} catch (e) {
  if (!e.message.includes("duplicate column")) {
    console.error("Failed to add wants_reminder column:", e.message);
  }
}

const getUser     = db.prepare('SELECT * FROM users WHERE jid=?');
const insertUser  = db.prepare('INSERT INTO users (jid,wa_name,first_seen,last_seen) VALUES (?,?,?,?)');
const updateSeen  = db.prepare('UPDATE users SET last_seen=?,wa_name=? WHERE jid=?');
const setLang     = db.prepare('UPDATE users SET language=? WHERE jid=?');
const setPeriod   = db.prepare('UPDATE users SET last_period=?,next_period=? WHERE jid=?');
const addSymptom  = db.prepare('INSERT INTO symptoms (jid,symptom,logged_at) VALUES (?,?,?)');
const getSymptoms = db.prepare('SELECT symptom,logged_at FROM symptoms WHERE jid=? ORDER BY logged_at DESC');
const addFeedback = db.prepare('INSERT INTO feedback (jid, response1, response2, submitted_at) VALUES (?,?,?,?)');


/* ═══════ 2.  Bot init ═══════ */
 const { Client, LocalAuth } = require('whatsapp-web.js');
 const puppeteer = require('puppeteer');
 const { Client, LocalAuth } = require('whatsapp-web.js');
 const puppeteer = require('puppeteer');

  // …

 const client = new Client({
   authStrategy: new LocalAuth({ dataPath: sessionDir }),
   puppeteer: {
     executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    headless: true,
    args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage'
     ]
   }
 });
 const client = new Client({
   authStrategy: new LocalAuth({ dataPath: sessionDir }),
 
  // point whatsapp-web.js at the full puppeteer package
   puppeteer: puppeteer,
   // now pass *its* launch options here:
  puppeteerOptions: {
     headless: true,
     args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage'
    ]
   }
 });


const CYCLE = 28;
const mem          = {};                 // chatId → { step , data:{} }
const ORDER_VENDOR = '2348012345678@c.us';   //  <-- put the vendor's JID here
const ORDER_LINK   = 'https://wa.me/2348012345678'; // same number, no + sign  // ✏️  Plateau fulfilment number
const STRINGS = {
  English: {
    menu: `Hi, I'm *Venille AI*, your private menstrual & sexual-health companion.

Reply with the *number* **or** the *words*:

1️⃣  Track my period
2️⃣  Log symptoms
3️⃣  Learn about sexual health
4️⃣  Order Venille Pads
5️⃣  View my cycle
6️⃣  View my symptoms
7️⃣  Change language
8️⃣  Give feedback / report a problem`,

    fallback: 'Sorry, I didn\'t get that.\nType *menu* to see what I can do.',
    trackPrompt: '🩸 When did your last period start? (e.g. 12/05/2025)',
    langPrompt: 'Type your preferred language (e.g. English, Hausa…)',
    savedSymptom: 'Saved ✔︎ — send another, or type *done*.',
    askReminder: '✅ Saved! Your next period is likely around *{0}*.\nWould you like a reminder? (yes / no)',
    reminderYes: '🔔 Reminder noted! I\'ll message you a few days before.',
    reminderNo: '👍 No problem – ask me any time.',
    invalidDate: '🙈 Please type the date like *12/05/2025*',
    notValidDate: '🤔 That doesn\'t look like a valid date.',
    symptomsDone: '✅ {0} symptom{1} saved. Feel better soon ❤️',
    symptomsCancel: '🚫 Cancelled.',
    symptomsNothingSaved: 'Okay, nothing saved.',
    symptomPrompt: 'How are you feeling? Send one symptom at a time.\nWhen done, type *done* (or *cancel*).',
    eduTopics: `What topic?

1️⃣  STIs  
2️⃣  Contraceptives  
3️⃣  Consent  
4️⃣  Hygiene during menstruation  
5️⃣  Myths and Facts`,
    languageSet: '🔤 Language set to *{0}*.',
    noPeriod: 'No period date recorded yet.',
    cycleInfo: `📅 *Your cycle info:*  
• Last period: *{0}*  
• Predicted next: *{1}*`,
    noSymptoms: 'No symptoms logged yet.',
    symptomsHistory: '*Your symptom history (last 5):*\n{0}',
    feedbackQ1: 'Did you have access to sanitary pads this month?\n1. Yes   2. No',
    feedbackQ2: 'Thanks. What challenges did you face? (or type "skip")',
    feedbackThanks: '❤️  Feedback noted — thank you!',
    orderQuantityPrompt: 'How many packs of *Venille Pads* would you like to order?',
    orderQuantityInvalid: 'Please enter a *number* between 1 and 99, e.g. 3',
    orderConfirmation: `✅ Your order for *{0} pack{1}* has been forwarded.

Tap the link below to chat directly with our sales team and confirm delivery:
{2}

Thank you for choosing Venille!`,
    orderVendorMessage: `🆕 *Venille Pads order*

From : {0}
JID  : {1}
Qty  : {2} pack{3}

(Please contact the customer to arrange delivery.)`
  },

  Hausa: {
    menu: `Sannu, ni ce *Venille AI*, abokiyar lafiyar jinin haila da dangantakar jima'i.

Zaɓi daga cikin waɗannan:

1️⃣  Bi jinin haila
2️⃣  Rubuta alamomin rashin lafiya
3️⃣  Koyi game da lafiyar jima'i
4️⃣  Yi odar Venille Pads
5️⃣  Duba zagayen haila
6️⃣  Duba alamun rashin lafiya
7️⃣  Sauya harshe
8️⃣  Bayar da ra'ayi / rahoto matsala`,

    fallback: 'Yi hakuri, ban gane ba.\nRubuta *menu* don ganin abin da zan iya yi.',
    trackPrompt: '🩸 Yaushe ne lokacin farkon jinin haila na ƙarshe? (e.g. 12/05/2025)',
    langPrompt: 'Rubuta harshen da kake so (misali: English, Hausa…)',
    savedSymptom: 'An ajiye ✔︎ — aika wani ko rubuta *done*.',
    askReminder: '✅ An ajiye! Ana sa ran haila na gaba ne kusa da *{0}*.\nKana son aiko maka da tunatarwa? (ee / a\'a)',
    reminderYes: '🔔 Tunatarwa ta samu! Zan aiko maka saƙo \'yan kwanakin kafin.',
    reminderNo: '👍 Babu damuwa - tambayi ni a kowane lokaci.',
    invalidDate: '🙈 Da fatan za a rubuta kwanan wata kamar *12/05/2025*',
    notValidDate: '🤔 Wannan bai yi kama da kwanan wata mai kyau ba.',
    symptomsDone: '✅ An ajiye alama {0}{1}. Da fatan kawo maki sauki ❤️',
    symptomsCancel: '🚫 An soke.',
    symptomsNothingSaved: 'To, ba a adana komai ba.',
    symptomPrompt: 'Yaya jikin ki? Aika alama guda ɗaya a kowane lokaci.\nIn an gama, rubuta *done* (ko *cancel*).',
    eduTopics: `Wane batun?

1️⃣  Cutar STIs  
2️⃣  Hanyoyin Dakile Haihuwa  
3️⃣  Yarda  
4️⃣  Tsabta yayin jinin haila  
5️⃣  Karin Magana da Gaskiya`,
    languageSet: '🔤 An saita harshe zuwa *{0}*.',
    noPeriod: 'Ba a yi rijistar kwanan haila ba har yanzu.',
    cycleInfo: `📅 *Bayanin zagayen haila:*  
• Haila na ƙarshe: *{0}*  
• Ana hasashen na gaba: *{1}*`,
    noSymptoms: 'Ba a rubuta alamun rashin lafiya ba har yanzu.',
    symptomsHistory: '*Tarihin alamun rashin lafiyarki (na ƙarshe 5):*\n{0}',
    feedbackQ1: 'Shin kun samu damar samun sanitary pads a wannan watan?\n1. Ee   2. A\'a',
    feedbackQ2: 'Na gode. Wane irin kalubale kuka fuskanta? (ko rubuta "skip")',
    feedbackThanks: '❤️  An lura da ra\'ayin ku - na gode!',
    orderQuantityPrompt: 'Kwunnan *Venille Pads* nawa kuke son siyan?',
    orderQuantityInvalid: 'Da fatan a shigar da *lambar* tsakanin 1 da 99, misali 3',
    orderConfirmation: `✅ An aika odar ku ta *kwunan {0}{1}*.

Danna wannan hanyar don tattaunawa kai tsaye da ma\'aikatan sayarwarmu don tabbatar da isar:
{2}

Mun gode da zaɓen Venille!`,
    orderVendorMessage: `🆕 *Odar Venille Pads*

Daga : {0}
JID  : {1}
Adadi: {2} kwunan{3}

(Da fatan a tuntuɓi masoyi don shirya isar da shi.)`
  }
  // Add more languages here as needed
};

// Helper function for string formatting (like String.format in C#)
function format(str, ...args) {
  return str.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
}

const fmt  = d=>d.toLocaleDateString('en-GB');
const addD = (d,n)=>{const c=new Date(d);c.setDate(c.getDate()+n);return c;};
const norm = s=>(s||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');

function st(id){ return (mem[id] ??= { step:null,data:{} }); }

/* Get user language or default to English */
function getUserLang(id) {
  const user = getUser.get(id);
  return user?.language || 'English';
}

/* Get string based on user's language preference */
function getString(id, key, ...args) {
  const lang = getUserLang(id);
  const strings = STRINGS[lang] || STRINGS.English; // Fallback to English if language not found
  const str = strings[key] || STRINGS.English[key]; // Fallback to English string if key not found
  return format(str, ...args);
}

/* safe (never-quote) sender */
async function safeSend(id, text){
  try     { await client.sendMessage(id, text); }
  catch(e){ console.warn('[send fail]', e.message); }
}

/* ═══════ 3. Static texts ═══════ */
const EDU = {
  stis: `
*Sexually Transmitted Infections (STIs)*

• _What are they?_  
  Infections passed from one person to another through sexual-contact (vaginal, anal, oral).

• _Common examples_  
  Chlamydia, gonorrhoea, HPV, HIV, syphilis, herpes.

• _Symptoms_  
  Many STIs have **no symptoms** at first. Others can cause unusual discharge, pain when urinating, lower-abdominal pain, sores, or itching.

• _Why they matter_  
  Untreated STIs can lead to infertility, chronic pain, pregnancy complications, and increased HIV risk.

• _Prevention tips_  
  — Use condoms correctly every time.  
  — Limit the number of sexual partners / practise mutual monogamy.  
  — Get vaccinated (HPV, Hep B).  
  — Have regular screening (every 3–12 months depending on risk).  

• _When to get tested?_  
  After unprotected sex, new partner(s), or if you notice any unusual symptoms.

_Reply **back** to return to the menu._`.trim(),

  contraceptives: `
*Contraceptives (Birth-control options)*

1. **Barrier methods** – condoms (male & female), diaphragms.  
   • Protect against pregnancy **and** most STIs (condoms).  

2. **Hormonal methods**  
   • Daily pill, weekly patch, monthly ring.  
   • Long-acting: 3-month injection, implant (3-5 yrs), hormonal IUD (3-8 yrs).  

3. **Non-hormonal long-acting**  
   • Copper IUD – up to 10 yrs, can be used as emergency contraception within 5 days of unprotected sex.  

4. **Permanent** – tubal ligation or vasectomy (surgical, highly effective).  

*Choosing the right method* depends on personal preference, side-effects, menstrual profile, convenience, cost, medical conditions and whether STI protection is needed. Always discuss with a qualified healthcare provider.

_Emergency contraception:_  
• Pills (up to 72–120 h; the sooner the better).  
• Copper IUD (within 5 days – most effective).`.trim(),

  consent: `
*Consent*

• Consent is an *active, enthusiastic, and freely-given* "yes" to sexual activity.  
• It can be withdrawn **at any time**; "No" means stop immediately.  
• Silence ≠ consent; intoxication, fear, or pressure invalidate consent.  
• Ask, listen, respect. Healthy relationships are built on mutual respect and clear communication.`.trim(),

  hygieneduringmenstruation: `
*Menstrual hygiene*

• Change pads/tampons every 4–6 h (or sooner if soaked) to prevent odour and infections.  
• Wash reusable pads/cups with clean water and mild soap; dry them fully in sunlight if possible.  
• Wash the vulva daily with clean water (no harsh soaps/douching).  
• Carry spare supplies and a zip-lock bag for used items when outside.  
• Dispose of pads properly – wrap in paper, place in a bin (never flush).`.trim(),

  mythsandfacts: `
*Common myths & facts*

• **Myth:** You can't get pregnant during your period.  
  **Fact:** Unlikely, but still possible – sperm can survive up to 5 days.

• **Myth:** Irregular cycles mean infertility.  
  **Fact:** Many factors cause irregularity; most people with irregular cycles can still become pregnant.

• **Myth:** Tampons break the hymen or affect virginity.  
  **Fact:** Virginity is a social concept; using tampons does not "take" it.

• **Myth:** Only promiscuous people get STIs.  
  **Fact:** Anyone who is sexually active can contract an STI. Protection + testing is key.`.trim()
};

const pick=(t,w,n)=>t===w||t===String(n)||t===`${n}.`||t===`${n})`;

/* ═══════ 4. WhatsApp events ═══════ */
client.on('qr', qr=>qrcode.generate(qr,{small:true}));
client.on('ready', ()=>console.log('The greatest developer got the Bot ready ✅'));
process.on('unhandledRejection',e=>console.error('[unhandled]',e));

client.on('message', async m => {
  /* ───  bookkeeping  ─────────────────────────── */
  const id   = m.from;
  const name = m._data?.notifyName || m._data?.pushName || '';
  const now  = new Date().toISOString();

  if (!getUser.get(id)) insertUser.run(id, name, now, now);
  else                  updateSeen.run(now, name, id);

  const raw       = (m.body || '').trim();
  const rawLower  = raw.toLowerCase();
  const txt       = norm(raw);
  const s         = st(id);

  /* ───  greetings / reset  ────────────────────── */
  const greetRE = /^(hi|hello|hey|yo|hi[, ]*venille|hello[, ]*venille|hey[, ]*venille|good\s*(morning|afternoon|evening))\b/;
  if (greetRE.test(rawLower) || txt === 'menu' || txt === 'back') {
    s.step = null;
    s.data = {};
    return safeSend(id, getString(id, 'menu'));
  }

  /* ══════════ ACTIVE-STEP HANDLERS ══════════ */

  /* period tracker ---------------------------------------------------- */
  if (s.step === 'askDate') {
    const mDate = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (!mDate) return safeSend(id, getString(id, 'invalidDate'));
    const last = new Date(+mDate[3], mDate[2] - 1, +mDate[1]);
    if (isNaN(last)) return safeSend(id, getString(id, 'notValidDate'));
    const next = addD(last, CYCLE);
    setPeriod.run(last.toISOString(), next.toISOString(), id);
    s.step = 'askRem';
    return safeSend(id, getString(id, 'askReminder', fmt(next)));
  }
  if (s.step === 'askRem') {
    const wants = txt.startsWith('y') || txt.startsWith('e');
    db.prepare('UPDATE users SET wants_reminder=? WHERE jid=?').run(wants ? 1 : 0, id);
    s.step = null;
    return safeSend(id, wants ? getString(id, 'reminderYes') : getString(id, 'reminderNo'));
  }
  

  /* symptom loop ------------------------------------------------------ */
  if (s.step === 'symLoop') {
    if (txt === 'done')   {
      const n = s.data.count || 0;
      s.step = null;
      return safeSend(id, n ? getString(id, 'symptomsDone', n, n > 1 ? 's' : '') 
                            : getString(id, 'symptomsNothingSaved'));
    }
    if (txt === 'cancel') {
      s.step = null;
      return safeSend(id, getString(id, 'symptomsCancel'));
    }
    addSymptom.run(id, raw, now);
    s.data.count = (s.data.count || 0) + 1;
    return safeSend(id, getString(id, 'savedSymptom'));
  }

  /* education --------------------------------------------------------- */
  if (s.step === 'edu') {
    const key = ({'1':'stis','2':'contraceptives','3':'consent',
                  '4':'hygieneduringmenstruation','5':'mythsandfacts'})[txt] || txt;
    s.step = null;
    return safeSend(id, '📖 ' + (EDU[key] || 'Here is some information on that topic.'));
  }

  /* language ---------------------------------------------------------- */
  if (s.step === 'lang') {
    // Check if the language exists in our strings
    const newLang = Object.keys(STRINGS).find(l => 
      l.toLowerCase() === raw.toLowerCase() || 
      l.toLowerCase().includes(raw.toLowerCase())
    ) || raw;
    
    setLang.run(newLang, id);
    s.step = null;
    return safeSend(id, getString(id, 'languageSet', newLang));
  }

  /* feedback ---------------------------------------------------------- */
  if (s.step === 'fb1' && ['1','2'].includes(txt)) {
    s.data.response1 = txt;
    s.step = 'fb2';
    return safeSend(id, getString(id, 'feedbackQ2'));
  }
  
  if (s.step === 'fb2') {
    const response2 = raw.trim();
    const submitted_at = new Date().toISOString();
    addFeedback.run(id, s.data.response1, response2, submitted_at);
    s.step = null;
    return safeSend(id, getString(id, 'feedbackThanks'));
  }
  

  /* ─── ORDER FLOW  (any location) ─────────────────────────────────── */

  /* 1️⃣  entry point from main menu */
  if (s.step === null && pick(txt, 'ordervenillepads', 4)) {
    s.step = 'order_qty';
    return safeSend(id, getString(id, 'orderQuantityPrompt'));
  }

  /* 2️⃣  capture quantity and forward */
  if (s.step === 'order_qty') {
    const qty = parseInt(txt, 10);
    if (!qty || qty < 1 || qty > 99)
      return safeSend(id, getString(id, 'orderQuantityInvalid'));

    const vendorMsg = getString(id, 'orderVendorMessage', name || id, id, qty, qty > 1 ? 's' : '');
    await safeSend(ORDER_VENDOR, vendorMsg);

    s.step = null;
    return safeSend(id, getString(id, 'orderConfirmation', qty, qty > 1 ? 's' : '', ORDER_LINK));
  }

  /* ══════════ MENU PICKS (idle) ══════════ */

  if (s.step === null && pick(txt, 'trackmyperiod', 1)) {
    s.step = 'askDate';
    return safeSend(id, getString(id, 'trackPrompt'));
  }

  if (s.step === null && pick(txt, 'logsymptoms', 2)) {
    s.step = 'symLoop';
    s.data.count = 0;
    return safeSend(id, getString(id, 'symptomPrompt'));
  }

  if (s.step === null && pick(txt, 'learnaboutsexualhealth', 3)) {
    s.step = 'edu';
    return safeSend(id, getString(id, 'eduTopics'));
  }

  /* view cycle -------------------------------------------------------- */
  if (s.step === null && pick(txt, 'viewmycycle', 5)) {
    const u = getUser.get(id);
    if (!u?.last_period) return safeSend(id, getString(id, 'noPeriod'));
    return safeSend(id, getString(id, 'cycleInfo', 
      fmt(new Date(u.last_period)), 
      fmt(new Date(u.next_period))
    ));
  }

  /* view symptoms ----------------------------------------------------- */
  if (s.step === null && pick(txt, 'viewmysymptoms', 6)) {
    const rows = getSymptoms.all(id);
    if (!rows.length) return safeSend(id, getString(id, 'noSymptoms'));
    
    const symptomsText = rows.slice(0,5)
      .map(r => `• ${r.symptom}  _(${fmt(new Date(r.logged_at))})_`)
      .join('\n');
    
    return safeSend(id, getString(id, 'symptomsHistory', symptomsText));
  }

  /* change language --------------------------------------------------- */
  if (s.step === null && pick(txt, 'changelanguage', 7)) {
    s.step = 'lang';
    return safeSend(id, getString(id, 'langPrompt'));
  }

  /* feedback ---------------------------------------------------------- */
  if (s.step === null && pick(txt, 'givefeedback', 8)) {
    s.step = 'fb1';
    return safeSend(id, getString(id, 'feedbackQ1'));
  }

  /* fallback ---------------------------------------------------------- */
  safeSend(id, getString(id, 'fallback'));
});

/* ═══════ 5. start ═══════ */
client.initialize();
cron.schedule('0 9 * * *', () => {
  const today = new Date();
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);

  const users = db.prepare(`
    SELECT jid, next_period, language FROM users
    WHERE wants_reminder = 1 AND next_period IS NOT NULL
  `).all();

  for (const u of users) {
    const next = new Date(u.next_period);
    const diff = Math.floor((next - today) / (1000 * 60 * 60 * 24));
    if (diff === 3) {
      const lang = u.language || 'English';
      const strings = STRINGS[lang] || STRINGS.English;
      const message = format(strings.reminderYes || STRINGS.English.reminderYes, fmt(next));
      safeSend(u.jid, '🩸 ' + message);
    }
  }

  console.log('[Reminder task] Daily check complete.');
});
