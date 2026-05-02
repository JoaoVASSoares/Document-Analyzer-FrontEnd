import { EUserType } from "../enum/EUserType.enum";

export interface UserRegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface UserRegisterResponse {
  id: string;
  fullName: string;
  email: string;
  password: string;
  type: EUserType;
  createdAt: Date;
  updatedAt: Date;
}
