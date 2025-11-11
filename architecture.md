# Technical Architecture Guide

*A simple explanation of how this app is structured and why.*

## Architecture Overview: Why Hexagonal?

I went with hexagonal architecture (also called ports & adapters) for this project, and honestly, it was one of my better decisions. Let me explain why in simple terms.

### The Problem I Was Solving

When I started, I had a typical question: "What happens if I need to switch from Prisma to TypeORM later? Or if I want to add a GraphQL API alongside the REST one?"

In traditional layered architecture, you'd be screwed. Your business logic would be so tangled up with your database and HTTP code that changing anything would be a nightmare.

Hexagonal architecture solves this by making the business logic the center of the universe, with everything else plugging into it through well-defined interfaces (ports).

### The Three Layers

```
┌─────────────────────────────────────────┐
│         Adapters (Infrastructure)       │
│  ┌───────────────────────────────────┐  │
│  │         Ports (Interfaces)        │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │    Core (Business Logic)    │  │  │
│  │  │                             │  │  │
│  │  │  - Domain Entities          │  │  │
│  │  │  - Use Cases                │  │  │
│  │  │  - Business Rules           │  │  │
│  │  │                             │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  ComplianceRepositoryPort ◄─────┐ │  │
│  │  RouteRepositoryPort ◄──────────┤ │  │
│  │  BankRepositoryPort ◄───────────┤ │  │
│  └───────────────────────────────────┘  │
│                                          │
│  PrismaComplianceRepository              │
│  PrismaRouteRepository                   │
│  PrismaBankRepository                    │
└─────────────────────────────────────────┘
```

**Core (Domain):** The heart of the app. Contains entities, business rules, and use cases. Has zero dependencies on frameworks or libraries. This is where the EU maritime compliance calculations live.

**Ports:** Interfaces that define contracts. The core says "I need something that can save routes" and defines a port. It doesn't care HOW routes are saved, just that it CAN be saved.

**Adapters:** Actual implementations. These are the concrete pieces that connect to real databases, APIs, and frameworks. They plug into the ports.

## How the Layers Work Together

Think of it like a restaurant:

**The Core (Kitchen)** knows how to make food. It has recipes (business logic) and knows what ingredients it needs (ports). It doesn't care if ingredients come from a local market or a delivery truck.

**The Ports (Order Interface)** define what the kitchen needs: "I need vegetables" or "I need to store this dish". It's just a contract, not the actual thing.

**The Adapters (Suppliers)** are the actual market, the delivery truck, the storage fridge. They implement what the ports define. You could switch from one supplier to another without changing the recipes.

### Real Example from This App

When a user wants to bank surplus carbon credits:

1. **HTTP Request** arrives at an Express adapter (inbound adapter)
2. **Controller** calls a use case function: "bankSurplus()"
3. **Use Case** (in Core) says: "I need to get the current compliance balance"
4. **Port** defines: "Someone should be able to get compliance balance"
5. **Repository Adapter** (outbound adapter) actually fetches from the database
6. **Use Case** does the business logic (checks if there's surplus, calculates amount)
7. **Use Case** says: "I need to save this banked amount"
8. **Another Port** defines: "Someone should be able to save bank entries"
9. **Repository Adapter** saves to database
10. **Response** flows back through the same chain

The beautiful part? The use case has no idea it's using Prisma and PostgreSQL. It just knows there's something that can save and retrieve data.

## Backend Structure (Simplified)


```
backend/
├── core/                          # The sacred inner circle
│   ├── application/               # Use cases (what the app does)
│   ├── domain/                    # Business logic and entities
│   └── ports/                     # Interfaces (contracts)
│
├── adapters/                      # The outside world
│   ├── inbound/                   # Things coming IN (HTTP, WebSockets, etc.)
│   └── outbound/                  # Things going OUT (Database, APIs, etc.)
│
├── infrastructure/                # Technical plumbing
│   ├── db/                        # Database connection
│   └── server/                    # Server setup
│
└── config/                        # Configuration
```

**Why this structure?**

- **Core** has zero dependencies on frameworks. Pure TypeScript. Pure business logic.
- **Adapters** can be swapped without touching Core. Want to switch from REST to GraphQL? Just add a new inbound adapter.
- **Infrastructure** is all the technical stuff that makes things run but isn't core to the business.

## Frontend Structure (Also Hexagonal!)

```
frontend/
├── app/                           # Next.js pages (UI layer)
│   ├── routes/
│   ├── compare/
│   ├── banking/
│   └── pooling/
│
├── core/                          # Same pattern as backend!
│   ├── application/               # Server actions (use cases)
│   ├── domain/                    # TypeScript interfaces
│   └── ports/                     # API contracts
│
├── adapters/
│   └── infrastructure/
│       └── apiClient.ts           # Talks to backend API
│
└── components/                    # Reusable UI bits
```

Yes, I used hexagonal architecture on the frontend too! The `core` doesn't know about Next.js, React, or fetch. It just knows "there's something that can get data from somewhere."

## Why Hexagonal Architecture Wins

Let me be real about why this pattern rocks:

### 1. **Easy to Test**

Since business logic is isolated in the core, you can test it without spinning up databases or servers. Mock the ports, test the logic. Done.

### 2. **Swap Infrastructure Easily**

Want to switch from Prisma to TypeORM? Or from PostgreSQL to MongoDB? Just create a new adapter. The core doesn't change.

### 3. **Multiple Entry Points**

Right now we have HTTP endpoints. Want to add a CLI tool? GraphQL API? WebSocket connections? Just add new inbound adapters. Same core logic, different interfaces.

### 4. **Clear Boundaries**

Everyone knows where to put their code:
- Business rules? Core/domain
- Database queries? Adapter/outbound
- API endpoints? Adapter/inbound
- Orchestration? Core/application

No more "where does this go?" debates.

### 5. **Framework Independent**

If Next.js becomes unpopular or Express gets replaced by something else, the core stays the same. You're not locked in.

## The Trade-offs (Being Honest)

**More Files and Folders**

Yes, there are more files. Yes, it's more indirection. For a tiny 5-page app, this would be overkill. But for anything that's going to grow and last, it's worth it.

**Learning Curve**

New developers need to understand the pattern first. But once they get it, they'll love it. The structure is so clear that onboarding actually becomes easier.

**Feels Like Extra Work Initially**

Creating a port and then an adapter feels like extra steps when you just want to save data. But trust me, the first time you need to swap out a technology, you'll be glad you did this.

## Real Benefits I've Experienced

**Bug Isolation**

When something breaks, I know exactly where to look. API issues? Check inbound adapters. Database problems? Check outbound adapters. Wrong calculation? Check the domain.

**Refactoring Confidence**

I've changed the database schema twice, swapped out some validation logic, and added new features. Each time, I only touched specific parts. The rest just kept working.

**Testing Made Bearable**

Testing becomes way less painful when you can test business logic without database connections or HTTP mocking. I can test compliance calculations in milliseconds.

## When NOT to Use Hexagonal Architecture

Let's be realistic:

- **Tiny prototypes** - If you're building a weekend project that might get thrown away, skip it
- **Simple CRUD apps** - If you're just saving and retrieving data with no business logic, it's overkill
- **Solo projects with tight deadlines** - If you need to ship fast and won't maintain it long-term, go simple

But for anything that:
- Has complex business rules
- Will grow over time
- Needs to last years
- Has multiple developers
- Might need infrastructure changes

Then hexagonal is your friend.

## Quick Reference: What Goes Where

Still confused about where to put code? Here's a cheat sheet:

**Writing business logic or calculations?** → `core/domain/`

**Orchestrating multiple operations?** → `core/application/`

**Defining a contract for something?** → `core/ports/`

**Implementing database queries?** → `adapters/outbound/`

**Implementing API endpoints?** → `adapters/inbound/`

**Setting up Express/Prisma/etc?** → `infrastructure/`

**Configuration and env vars?** → `config/`

## Wrapping Up

Hexagonal architecture takes a bit more upfront effort, but it pays dividends over time. The core principle is simple: **keep your business logic pure and independent of everything else**.

Everything in the `core` folder should be framework-agnostic. Everything outside the `core` is replaceable.

That's it. That's the whole philosophy.

Is it perfect? Nope. Will it solve all your problems? Definitely not. But it's a solid foundation that makes changes less scary and maintenance more manageable.

Questions? Suggestions? Open an issue or PR. I'm always looking to improve this!

---

*P.S. - If this seems like a lot for a simple CRUD app, it probably is. Use your judgment on whether the complexity is worth it for your use case.*