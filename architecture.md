# Technical Architecture Deep Dive

*If you're the kind of person who wants to know exactly how everything fits together under the hood, this doc is for you.*


## Architecture Overview: Why Hexagonal?

I went with hexagonal architecture (also called ports & adapters) for this project, and honestly, it was one of my better decisions. Let me explain why.

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

**Core (Domain):** The heart of the app. Contains entities, business rules, and use cases. Has zero dependencies on frameworks or libraries.

**Ports:** Interfaces that define contracts. The core says "I need something that can save routes" and defines a port. It doesn't care HOW routes are saved.

**Adapters:** Actual implementations. Prisma adapter, Express adapter, etc. These plug into the ports.

## Backend Architecture

### Directory Structure (The Reasoning)

```
backend/
├── src/
│   ├── core/                           # The sacred inner circle
│   │   ├── application/                # Use cases (orchestration)
│   │   │   ├── ComputeCB.ts           # Calculate compliance balance
│   │   │   ├── BankSurplus.ts         # Bank excess credits
│   │   │   ├── ApplyBanked.ts         # Use banked credits
│   │   │   ├── CreatePool.ts          # Create emissions pool
│   │   │   └── CompareRoutes.ts       # Compare against baseline
│   │   │
│   │   ├── domain/                     # Pure business logic
│   │   │   ├── RouteEntity.ts         # Route calculations
│   │   │   ├── ShipComplianceEntity.ts
│   │   │   ├── BankEntryEntity.ts
│   │   │   └── PoolEntity.ts
│   │   │
│   │   └── ports/                      # Contracts/Interfaces
│   │       ├── RouteRepositoryPort.ts
│   │       ├── ComplianceRepositoryPort.ts
│   │       ├── BankRepositoryPort.ts
│   │       └── PoolRepositoryPort.ts
│   │
│   ├── adapters/                       # The outside world
│   │   ├── inbound/                    # Things coming IN
│   │   │   └── http/                   # HTTP controllers
│   │   │       ├── bankingController.ts
│   │   │       ├── complianceController.ts
│   │   │       └── poolingController.ts
│   │   │
│   │   └── outbound/                   # Things going OUT
│   │       └── postgres/               # Database adapters
│   │           ├── PrismaRouteRepository.ts
│   │           ├── PrismaComplianceRepository.ts
│   │           ├── PrismaBankRepository.ts
│   │           └── PrismaPoolRepository.ts
│   │
│   ├── infrastructure/                 # Technical concerns
│   │   ├── db/
│   │   │   └── prisma.ts              # Prisma client singleton
│   │   └── server/
│   │       └── expressApp.ts          # Express setup
│   │
│   ├── config/
│   │   └── env.ts                     # Environment config
│   │
│   └── index.ts                        # Entry point
│
└── prisma/
    ├── schema.prisma                   # Database schema
    ├── migrations/                     # Migration history
    └── seed.ts                         # Test data
```

### The Data Flow (How a Request Actually Works)

Let me walk you through what happens when a user banks a surplus:

1. **HTTP Request Comes In**
   ```
   POST /banking/bank
   Body: { shipId: "SHIP001", year: 2023 }
   ```

2. **Express Router → Controller**
   ```typescript
   // bankingController.ts
   app.post('/banking/bank', async (req, res) => {
     const { shipId, year } = req.body;
     // Controller doesn't know about business logic
   ```

3. **Controller → Use Case**
   ```typescript
   // Still in controller
   const result = await bankSurplus(shipId, year);
   // bankSurplus is our use case function
   ```

4. **Use Case → Repository (via Port)**
   ```typescript
   // BankSurplus.ts (use case)
   export async function bankSurplus(shipId: string, year: number) {
     // Get current CB using the port interface
     const cb = await complianceRepo.getCB(shipId, year);
     
     if (cb <= 0) throw new Error("No surplus to bank");
     
     // Save to bank using the port interface
     return await bankRepo.bankSurplus(shipId, year, cb);
   }
   ```

5. **Repository → Database**
   ```typescript
   // PrismaBankRepository.ts (adapter)
   async bankSurplus(shipId: string, year: number, amount: number) {
     return await prisma.bankEntry.create({
       data: { shipId, year, amount, type: 'BANK' }
     });
   }
   ```

6. **Response Flows Back**
   ```
   Database → Repository → Use Case → Controller → HTTP Response
   ```

The beautiful part? The use case (`BankSurplus`) has no idea it's talking to Prisma. It just knows there's something that implements `BankRepositoryPort`.

### Domain Entities: Where Business Logic Lives

#### RouteEntity

This is where the magic happens. All the emissions calculations:

```typescript
export interface RouteEntity {
  id: number;
  routeName: string;
  vesselType: string;
  fuelType: string;
  fuelConsumed: number;  // in tons
  distance: number;       // in nautical miles
  year: number;
  isBaseline: boolean;
}

// Business logic functions
export function calculateGHGIntensity(route: RouteEntity): number {
  // GHG intensity = emissions per unit distance
  const emissions = route.fuelConsumed * getEmissionFactor(route.fuelType);
  return emissions / route.distance;
}

export function calculateComplianceBalance(
  route: RouteEntity,
  baselineRoute: RouteEntity
): number {
  const actualIntensity = calculateGHGIntensity(route);
  const targetIntensity = calculateGHGIntensity(baselineRoute);
  
  // CB = (target - actual) × distance
  // Positive CB = good (under target)
  // Negative CB = bad (over target)
  return (targetIntensity - actualIntensity) * route.distance;
}
```

These functions are pure business logic. No database calls, no HTTP stuff, just math.

#### ShipComplianceEntity

Tracks compliance status for a ship:

```typescript
export interface ShipComplianceEntity {
  shipId: string;
  year: number;
  complianceBalance: number;  // The CB value
  isCompliant: boolean;        // CB >= 0
  lastUpdated: Date;
}
```

### Use Cases: Orchestrating Business Logic

Use cases are like conductors of an orchestra. They coordinate different parts of the system:

#### Example: ComputeCB

```typescript
export async function computeCB(
  shipId: string,
  year: number
): Promise<ShipComplianceEntity> {
  // 1. Get all routes for this ship/year
  const routes = await routeRepo.getRoutes({ shipId, year });
  
  // 2. Get the baseline route
  const baseline = await routeRepo.getBaseline(year);
  
  if (!baseline) {
    throw new Error("No baseline set for this year");
  }
  
  // 3. Calculate CB for each route
  const totalCB = routes.reduce((sum, route) => {
    return sum + calculateComplianceBalance(route, baseline);
  }, 0);
  
  // 4. Save the compliance record
  return await complianceRepo.saveCB({
    shipId,
    year,
    complianceBalance: totalCB,
    isCompliant: totalCB >= 0
  });
}
```

Notice how it:
- Uses repository ports (not concrete implementations)
- Contains the business flow
- Delegates calculations to domain entities
- Has no framework dependencies

## Frontend Architecture

### The Next.js App Router Structure

```
frontend/src/
├── app/                           # Pages (App Router)
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home (redirects to /routes)
│   ├── routes/
│   │   ├── page.tsx              # Routes page
│   │   └── layout.tsx            # Adds navigation dock
│   ├── compare/
│   ├── banking/
│   └── pooling/
│
├── components/                    # Reusable UI components
│   └── ui/                       # shadcn components
│       ├── floating-dock.tsx
│       ├── tooltip.tsx
│       └── ... (other UI bits)
│
├── core/                          # Business logic (yes, on frontend too!)
│   ├── application/              # Server Actions
│   │   ├── routeActions.ts
│   │   ├── complianceActions.ts
│   │   ├── bankingActions.ts
│   │   └── poolingActions.ts
│   │
│   ├── domain/                   # TypeScript interfaces
│   │   ├── RouteEntity.ts
│   │   ├── ComplianceEntity.ts
│   │   ├── BankingEntity.ts
│   │   └── PoolEntity.ts
│   │
│   └── ports/                    # API contracts
│       └── ApiClientPort.ts
│
├── adapters/
│   └── infrastructure/
│       └── apiClient.ts          # Implements ApiClientPort
│
├── lib/
│   ├── utils.ts                  # Helper functions
│   └── api.ts                    # API client exports
│
├── styles/
│   └── globals.css               # Global styles + Tailwind
│
└── env.js                         # Environment validation
```

### Server Actions: The Bridge

I'm using Next.js Server Actions to bridge the gap between client and server:

```typescript
// routeActions.ts
'use server'

import { apiClient } from '@/adapters/infrastructure/apiClient';

export async function getRoutes(filters?: {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}) {
  return await apiClient.getRoutes(filters);
}

export async function setBaseline(routeId: number) {
  return await apiClient.setBaseline(routeId);
}
```

These run on the server, so they can safely call the backend API without exposing it to the client.

Then in components:

```typescript
'use client'

export function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  
  useEffect(() => {
    getRoutes().then(setRoutes);  // Calls the server action
  }, []);
  
  return (/* UI stuff */);
}
```

### The API Client Pattern

The frontend also uses ports & adapters (I'm consistent like that):

```typescript
// ApiClientPort.ts (the contract)
export interface ApiClientPort {
  getRoutes(filters?: RouteFilters): Promise<RouteEntity[]>;
  setBaseline(routeId: number): Promise<{ message: string }>;
  getCB(shipId: string, year: number): Promise<ComplianceBalance>;
  // ... etc
}

// apiClient.ts (the implementation)
class ApiClient implements ApiClientPort {
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(error.error ?? `API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getRoutes(filters?: RouteFilters): Promise<RouteEntity[]> {
    const params = new URLSearchParams();
    if (filters?.vesselType) params.append("vesselType", filters.vesselType);
    // ... build query string
    
    return this.fetchApi<RouteEntity[]>(`/routes?${params}`);
  }
}
```

Why this pattern? Because I could swap out `fetch` for `axios` or whatever without changing any other code.

## Database Schema Design

### The Prisma Schema

```prisma
// Ship represents a vessel
model Ship {
  id        String   @id @default(uuid())
  name      String
  type      String   // Container, Tanker, Bulk, etc.
  routes    Route[]
  compliance ShipCompliance[]
  bankEntries BankEntry[]
  poolMembers PoolMember[]
}

// Route represents a voyage
model Route {
  id            Int      @id @default(autoincrement())
  routeName     String
  ship          Ship     @relation(fields: [shipId], references: [id])
  shipId        String
  vesselType    String
  fuelType      String
  fuelConsumed  Float    // tons
  distance      Float    // nautical miles
  year          Int
  isBaseline    Boolean  @default(false)
}

// Tracks compliance balance
model ShipCompliance {
  id                 Int      @id @default(autoincrement())
  ship               Ship     @relation(fields: [shipId], references: [id])
  shipId             String
  year               Int
  complianceBalance  Float    // The CB value
  isCompliant        Boolean
  lastUpdated        DateTime @default(now())
  
  @@unique([shipId, year])  // One record per ship per year
}

// Banking transactions
model BankEntry {
  id        Int      @id @default(autoincrement())
  ship      Ship     @relation(fields: [shipId], references: [id])
  shipId    String
  year      Int
  amount    Float
  type      String   // 'BANK' or 'APPLY'
  createdAt DateTime @default(now())
}

// Emissions pools
model Pool {
  id        Int          @id @default(autoincrement())
  year      Int
  totalCB   Float
  members   PoolMember[]
  createdAt DateTime     @default(now())
}

model PoolMember {
  id     Int    @id @default(autoincrement())
  pool   Pool   @relation(fields: [poolId], references: [id])
  poolId Int
  ship   Ship   @relation(fields: [shipId], references: [id])
  shipId String
  cb     Float  // The CB this ship contributes
}
```

### Why These Relationships?

- **Ship → Routes (One-to-Many):** A ship has many routes over time
- **Ship → Compliance (One-to-Many):** One compliance record per year
- **Ship → BankEntries (One-to-Many):** Track all banking transactions
- **Pool → PoolMembers (One-to-Many):** A pool contains multiple ships
- **Ship → PoolMembers (One-to-Many):** A ship can be in multiple pools (different years)

The `@@unique` constraints ensure data integrity:
- Can't have duplicate compliance records for same ship/year
- Baseline flag ensures only one baseline per year

## Key Design Decisions & Trade-offs

### Decision 1: Hexagonal Architecture

**Why:** Flexibility, testability, maintainability

**Trade-off:** More files and indirection. For a small project, might be overkill. But this keeps the code clean as it grows.

### Decision 2: Prisma Over Raw SQL

**Why:** Type safety, migrations, less boilerplate

**Trade-off:** Performance can be slower than raw SQL for complex queries. Haven't hit that limit yet though.

### Decision 3: Server Actions Over API Routes

**Why:** Less boilerplate, better TypeScript integration, automatic serialization

**Trade-off:** Tied to Next.js. If I want to reuse the frontend with a different backend framework, I'd need to refactor.

### Decision 4: Monorepo vs Separate Repos

**Why Separate:** Backend and frontend can be deployed independently, different teams could work on them

**Trade-off:** Have to keep types in sync manually. A monorepo with shared types would be cleaner.

### Decision 5: PostgreSQL Over MongoDB

**Why:** Relational data (ships, routes, pools all have clear relationships), ACID compliance for banking transactions

**Trade-off:** Less flexible schema. But our data model is pretty stable anyway.

## Performance Considerations

### Database Indexes

Added these for common queries:

```prisma
model Route {
  // ...
  @@index([shipId, year])
  @@index([isBaseline, year])
}

model ShipCompliance {
  // ...
  @@index([year])
  @@index([isCompliant])
}
```

### Caching Strategy (Future)

Right now, no caching. For v2, I'd add:

- Redis for frequently accessed data (baseline routes, current year compliance)
- React Query on frontend for automatic cache management
- Stale-while-revalidate for less critical data

### Query Optimization

The `compareRoutes` endpoint used to fetch all routes individually. Now it does:

```typescript
// Before (N+1 queries - BAD)
const routes = await prisma.route.findMany();
for (const route of routes) {
  const ship = await prisma.ship.findUnique({ where: { id: route.shipId }});
}

// After (1 query - GOOD)
const routes = await prisma.route.findMany({
  include: { ship: true }
});
```

Made a huge difference with 100+ routes.

## Security Considerations

### Input Validation

Every endpoint validates input:

```typescript
if (!shipId || typeof year !== 'number') {
  return res.status(400).json({ error: 'Invalid input' });
}
```

### SQL Injection Protection

Prisma parameterizes queries automatically, so we're safe there.

### CORS Configuration

```typescript
// Development: Allow all origins
app.use(cors());

// Production: Whitelist specific domains
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || []
}));
```

### Environment Variables

Never commit `.env` files. Use `.env.example` as a template:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/db
PORT=3000
NODE_ENV=development
```

## Testing Strategy (When I Get Around To It)

### Unit Tests (Domain Logic)

Test pure functions in domain entities:

```typescript
describe('calculateComplianceBalance', () => {
  it('returns positive CB when under target', () => {
    const route = { /* low emissions */ };
    const baseline = { /* high emissions */ };
    
    const cb = calculateComplianceBalance(route, baseline);
    expect(cb).toBeGreaterThan(0);
  });
});
```

### Integration Tests (Use Cases)

Test use cases with mock repositories:

```typescript
describe('bankSurplus', () => {
  it('banks surplus when CB is positive', async () => {
    const mockRepo = {
      getCB: jest.fn().mockResolvedValue(100),
      bankSurplus: jest.fn()
    };
    
    await bankSurplus('SHIP001', 2023, mockRepo);
    expect(mockRepo.bankSurplus).toHaveBeenCalled();
  });
});
```

### E2E Tests (Full Flow)

Test complete user flows:

```typescript
test('user can bank surplus and apply it later', async () => {
  // Bank surplus in 2023
  await page.goto('/banking');
  await page.fill('[name="shipId"]', 'SHIP001');
  await page.fill('[name="year"]', '2023');
  await page.click('button:has-text("Bank Surplus")');
  
  // Apply in 2024
  await page.fill('[name="year"]', '2024');
  await page.click('button:has-text("Apply Banked")');
  
  expect(page.locator('.success-message')).toBeVisible();
});
```

## Deployment Architecture

### Development

```
┌─────────────┐         ┌─────────────┐
│  Frontend   │────────▶│   Backend   │
│ localhost:  │         │ localhost:  │
│    3001     │         │    3000     │
└─────────────┘         └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  PostgreSQL │
                        │   (Local)   │
                        └─────────────┘
```

### Production (Render)

```
┌──────────────┐        ┌──────────────┐
│   Vercel     │────────▶│    Render    │
│  (Frontend)  │  HTTPS  │  (Backend)   │
│              │         │              │
└──────────────┘         └──────┬───────┘
                                │
                                │ Private
                                ▼
                         ┌──────────────┐
                         │  Render PG   │
                         │  (Database)  │
                         └──────────────┘
```

### CI/CD Pipeline (Planned)

```
Push to main
    │
    ├──▶ GitHub Actions
    │       ├──▶ Run tests
    │       ├──▶ Build backend
    │       ├──▶ Deploy to Render
    │       └──▶ Run migrations
    │
    └──▶ Vercel
            ├──▶ Build frontend
            └──▶ Deploy automatically
```

## Monitoring & Logging (Future)

Would add:
- **Sentry** for error tracking
- **LogRocket** for frontend session replay
- **Datadog** for backend metrics
- **Prisma Studio** for database inspection

## Conclusion

This architecture is probably overkill for a project this size, but it scales well and keeps the code clean. The hexagonal approach makes it easy to:

- Test business logic in isolation
- Swap out infrastructure (database, API framework, etc.)
- Add new features without breaking existing ones
- Onboard new developers (clear separation of concerns)

Is it perfect? Nah. But it's pretty solid, and I'd build future projects the same way.

Questions? Improvements? I'm all ears. Open an issue or PR!
