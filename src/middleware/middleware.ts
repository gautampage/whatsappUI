import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  try {
    // Get session token from cookies if available (for server-side checking)
    const sessionToken = request.cookies.get("sessionToken")?.value;

    // Check if user is trying to access protected routes
    if (request.nextUrl.pathname.startsWith("/chat")) {
      // For server-side checking, we can't access localStorage
      // The client-side ProtectedRoute component will handle the detailed session validation
      console.log("🔐 Middleware: Checking access to protected route");

      // Allow the request to proceed - client-side protection will handle the rest
      return NextResponse.next();
    }

    // Allow access to root and login pages
    if (
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname.startsWith("/login")
    ) {
      return NextResponse.next();
    }
  } catch (error) {
    console.error("Middleware error:", error);
  }

  return NextResponse.next();
}
