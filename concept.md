# Social Planner AI

## Core Idea

An AI assistant that proactively fills your calendar with social events so you don't have to do the planning yourself. It works like that one friend who's always organizing things, except it never gets tired of doing it.

The target user is someone who loves being social but defaults to work and forgets to plan things. The AI handles the mental load of figuring out what to do, suggesting it, and coordinating with friends.

## How It Works

### The Core Loop

1. AI has access to your calendar, contacts, and iMessage
2. It monitors your calendar for open social slots
3. It proactively texts you with concrete event suggestions
4. You respond naturally (yes, no, suggest something else)
5. Once you approve, AI drafts a message to your friend(s) and shows you for approval
6. You confirm (or tweak), AI sends it via iMessage
7. AI creates a tentative calendar hold for that time slot
8. From there, you and your friend just text normally to finalize details
9. The AI's job is done. It got the ball rolling.

### Goal: 2 social events per week

The v1 logic is simple: aim for 2 social hangs per week. The AI checks your calendar, finds open slots, and suggests things to fill them. If you decline, it tries again for a different slot. If you hit 2 for the week, it backs off. No guilt tripping, no over-prompting.

## The Interaction Model

Two interfaces: iMessage for the day-to-day conversation, and a web app for configuration and browsing.

### Key principles:
- **Proactive, not reactive**: The AI initiates. You don't have to ask it for plans.
- **Concrete suggestions**: Never "want to do something this weekend?" Always "There's a new ramen spot in the East Village. Want me to see if Jake's down for dinner Thursday?"
- **Respects your answer**: If you say "nah, staying in," it moves on. No follow-ups, no pressure.
- **Reads the room**: If your calendar is packed with work, it should know to stay quiet. If your weekend is wide open, that's a natural trigger.

### Example Conversations

**Simple weeknight suggestion:**
> AI: You're free Thursday evening. There's a new ramen spot in the East Village getting great buzz, Ramen Lab. Want me to see if anyone's down for dinner?
> You: Yeah that sounds good. Ask Jake and Tommy
> AI: On it. I'll let you know what they say.

**Weekend, something bigger:**
> AI: Your Saturday is wide open. There's a free jazz series at Brooklyn Mitten in Prospect Park, sets start at 3pm. Could be a good crew hang. Interested?
> You: Eh not really feeling jazz. What else?
> AI: Fair. There's also a street food market at Smorgasburg Williamsburg, or the Knicks play at 7 if you want something low effort.
> You: Smorgasburg, let's do it

**Not feeling it:**
> AI: You've got nothing tonight and you're at 0 social events this week. Drinks somewhere?
> You: Nah, staying in tonight
> AI: All good. You've still got the weekend.

**Already covered:**
> AI: Looks like you've already got dinner with Sarah on Friday and brunch Sunday. You're set this week. Enjoy.

## Event Discovery

The AI needs to be genuinely good at finding interesting, varied things to do in NYC. Generic Google/Yelp results won't cut it. It needs to surface the kind of stuff a well-connected friend would know about.

### The Event Database

A scrape pipeline runs daily (or twice-weekly for slower sources) and populates a local database of everything happening in NYC. Each event is categorized and tagged so the AI can query it intelligently.

**Each event record includes:**
- Event name and description
- Category: food, active, culture, low effort, seasonal/one-off
- Effort level: low, medium, high
- Best time: weeknight, weekend day, weekend night, any
- Neighborhood
- Price range
- Group size (solo-friendly, pairs, groups)
- Expiration date (when it's no longer relevant)

**Example of what a week's DB might look like:**

| Event | Category | Effort | Day/Time | Neighborhood | Price |
|---|---|---|---|---|---|
| Ramen Lab opening week | Food | Low | Any evening | East Village | $$ |
| Knicks vs Celtics | Culture | Low | Sat 7pm | Midtown | $$$ |
| Smorgasburg | Food/Social | Medium | Sat/Sun daytime | Williamsburg | $$ |
| Free comedy at The Creek | Culture | Low | Fri 9pm | LIC | Free |
| Prospect Park cherry blossoms | Active | Low | Weekend daytime | Park Slope | Free |
| Nonsense NYC warehouse party | Culture | High | Sat late night | Bushwick | $ |

### Data Sources

**Tier 1: Structured APIs (reliable, easy to pull)**
- Google Places API: restaurants, bars, coffee shops, ratings, hours, neighborhoods
- Eventbrite API: events with dates, prices, categories
- Resy/OpenTable: reservation availability
- Weather API: outdoor vs. indoor decision making
- SeatGeek/Ticketmaster: sports, concerts, bigger events

**Tier 2: Scrapable editorial sources (best signal, curated by humans)**
- The Infatuation: recently reviewed, neighborhood guides
- Eater NY: new openings, "where to eat right now" lists
- TimeOut NY: event listings, seasonal roundups
- Nonsense NYC newsletter: weekly email with interesting/weird events (just text, very scrapable)

**Tier 3: Community sources (good but noisier)**
- Reddit (r/nycevents, r/AskNYC): people post events and recommendations
- Meetup.com: group activities, pickup sports, social events
- NYC Parks events page: free outdoor stuff, seasonal programming

**Skipping for v1:**
- Instagram, TikTok (API access painful, unstructured data)
- Facebook Events (API is basically dead)
- Twitter/X (too noisy)

### How the AI Queries the DB

When it's time to suggest something, the AI filters by:
- What day/time slot is open on the calendar
- What category was last suggested (avoid repeats)
- What you've declined recently (don't re-suggest)
- Weather (skip outdoor stuff if it's raining)
- Time-sensitive events get priority over evergreen suggestions (a pop-up this Saturday matters more than "there's always good ramen in the East Village")

Leads with one strong pick. If you say no, it goes back to the DB and pulls something from a different category.

### Event Variety Rules
- Don't suggest the same category back to back
- Track what's been suggested recently to keep it fresh
- Match effort level to the time slot (2 hour gap vs. full open day)
- Day of week and time of day matter (Friday night is different from Sunday morning)
- Seasonal and one-off events get priority over evergreen options

## Friend Outreach

### Transparency
Friends know it's AI-assisted. The first time someone gets a message through this, it includes a casual note like: "btw I'm using a planning tool to help me be more social, so if these texts feel more organized than usual, that's why lol." After that, messages are just normal.

### Draft-first
The AI always shows you the draft before sending. You can tweak the wording or just confirm. This keeps you in control and makes sure messages sound like you.

### The AI stops after sending
Once the message is sent and the tentative calendar hold is created, the AI steps back. It doesn't monitor your friend's reply or try to negotiate times. You and your friend just have a normal text conversation from there. If the plan falls through, you either tell the AI ("didn't work out, try someone else") or just delete the calendar hold yourself.

### Why this works
- No weird AI-in-the-middle dynamic
- Your friends are just getting a normal text from you
- The tentative hold prevents the AI from double-booking that slot
- Keeps the AI's scope small and simple for v1

### Example Flow
> AI: You're free Thursday evening. There's a new ramen spot in the East Village, Ramen Lab. Want me to see if Jake's down?
> You: Yeah ask Jake
> AI: Here's what I'd send: "Hey Jake, you free Thursday for dinner? Want to try that new ramen spot in the East Village, Ramen Lab." Good to send?
> You: Yeah send it
> AI: Sent. I blocked Thursday 7-9pm on your calendar as tentative. You two take it from here.

## Taste and Learning

This is what makes it feel magical. The AI gets better over time because it's tracking what you like, what you don't, where you've been, and how your life actually works.

### Layer 1: Explicit Preferences (Rules File)

A config file with hard rules the AI always respects. You can edit it anytime.

Example rules:
- Never suggest $$$$$ restaurants
- No drinks on Sunday nights (work the next day)
- No events past 11pm on weeknights
- Preferred neighborhoods: East Village, Williamsburg, Park Slope, LIC
- Avoid: Times Square, Midtown tourist traps
- Max commute: 30 min by subway
- Home address: [your address]

These are absolute filters. The AI never violates them.

### Layer 2: Location and Commute Awareness

The AI knows:
- Your home address
- Which subway lines are close to you
- Estimated travel time to any venue via transit (Google Maps Directions API)
- Don't suggest something that's a 50 min commute on a Tuesday night
- Factor commute into calendar holds: if dinner is at 7 and the venue is 25 min away, block from 6:30

### Layer 3: Weather Awareness

- Check forecast for the specific day/time of the suggestion
- Raining Saturday? Skip Smorgasburg, suggest the comedy show instead
- Beautiful spring day? Prioritize outdoor stuff
- Freezing cold? Cozy indoor options

### Layer 4: Learned Preferences (Behavioral)

Tracked automatically from your accept/decline/feedback patterns over time:
- **Category preferences**: You keep saying yes to food, rarely to active stuff on weekdays
- **Price sensitivity**: You always pick the cheaper option, stop suggesting $$$
- **Neighborhood patterns**: You never say yes to anything in Midtown
- **Time patterns**: You're a "weeknight dinner" person but a "weekend activity" person
- **Seasonal patterns**: More social in summer, less in winter
- **Friend pairings**: Who you tend to say yes to hanging with, which friends fit which activities

### Layer 5: Venue History

Every place you've been gets tracked:
- **Loved it**: Goes into your rotation. The AI will suggest it again with new people or after enough time passes.
- **It was fine**: Won't re-suggest for a while, but it's not blocked.
- **Never again**: Permanently blocked. Never suggested.

### Post-Event Check-in

The day after an event, the AI sends a quick check-in:
> AI: How was Ramen Lab?
> You: Really good actually
> AI: Nice, added to your rotation.

Or:
> AI: How was that comedy show?
> You: Meh
> AI: Got it, won't suggest that venue again.

If you don't respond, it drops it. No nagging. It just falls back on the implicit signals (you went, so it was at least acceptable).

### The "Magic" Moment

After a few months of data, suggestions start to feel eerily good:

> AI: Last time you went to that comedy show in LIC you said it was great. There's another one this Friday, different comedian. You and Tommy haven't hung out in 3 weeks. Want me to send him a text?

Three pieces of learning in one suggestion: you liked comedy at that venue, you liked going with Tommy, and it's been a while since you two connected. That's the kind of suggestion a thoughtful friend would make.

## Web App

The web app is the control panel. iMessage is where you use it, the web app is where you configure it.

### Onboarding Flow

First-time setup walks you through one question at a time, clean and simple. Each screen is one question with a small footnote: *"Don't worry, you can adjust all of this later."*

1. What's your home address?
2. What neighborhoods do you like hanging out in? (checklist of NYC neighborhoods)
3. Any neighborhoods you want to avoid?
4. What's the most you'd want to spend on a night out? (price range slider)
5. What kinds of activities do you enjoy? (food, drinks, active, culture, low-key hangs, etc.)
6. Any hard no's? Things you never want suggested? (free text)
7. How social do you want to be? How many events per week feels right? (slider, default 2)
8. What days/times are you usually free for social stuff? (weeknight evenings, weekend days, weekend nights)
9. Who are your go-to friends to hang with? (name + phone number for each, simple list)
10. What's your iMessage number?

After onboarding, the AI has enough context to make decent suggestions from day one.

### Dashboard Sections

**Preferences and Rules**
- Toggle-style settings: max price range slider, neighborhood checklist, commute limit, time restrictions
- Blocklist: venues, neighborhoods, event types you never want suggested
- Social goal: adjust the events/week target
- Home address and commute settings

**Venue History**
- List of everywhere you've been (pulled from calendar events that happened)
- Rating for each: loved / fine / never again
- Filter by category, neighborhood, date
- "Rotation" view: places you loved that the AI can re-suggest

**Event Database Browser**
- What the scraper found this week, organized by category
- Star something yourself: "suggest this to me for Saturday"
- See what's time-sensitive vs. evergreen
- Map view showing events by neighborhood
- Tap "plan this" on any event and the AI takes over (picks a time, drafts a message to friends)

## Technical Architecture

### Core Principle: The AI is a Real Agent, Not a Notification System

The iMessage interface is not a dumb bot firing off pre-written suggestions. It's a Claude agent running in a loop with full tool access. Every message you send gets interpreted by the agent, which can call whatever tools it needs to respond intelligently.

If you say "nah, that's too far," the agent understands "too far" means distance, queries the event DB filtered by closer neighborhoods, and comes back with a better pick. It's a real conversation with a smart agent, not a menu system.

### System Architecture: Three Separate Processes, One Shared DB

The system is three independent processes that share a single SQLite database. Each has a different lifecycle and purpose.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Web App    │     │  Scraper    │     │  Agent      │
│  (Next.js)  │     │  (cron)     │     │  (daemon)   │
│  port 3000  │     │  daily 6am  │     │  always-on  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────┴──────┐
                    │   SQLite    │
                    │  (shared)   │
                    └─────────────┘
```

**Web App** (Next.js): Onboarding, preferences UI. `npm run dev`
**Scraper** (cron): Daily event pipeline. `npx tsx scripts/scrape.ts`
**Agent** (daemon): Long-running process that watches calendar/iMessage, texts suggestions, handles replies. `npx tsx scripts/agent.ts`

All three live in the same repo, share `src/lib/schema.ts`, `src/lib/db.ts`, and `src/lib/constants.ts`. They communicate only through the shared SQLite database, never directly. If one crashes, the others keep running.

**Why separate:** Each piece has a different lifecycle. The web app runs when you want to tweak settings. The scraper runs once a day. The agent runs continuously. Cramming them into one process would mean a scraper crash takes down the agent.

### Infrastructure

- **iMessage integration**: Lives in the agent process. Uses AppleScript to send messages and reads from the local SQLite database (`~/Library/Messages/chat.db`). No official Apple API exists.
- **Calendar access**: Google Calendar or Apple Calendar API
- **AI backbone**: Claude API with tool use
- **Requires a Mac** running as the always-on server (iMessage constraint)
- **Web app**: serves the dashboard, onboarding, and writes to the shared DB

### Agent Tools

**`query_events`**
- Searches the event database with filters
- Inputs: category, neighborhood, date range, price range, effort level, max commute time, indoor/outdoor
- Returns: list of matching events with all metadata
- Example: agent gets "too far" feedback, calls `query_events` with `max_commute=20min` and the same date

**`get_calendar`**
- Reads your calendar for a date range
- Returns: list of events with times, and gaps between them
- Used to find open slots and gauge how busy your week is

**`create_calendar_hold`**
- Creates a tentative event on your calendar
- Inputs: title, date, start time, end time (factoring in commute)
- Returns: confirmation

**`get_weather`**
- Checks forecast for a specific date/time/location
- Returns: conditions, temperature, rain probability
- Agent uses this to filter outdoor vs. indoor suggestions

**`get_commute_time`**
- Calculates transit time from home to a venue
- Inputs: destination address
- Returns: time in minutes via subway
- Used for filtering events and for setting accurate calendar hold start times

**`get_preferences`**
- Reads the full preference profile: rules, blocklists, venue history, learned patterns
- Agent checks this before every suggestion

**`send_imessage`**
- Sends a message via iMessage to a phone number
- Inputs: phone number, message text
- Only used after explicit user approval of a draft

**`get_friends`**
- Returns friend list with names and phone numbers
- Agent uses this when you say "ask Jake" to look up Jake's number

**`log_interaction`**
- Records every suggestion and your response (accepted, declined, reason given)
- Feeds the learning system over time

### Agent Decision Flow

When it's time to make a suggestion, the agent follows this logic:

1. Call `get_calendar` to find open slots this week
2. Call `get_preferences` to know rules and recent patterns
3. Call `get_weather` for the open slot's date
4. Call `query_events` with all those filters applied
5. Pick the best match, craft a natural suggestion, send it via iMessage
6. Wait for your response
7. If you say no with a reason ("too far", "not feeling food"), adjust filters and go back to step 4
8. If you say yes and name a friend, call `get_friends`, draft a message, show you the draft
9. On approval, call `send_imessage` and `create_calendar_hold`
10. Call `log_interaction` to record everything

The key: the agent can do multiple rounds of tool calls in a single conversation turn. Your feedback dynamically adjusts the query, not from a script, but because the agent understands natural language and maps it to the right tool parameters.

## Scope

Building this as a personal tool first. Just for Sam, in NYC, on a Mac. No need to generalize for other users, cities, or platforms. If it actually changes behavior (more social events happening), that's a signal there might be a product here. But not thinking about that yet.

## MVP (Version 1)

### What to build

**Simple web app**
- Onboarding flow: 10 questions, one at a time, with footnote "Don't worry, you can adjust all of this later."
- Basic preferences page: view and edit what you set during onboarding
- No full dashboard, no event browser, no venue history UI

**Event scraper (limited sources)**
- Start with 2-3 sources: Eventbrite API + Eater NY + one more (Nonsense NYC or TimeOut)
- Runs daily, populates the event DB with categorized/tagged events
- Enough variety to make decent suggestions, not trying to be comprehensive yet

**Claude agent with tools**
- `query_events`: search event DB with filters
- `get_calendar`: read calendar for open slots
- `get_preferences`: read onboarding preferences and rules
- `get_friends`: look up friend names and phone numbers
- `send_imessage`: send messages (only after user approval)
- `create_calendar_hold`: create tentative calendar events
- `log_interaction`: record suggestions and responses for future learning

**iMessage integration**
- Via MCP server on Mac
- Agent reads incoming messages, sends suggestions, drafts outreach to friends

**Calendar integration**
- Google Calendar or Apple Calendar
- Read events to find open slots, create tentative holds

**Friend list**
- Stored from onboarding: name + phone number
- Simple lookup, no intelligence about who fits what activity yet

**Suggestion logic**
- Goal: 2 social events per week
- Find open slots, query event DB, suggest one thing at a time
- Use neighborhood preferences as a commute proxy (no Google Maps API yet)
- Respect all hard rules from preferences

### What to skip (saved for V2+)

**V2: Learning and Intelligence**
- Behavioral learning from accept/decline patterns over time
- Venue history tracking and loved/fine/never again ratings
- Post-event check-ins ("How was Ramen Lab?")
- Friend-activity pairing intelligence (who fits which activities)
- The "magic moment" suggestions (combining venue + friend + timing signals)

**V2: Better Event Discovery**
- Weather awareness (outdoor vs. indoor filtering)
- Actual commute time calculations via Google Maps API
- Tier 3 sources: Reddit, Meetup, NYC Parks
- Seasonal pattern awareness

**V2: Full Web App Dashboard**
- Venue history page with ratings and rotation view
- Event database browser with search and filters
- Map view showing events by neighborhood
- "Plan this" button to hand an event to the agent
- Rules editable via iMessage conversation ("stop suggesting Midtown")

### The Test

Run it for 4 weeks. The question to answer: did you actually go to more social events than you would have otherwise? If yes, build V2. If not, figure out what's broken, whether it's the suggestions, the interaction model, the friction, or something else.

## Open Questions

- Scraping reliability: how to handle sources that change HTML or block scrapers?
- How much history before behavioral learning feels useful? Weeks? Months?
- Which 2-3 event sources give the best bang for the buck in the MVP?

## Build Progress

### Completed: Web App + Onboarding (Feb 16, 2026)

**Tech stack chosen:** Next.js 14+ (App Router), TypeScript, SQLite via Drizzle ORM + better-sqlite3, Tailwind CSS + shadcn/ui

**What was built:**

1. **Project scaffold** at `/Users/samgardner/Work/Projects/social-planner-ai/`
   - Next.js app with App Router and `src/` directory
   - Drizzle ORM with SQLite (database at `data/social-planner.db`)
   - shadcn/ui components: button, input, textarea, slider, checkbox, label, card

2. **Database schema** (`src/lib/schema.ts`)
   - MVP tables: `preferences`, `neighborhoods`, `activity_preferences`, `availability`, `friends`
   - Future tables (defined, not yet used): `events`, `interaction_logs`, `venue_history`
   - Migrations applied and working

3. **API routes**
   - `POST /api/onboarding` - saves all onboarding data in a single transaction
   - `GET/PUT /api/preferences` - read and update preferences
   - `GET/POST/PUT/DELETE /api/friends` - full CRUD for friends

4. **10-step onboarding flow** (`/onboarding`)
   - Step 1: Home address (text input)
   - Step 2: Liked neighborhoods (checkbox grid, ~50 NYC neighborhoods)
   - Step 3: Avoided neighborhoods (same grid, minus liked ones)
   - Step 4: Max budget (slider $10-$200+ with quick-pick labels)
   - Step 5: Activity types (checkbox list with descriptions)
   - Step 6: Hard no's (free text textarea)
   - Step 7: Social frequency (slider 0-7, default 2, with contextual labels)
   - Step 8: Availability (toggle buttons: weeknight evenings, weekend days, weekend nights)
   - Step 9: Friends (dynamic list: name + phone number, add/remove rows)
   - Step 10: iMessage number (phone input)
   - Progress bar, back/next navigation, footnote on every screen
   - All state held in memory, single POST on finish, redirect to preferences

5. **Preferences page** (`/preferences`)
   - Card-based layout with all preference sections
   - Inline editing for each section (click Edit, make changes, Save/Cancel)
   - Friends section with add/remove functionality
   - Each section saves independently via API

6. **Root page routing** (`/`)
   - Checks if onboarding is complete
   - Redirects to `/onboarding` if not, `/preferences` if done

**Key files:**
- `src/lib/schema.ts` - all DB table definitions
- `src/lib/db.ts` - Drizzle client with WAL mode
- `src/lib/constants.ts` - NYC neighborhoods, activity types, availability slots
- `src/app/onboarding/page.tsx` - onboarding flow controller
- `src/components/onboarding/` - 10 step components + progress bar
- `src/app/preferences/page.tsx` - preferences view/edit page
- `src/app/api/` - onboarding, preferences, friends routes
- `drizzle.config.ts` - Drizzle Kit config
- `concept.md` - this document

**How to run:**
```bash
cd /Users/samgardner/Work/Projects/social-planner-ai
npm run dev
# Visit http://localhost:3000
```

### Next up

- Event scraper (Eventbrite API + Eater NY + one more source)
- Claude agent with tool access
- iMessage integration via MCP
- Calendar integration (Google Calendar or Apple Calendar)

## Status

Web app with onboarding and preferences is built and working. Next milestone is the event scraper and agent layer.
