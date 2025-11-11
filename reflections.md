# Building This App: What I Actually Learned

## The Journey (And Why AI Agents Are Pretty Cool)

So I built this Fuel EU Maritime compliance tracker, and honestly? Using AI agents made a huge difference in how I approached the whole thing. Let me break down what actually happened.

## What I Learned Using AI Agents

### They're Great at the Boring Stuff

The best part about using AI? I could throw a bunch of code at it and say "explain what this does" and get back a coherent summary in seconds. No more spending 30 minutes reading through a file trying to figure out what the previous developer (or past me) was thinking.

For example, when I was trying to understand the Prisma schema and how it connected to the rest of the app, I just asked the AI to map out the relationships. Boom - instant diagram in my head. Would've taken me way longer manually.

### Code Generation Was Hit or Miss

Here's the truth: AI is amazing at generating boilerplate but sometimes creates code that *looks* right but isn't. I learned to:

1. **Always review everything** - the AI once generated a Prisma query that would've worked but was super inefficient
2. **Use it for structure, not blind copy-paste** - I'd ask for the skeleton of a function, then fill in the actual business logic myself
3. **Test everything twice** - AI-generated code can have subtle bugs that only show up in edge cases

The TypeScript type definitions though? Chef's kiss. AI absolutely crushed those.

### It Taught Me Patterns I Didn't Know

The hexagonal architecture pattern? I'd heard of it but never really used it. The AI helped me understand it by generating examples and explaining the "why" behind each layer. That's the kind of learning that would've taken me days of reading blog posts and documentation.

Same with some of the more advanced TypeScript patterns. I learned about discriminated unions and proper error handling just by asking "how can I make this type-safe?"

## Efficiency Gains vs. Manual Coding

Let me be real about the numbers here:

### What Got Faster (Like, Way Faster)

**Initial Setup - 75% Time Savings**

Setting up the project structure, installing dependencies, configuring TypeScript/ESLint/Prettier - all that stuff that's necessary but tedious? AI helped me knock that out in maybe 30 minutes instead of 2-3 hours.

```
Traditional: ~3 hours
With AI: ~45 minutes
```

**Writing Type Definitions - 60% Time Savings**

I had all these entities (RouteEntity, ComplianceEntity, etc.) that needed TypeScript interfaces. Instead of manually typing them out and constantly fighting with type errors, I described what I needed and the AI generated them. Then I just reviewed and tweaked.

```
Traditional: ~2 hours
With AI: ~50 minutes
```

**Documentation - 80% Time Savings**

Writing docs is my least favorite part of coding (I know, I know, I should love it). The AI helped me generate the initial structure and explanations, which I then rewrote to sound less robotic. Much faster than starting from a blank page.

```
Traditional: ~4 hours
With AI: ~1 hour (including rewriting)
```

### What Didn't Get Faster (The Reality Check)

**Business Logic - Maybe 20% Time Savings**

The core calculations (compliance balance, emissions pooling, etc.) still required me to think deeply about the requirements. The AI could help with syntax, but understanding the actual EU regulations and translating them into code? That was all me.

I tried having AI write the compliance calculation logic and it got close but missed some important edge cases. I ended up rewriting most of it.

**Debugging - Actually Got Slower Sometimes**

When AI-generated code had bugs, debugging was harder because I didn't write it originally. I had to first understand what the AI was trying to do, THEN figure out why it wasn't working. With my own code, I already know the intent.

**Architecture Decisions - No Time Savings**

Deciding whether to use server actions vs. API routes, how to structure the database schema, where to put business logic - these decisions take time and thought. AI can suggest options, but ultimately you have to make the call based on your specific needs.

## The Real Numbers

If I'm honest about the total project time:

**Estimated time without AI:** ~80 hours
**Actual time with AI:** ~50 hours
**Time savings:** ~38%

That's significant! But it's not the "10x productivity" some people claim. It's more like 1.5x-2x for a project like this.

## What Actually Made Me More Productive

1. **Faster iteration** - I could try different approaches quickly
2. **Less context switching** - Instead of googling "prisma many-to-many relationship" and getting lost in docs, I just asked
3. **Better error messages** - When I hit a TypeScript error I didn't understand, AI could explain it
4. **Learning while building** - I learned new patterns and best practices as I went

## What Didn't Work Well

### When AI Hallucinated

AI confidently told me about a Prisma feature that doesn't exist. I wasted 20 minutes trying to use it before realizing it made it up. Lesson learned: verify everything, especially if it sounds too good to be true.

### When It Gave Me Outdated Code

Some of the Next.js patterns it suggested were from version 12, but I'm using 15. The syntax had changed. I had to cross-reference with official docs anyway.

### When I Became Dependent

I caught myself asking AI for things I should know how to do. Like basic array methods or simple TypeScript types. That's a trap - you still need to understand the fundamentals.

## Improvements I'd Make Next Time

### 1. Better Prompting From Day One

I got better at prompting as I went along, but I should've started with more specific, detailed prompts. Instead of:

> "Create a route repository"

I should've led with:

> "Create a route repository using Prisma that implements the RouteRepositoryPort interface. It should include error handling, proper TypeScript types, and follow the hexagonal architecture pattern. Include methods for filtering by vessel type, fuel type, and year."

The second prompt gives way better results.

### 2. Test-Driven Development with AI

Next time, I'd generate tests FIRST with AI, then write the actual code. This would help catch issues earlier and ensure the AI-generated code actually works the way I expect.

### 3. Use AI for Code Review

I should've been pasting my code back to AI and asking "what could go wrong with this?" or "what edge cases am I missing?" That would've caught bugs before they hit production.

### 4. Document While Building

Instead of writing docs at the end (which I hate), I should've used AI to generate documentation as I wrote each feature. Would've been more accurate and saved time later.

### 5. Keep a "Decision Log"

I wish I'd documented all the architectural decisions and why I made them. AI could've helped generate this as I went. Would be super valuable for future me or other contributors.

## The Bottom Line

Would I use AI agents again? Absolutely. They're not magic and they're not going to replace developers anytime soon, but they're incredibly useful tools.

The key is understanding that AI is:
- **Great at:** Boilerplate, documentation, explaining concepts, suggesting patterns
- **Okay at:** Business logic, debugging, architecture decisions
- **Bad at:** Understanding your specific requirements, knowing your domain, catching subtle bugs

### My Rule of Thumb Now

**Use AI for speed, not as a shortcut for understanding.**

If I don't understand what the AI-generated code does, I don't use it. Period. It's a productivity tool, not a replacement for actually knowing how to code.

### The Most Valuable Thing I Learned

It's not about the code AI can write for me. It's about how AI can help me learn faster and iterate quicker. The real productivity gain comes from:

1. Spending less time stuck on syntax or API documentation
2. Trying multiple approaches without committing to one
3. Learning new patterns and techniques in context
4. Getting unstuck faster when I hit a wall

## What's Next

For my next project, I want to:

- Build with AI from day one (not retrofit it in)
- Use AI to generate comprehensive tests
- Have AI help me with code reviews before I commit
- Use it more for documentation as I build
- Experiment with AI for UI/UX suggestions

But most importantly, I want to keep learning. AI is a tool that makes me better at my job, but only if I understand what's happening under the hood.

## Final Thoughts

Building this app was fun, educational, and honestly? Pretty smooth compared to some of my past projects. AI agents deserve a lot of credit for that.

But here's what didn't change: I still had to understand the problem domain, make tough architecture decisions, write tests, debug weird issues, and ship working software.

AI made me faster. But it didn't make me a developer. That's still on me.

And you know what? I'm okay with that. The craft of software engineering is still very much alive. We just have better tools now.

---

Would I recommend using AI for your next project? 100%. Just remember: it's a co-pilot, not an auto-pilot.

P.S. - Yes, I used AI to help edit parts of this reflection doc. The irony is not lost on me. 😄