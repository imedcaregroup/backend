import { Request, Router } from "express";

interface IUser {
  id: string;
  email?: string;
  googleId?: string;
  authProvider: string;
}

export interface UserRequest extends Request {
  user: IUser | null | any;
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

// export interface IRequestHandler {
//   (req: Request | UserRequest, res: Response, next: NextFunction): Promise<any>;
// }
