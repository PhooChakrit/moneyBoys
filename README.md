# FriendPay 💸

A modern expense splitting and group payment management app built with Next.js 15. Track shared expenses, split bills with friends, and settle debts easily.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)

## ✨ Features

- **Group Management** - Create groups, invite friends with shareable links
- **Expense Tracking** - Add expenses with custom splits (equal, percentage, or custom amounts)
- **Smart Settlements** - Calculate optimal payment paths to minimize transactions
- **Multi-language** - Supports English and Thai (`next-intl`)
- **Dark Mode** - System-aware theme switching
- **Payment QR Codes** - Generate QR codes for easy mobile payments
- **Image Storage** - Profile pictures and receipts stored on Cloudflare R2

## 🛠️ Tech Stack

| Category             | Technology                          |
| -------------------- | ----------------------------------- |
| Framework            | Next.js 15 (App Router + Turbopack) |
| Language             | TypeScript                          |
| Database             | PostgreSQL + Prisma ORM             |
| Styling              | Tailwind CSS 4                      |
| UI Components        | Radix UI + shadcn/ui                |
| State Management     | Zustand                             |
| Authentication       | Custom session-based auth           |
| File Storage         | Cloudflare R2 (S3-compatible)       |
| Internationalization | next-intl                           |

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Cloudflare R2 bucket (for file storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/friendpay"

   # Cloudflare R2
   R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
   R2_ACCESS_KEY_ID="your-access-key"
   R2_SECRET_ACCESS_KEY="your-secret-key"
   R2_BUCKET_NAME="your-bucket"
   R2_PUBLIC_URL="https://your-r2-public-domain.com"
   IMAGE_WORKER_URL="https://your-r2-public-domain.com"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
my-app/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── (main)/        # Main app pages (protected)
│   │   ├── login/         # Auth pages
│   │   └── register/
│   └── api/               # API routes
├── features/              # Feature-based modules
│   ├── auth/              # Authentication context
│   ├── expense/           # Add/edit expenses
│   ├── groups/            # Group management
│   ├── history/           # Transaction history
│   ├── home/              # Dashboard
│   ├── payment-method/    # Bank account settings
│   ├── settings/          # App settings
│   └── settlement/        # Debt settlement
├── components/            # Shared UI components
├── lib/                   # Utilities and configs
├── messages/              # i18n translation files
└── prisma/                # Database schema
```

## 🧪 Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start development server (Turbopack) |
| `npm run build`        | Build for production                 |
| `npm run start`        | Start production server              |
| `npm run lint`         | Run ESLint                           |
| `npm run prettier-fix` | Format code with Prettier            |
| `npm run seed`         | Seed demo data                       |
| `npm run db:clear`     | Clear all database data              |
| `npm run db:cleanup`   | Clean up expired sessions            |

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in project settings
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:

- `DATABASE_URL`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `IMAGE_WORKER_URL`

## 📄 License

MIT
