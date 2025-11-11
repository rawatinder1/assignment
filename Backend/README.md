# Fuel EU Maritime - Backend

## Setup Instructions

### 1. Navigate to Backend directory
```bash
cd Backend
```

### 2. Create `.env` file
Copy `.env.example` to `.env` and update with your database credentials:
```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:
```
DATABASE_URL="postgresql://user:password@localhost:5432/fueleu_maritime?schema=public"
PORT=3000
```

### 3. Install dependencies
```bash
npm install
```

### 4. Generate Prisma Client
```bash
npm run prisma:generate
```

### 5. Run migrations
```bash
npm run prisma:migrate
```

### 6. Seed the database
```bash
npm run seed
```

### 7. Start the development server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm run build` - Build TypeScript to JavaScript
- `npm run seed` - Seed database with sample data
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## API Endpoints

### Routes
- `GET /routes` - Get all routes (with optional filters: ?vesselType=X&fuelType=Y&year=Z)
- `GET /routes/comparison` - Get comparison data (baseline vs all routes)
- `POST /routes/:id/baseline` - Set a route as baseline

### Compliance
- `GET /compliance/cb?shipId=XXX&year=YYYY` - Get/Compute compliance balance
- `GET /compliance/adjusted-cb?shipId=XXX&year=YYYY` - Get adjusted CB after banking

### Banking
- `GET /banking/records?shipId=XXX&year=YYYY` - Get bank records
- `POST /banking/bank` - Bank positive CB surplus (body: `{ shipId, year }`)
- `POST /banking/apply` - Apply banked surplus (body: `{ shipId, year, amount }`)

### Pooling
- `POST /pools` - Create a pool (body: `{ year, members: [{ shipId }] }`)

### Health Check
- `GET /health` - Health check endpoint

