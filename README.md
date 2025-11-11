# Fuel EU Maritime Compliance Tracker

Hey there! 👋 Welcome to my Fuel EU Maritime compliance application. I built this to help shipping companies track their emissions, manage carbon credits, and stay compliant with EU maritime regulations. It's been quite the journey getting this thing to work smoothly!

## What Does This Thing Actually Do?

So basically, this app helps you:

- **Track shipping routes** and see how much emissions each one produces
- **Compare routes** against a baseline to see if you're meeting compliance targets
- **Bank carbon credits** when you're doing better than required (like saving money for later!)
- **Apply banked credits** when you need them in tougher years
- **Create emissions pools** where multiple ships can share compliance balances

Think of it like a fitness tracker, but for ship emissions instead of steps. The EU has these regulations about how much ships can pollute, and this app helps you stay on the right side of those rules.

## The Tech Stack (What I Built This With)

I went with a pretty modern setup here:

**Frontend:**
- Next.js 15 (with the new App Router - still getting used to it!)
- React 19 for the UI
- TypeScript everywhere because I got tired of runtime errors
- TailwindCSS for styling (no more CSS headaches)
- Recharts for those sweet data visualizations
- shadcn/ui components (these saved me SO much time)

**Backend:**
- Node.js with Express (classic combo)
- PostgreSQL for the database (reliable as always)
- Prisma as the ORM (seriously, where has this been all my life?)
- TypeScript here too for consistency

**Architecture:**
I followed a hexagonal (ports & adapters) pattern because I wanted the business logic to be independent of the framework. Makes testing easier and the code more maintainable long-term.

## Getting Started (Let's Get You Running)

### What You'll Need

Before we start, make sure you have:
- Node.js (v18 or higher - I'm using v20)
- PostgreSQL running somewhere (locally or cloud)
- A terminal and your favorite code editor

### Backend Setup

Alright, let's get the backend running first:

1. **Clone this bad boy:**
   ```bash
   git clone <your-repo-url>
   cd backend
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Set up your environment variables:**
   
   Create a `.env` file in the backend directory and add:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/fueleu_db"
   PORT=3000
   NODE_ENV=development
   ```
   
   Replace `username`, `password`, and `fueleu_db` with your actual PostgreSQL credentials.

4. **Run the database migrations:**
   ```bash
   npx prisma migrate dev
   ```
   
   This creates all the tables you need. Prisma makes this so easy!

5. **Seed the database with some initial data:**
   ```bash
   npm run seed
   ```
   
   This adds some sample routes and ships so you can see everything working.

6. **Start the server:**
   ```bash
   npm run dev
   ```
   
   The backend should now be running on `http://localhost:3000` 🎉

### Frontend Setup

Now for the fun part - the UI:

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your environment:**
   
   Create a `.env.local` file and add:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```
   
   **Important:** This is where your frontend connects to your backend. If you're deploying to production, change this to your actual API URL!

4. **Fire it up:**
   ```bash
   npm run dev
   ```
   
   Open `http://localhost:3001` in your browser and you should see the app! 🚀

## How to Actually Use This Thing

### Route Management

When you first open the app, you'll land on the routes page. Here's what I usually do:

1. **Filter the routes** using the dropdowns - you can filter by vessel type, fuel type, or year
2. **Look at the emissions data** - each route shows you the GHG intensity and how much fuel was consumed
3. **Set a baseline** - pick the route that represents your target performance and click "Set as Baseline"

The baseline is super important because everything else gets compared against it.

### Comparing Routes

Head over to the Compare page to see how all your routes stack up:

- The **bar chart** shows you which routes are compliant (green) and which aren't (red)
- The **table below** gives you all the nitty-gritty details
- Routes above the baseline are burning more emissions than they should - those need attention!

### Carbon Banking

This is where it gets interesting. Go to the Banking page:

1. **Enter a ship ID and year** (try "SHIP001" and 2023 if you're using the seed data)
2. You'll see the ship's **Compliance Balance (CB)** - this is basically their carbon budget
3. If the CB is positive (surplus), you can click **"Bank Surplus"** to save it for later
4. If you have banked credits, you can apply them to years when you need them

Think of it like rollover minutes on an old phone plan, but for carbon credits!

### Creating Pools

The Pooling page lets you group ships together:

1. **Select a year**
2. **Add ships to the pool** using the form
3. Each ship brings their CB value to the table
4. The pool's combined CB is calculated automatically
5. Hit **"Create Pool"** and boom - the ships can now share compliance balances

This is great for fleets where some ships perform better than others. They can balance each other out!

## Project Structure (For the Curious)

I organized this using hexagonal architecture. Here's the basic layout:

```
├── backend/
│   ├── src/
│   │   ├── core/                    # Business logic lives here
│   │   │   ├── application/         # Use cases (the "what" we do)
│   │   │   ├── domain/              # Entities and business rules
│   │   │   └── ports/               # Interfaces (contracts)
│   │   ├── adapters/                # External world interactions
│   │   │   ├── inbound/             # Controllers (HTTP handlers)
│   │   │   └── outbound/            # Repositories (database)
│   │   └── infrastructure/          # Technical stuff (DB, server)
│   └── prisma/                      # Database schema and migrations
│
└── frontend/
    ├── src/
    │   ├── app/                     # Next.js pages
    │   ├── components/              # Reusable UI components
    │   ├── core/
    │   │   ├── application/         # Server actions
    │   │   ├── domain/              # TypeScript interfaces
    │   │   └── ports/               # API contracts
    │   └── adapters/                # API client implementation
```

The cool thing about this structure is that the `core` directory doesn't know anything about Express, Prisma, or Next.js. I could swap them out without touching the business logic!

## Key Features I'm Proud Of

### Real-Time Compliance Calculation

The app calculates compliance on the fly using this formula:

```
CB = (Target GHG Intensity - Actual GHG Intensity) × Energy Consumed
```

If CB is positive, you're doing great! Negative means you need to make improvements or use banked credits.

### Adjusted Compliance Balance

This is something I added that takes into account banked credits from previous years:

```
Adjusted CB = Current CB + Banked Credits - Penalties
```

It gives you a more realistic picture of where you actually stand.

### Emissions Pooling

Multiple ships can pool their compliance balances together. The math is straightforward:

```
Pool CB = Ship1 CB + Ship2 CB + Ship3 CB + ...
```

If the total is positive, everyone in the pool is compliant!

## API Endpoints (For the Backend Nerds)

Here are the main endpoints I built:

**Routes:**
- `GET /routes` - Fetch all routes (with optional filters)
- `GET /routes/comparison` - Compare all routes against baseline
- `POST /routes/:id/baseline` - Set a route as baseline

**Compliance:**
- `GET /compliance/cb` - Get compliance balance for a ship/year
- `GET /compliance/adjusted-cb` - Get adjusted CB with banking

**Banking:**
- `GET /banking/records` - Get all banking records
- `POST /banking/bank` - Bank a surplus
- `POST /banking/apply` - Apply banked credits

**Pooling:**
- `POST /pools` - Create a new pool

All endpoints return JSON and use standard HTTP status codes. I tried to make the error messages actually helpful too!

## Deployment (Getting This Live)

I set this up to deploy on Render, but you can use any platform:

### Backend Deployment

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repo
4. Add your environment variables (especially `DATABASE_URL`)
5. Render will auto-deploy on every push to main

### Frontend Deployment

You can deploy the Next.js app to Vercel (easiest option):

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the frontend directory
3. Follow the prompts
4. Don't forget to set `NEXT_PUBLIC_API_BASE_URL` to your production backend URL!

## Testing (Work in Progress)

I'll be honest - I need to add more tests. Right now I've been manually testing everything, but I plan to add:

- Unit tests for the business logic (Jest)
- Integration tests for the API endpoints (Supertest)
- E2E tests for the frontend (Playwright)

If you want to contribute tests, that would be amazing! 🙏

## Common Issues I Ran Into (So You Don't Have To)

### "Cannot connect to localhost"
Make sure your `.env.local` has the correct `NEXT_PUBLIC_API_BASE_URL`. And remember - changes to env files require a restart of the dev server!

### "Prisma Client Not Found"
Run `npx prisma generate` to regenerate the Prisma client.

### CORS Errors
Check that CORS is enabled in the backend (`expressApp.ts`). I have it set to allow all origins in development, but you'll want to restrict that in production.

### TypeScript Errors All Over
Try `npm run type-check` to see what's wrong. Sometimes it's just a missing type or an outdated interface.

## What I Learned Building This

This was my first time really diving into:
- **Hexagonal architecture** - took a bit to wrap my head around, but now I get why people love it
- **Prisma** - seriously so much better than raw SQL or older ORMs
- **Next.js App Router** - the server actions are powerful but took some getting used to
- **EU Maritime regulations** - learned way more about shipping emissions than I expected!

The biggest lesson? Start with a solid architecture even if it feels like overkill. I refactored this thing twice before settling on hexagonal, and I wish I'd started there.

## Future Improvements

Things I want to add:
- [ ] Real-time notifications when a ship goes out of compliance
- [ ] Historical trend charts (show compliance over multiple years)
- [ ] Export functionality (PDF reports for audits)
- [ ] User authentication and multi-tenant support
- [ ] Mobile app (React Native maybe?)
- [ ] Better error handling and validation
- [ ] Automated testing (currently doing manual testing)

## Contributing

Found a bug? Have an idea? I'd love your help! Just:

1. Fork the repo
2. Create a branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write a commit message that explains what you did
5. Push and open a PR

I try to review PRs within a few days.

## Questions?

If something's not clear or you run into issues, open an issue on GitHub or reach out. I'm always happy to help!

## License

MIT - do whatever you want with this code. If you build something cool with it, I'd love to hear about it!

---

Built with ☕ and probably too much Stack Overflow.
