import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getCurrentUser } from "@/lib/auth";

// Worker base URL
const WORKER_URL =
  process.env.IMAGE_WORKER_URL ||
  "https://photo-friendpay.6534414023.workers.dev";
const IMAGE_SECRET = process.env.IMAGE_SECRET || "";

// URL expiry time in seconds (60 seconds = 1 minute)
const URL_EXPIRY_SECONDS = 60;

/**
 * Generate a signed image URL compatible with the Cloudflare Worker
 *
 * POST /api/image-url
 * Body: { key: "qrcodes/userId/filename.png" }
 * Returns: { url: "https://worker.dev/key?exp=xxx&sig=xxx" }
 */
export async function POST(request: Request) {
  try {
    // Step 1: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Get the image key from request body
    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing image key" }, { status: 400 });
    }

    // Step 3: Normalize the key
    // Handle legacy data: if it's a full URL, extract just the path
    let normalizedKey = key;

    // Remove any URL prefix (handles both cdn.moneyboys.com and other domains)
    if (
      normalizedKey.startsWith("http://") ||
      normalizedKey.startsWith("https://")
    ) {
      try {
        const url = new URL(normalizedKey);
        normalizedKey = url.pathname;
      } catch {
        // If URL parsing fails, continue with the original key
      }
    }

    // Remove leading slashes and collapse multiple slashes
    normalizedKey = normalizedKey
      .replace(/^\/+/, "") // Remove leading slashes
      .replace(/\/+/g, "/"); // Collapse multiple slashes

    // Step 4: (Optional) Verify user has access to this image
    // For public images like QR codes, we skip this check
    // For private images, you could check: normalizedKey.includes(user.id)

    // Step 5: Generate expiration timestamp (current time + expiry)
    const exp = Math.floor(Date.now() / 1000) + URL_EXPIRY_SECONDS;

    // Step 6: Create HMAC-SHA256 signature
    // Format: HMAC(secret, "key:exp")
    const data = `${normalizedKey}:${exp}`;
    const sig = createHmac("sha256", IMAGE_SECRET).update(data).digest("hex");

    // Step 7: Construct the signed URL
    const signedUrl = `${WORKER_URL}/${normalizedKey}?exp=${exp}&sig=${sig}`;

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Generate image URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
