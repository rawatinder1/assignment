# AI Agent Workflow - How I Actually Built This

## The Project

I needed to build a **Maritime Emissions Tracking System** for my project - basically a tool to help shipping companies monitor their carbon footprint and meet EU environmental standards. Real regulations, real calculations, real headaches if you mess up the math.

---

## My Toolbox

### Main Assistant: Claude 3.5 Sonnet via Cursor

Look, I'll be straight with you - AI was incredibly helpful. But I treated it more like a really knowledgeable colleague than a magic wand that writes perfect code.

**How it broke down:**
- ~35% of the code: AI wrote the initial version
- ~65%: Me fixing, refining, and making it actually production-ready

**What I was actually doing:**
1. Designing the system architecture (the hard thinking part)
2. Having AI generate repetitive code patterns
3. Reviewing every single line it produced
4. Debugging and improving what it gave me
5. Making every critical decision myself

---

## The Build Process

### Phase 1: Planning and Foundation

**My preparation work:**
- Spent hours reading about clean architecture patterns
- Studied the EU maritime emission regulations
- Mapped out the data flow and entity relationships  
- Decided on the stack: Next.js, Express, PostgreSQL, TypeScript

**How I prompted Claude:**
```
I'm building a maritime emissions tracking system with clean architecture. 
Need these components:

Core domain:
- Ship voyage records, Emission calculations, Credit management, Fleet pooling

Architecture layers:
- HTTP API layer
- Database layer with PostgreSQL

Generate the folder structure following dependency inversion principles.
Make sure the domain logic doesn't depend on external frameworks.
```

**What I did after getting the output:**
1. Verified the dependency flow was correct
2. Adjusted the folder structure to better fit my needs
3. Configured TypeScript with stricter rules
4. Rewrote the entity models to match regulation requirements

**Reality check:** The generated structure was about 65% correct. Spent another 90 minutes fine-tuning entity definitions, adding custom validators, and restructuring some of the use case logic because the initial approach wasn't quite right for my needs.

---

### Phase 2: Core Calculations (Where the Real Work Happened)

**My research phase:**
- Actually read through EU Regulation 2023/1805 (not fun, but necessary)
- Worked out the emission formulas: `Emission Index = (Reference Level - Current Level) × Fuel Energy`
- Documented all the business rules and constraints
- Figured out the credit banking mechanism

**My prompt to Claude:**
```
Need to implement the emission index calculation use case:

The math: EI = (Reference Level - Actual Level) × Fuel Energy Content
Fuel Energy = Consumption × 41,000 MJ/ton

Business rules:
- Reference levels decrease yearly (3% in 2025, 8% in 2030, etc.)
- Can result in credit (positive) or deficit (negative)  
- Must handle edge cases properly
- Return a well-structured result object

Keep this as pure business logic - no database dependencies mixed in.
```

**What I contributed:**
- Provided the exact regulatory formulas (AI doesn't know niche EU maritime law)
- Defined all the validation constraints
- Created comprehensive test cases
- Handled all the edge cases mentioned in the regulations

**My test approach:**
```typescript
// Created these test scenarios myself
const testScenarios = [
  { emissionLevel: 87.5, expectedStatus: 'credit' },
  { emissionLevel: 93.2, expectedStatus: 'deficit' },
  { emissionLevel: 90.1, expectedStatus: 'compliant' }
];
```

**What I refined:**
- Fixed floating-point precision problems
- Wrote better, more actionable error messages
- Designed the FIFO credit allocation strategy (my algorithm)
- Implemented the pooling distribution logic (greedy algorithm - my choice)

---

### Phase 3: Database Layer Overhaul

**My architectural decision:**
Started with raw SQL queries, but realized Prisma would give me:
- Better type safety across the board
- Cleaner, more maintainable code
- Automatic schema migrations
- Less boilerplate in repositories

**How I asked for help:**
```
Need to refactor the database layer from raw SQL to Prisma ORM.

Current state:
- 5 repository classes using node-postgres
- Complex query logic with manual joins
- String concatenation for SQL (yeah, I know)

Must-haves:
1. Keep all repository interfaces unchanged (can't break the contracts)
2. Translate queries to Prisma syntax
3. Maintain transactional integrity for fleet pooling
4. Full type safety throughout

Let's start with the schema definition, then tackle repositories one by one.
```

**My migration approach:**
1. Carefully reviewed the generated Prisma schema
2. Tested each repository method in isolation  
3. Verified pooling transactions maintained ACID properties
4. Ran performance benchmarks comparing old vs new
5. Fixed several query optimization issues I spotted

**Example of my review:**
```typescript
// What Claude generated:
async findByVoyageId(voyageId: string): Promise<Voyage | null> {
  const voyage = await this.prisma.voyage.findUnique({
    where: { voyageId },
  });
  return voyage ? this.toDomain(voyage) : null;
}

// My checklist:
✅ Correct Prisma query pattern
✅ Null handling is solid
✅ Interface contract maintained
✅ Types are correct
✅ Should add error handling for DB constraints
```

**My improvements:**
- Added strategic database indexes
- Enhanced error handling for unique constraint violations
- Optimized join strategies for complex queries
- Configured connection pool settings

---

### Phase 4: UI Design and Polish

**My design goals:**
- Dark theme with nautical aesthetic
- Clean, professional look (not startup flashy)
- Purposeful animations (smooth but not distracting)
- Error messages that non-technical users can understand

**Color palette I designed:**
```javascript
// My design choices
theme: {
  colors: {
    primary: '#1e3a8a',    // Deep navy blue
    surface: '#0f172a',    // Dark slate
    card: '#1e293b',       // Lighter slate for cards
    success: '#059669',    // Ocean green for compliance
    warning: '#f59e0b',    // Amber for warnings
    danger: '#dc2626',     // Red for violations
  }
}
```

**My instructions to Claude:**
```
Redesign the UI components with this theme:

Style: Dark nautical theme, professional and clean
Colors: [my custom palette above]
Typography: Inter font family, clear hierarchy
Components: Subtle glassmorphism on cards, soft shadows
Icons: Use Lucide icons - nautical theme (ship, waves, anchor)
Animations: Gentle fade-in and slide effects, max 400ms duration

Update all page components and shared UI elements.
Don't break any existing functionality.
```

**My quality checks:**
1. Verified WCAG color contrast compliance
2. Tested responsive layouts on different devices
3. Ensured animations ran at 60fps
4. Confirmed no regressions in functionality
5. Validated icon choices fit the context

**My adjustments:**
- Simplified some component structures for better reusability
- Fine-tuned animation curves based on feel
- Redesigned data tables for better information density
- Added dynamic status indicators with color coding

---

### Phase 5: User-Friendly Error Handling

**The initial problem:**
Error messages were way too technical. "Voyage record for year 2025 conflicts with calculation year 2024" - okay, but what should I actually do?

**My requirements:**
- Convert technical errors to plain language
- Provide actionable next steps
- No server-side jargon in user-facing messages

**My detailed prompt:**
```
Create a comprehensive error handling system:

1. Error parsing layer:
   - Extract meaningful info from HTTP errors
   - Classify: network issues, server errors, client validation
   - Transform technical messages

2. User-friendly translations:
   Before: "Voyage record for year 2025 conflicts with calculation year 2024"
   After: "The selected voyage and year don't match"
   
   Before: "Insufficient emission credits for offset operation"
   After: "Not enough credits available for this offset"

3. Actionable guidance:
   - Focus on what users can do in the interface
   - No technical commands or backend suggestions
   - Example: "Select a different voyage from the list"

4. Visual presentation:
   - Color-coded severity levels
   - Separate suggestion section  
   - Consistent with dark theme

Create in: lib/errorHandler.ts and update ErrorDisplay component.
```

**My test scenarios:**
```typescript
const errorTests = [
  {
    trigger: 'API server offline',
    expectedMsg: 'Unable to connect to server',
    expectedHint: 'Check your connection and try again'
  },
  {
    trigger: 'Year mismatch validation',
    expectedMsg: 'Voyage and calculation year mismatch',
    expectedHint: 'Adjust the year selector to match the voyage'
  }
];
```

**My refinements:**
- Built pattern matching for domain-specific errors
- Made suggestions contextually aware
- Eliminated all technical terminology
- User-tested messages with non-developers

---

## My Strategic AI Usage

### Where AI Helped Most

**1. Scaffolding and boilerplate (~40% of code)**
- Interface definitions in TypeScript
- Standard CRUD repository methods
- Component structure with props
- API route handlers

**My part:** Generate skeleton, implement business logic myself.

**2. Pattern-based transformations (~20% of code)**
- Migrating SQL to Prisma queries
- Applying design system across components
- Maintaining code consistency

**My part:** Define transformation rules, validate each change.

**3. Code restructuring (~15% of code)**
- Refactoring to different patterns
- Bulk import updates
- Consistency enforcement

**My part:** Set constraints, ensure nothing breaks.

### What I Owned Completely

**1. System Design (100%)**
- Chose clean architecture approach
- Designed entity relationships
- Defined layer boundaries  
- Created port/adapter contracts

**2. Business Rules (100%)**
- Studied regulatory requirements
- Derived calculation formulas
- Designed validation logic
- Created allocation algorithms

**3. User Experience (100%)**
- Designed color schemes
- Selected animation styles
- Crafted error messages
- Made all UX decisions

**4. Quality Assurance (100%)**
- Tested all features
- Verified calculations
- Reviewed code quality
- Ensured type correctness

---

## Time Investment Analysis

| Task | Time With AI | Manual Estimate |
|------|-------------|-----------------|
| **Design & Planning** | 2.5 hours | 2.5 hours |
| **Requirement Analysis** | 2 hours | 2 hours |
| **Code Implementation** | 1.5 hours | 22 hours |
| **Testing & QA** | 2 hours | 4 hours |
| **UI/UX Work** | 1.5 hours | 9 hours |
| **Refactoring** | 1 hour | 5 hours |
| **Total** | **~10.5 hours** | **~44.5 hours** |

**Key takeaway:** Design and thinking time stayed constant. AI accelerated implementation and repetitive work.

---

## My Code Review Checklist

For every piece of generated code, I verified:

- **Type Safety**: Proper TypeScript usage throughout
- **Business Logic**: Actually matches requirements
- **Architecture**: Follows clean architecture principles
- **Error Handling**: Comprehensive try-catch blocks
- **Performance**: No obvious inefficiencies
- **Consistency**: Matches existing code patterns
- **Testability**: Easy to write tests for

### Quality Standards
```typescript
// My non-negotiables:
const standards = {
  compilation: 'Must pass strict TypeScript checks',
  linting: 'Zero ESLint errors or warnings',
  functionality: 'Works correctly in manual testing',
  maintainability: 'I can explain every line',
  documentation: 'Comments are clear and accurate'
};
```

---

## Skills I Actually Used

### Technical Decisions I Made
1. **Architecture**: Selected clean architecture over traditional MVC
2. **ORM Choice**: Picked Prisma for type safety and DX
3. **State Strategy**: Used server components with minimal client state
4. **Error Strategy**: Multi-layer error handling approach
5. **Styling**: Tailwind utility-first approach

### Domain Knowledge Applied
- Interpreted maritime emission regulations
- Translated legal requirements to business rules
- Designed calculation algorithms
- Created validation rules
- Defined user workflows

### Quality Standards Enforced
- Strict TypeScript configuration
- Comprehensive error handling
- Consistent naming conventions
- Complete type coverage
- Performance considerations

---

## My Development Flow

### 1. **Design Phase** (100% Me)
- Sketch system architecture
- Define data models
- Design user flows
- Create mockups

### 2. **Implementation** (AI-Assisted)
- Write detailed specs
- Generate initial code with AI
- Review and refine thoroughly
- Test everything

### 3. **Refinement** (100% Me)
- Optimize performance
- Improve error handling
- Polish user experience
- Fine-tune details

### 4. **Quality Control** (100% Me)
- Manual testing
- Code review
- Security audit
- Performance validation

---

## Code Ownership Reality

```
Total Codebase: ~7,500 lines

My Original Work:
├── Architecture & Patterns: 100%
├── Business Logic: 100%
├── Test Cases: 100%
└── Final Decisions: 100%

AI-Generated (my specs):
├── Scaffolding: ~40%
├── CRUD Operations: ~30%
├── Type Definitions: ~20%
└── UI Styling: ~25%

Collaborative:
├── Database Queries: ~50/50
├── Error Handling: ~65/35 (Me/AI)
├── Components: ~55/45 (Me/AI)
└── API Routes: ~45/55 (Me/AI)
```

**Reality check:**
- AI contribution to final code: ~35%
- My contribution (design + review + refinement): ~65%

---

## What Actually Worked

### 1. **Detailed Specifications**
❌ Bad: "Create a credit banking system"
✅ Good: Provide exact formulas, edge cases, validation rules, and expected behavior

### 2. **Incremental Approach**
❌ Bad: "Build the entire system"
✅ Good: One layer at a time, validate each step

### 3. **Critical Review**
❌ Bad: Copy-paste generated code
✅ Good: Read and understand every line

### 4. **Domain First**
❌ Bad: Let AI make business decisions
✅ Good: Research domain deeply, specify clearly

### 5. **Own Your Tests**
❌ Bad: Trust generated code works
✅ Good: Test all scenarios thoroughly

---

## Key Insights

### 1. **AI is a Power Tool, Not a Solution**
I made architectural choices, designed business logic, and ensured quality. AI accelerated implementation of my designs.

### 2. **Specification Quality = Output Quality**
Better specs led to better code. This forced clearer thinking about requirements.

### 3. **Domain Understanding is Critical**
Without understanding maritime regulations, I couldn't validate business logic or create proper tests.

### 4. **Code Review is Essential**
Every generated line needed scrutiny. Caught edge cases, improved error handling, enhanced performance.

### 5. **Iterative Improvement Works**
First output rarely perfect. Multiple refinement cycles based on my feedback improved quality significantly.

---

## What Made This Work

### My Critical Contributions

1. **Clear Vision**: Knew exactly what needed building
2. **Solid Foundation**: Strong architecture from start
3. **Domain Expertise**: Deep understanding of requirements
4. **Quality Focus**: Never compromised on code quality
5. **User Perspective**: Always considered end-user needs
6. **Comprehensive Testing**: Validated everything thoroughly

### AI's Contributions

1. **Velocity**: Faster implementation of my designs
2. **Consistency**: Uniform pattern application
3. **Boilerplate**: Handled repetitive structures
4. **Refactoring**: Quick bulk changes

---

## Required Skills (Despite AI)

To effectively use AI, I needed:

- **Architecture Knowledge**: Design maintainable systems
- **Domain Expertise**: Validate business logic
- **Code Review Skills**: Spot issues in generated code
- **Testing Ability**: Verify functionality
- **UX Intuition**: Create usable interfaces
- **Quality Standards**: Maintain code excellence
- **Critical Thinking**: Question and improve outputs

**Reality:** AI didn't reduce skill requirements—it amplified their impact.

---

## Conclusion

AI tools served as an **intelligent accelerator** in my development process. They didn't replace my skills; they amplified my productivity by handling repetitive tasks while I focused on:

- Architecture and design decisions
- Business logic correctness
- User experience quality
- Code review and validation
- Testing and quality assurance

The result is code I fully understand, can maintain, and completely own. AI was a tool that helped me build faster, not a replacement for actually knowing how to develop software.

**Time invested:** ~10.5 hours  
**Code ownership:** 100%  
**AI's role:** Accelerator, not replacement

---

**Approach:** AI-assisted development with full developer control  
**Quality:** Production-ready, thoroughly tested, maintainable  
**Skills Used:** Architecture, domain modeling, testing, UX design, code review  
**Learning:** AI amplifies capabilities when used strategically with strong fundamentals