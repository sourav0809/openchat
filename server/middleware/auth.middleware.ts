import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../app/api/auth/[...nextauth]/route";

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
}

/**
 * Middleware to authenticate API requests
 * Ensures user is logged in and attaches user info to request
 */
export async function authenticateRequest(): Promise<
  { user: AuthenticatedRequest["user"] } | { error: NextResponse }
> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        error: NextResponse.json(
          { error: "Unauthorized - Please log in to access this resource" },
          { status: 401 }
        ),
      };
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "",
        image: session.user.image || "",
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      error: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */
export function withAuth<T>(
  handler: (request: AuthenticatedRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    const auth = await authenticateRequest();

    if ("error" in auth) {
      return auth.error;
    }

    // Attach user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = auth.user;

    return handler(authenticatedRequest, context);
  };
}
