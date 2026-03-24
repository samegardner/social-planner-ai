# Social Planner AI

I was heads down at work but still wanted to make the most of weekends in NYC. So I built an AI agent that scrapes local events throughout the week, picks ones it thinks I'd like, and texts me suggestions. It can also help coordinate plans with friends over SMS.

## How it works

Three processes, one SQLite database:

**Event scraper** runs daily, pulling from the Ticketmaster API and Eater NY, then uses Claude to enrich and categorize each event (neighborhood, vibe, effort level, price range).

**Agent daemon** monitors my Google Calendar for open social slots, queries the event database filtered by my preferences, and texts me suggestions. The agent is conversational. I can reply "that's too far" and it'll re-query with closer neighborhoods, or "invite Jake" and it'll draft an outreach message for my approval before sending. It creates tentative calendar holds to prevent double-booking.

**Web app** (Next.js) handles onboarding and preference management: neighborhoods I like, budget, activity types, availability windows, friend list. A 10-step questionnaire captures everything the agent needs to make good recommendations.

## Agent tools

The Claude agent has access to 8 tools:
- Query the event database (with filters for category, neighborhood, date, price, effort level)
- Read my Google Calendar (rolling 2-week window)
- Read my preferences and hard rules
- Look up friends and phone numbers
- Send messages
- Create tentative calendar holds
- Log interactions (for future preference learning)
- Search the web (fallback for real-time info)

## Setup

```bash
npm install
cp .env.example .env  # Add API keys (Anthropic, Ticketmaster, Google, Telegram)
npx drizzle-kit push   # Set up SQLite schema
npm run dev             # Web app on localhost:3000
npx tsx scripts/scrape.ts   # Run the event scraper
npx tsx scripts/agent.ts    # Start the agent daemon
```

## Stack

- TypeScript, Next.js, React
- Claude API with tool use
- SQLite + Drizzle ORM
- Ticketmaster API, Eater NY (web scraping), Google Calendar API
- Telegram Bot API (planning to move to Telnyx for SMS)
- Railway for deployment
