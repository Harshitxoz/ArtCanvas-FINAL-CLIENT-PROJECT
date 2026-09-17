import type { ObjectId } from "mongodb";
import type { UserRole } from "@/types";

export interface UserDocument {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
