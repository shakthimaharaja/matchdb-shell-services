import { AccessTokenPayload } from "../services/jwt.service";

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      userType: string;
      plan: string;
    }
  }
}
