import { Request, Router } from "express";

interface IUser {
  id: string;
  email?: string;
  googleId?: string;
  authProvider: string;
}

export interface UserRequest extends Request {
  admin: any;
  user: IUser | null | any;
}

// Admin interface for authentication
interface IAdmin {
  _id: number;
  email: string;
  name: string;
  role: "ADMIN" | "SUPER_ADMIN";
}

// Request with admin context
export interface AdminRequest extends Request {
  admin: IAdmin | null;
}

export interface IjwtPayLoad {
  id?: string;
}

export interface Routes {
  path?: string;
  router: Router;
}

export interface ValidationError {
  type: string;
  value: string | number;
  msg: string;
  path: string;
  location: string;
}

export const Payriff = {
  BASE_URL: "https://api.payriff.com/api/v3",
  SUCCESS: "00000",
};

// export interface IRequestHandler {
//   (req: Request | UserRequest, res: Response, next: NextFunction): Promise<any>;
// }
