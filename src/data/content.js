// ---------------------------------------------------------------------------
// VaultEdge Academy: static editorial content (glossary, calendar, quizzes, marketing copy).
// Courses, lessons, instruments, sessions, plans and all user data come from the database via /api.
// ---------------------------------------------------------------------------

export const CATEGORIES = ['Forex', 'Gold', 'Indices', 'Crypto', 'Risk Management', 'Psychology']
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

// Deterministic pseudo-random generator so generated artwork is stable between reloads
export function seeded(seedStr) {
  let h = 2166136261
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Instructor & mentor profiles, looked up by the name stored in the database
// ---------------------------------------------------------------------------
const profiles = [
  { name: 'Ava Lindqvist', role: 'Head of FX Education', hue: ['#10b981', '#0ea5e9'], years: 14, bio: 'Former institutional FX dealer in Stockholm and London. Ava has spent 14 years on trading desks and now designs VaultEdge’s forex curriculum with a focus on process, not predictions.' },
  { name: 'Marcus Reed', role: 'Senior Technical Analyst', hue: ['#f2c14e', '#f97316'], years: 11, bio: 'Chartered Market Technician (CMT) known for turning messy charts into simple, testable rules.' },
  { name: 'Priya Kapoor', role: 'Risk & Portfolio Strategist', hue: ['#a78bfa', '#10b981'], years: 12, bio: 'Priya built risk frameworks for a multi-asset fund before joining VaultEdge. Her lessons focus on sizing, drawdown control and surviving long enough to get good.' },
  { name: 'Daniel Okafor', role: 'Global Macro Educator', hue: ['#38bdf8', '#6366f1'], years: 16, bio: 'Ex-economist turned macro trader. Daniel connects central-bank policy, data releases and cross-asset flows into clear, practical frameworks.' },
  { name: 'Sofia Marín', role: 'Performance Coach', hue: ['#f472b6', '#f2c14e'], years: 9, bio: 'Sport psychologist who has coached professional traders for nearly a decade. Sofia helps students build routines that hold up under pressure.' },
  { name: 'Nadia Rahman', role: 'Student Success Mentor', hue: ['#14b8a6', '#f2c14e'], years: 7, bio: 'Nadia helps new students find their feet: first trades, first plans and first certificates.' },
]

export const initialsOf = (name = '') => name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export function person(name = '') {
  const p = profiles.find((x) => x.name === name)
  if (p) return { ...p, initials: initialsOf(p.name) }
  return { name, role: 'VaultEdge mentor', hue: ['#10b981', '#f2c14e'], years: null, bio: '', initials: initialsOf(name) }
}

export const instructorList = profiles.map((p) => person(p.name))

// ---------------------------------------------------------------------------
// Quiz bank (self-check quizzes at the end of every module)
// ---------------------------------------------------------------------------
const q = (question, options, answer, explain) => ({ question, options, answer, explain })

const quizBank = {
  Forex: [
    q('In EUR/USD, which currency is the base currency?', ['USD', 'EUR', 'Both', 'Neither'], 1, 'The first currency in a pair is the base; the price shows how much of the quote currency buys one unit of the base.'),
    q('For most pairs, a pip is a move in which decimal place?', ['1st', '2nd', '4th', '6th'], 2, 'For most pairs a pip is 0.0001. Yen pairs are the exception, where it is 0.01.'),
    q('A standard lot in forex equals how many units of the base currency?', ['1,000', '10,000', '100,000', '1,000,000'], 2, 'Standard = 100,000; mini = 10,000; micro = 1,000.'),
    q('Which session overlap usually brings the most liquidity?', ['Sydney–Tokyo', 'London–New York', 'Tokyo–London', 'None'], 1, 'The London–New York overlap usually has the highest volume and the tightest spreads.'),
    q('A higher high followed by a higher low suggests…', ['Downtrend', 'Uptrend', 'Range', 'Reversal confirmed'], 1, 'Higher highs and higher lows define an uptrend.'),
    q('Former resistance that is broken often becomes…', ['Irrelevant', 'Support', 'A gap', 'A trendline'], 1, 'This is the classic “break and retest” role reversal.'),
  ],
  Gold: [
    q('Gold often weakens when…', ['Real yields rise', 'Inflation rises', 'Risk aversion rises', 'The dollar falls'], 0, 'Higher real yields raise the opportunity cost of holding a non-yielding asset.'),
    q('Because gold is priced in dollars, a stronger dollar usually…', ['Lifts gold', 'Weighs on gold', 'Has no effect', 'Closes the market'], 1, 'A stronger dollar makes gold more expensive for other currencies, often pressuring the price.'),
    q('Which session usually brings the biggest gold moves?', ['Asian', 'London and New York', 'Weekend', 'None'], 1, 'Volatility jumps at the London open and again when New York joins.'),
    q('Higher volatility should lead you to…', ['Increase size', 'Reduce size for the same risk', 'Remove stops', 'Ignore it'], 1, 'Wider stops need smaller positions to keep risk constant.'),
  ],
  Indices: [
    q('The Nasdaq 100 is weighted mainly by…', ['Share price', 'Market capitalisation', 'Revenue', 'Equal weight'], 1, 'Larger companies by market value have a bigger influence.'),
    q('The Dow (US30) is…', ['Market-cap weighted', 'Price weighted', 'Equal weighted', 'Volume weighted'], 1, 'In a price-weighted index, high-priced stocks move it most.'),
    q('The opening range is…', ['The day’s full range', 'The first 15–30 minutes’ high and low', 'Yesterday’s close', 'A news event'], 1, 'A clean break of the opening range often hints at the day’s direction.'),
    q('Earnings from mega-cap tech mostly affect…', ['US30 only', 'NAS100', 'Gold', 'EUR/USD'], 1, 'A handful of tech giants drive much of the Nasdaq 100.'),
  ],
  Crypto: [
    q('Crypto markets typically trade…', ['Mon–Fri only', '24/7', 'London hours', 'Only during US hours'], 1, 'Most crypto venues never close, so risk never sleeps.'),
    q('Persistently high positive funding rates suggest…', ['Crowded longs', 'Crowded shorts', 'Low volume', 'A halving'], 0, 'Longs paying shorts heavily often signals crowded, leveraged long positioning.'),
    q('Slippage is most likely when…', ['Liquidity is deep', 'Liquidity is thin', 'Spreads are tight', 'Markets are closed'], 1, 'Thin order books mean larger orders move the price.'),
    q('The safest way to protect holdings is usually…', ['Sharing your seed phrase', 'Strong passwords and 2FA', 'Public Wi-Fi', 'One password everywhere'], 1, 'Most crypto losses come from security mistakes.'),
  ],
  'Risk Management': [
    q('Under the 1% rule on a $10,000 account, the maximum risk per trade is…', ['$10', '$100', '$1,000', '$1'], 1, '1% of $10,000 = $100.'),
    q('After a 50% drawdown, what gain do you need to recover?', ['50%', '75%', '100%', '25%'], 2, 'Losing half means you must double what is left to get back to break-even.'),
    q('Position size should be calculated from…', ['Your gut feeling', 'Account risk and stop distance', 'Last trade’s result', 'Leverage available'], 1, 'Size = risk amount ÷ (stop distance × pip value).'),
    q('A 1:3 risk-to-reward means…', ['Risk $3 to make $1', 'Risk $1 to make $3', 'Win 3 of 4 trades', 'Use 3× leverage'], 1, 'You aim to make three times what you risk.'),
  ],
  Psychology: [
    q('Revenge trading is…', ['A hedging strategy', 'Trading impulsively to win back losses', 'A news strategy', 'Copy trading'], 1, 'It is emotional, unplanned trading after a loss, and usually makes things worse.'),
    q('The main purpose of a trading journal is to…', ['Impress others', 'Find patterns in your behaviour and results', 'Track news', 'Replace a plan'], 1, 'Journals reveal habits that numbers alone hide.'),
    q('FOMO most often leads to…', ['Patient entries', 'Chasing late entries', 'Smaller positions', 'Better R:R'], 1, 'Fear of missing out pushes traders into late, poorly planned entries.'),
    q('A good outcome on a bad process is…', ['Proof you are right', 'Luck that can reinforce bad habits', 'Always fine', 'A strategy'], 1, 'Judge decisions by process, not just outcome.'),
  ],
}

export function moduleQuiz(category, moduleIndex) {
  const bank = [...(quizBank[category] || []), ...quizBank['Risk Management']]
  return [0, 1, 2].map((i) => bank[(moduleIndex * 3 + i) % bank.length])
}

const takeaways = [
  'Define the rule before you look for the trade.',
  'Every position starts with a stop-loss and a planned size.',
  'Context beats signals: always ask where price is in the bigger picture.',
  'Write the idea in your journal in one sentence.',
  'Practise it at least three times in the simulator before moving on.',
  'If you cannot explain it simply, rewatch the worked example.',
]

export function lessonTakeaways(lessonId) {
  const rnd = seeded(`lesson-${lessonId}`)
  return [...takeaways].sort(() => rnd() - 0.5).slice(0, 3)
}

/** Flatten a course (from /api/courses/:slug) into lessons + a quiz per module. */
export function playlist(course) {
  const items = []
  course.modules.forEach((m, mi) => {
    m.lessons.forEach((l, li) => items.push({ type: 'lesson', id: String(l.id), moduleIndex: mi, lessonIndex: li, lesson: l }))
    items.push({ type: 'quiz', id: `quiz-${mi}`, moduleIndex: mi })
  })
  return items
}

export const fmtMinutes = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

// ---------------------------------------------------------------------------
// Economic calendar (dates relative to the current week)
// ---------------------------------------------------------------------------
function weekDay(offset) {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1 + offset)
  d.setHours(0, 0, 0, 0)
  return d
}

export const economicEvents = [
  { day: 0, time: '01:30', currency: 'AUD', title: 'RBA Meeting Minutes', impact: 'medium', forecast: '—', previous: '—', actual: '—' },
  { day: 0, time: '09:00', currency: 'EUR', title: 'German ZEW Economic Sentiment', impact: 'medium', forecast: '12.4', previous: '10.3', actual: '13.1' },
  { day: 0, time: '15:00', currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', forecast: '48.9', previous: '48.2', actual: '49.3' },
  { day: 1, time: '07:00', currency: 'GBP', title: 'Claimant Count Change', impact: 'medium', forecast: '20.5K', previous: '23.7K', actual: '—' },
  { day: 1, time: '14:30', currency: 'CAD', title: 'CPI m/m', impact: 'high', forecast: '0.2%', previous: '0.4%', actual: '—' },
  { day: 1, time: '16:00', currency: 'USD', title: 'JOLTS Job Openings', impact: 'medium', forecast: '7.6M', previous: '7.7M', actual: '—' },
  { day: 2, time: '07:00', currency: 'GBP', title: 'CPI y/y', impact: 'high', forecast: '2.1%', previous: '2.2%', actual: '—' },
  { day: 2, time: '16:30', currency: 'USD', title: 'Crude Oil Inventories', impact: 'medium', forecast: '-1.2M', previous: '3.4M', actual: '—' },
  { day: 2, time: '20:00', currency: 'USD', title: 'FOMC Meeting Minutes', impact: 'high', forecast: '—', previous: '—', actual: '—' },
  { day: 3, time: '13:15', currency: 'EUR', title: 'ECB Main Refinancing Rate', impact: 'high', forecast: '3.40%', previous: '3.65%', actual: '—' },
  { day: 3, time: '14:30', currency: 'USD', title: 'Unemployment Claims', impact: 'medium', forecast: '231K', previous: '228K', actual: '—' },
  { day: 3, time: '23:50', currency: 'JPY', title: 'Trade Balance', impact: 'low', forecast: '-0.31T', previous: '-0.62T', actual: '—' },
  { day: 4, time: '09:30', currency: 'GBP', title: 'Retail Sales m/m', impact: 'medium', forecast: '0.4%', previous: '-0.3%', actual: '—' },
  { day: 4, time: '14:30', currency: 'USD', title: 'Non-Farm Payrolls', impact: 'high', forecast: '165K', previous: '142K', actual: '—' },
  { day: 4, time: '16:00', currency: 'USD', title: 'UoM Consumer Sentiment', impact: 'low', forecast: '68.5', previous: '67.9', actual: '—' },
].map((e, i) => ({ ...e, id: `ev${i}`, date: weekDay(e.day) }))

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
export const glossary = [
  { term: 'Pip', group: 'Forex', definition: 'The smallest standard price move in a currency pair, usually 0.0001 (0.01 for yen pairs).' },
  { term: 'Pipette', group: 'Forex', definition: 'A fractional pip, one tenth of a pip, shown as the fifth decimal place on most pairs.' },
  { term: 'Lot', group: 'Forex', definition: 'A standardised trade size. Standard = 100,000 units, mini = 10,000, micro = 1,000.' },
  { term: 'Leverage', group: 'Risk', definition: 'Borrowed exposure that lets you control a large position with a small deposit. It amplifies both gains and losses.' },
  { term: 'Margin', group: 'Risk', definition: 'The deposit required to open and maintain a leveraged position.' },
  { term: 'Margin call', group: 'Risk', definition: 'A warning that your equity has fallen below the required margin level.' },
  { term: 'Spread', group: 'Market basics', definition: 'The difference between the bid (sell) price and the ask (buy) price.' },
  { term: 'Swap', group: 'Costs', definition: 'An overnight financing charge or credit applied to positions held past the daily rollover.' },
  { term: 'Drawdown', group: 'Risk', definition: 'The decline from a peak in account equity to a subsequent low, usually shown as a percentage.' },
  { term: 'Stop-loss', group: 'Risk', definition: 'An order that closes a position at a predefined price to limit losses.' },
  { term: 'Take-profit', group: 'Orders', definition: 'An order that closes a position once a predefined profit level is reached.' },
  { term: 'Slippage', group: 'Market basics', definition: 'Execution at a different price than requested, common in fast or thin markets.' },
  { term: 'Liquidity', group: 'Market basics', definition: 'How easily an asset can be bought or sold without moving its price significantly.' },
  { term: 'Volatility', group: 'Market basics', definition: 'The degree of price variation over time. Higher volatility means larger swings.' },
  { term: 'Bid / Ask', group: 'Market basics', definition: 'Bid is the price you can sell at; ask is the price you can buy at.' },
  { term: 'Long / Short', group: 'Orders', definition: 'Long profits from rising prices; short profits from falling prices.' },
  { term: 'CFD', group: 'Instruments', definition: 'Contract for Difference: a derivative that tracks an asset’s price without ownership.' },
  { term: 'Risk-to-reward', group: 'Risk', definition: 'The ratio between the amount risked on a trade and the potential profit.' },
  { term: 'Support', group: 'Technical', definition: 'A price area where buying interest has historically stopped declines.' },
  { term: 'Resistance', group: 'Technical', definition: 'A price area where selling interest has historically capped advances.' },
  { term: 'Candlestick', group: 'Technical', definition: 'A chart bar showing the open, high, low and close for a given period.' },
  { term: 'Equity', group: 'Account', definition: 'Account balance plus or minus the floating profit and loss of open positions.' },
  { term: 'Hedging', group: 'Risk', definition: 'Opening offsetting positions to reduce exposure to adverse price moves.' },
  { term: 'Carry trade', group: 'Forex', definition: 'Buying a higher-yielding currency against a lower-yielding one to earn the rate differential.' },
]

// ---------------------------------------------------------------------------
// Past recordings (illustrative library)
// ---------------------------------------------------------------------------
export const recordings = [
  { id: 'rec1', title: 'How the FOMC moved every asset class', host: 'Daniel Okafor', length: '58:12', ago: '3 days ago', hue: ['#38bdf8', '#6366f1'] },
  { id: 'rec2', title: 'Gold at record highs: levels that matter', host: 'Marcus Reed', length: '46:30', ago: '5 days ago', hue: ['#f2c14e', '#ea580c'] },
  { id: 'rec3', title: 'Position sizing clinic: your questions answered', host: 'Priya Kapoor', length: '41:05', ago: '1 week ago', hue: ['#a78bfa', '#10b981'] },
  { id: 'rec4', title: 'London open: trading the first hour', host: 'Ava Lindqvist', length: '32:47', ago: '1 week ago', hue: ['#10b981', '#0ea5e9'] },
  { id: 'rec5', title: 'Breaking a losing streak without breaking yourself', host: 'Sofia Marín', length: '44:20', ago: '2 weeks ago', hue: ['#f472b6', '#f2c14e'] },
  { id: 'rec6', title: 'Bitcoin volatility and weekend risk', host: 'Marcus Reed', length: '38:55', ago: '2 weeks ago', hue: ['#f97316', '#f2c14e'] },
].map((r) => ({ ...r, hostData: person(r.host) }))

// ---------------------------------------------------------------------------
// Marketing content
// ---------------------------------------------------------------------------
export const testimonials = [
  { name: 'Chloe Martins', role: 'Pro member · Lisbon', initials: 'CM', text: 'VaultEdge finally made risk management click for me. The simulator let me make every beginner mistake without losing a cent of real money.', rating: 5 },
  { name: 'Kwame Asante', role: 'Elite member · Accra', initials: 'KA', text: 'The live sessions are incredible. Marcus explains price action in a way that feels obvious afterwards.', rating: 5 },
  { name: 'Elena Novak', role: 'Pro member · Prague', initials: 'EN', text: 'Structured, beautifully designed and brutally honest about risk. It is the opposite of every “get rich quick” course out there.', rating: 5 },
  { name: 'Ryo Tanaka', role: 'Free member · Osaka', initials: 'RT', text: 'I completed Forex Foundations for free and earned my first certificate in two weeks. The quizzes kept me accountable.', rating: 5 },
  { name: 'Amara Diallo', role: 'Elite member · Paris', initials: 'AD', text: 'The progress tracking and streaks are addictive in the best way.', rating: 5 },
]

export const partners = ['MarketWire', 'FinScope', 'The Ledger', 'TradeDaily', 'Capital Pulse', 'Bullion Times', 'Quant Weekly']

export const insights = [
  { tag: 'Risk', text: 'Decide how much you are willing to lose before you think about how much you could win.' },
  { tag: 'Discipline', text: 'A missed trade costs you nothing. A forced trade can cost you a week of progress.' },
  { tag: 'Sizing', text: 'Keep risk per trade at 1–2% of your account. Survival is the first edge.' },
  { tag: 'Process', text: 'Judge your trades by whether you followed your plan, not by whether they made money.' },
  { tag: 'Psychology', text: 'After two losses in a row, step away for 30 minutes. Revenge trading is never a strategy.' },
  { tag: 'Leverage', text: 'Leverage magnifies mistakes faster than it magnifies skill. Use less than you are offered.' },
  { tag: 'Journaling', text: 'Write one sentence about why you entered every trade. Patterns will appear within weeks.' },
  { tag: 'News', text: 'Spreads widen around high-impact news. Check the calendar before you place a trade.' },
  { tag: 'Stops', text: 'Never move your stop-loss further away. Move it closer, or leave it alone.' },
  { tag: 'Patience', text: 'The market will be open tomorrow. Your capital needs to be there too.' },
]

export const badgeDefs = [
  { id: 'first-lesson', title: 'First Lesson', desc: 'Complete your first lesson', icon: 'BookOpen', hue: ['#10b981', '#34d399'] },
  { id: 'streak-7', title: '7-Day Streak', desc: 'Learn 7 days in a row', icon: 'Flame', hue: ['#f97316', '#f2c14e'] },
  { id: 'quiz-master', title: 'Quiz Master', desc: 'Score 100% on a module quiz', icon: 'Trophy', hue: ['#f2c14e', '#ffe08a'] },
  { id: 'risk-manager', title: 'Risk Manager', desc: 'Place a practice trade with a stop-loss', icon: 'Shield', hue: ['#a78bfa', '#10b981'] },
  { id: 'first-trade', title: 'First Practice Trade', desc: 'Open your first practice trade', icon: 'CandlestickChart', hue: ['#0ea5e9', '#10b981'] },
  { id: 'graduate', title: 'Graduate', desc: 'Complete a full course', icon: 'GraduationCap', hue: ['#10b981', '#f2c14e'] },
]

// Copy that sits alongside the plans loaded from the database
export const planCopy = {
  Free: { tagline: 'Start learning the essentials', cta: 'Start free' },
  Pro: { tagline: 'For serious, consistent learners', cta: 'Go Pro' },
  Elite: { tagline: 'Mentorship and the full toolkit', cta: 'Go Elite' },
}

export const planComparison = [
  { feature: 'Free foundation courses', values: [true, true, true] },
  { feature: 'Full course library', values: [false, true, true] },
  { feature: 'Trading simulator', values: ['Basic', 'Advanced', 'Advanced'] },
  { feature: 'Live sessions per week', values: ['1 / month', '5', '5 + Elite'] },
  { feature: 'Recording library', values: [false, true, true] },
  { feature: 'Certificates', values: [true, true, true] },
  { feature: '1:1 mentor reviews', values: [false, false, 'Monthly'] },
  { feature: 'Priority support', values: [false, false, true] },
]
