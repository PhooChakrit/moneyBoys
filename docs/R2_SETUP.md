# Cloudflare R2 Storage Setup

MoneyBoy uses Cloudflare R2 for image storage (avatars, receipts). The database only stores URLs.

## Setup Steps

### 1. Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Name it `moneyboy` (or your preferred name)
5. Click **Create bucket**

### 2. Generate API Tokens

1. In R2, go to **Manage R2 API Tokens**
2. Click **Create API token**
3. Set permissions: **Object Read & Write**
4. Copy the **Access Key ID** and **Secret Access Key**

### 3. Configure Public Access (Optional)

**Option A: Custom Domain**

1. In your bucket settings, go to **Settings** → **Public Access**
2. Click **Connect Domain**
3. Enter your subdomain (e.g., `cdn.moneyboy.com`)
4. Follow DNS setup instructions

**Option B: R2.dev Domain**

1. Enable **R2.dev subdomain** in bucket settings
2. Use the provided URL: `https://<bucket-name>.<account-id>.r2.dev`

### 4. Update Environment Variables

Copy `env.example` to `.env` and fill in:

```env
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key-id>
R2_SECRET_ACCESS_KEY=<your-secret-access-key>
R2_BUCKET_NAME=moneyboy
R2_PUBLIC_URL=https://cdn.moneyboy.com  # or your R2.dev URL
```

## Usage

### Upload from Client

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("folder", "receipts"); // or "avatars"

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

const { url } = await response.json();
// Save this URL to the database
```

### Upload from Server

```typescript
import { uploadToR2 } from "@/lib/r2-upload";

const url = await uploadToR2(file, "avatars");
// Save to database
await prisma.user.update({
  where: { id: userId },
  data: { avatar: url },
});
```

### Delete Files

```typescript
import { deleteFromR2 } from "@/lib/r2-upload";

await deleteFromR2(oldAvatarUrl);
```

## Database Integration

Images are stored as URLs in Prisma:

```typescript
// User avatar
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    avatar: "https://cdn.moneyboy.com/avatars/123.jpg", // R2 URL
  },
});

// Expense receipt
const expense = await prisma.expense.create({
  data: {
    title: "Dinner",
    amount: 500,
    receiptUrl: "https://cdn.moneyboy.com/receipts/456.jpg", // R2 URL
    // ...
  },
});
```

## Folder Structure

```
moneyboy/              # R2 bucket
├── avatars/          # User profile pictures
├── receipts/         # Expense receipts
└── groups/           # Group cover images (future)
```

## Cost Estimation

R2 pricing (as of 2024):

- Storage: $0.015/GB/month
- Class A operations: $4.50/million
- Class B operations: $0.36/million
- **No egress fees** (free bandwidth)

Example for 1000 users:

- 1000 avatars × 100KB = ~100MB
- 10,000 receipts × 200KB = ~2GB
- Total storage: ~2.1GB = **$0.03/month**
