/* eslint-disable prettier/prettier */
export interface RequestWithUser extends Request {
  user: { 
    id: string; 
    role: string; 
    email: string 
  };
}
