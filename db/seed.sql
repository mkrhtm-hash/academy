-- VaultEdge Academy sample data. Safe to run repeatedly: every insert is an upsert on a natural key.

-- ---------------------------------------------------------------------------
-- Plans (match the Pricing page). "Choosing" a plan is a demo switch only, no payments.
-- ---------------------------------------------------------------------------
INSERT INTO plans (name, price_monthly, features, is_popular) VALUES
  ('Free', 0, '["2 foundation courses", "Trading simulator (basic)", "Economic calendar & glossary", "Community Q&A (monthly)"]', FALSE),
  ('Pro', 29, '["All 8 courses", "Advanced simulator & analytics", "All weekly live sessions", "Certificates of completion", "Full recording library"]', TRUE),
  ('Elite', 79, '["Everything in Pro", "Monthly 1:1 mentor review", "Private Elite sessions", "Trade journal reviews", "Priority support"]', FALSE)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly, features = EXCLUDED.features, is_popular = EXCLUDED.is_popular;

-- ---------------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------------
INSERT INTO courses (slug, title, subtitle, level, category, instructor_name, thumbnail, description, outcomes, is_free) VALUES
  ('forex-foundations', 'Forex Foundations', 'From your first pip to your first trading plan', 'Beginner', 'Forex', 'Ava Lindqvist', '#10b981,#0ea5e9',
   'A clear, structured introduction to the world''s largest market. Learn how currency pairs are quoted, what moves them, how leverage really works and how to build a simple, rules-based plan before you ever risk real money.',
   '["Read and quote currency pairs confidently", "Calculate pips, lots and position value", "Understand leverage, margin and why they cut both ways", "Identify the major trading sessions", "Build a one-page trading plan", "Practise safely in the simulator"]', TRUE),
  ('risk-management-essentials', 'Risk Management Essentials', 'Protect your capital first, always', 'Beginner', 'Risk Management', 'Priya Kapoor', '#a78bfa,#10b981',
   'The most important course on VaultEdge. Learn position sizing, the 1% rule, risk-to-reward, drawdown maths and how professionals think about survival before profit.',
   '["Size every position from your stop loss", "Apply the 1-2% risk rule", "Calculate risk-to-reward", "Understand drawdown recovery maths", "Build a personal risk policy"]', TRUE),
  ('price-action-mastery', 'Price Action Mastery', 'Read the chart, not the noise', 'Intermediate', 'Forex', 'Marcus Reed', '#10b981,#f2c14e',
   'Master support and resistance, trend structure, candlestick patterns and multi-timeframe analysis. Every concept comes with clear, testable rules you can practise in the simulator.',
   '["Map support and resistance levels", "Identify trend structure and breaks", "Use candlestick patterns in context", "Combine timeframes for confluence", "Write testable entry rules", "Review trades like a professional"]', FALSE),
  ('gold-trading-playbook', 'Gold Trading Playbook', 'Trade XAU/USD with a plan, not a hunch', 'Intermediate', 'Gold', 'Daniel Okafor', '#f2c14e,#ea580c',
   'Gold reacts to real yields, the US dollar and fear. Learn what drives XAU/USD, how it behaves in each session, and how to size trades for its wider daily ranges.',
   '["Explain gold''s link with real yields and the dollar", "Recognise safe-haven flows", "Trade the London and New York sessions", "Size positions for higher volatility", "Build a repeatable gold playbook"]', FALSE),
  ('indices-playbook', 'US30 & NAS100 Playbook', 'Trade the world''s most-watched stock indices', 'Intermediate', 'Indices', 'Ava Lindqvist', '#0ea5e9,#a78bfa',
   'Understand how the Dow and the Nasdaq 100 are built, why they gap, and how earnings and data releases move them. Learn opening-range and trend-day tactics with disciplined risk.',
   '["Explain how US30 and NAS100 are weighted", "Handle opening gaps", "Trade the opening range", "Read the economic calendar for index risk", "Manage fast intraday moves"]', FALSE),
  ('crypto-markets-decoded', 'Crypto Markets Decoded', 'Bitcoin, liquidity and 24/7 risk, explained', 'Beginner', 'Crypto', 'Marcus Reed', '#f97316,#f2c14e',
   'Crypto trades around the clock with deep swings. Understand market structure, exchange risk, halving cycles and how to apply disciplined risk management to a volatile asset class.',
   '["Understand crypto market structure", "Evaluate exchange and custody risk", "Read funding and sentiment signals", "Apply volatility-adjusted sizing", "Avoid common crypto pitfalls"]', FALSE),
  ('trading-psychology', 'Trading Psychology', 'Build the mindset that keeps you consistent', 'Intermediate', 'Psychology', 'Sofia Marín', '#f472b6,#f2c14e',
   'Fear, greed, revenge trading and FOMO destroy more accounts than bad strategies. Build routines, checklists and reflection habits that keep you disciplined.',
   '["Recognise emotional trading triggers", "Build a pre-market routine", "Use checklists to reduce impulsive trades", "Recover from losing streaks", "Journal for self-awareness"]', FALSE),
  ('advanced-position-sizing', 'Advanced Position Sizing', 'Portfolio risk, correlation and drawdown control', 'Advanced', 'Risk Management', 'Priya Kapoor', '#14b8a6,#6366f1',
   'For experienced students. Go beyond the 1% rule: volatility-based sizing, correlated exposure, risk of ruin and how to scale up and down with your equity curve.',
   '["Size positions from volatility (ATR)", "Measure correlated exposure", "Estimate risk of ruin", "Set daily and weekly loss limits", "Scale risk with your equity curve"]', FALSE)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, level = EXCLUDED.level, category = EXCLUDED.category,
  instructor_name = EXCLUDED.instructor_name, thumbnail = EXCLUDED.thumbnail, description = EXCLUDED.description,
  outcomes = EXCLUDED.outcomes, is_free = EXCLUDED.is_free;

-- ---------------------------------------------------------------------------
-- Modules  (course slug, order, title)
-- ---------------------------------------------------------------------------
INSERT INTO modules (course_id, order_index, title)
SELECT c.id, v.ord, v.title
FROM (VALUES
  ('forex-foundations', 1, 'How the FX market works'),
  ('forex-foundations', 2, 'Pips, lots and leverage'),
  ('forex-foundations', 3, 'Sessions and price behaviour'),
  ('forex-foundations', 4, 'Your first trading plan'),
  ('risk-management-essentials', 1, 'Why risk comes first'),
  ('risk-management-essentials', 2, 'Position sizing'),
  ('risk-management-essentials', 3, 'Your risk policy'),
  ('price-action-mastery', 1, 'Market structure'),
  ('price-action-mastery', 2, 'Candlesticks in context'),
  ('price-action-mastery', 3, 'Chart patterns'),
  ('price-action-mastery', 4, 'Putting it together'),
  ('gold-trading-playbook', 1, 'What moves gold'),
  ('gold-trading-playbook', 2, 'Gold through the trading day'),
  ('gold-trading-playbook', 3, 'Building your gold playbook'),
  ('indices-playbook', 1, 'How indices work'),
  ('indices-playbook', 2, 'The opening hour'),
  ('indices-playbook', 3, 'Event risk and trend days'),
  ('crypto-markets-decoded', 1, 'Market structure'),
  ('crypto-markets-decoded', 2, 'Reading the crypto market'),
  ('crypto-markets-decoded', 3, 'Risk in a 24/7 market'),
  ('trading-psychology', 1, 'Know your mind'),
  ('trading-psychology', 2, 'Routines that work'),
  ('trading-psychology', 3, 'Long-term consistency'),
  ('advanced-position-sizing', 1, 'Volatility-based sizing'),
  ('advanced-position-sizing', 2, 'Portfolio and correlation risk'),
  ('advanced-position-sizing', 3, 'Drawdown control'),
  ('advanced-position-sizing', 4, 'Scaling with your equity curve')
) AS v(slug, ord, title)
JOIN courses c ON c.slug = v.slug
ON CONFLICT (course_id, order_index) DO UPDATE SET title = EXCLUDED.title;

-- ---------------------------------------------------------------------------
-- Lessons  (course slug, module order, lesson order, title, minutes, content)
-- ---------------------------------------------------------------------------
INSERT INTO lessons (module_id, order_index, title, duration_minutes, content)
SELECT m.id, v.ord, v.title, v.mins, v.content
FROM (VALUES
  -- Forex Foundations
  ('forex-foundations', 1, 1, 'What is forex?', 7, 'Forex is the global market for exchanging one currency for another. It runs 24 hours a day, five days a week, and trades more than $7 trillion daily. You always trade one currency against another, so every trade is a view on the relative strength of two economies.'),
  ('forex-foundations', 1, 2, 'Base vs. quote currency', 6, 'In EUR/USD, EUR is the base and USD is the quote. The price tells you how many US dollars one euro buys. Buying the pair means you expect the base currency to strengthen against the quote currency.'),
  ('forex-foundations', 1, 3, 'Bid, ask and the spread', 8, 'The bid is the price you can sell at and the ask is the price you can buy at. The difference is the spread, your cost of entry. Tight spreads on major pairs are one reason beginners start there.'),
  ('forex-foundations', 1, 4, 'Who moves the market', 9, 'Central banks, commercial banks, funds and corporations dominate FX volume. Retail traders are a small slice. Understanding who is on the other side helps you respect liquidity and avoid chasing news spikes.'),
  ('forex-foundations', 2, 1, 'Pips and pipettes', 7, 'A pip is the standard unit of price movement: 0.0001 for most pairs and 0.01 for yen pairs. A pipette is one tenth of a pip. Measuring stops and targets in pips makes them comparable across pairs.'),
  ('forex-foundations', 2, 2, 'Lot sizes explained', 8, 'A standard lot is 100,000 units of the base currency, a mini lot 10,000 and a micro lot 1,000. On EUR/USD one standard lot moves about $10 per pip. Lot size, not leverage, decides how much each pip is worth to you.'),
  ('forex-foundations', 2, 3, 'Leverage and margin', 10, 'Leverage lets you control a large position with a small deposit called margin. At 1:30, a $100,000 position needs about $3,333 of margin. Leverage magnifies both gains and losses, so treat it as a tool, not a target.'),
  ('forex-foundations', 2, 4, 'Margin calls and stop-outs', 7, 'If losses shrink your equity below the required margin, your broker issues a margin call and may close positions automatically. The fix is simple: smaller size, a stop-loss on every trade and never using all your free margin.'),
  ('forex-foundations', 3, 1, 'Sydney, Tokyo, London, New York', 8, 'The FX day passes through four major sessions. London is the busiest, and the London-New York overlap usually brings the tightest spreads and biggest moves. Know which session suits your schedule and your pairs.'),
  ('forex-foundations', 3, 2, 'Volatility through the day', 7, 'Price ranges expand at session opens and around news, then often contract in quieter hours. Matching your strategy to the time of day avoids trading breakouts in a dead market or ranges during a news spike.'),
  ('forex-foundations', 3, 3, 'Reading a basic chart', 9, 'Candlestick charts show the open, high, low and close for each period. Start with one timeframe, mark the obvious highs and lows, and describe what price is doing in one sentence before thinking about a trade.'),
  ('forex-foundations', 4, 1, 'Defining entry rules', 8, 'An entry rule should be specific enough that two people would take the same trade. Write down the setup, the trigger and the conditions that cancel it. Vague rules lead to impulsive trades.'),
  ('forex-foundations', 4, 2, 'Placing stops and targets', 9, 'Place your stop where your trade idea is proven wrong, not at an arbitrary distance. Then set a target that offers at least 1.5 times your risk. Size the position last, from the stop distance.'),
  ('forex-foundations', 4, 3, 'Journaling every trade', 6, 'Record the setup, entry, stop, target, result and how you felt. After 20 trades, patterns appear: the times you trade best, the mistakes you repeat and the setups worth keeping.'),

  -- Risk Management Essentials
  ('risk-management-essentials', 1, 1, 'The maths of losing', 7, 'Losses hurt more than equal gains help. Lose 10% and you need 11% to recover; lose 50% and you need 100%. That asymmetry is why professionals obsess over keeping losses small.'),
  ('risk-management-essentials', 1, 2, 'Drawdown and recovery', 8, 'Drawdown is the fall from your equity peak to the following low. Tracking it tells you when to cut size and take a break. A plan for drawdowns written in advance beats a decision made under stress.'),
  ('risk-management-essentials', 1, 3, 'Survival over profit', 6, 'Your first job as a trader is to still be trading next year. Consistent small risk lets your edge play out over hundreds of trades instead of being cut short by a few bad ones.'),
  ('risk-management-essentials', 2, 1, 'The 1% rule', 7, 'Risk no more than 1% of your account on a single trade. On a $10,000 account that is $100. Ten losses in a row then cost about 10%, which is painful but recoverable.'),
  ('risk-management-essentials', 2, 2, 'Sizing from your stop', 9, 'Position size equals the amount you are willing to risk divided by the value of your stop distance. A wider stop means a smaller position, so your dollar risk stays the same whatever the market.'),
  ('risk-management-essentials', 2, 3, 'Using the risk calculator', 6, 'Enter your account size, risk percentage and stop distance in pips, and the calculator returns the lot size using each instrument''s pip size and contract size. Use it before every practice trade until it becomes habit.'),
  ('risk-management-essentials', 3, 1, 'Risk-to-reward ratios', 8, 'Risk-to-reward compares what you can lose with what you aim to make. At 1:2 you can be right only 40% of the time and still grow the account. Combine it with your win rate to judge a strategy.'),
  ('risk-management-essentials', 3, 2, 'Daily and weekly loss limits', 7, 'Set a maximum loss per day and per week, for example 3% and 6%. When you hit it, you stop. Loss limits protect you from the bad decisions that follow bad days.'),
  ('risk-management-essentials', 3, 3, 'Writing your risk policy', 9, 'A one-page risk policy covers risk per trade, maximum open risk, loss limits and what you do after a losing streak. Print it, sign it and review it monthly.'),

  -- Price Action Mastery
  ('price-action-mastery', 1, 1, 'Trends, ranges and transitions', 9, 'Markets alternate between trending and ranging. Higher highs and higher lows define an uptrend, lower highs and lower lows a downtrend. Identifying the current state comes before choosing a strategy.'),
  ('price-action-mastery', 1, 2, 'Support and resistance', 10, 'Support is where buying has stopped declines before; resistance is where selling has capped rallies. Draw zones, not thin lines, and favour levels that price has respected several times.'),
  ('price-action-mastery', 1, 3, 'Break and retest', 8, 'When price breaks a level and returns to test it from the other side, old resistance can become new support. The retest offers a defined entry with a logical stop just beyond the level.'),
  ('price-action-mastery', 2, 1, 'Anatomy of a candle', 6, 'Each candle shows who won the period. Long wicks show rejection, large bodies show conviction and small bodies show indecision. Read candles relative to the ones around them.'),
  ('price-action-mastery', 2, 2, 'Engulfing and pin bars', 9, 'An engulfing candle completely covers the previous body; a pin bar has a long wick rejecting a price. Both matter far more at key levels than in the middle of nowhere.'),
  ('price-action-mastery', 2, 3, 'Patterns that fail', 7, 'Every pattern fails sometimes, and failed patterns are information too. A bullish engulfing candle that is immediately reversed often leads to a strong move the other way.'),
  ('price-action-mastery', 3, 1, 'Triangles and flags', 8, 'Triangles and flags are pauses within a move. Measure the prior move, wait for a close outside the pattern, and place your stop on the other side of the structure.'),
  ('price-action-mastery', 3, 2, 'Double tops and bottoms', 8, 'A double top forms when price fails twice at the same high. The pattern only completes when the low between the peaks breaks. Trading it early is guessing.'),
  ('price-action-mastery', 3, 3, 'Head and shoulders', 9, 'Head and shoulders shows a trend losing momentum: a high, a higher high, then a lower high. The neckline break is the trigger, and the height of the head gives a rough target.'),
  ('price-action-mastery', 4, 1, 'Multi-timeframe analysis', 10, 'Use a higher timeframe for direction and key levels, and a lower one for timing. Trade in the direction of the higher timeframe unless you have a strong reason not to.'),
  ('price-action-mastery', 4, 2, 'Writing testable rules', 8, 'Turn what you see into rules a computer could follow: which level, which candle, which timeframe, where the stop goes. Testable rules let you measure whether a setup has an edge.'),
  ('price-action-mastery', 4, 3, 'Reviewing your trades', 7, 'Every weekend, screenshot each trade with entry, stop and exit marked. Grade the decision, not the result. Over time the review becomes your best teacher.'),

  -- Gold Trading Playbook
  ('gold-trading-playbook', 1, 1, 'Why gold moves', 8, 'Gold pays no interest, so it competes with yield-bearing assets. It tends to rise when real yields fall, when the dollar weakens or when investors seek safety. Price reflects shifts in all three.'),
  ('gold-trading-playbook', 1, 2, 'Gold vs. the dollar and yields', 9, 'Because gold is priced in dollars, a stronger dollar usually weighs on it. Watch US 10-year real yields: sharp rises often pressure XAU/USD, while falling yields support it.'),
  ('gold-trading-playbook', 1, 3, 'Safe-haven flows', 7, 'During geopolitical stress or market panic, money often flows into gold. These moves can be fast and news-driven, so reduce size and widen stops when headlines dominate.'),
  ('gold-trading-playbook', 1, 4, 'Central bank buying', 6, 'Central banks have been steady buyers of gold, adding long-term demand. This does not give short-term signals, but it explains why dips have often been bought in recent years.'),
  ('gold-trading-playbook', 2, 1, 'The Asian session range', 7, 'Gold often builds a quiet range during Asian hours. Marking its high and low gives you reference levels for the more active London session.'),
  ('gold-trading-playbook', 2, 2, 'London and New York opens', 9, 'Volatility jumps at the London open and again when New York joins. Breakouts of the Asian range are common here, but so are false breaks. Wait for a close beyond the level.'),
  ('gold-trading-playbook', 2, 3, 'US data days', 8, 'Non-farm payrolls, CPI and Fed decisions can move gold $30 or more in minutes. Either stay flat into the release or trade much smaller with a plan for slippage.'),
  ('gold-trading-playbook', 3, 1, 'Sizing for wider ranges', 8, 'Gold''s daily range is several times larger than EUR/USD in percentage terms. Use the risk calculator: a wider stop means a smaller lot size so your dollar risk stays fixed.'),
  ('gold-trading-playbook', 3, 2, 'Trend-following setups', 9, 'In a clear trend, buy pullbacks to prior resistance turned support, with a stop below the swing low. Let winners run to the next major level rather than snatching small profits.'),
  ('gold-trading-playbook', 3, 3, 'Writing your gold playbook', 7, 'Pick one or two setups, define the session you trade, your risk per trade and your news rules. Practise the playbook in the simulator for at least 30 trades before judging it.'),

  -- US30 & NAS100 Playbook
  ('indices-playbook', 1, 1, 'What is an index?', 6, 'An index tracks a basket of shares. US30 follows 30 large US companies and NAS100 the 100 largest non-financial Nasdaq stocks. Trading the index is a view on the whole basket.'),
  ('indices-playbook', 1, 2, 'How US30 and NAS100 are weighted', 8, 'The Dow is price-weighted, so high-priced stocks matter most. The Nasdaq 100 is weighted by market value, so a handful of tech giants drive much of its movement.'),
  ('indices-playbook', 1, 3, 'Points, contracts and margin', 8, 'Index CFDs move in points. Check the value of one point per lot, the margin needed and the trading hours before placing any trade. The simulator shows all three on the order ticket.'),
  ('indices-playbook', 2, 1, 'Pre-market and gaps', 8, 'Indices can open well above or below the previous close. Mark the prior close and pre-market high and low. Gaps often partially fill, but strong news gaps can run all day.'),
  ('indices-playbook', 2, 2, 'The opening range', 9, 'The first 15 to 30 minutes after the cash open set a range. A clean break and hold of that range often signals the day''s direction. Place stops back inside the range.'),
  ('indices-playbook', 2, 3, 'Avoiding the first-minute chaos', 6, 'Spreads widen and price whips in the first minutes after the open. Waiting a few minutes costs little and saves many bad fills.'),
  ('indices-playbook', 3, 1, 'Earnings season', 8, 'When heavyweights like Apple or Microsoft report, NAS100 can gap sharply. Check the earnings calendar and reduce size around major reports.'),
  ('indices-playbook', 3, 2, 'Data releases and the Fed', 8, 'Inflation and jobs data shift rate expectations, which move indices. Fed decision days are often quiet before the announcement and volatile after.'),
  ('indices-playbook', 3, 3, 'Recognising trend days', 9, 'On trend days, price opens near one extreme and closes near the other with shallow pullbacks. Fading a trend day is costly; joining pullbacks with a trailing stop works better.'),
  ('indices-playbook', 3, 4, 'Managing fast moves', 7, 'Indices can move hundreds of points quickly. Use hard stops, avoid adding to losers and take partial profits at planned levels.'),

  -- Crypto Markets Decoded
  ('crypto-markets-decoded', 1, 1, 'How crypto exchanges work', 8, 'Crypto trades on many exchanges at once, each with its own order book. Prices are similar but not identical, and liquidity varies widely between venues and coins.'),
  ('crypto-markets-decoded', 1, 2, 'Spot vs. derivatives', 7, 'Spot means owning the coin. Derivatives such as perpetual futures and CFDs let you trade the price with leverage. Leverage on an already volatile asset needs extra care.'),
  ('crypto-markets-decoded', 1, 3, 'Liquidity and slippage', 7, 'In thin markets, large orders move the price and you get filled worse than expected. Bitcoin and Ethereum are the most liquid; smaller coins can slip badly.'),
  ('crypto-markets-decoded', 2, 1, 'Halving cycles in context', 8, 'Bitcoin''s issuance halves roughly every four years. Past cycles saw big rallies afterwards, but history is a small sample. Treat cycles as background, not a timing tool.'),
  ('crypto-markets-decoded', 2, 2, 'Funding rates and leverage', 8, 'Perpetual futures use funding payments to stay near spot. High positive funding means crowded longs, which can unwind violently. It is a useful sentiment gauge.'),
  ('crypto-markets-decoded', 2, 3, 'Sentiment extremes', 6, 'Euphoria and panic both show up in social media, funding and volume. Extremes are warnings to tighten risk, not signals to blindly fade the move.'),
  ('crypto-markets-decoded', 3, 1, 'Weekend gaps and wicks', 7, 'Crypto never closes, but liquidity thins at weekends. Sudden wicks can trigger stops. Smaller size or wider stops with smaller lots help in quiet hours.'),
  ('crypto-markets-decoded', 3, 2, 'Volatility-adjusted sizing', 9, 'BTC can move 5% in a day. Size from your stop distance so your dollar risk stays at 1% even when the stop is far away. The risk calculator does this for you.'),
  ('crypto-markets-decoded', 3, 3, 'Security essentials', 7, 'Use strong unique passwords, two-factor authentication and never share recovery phrases. Most crypto losses come from security mistakes, not bad trades.'),

  -- Trading Psychology
  ('trading-psychology', 1, 1, 'Fear, greed and FOMO', 8, 'Fear makes you exit winners early; greed makes you hold losers and oversize. FOMO pushes you into late entries. Naming the emotion is the first step to managing it.'),
  ('trading-psychology', 1, 2, 'Cognitive biases in trading', 9, 'Confirmation bias, recency bias and loss aversion distort decisions. A written plan and a checklist force you to look at evidence instead of feelings.'),
  ('trading-psychology', 1, 3, 'Revenge trading', 7, 'After a loss, the urge to win it back immediately is strong. Revenge trades are unplanned and oversized. A rule such as stopping after two losses breaks the cycle.'),
  ('trading-psychology', 2, 1, 'The pre-market routine', 8, 'Spend 15 minutes before trading checking the calendar, marking levels and setting your maximum loss for the day. Routines reduce decisions made in the heat of the moment.'),
  ('trading-psychology', 2, 2, 'The trading checklist', 7, 'Before every trade, tick through: setup present, stop defined, size calculated, no major news. If any box is empty, there is no trade.'),
  ('trading-psychology', 2, 3, 'Knowing when to stop', 6, 'Stop when you hit your loss limit, feel tired or notice you are bending rules. Walking away is a skill, and the market will be there tomorrow.'),
  ('trading-psychology', 2, 4, 'Breathing and focus', 5, 'A few slow breaths before clicking buy or sell lowers your heart rate and improves decisions. Simple physical habits support mental discipline.'),
  ('trading-psychology', 3, 1, 'Handling losing streaks', 8, 'Losing streaks happen to every strategy. Cut size in half after a set number of losses, review your journal and return to full size only after following your plan again.'),
  ('trading-psychology', 3, 2, 'Journaling for insight', 7, 'Beyond numbers, write how you felt before and after each trade. Emotional patterns often explain results better than chart patterns.'),
  ('trading-psychology', 3, 3, 'Process over outcome', 6, 'A good trade can lose and a bad trade can win. Judge yourself on whether you followed your process. Good process, repeated, produces good results over time.'),

  -- Advanced Position Sizing
  ('advanced-position-sizing', 1, 1, 'Average True Range (ATR)', 9, 'ATR measures how far an instrument typically moves in a period. Basing stops on ATR adapts them to current volatility instead of using the same distance in calm and wild markets.'),
  ('advanced-position-sizing', 1, 2, 'ATR-based stops and size', 10, 'Set your stop at a multiple of ATR, then size the position so that stop equals your fixed risk. When volatility rises, positions shrink automatically.'),
  ('advanced-position-sizing', 1, 3, 'Comparing risk across assets', 8, 'A 20-pip stop on EUR/USD and a $20 stop on gold are very different risks. Converting everything to account currency per lot makes cross-asset decisions consistent.'),
  ('advanced-position-sizing', 2, 1, 'Correlated exposure', 9, 'Long EUR/USD and long GBP/USD are largely the same bet against the dollar. Add up correlated positions and treat them as one when checking total risk.'),
  ('advanced-position-sizing', 2, 2, 'Maximum open risk', 7, 'Cap the total risk of all open trades, for example 3% of equity. This prevents a single market shock from hitting several positions at once.'),
  ('advanced-position-sizing', 2, 3, 'Hedging basics', 8, 'A hedge is a position that offsets risk in another. Hedging can reduce exposure, but it also adds costs and complexity. Know exactly what risk you are removing.'),
  ('advanced-position-sizing', 3, 1, 'Risk of ruin', 9, 'Risk of ruin estimates the chance of losing a set portion of your account given your win rate, payoff and risk per trade. Small changes in risk per trade change it dramatically.'),
  ('advanced-position-sizing', 3, 2, 'Daily and weekly circuit breakers', 7, 'Hard limits stop a bad day becoming a bad month. Automate them where you can and treat them as non-negotiable.'),
  ('advanced-position-sizing', 3, 3, 'Recovering from drawdown', 8, 'Cut risk during drawdown and rebuild slowly. Trying to recover quickly with bigger size is the most common way traders turn a drawdown into a blow-up.'),
  ('advanced-position-sizing', 4, 1, 'Fixed fractional sizing', 8, 'Risking a fixed percentage of current equity means position size grows as you win and shrinks as you lose. It is simple and naturally protective.'),
  ('advanced-position-sizing', 4, 2, 'Equity curve filters', 8, 'Some traders reduce size when their equity curve falls below its moving average. It is a way of letting recent performance adjust risk automatically.'),
  ('advanced-position-sizing', 4, 3, 'Stress-testing your plan', 9, 'Ask what happens after 10 losses in a row, a weekend gap through your stop or a sudden spread spike. If the answer is unacceptable, reduce size until it is not.')
) AS v(slug, mod_ord, ord, title, mins, content)
JOIN courses c ON c.slug = v.slug
JOIN modules m ON m.course_id = c.id AND m.order_index = v.mod_ord
ON CONFLICT (module_id, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration_minutes = EXCLUDED.duration_minutes, content = EXCLUDED.content;

-- Course duration = sum of its lessons
UPDATE courses c SET duration_minutes = s.total
FROM (
  SELECT m.course_id, SUM(l.duration_minutes)::int AS total
  FROM lessons l JOIN modules m ON m.id = l.module_id
  GROUP BY m.course_id
) s
WHERE s.course_id = c.id;

-- ---------------------------------------------------------------------------
-- Instruments. current_price is kept if it already exists so the random walk continues.
-- ---------------------------------------------------------------------------
INSERT INTO instruments (symbol, name, asset_class, base_price, pip_size, contract_size, decimals, quote_is_usd, spread_pips, volatility, current_price, price_updated_at) VALUES
  ('XAU/USD', 'Gold Spot',                 'Metals',  4000.00,   0.1,    100,    2, TRUE,  3,   0.00010, 4000.00,   now()),
  ('XAG/USD', 'Silver Spot',               'Metals',  53.300,    0.01,   5000,   3, TRUE,  3,   0.00015, 53.300,    now()),
  ('EUR/USD', 'Euro / US Dollar',          'Forex',   1.11400,   0.0001, 100000, 5, TRUE,  1.2, 0.00006, 1.11400,   now()),
  ('GBP/USD', 'British Pound / US Dollar', 'Forex',   1.33200,   0.0001, 100000, 5, TRUE,  1.4, 0.00007, 1.33200,   now()),
  ('USD/JPY', 'US Dollar / Japanese Yen',  'Forex',   157.700,   0.01,   100000, 3, FALSE, 1.3, 0.00006, 157.700,   now()),
  ('AUD/USD', 'Australian Dollar / US Dollar', 'Forex', 0.65800, 0.0001, 100000, 5, TRUE,  1.4, 0.00007, 0.65800,   now()),
  ('US30',    'Wall Street 30 (Dow)',      'Indices', 52360.0,   1,      1,      1, TRUE,  2,   0.00010, 52360.0,   now()),
  ('NAS100',  'US Tech 100 (Nasdaq)',      'Indices', 29270.0,   1,      1,      1, TRUE,  2,   0.00012, 29270.0,   now()),
  ('BTC/USD', 'Bitcoin',                   'Crypto',  79500.00,  1,      1,      2, TRUE,  30,  0.00025, 79500.00,  now()),
  ('ETH/USD', 'Ethereum',                  'Crypto',  2300.00,   0.1,    1,      2, TRUE,  15,  0.00030, 2300.00,   now())
ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name, asset_class = EXCLUDED.asset_class, base_price = EXCLUDED.base_price,
  pip_size = EXCLUDED.pip_size, contract_size = EXCLUDED.contract_size, decimals = EXCLUDED.decimals,
  quote_is_usd = EXCLUDED.quote_is_usd, spread_pips = EXCLUDED.spread_pips, volatility = EXCLUDED.volatility,
  current_price = COALESCE(instruments.current_price, EXCLUDED.current_price),
  price_updated_at = COALESCE(instruments.price_updated_at, EXCLUDED.price_updated_at);

-- ---------------------------------------------------------------------------
-- Live mentor sessions over the next 7 days. Re-running refreshes the dates.
-- ---------------------------------------------------------------------------
INSERT INTO live_sessions (slug, title, mentor_name, start_time, duration_minutes, capacity, topic, level)
SELECT v.slug, v.title, v.mentor, date_trunc('hour', now()) + v.starts_in, v.mins, v.cap, v.topic, v.lvl
FROM (VALUES
  ('market-open-briefing', 'Market Open Briefing',        'Ava Lindqvist', interval '4 hours',             30, 40, 'Key levels, overnight news and the economic calendar before the London open.', 'All levels'),
  ('gold-live-charting',   'Gold Live Charting',          'Daniel Okafor', interval '1 day 2 hours',        60, 30, 'Daniel marks up XAU/USD live and walks through his session playbook.', 'Intermediate'),
  ('price-action-live',    'Price Action Live',           'Marcus Reed',   interval '1 day 7 hours',        60, 25, 'Marcus marks up live charts across FX and indices and takes your requests.', 'Intermediate'),
  ('mentor-qa-risk',       'Q&A: Risk and Position Sizing', 'Priya Kapoor', interval '2 days 5 hours',      45, 20, 'Bring your questions on risk, sizing and building a trading plan.', 'All levels'),
  ('mindset-clinic',       'Mindset Clinic',              'Sofia Marín',   interval '3 days 3 hours',       45, 15, 'Practical tools for handling losing streaks, FOMO and revenge trading.', 'All levels'),
  ('first-trade-workshop', 'Your First Practice Trade',   'Nadia Rahman',  interval '4 days 1 hour',        40, 30, 'A friendly walkthrough of the simulator: order ticket, stop-loss, take-profit and closing a trade.', 'Beginner'),
  ('indices-opening-hour', 'Indices: The Opening Hour',   'Ava Lindqvist', interval '5 days 6 hours',       45, 25, 'How to approach the US cash open on US30 and NAS100 without getting chopped up.', 'Intermediate'),
  ('weekly-outlook',       'Weekly Outlook',              'Daniel Okafor', interval '6 days 4 hours',       60, 50, 'The key themes, central bank expectations and events to watch next week.', 'All levels')
) AS v(slug, title, mentor, starts_in, mins, cap, topic, lvl)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, mentor_name = EXCLUDED.mentor_name, start_time = EXCLUDED.start_time,
  duration_minutes = EXCLUDED.duration_minutes, capacity = EXCLUDED.capacity, topic = EXCLUDED.topic, level = EXCLUDED.level,
  seats_taken = (SELECT count(*) FROM session_bookings b WHERE b.session_id = live_sessions.id);
