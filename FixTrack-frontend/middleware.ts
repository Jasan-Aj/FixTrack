import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleRoutes: Record<string, string> = {
  student: "/student/dashboard",
  tech: "/tech/dashboard",
  admin: "/admin/dashboard",
};

function decodeToken(token: string): { role?: string; sub?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (pathname === "/" || pathname === "/login") {
    return NextResponse.next();
  }

  // Only protect dashboard routes
  const isDashboardRoute = Object.values(roleRoutes).some((route) =>
    pathname.startsWith(route)
  );

  if (!isDashboardRoute) {
    return NextResponse.next();
  }

  // Check for token
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT to check role
  const payload = decodeToken(token);
  if (!payload || !payload.role) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = payload.role;
  const expectedRoute = roleRoutes[userRole];

  // Redirect if user is on wrong dashboard for their role
  if (expectedRoute && !pathname.startsWith(expectedRoute)) {
    return NextResponse.redirect(new URL(expectedRoute, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
