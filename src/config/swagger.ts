import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MatchDB Shell Services API",
      version: "1.0.0",
      description:
        "Authentication & Payments API for the MatchDB platform. Handles user registration, login, Google OAuth, JWT token management, Stripe subscriptions, and candidate package purchases.",
      contact: { name: "MatchDB Team" },
    },
    servers: [
      { url: "/api", description: "Default (relative)" },
      { url: "http://localhost:8000/api", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────
        RegisterRequest: {
          type: "object",
          required: [
            "email",
            "password",
            "first_name",
            "last_name",
            "user_type",
          ],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            first_name: { type: "string" },
            last_name: { type: "string" },
            user_type: { type: "string", enum: ["vendor", "candidate"] },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/UserResponse" },
          },
        },
        UserResponse: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            user_type: { type: "string", enum: ["vendor", "candidate"] },
            plan: {
              type: "string",
              enum: ["free", "basic", "pro", "pro_plus"],
            },
            username: { type: "string" },
            membership_config: { type: "object", nullable: true },
            has_purchased_visibility: { type: "boolean" },
          },
        },
        RefreshRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" },
          },
        },
        // ── Payments ──────────────────────────────────────────────
        VendorPlan: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            price: { type: "number" },
            interval: { type: "string", nullable: true },
            features: { type: "array", items: { type: "string" } },
            stripePriceId: { type: "string" },
          },
        },
        CandidatePackage: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            price: { type: "number" },
            description: { type: "string" },
          },
        },
        Subscription: {
          type: "object",
          properties: {
            plan: { type: "string" },
            status: { type: "string" },
            current_period_end: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            membership_config: { type: "object", nullable: true },
          },
        },
        CheckoutRequest: {
          type: "object",
          required: ["priceId"],
          properties: {
            priceId: { type: "string" },
            membershipConfig: { type: "object", nullable: true },
          },
        },
        CandidateCheckoutRequest: {
          type: "object",
          required: ["packageId"],
          properties: {
            packageId: { type: "string" },
            selectedSubdomains: { type: "array", items: { type: "string" } },
          },
        },
        CheckoutResponse: {
          type: "object",
          properties: {
            url: { type: "string", description: "Stripe Checkout session URL" },
          },
        },
        PortalResponse: {
          type: "object",
          properties: {
            url: { type: "string", description: "Stripe Customer Portal URL" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    // ── Paths (inline — no JSDoc annotations needed) ──────────────
    paths: {
      // ===== AUTH ===================================================
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          description:
            "Creates a vendor or candidate account with email/password. A welcome email is sent via SendGrid.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "User created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            409: { description: "Email already registered" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with email & password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "New token pair",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            401: { description: "Invalid refresh token" },
          },
        },
      },
      "/auth/verify": {
        get: {
          tags: ["Auth"],
          summary: "Verify current token & return user data",
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: "Token valid",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserResponse" },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout (revoke refresh tokens)",
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: "Logged out" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/auth/account": {
        delete: {
          tags: ["Auth"],
          summary: "Delete current user account",
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: "Account deleted" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/auth/google": {
        get: {
          tags: ["Auth"],
          summary: "Initiate Google OAuth flow",
          parameters: [
            {
              name: "userType",
              in: "query",
              required: true,
              schema: { type: "string", enum: ["vendor", "candidate"] },
            },
          ],
          responses: {
            302: { description: "Redirect to Google consent screen" },
          },
        },
      },
      "/auth/google/callback": {
        get: {
          tags: ["Auth"],
          summary: "Google OAuth callback",
          description:
            "Handles the redirect from Google after user consent. Redirects to the frontend with token params.",
          responses: {
            302: { description: "Redirect to frontend with auth tokens" },
          },
        },
      },
      // ===== PAYMENTS ===============================================
      "/payments/plans": {
        get: {
          tags: ["Payments"],
          summary: "List vendor subscription plans",
          responses: {
            200: {
              description: "Plan list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/VendorPlan" },
                  },
                },
              },
            },
          },
        },
      },
      "/payments/candidate-packages": {
        get: {
          tags: ["Payments"],
          summary: "List candidate visibility packages",
          responses: {
            200: {
              description: "Package list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/CandidatePackage" },
                  },
                },
              },
            },
          },
        },
      },
      "/payments/subscription": {
        get: {
          tags: ["Payments"],
          summary: "Get current user subscription status",
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: "Subscription data",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Subscription" },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/payments/checkout": {
        post: {
          tags: ["Payments"],
          summary: "Create Stripe Checkout session (vendor subscription)",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CheckoutRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Checkout URL",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CheckoutResponse" },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/payments/candidate-checkout": {
        post: {
          tags: ["Payments"],
          summary: "Create Stripe Checkout session (candidate package)",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CandidateCheckoutRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Checkout URL",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CheckoutResponse" },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/payments/portal": {
        post: {
          tags: ["Payments"],
          summary: "Create Stripe Customer Portal session",
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: "Portal URL",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PortalResponse" },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/payments/webhook": {
        post: {
          tags: ["Payments"],
          summary: "Stripe webhook endpoint",
          description:
            "Receives Stripe events (checkout.session.completed, customer.subscription.updated, etc.). Uses raw body parsing.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: {
            200: { description: "Webhook processed" },
            400: { description: "Signature verification failed" },
          },
        },
      },
    },
  },
  apis: [], // All paths defined inline above — no file scanning needed
};

export const swaggerSpec = swaggerJsdoc(options);
