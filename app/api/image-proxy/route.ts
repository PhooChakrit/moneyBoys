import { NextResponse } from "next/server";
import { createHmac } from "crypto";

// Worker base URL
const WORKER_URL =
  process.env.IMAGE_WORKER_URL ||
  "https://photo-friendpay.6534414023.workers.dev";
const IMAGE_SECRET = process.env.IMAGE_SECRET || "";

// URL expiry time in seconds
const URL_EXPIRY_SECONDS = 300; // 5 minutes for proxy

/**
 * GET /api/image-proxy?key=<object-key>
 * Returns a redirect to a signed image URL
 * This allows displaying images without exposing signed URLs to the client
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing image key" }, { status: 400 });
    }

    // Normalize the key
    // Handle legacy data: if it's a full URL, extract just the path
    if (key.startsWith("http://") || key.startsWith("https://")) {
      try {
        const url = new URL(key);
        key = url.pathname;
      } catch {
        // If URL parsing fails, continue with the original key
      }
    }

    // Remove leading slashes and collapse multiple slashes
    const normalizedKey = key.replace(/^\/+/, "").replace(/\/+/g, "/");

    // Generate expiration timestamp
    const exp = Math.floor(Date.now() / 1000) + URL_EXPIRY_SECONDS;

    // Create HMAC-SHA256 signature
    const data = `${normalizedKey}:${exp}`;
    const sig = createHmac("sha256", IMAGE_SECRET).update(data).digest("hex");

    // Construct the signed URL
    const signedUrl = `${WORKER_URL}/${normalizedKey}?exp=${exp}&sig=${sig}`;

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
