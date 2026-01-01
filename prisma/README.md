# Prisma Database Setup

FriendPay uses Prisma ORM with PostgreSQL for database management.

## Database Schema

### Models

- **User** - App users with email and profile info
- **Group** - Expense groups (e.g., "Trip to Chiang Mai")
- **GroupMember** - Many-to-many relationship between Users and Groups
- **Expense** - Individual expenses with amount, title, and receipt
- **ExpenseSplit** - How an expense is split among group members
- **Settlement** - Tracking who owes whom and payment status

## Setup

1. **Configure Database URL**

In `prisma.config.ts`, update the DATABASE_URL:

```typescript
datasource: {
  url: process.env["DATABASE_URL"],
}
```

Or set in `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/moneyboy"
```

2. **Generate Prisma Client**

```bash
npx prisma generate
```

3. **Create Migration**

```bash
npx prisma migrate dev --name init
```

4. **Open Prisma Studio** (optional)

```bash
npx prisma studio
```

## Usage

Import the Prisma client in your code:

```typescript
import prisma from "@/lib/prisma";

// Example: Get all groups
const groups = await prisma.group.findMany({
  include: {
    members: {
      include: {
        user: true,
      },
    },
  },
});
```

## ER Diagram

```
User ────< GroupMember >──── Group
 │                            │
 │                            │
 └──< Expense                 │
      │                       │
      └──< ExpenseSplit       │
                              │
Settlement ──────────────────┘
```
