import { Model } from "mongoose";
import { IUser } from "../entities/user.entities";
import { IUserRepository } from "../interfaces/repositories.interface";

export class UserRepository implements IUserRepository {
  constructor(private userModel: Model<IUser>) {}

  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new this.userModel(userData);
    return await user.save();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.userModel.findOne({ email, isActive: true });
  }

  async findById(id: string): Promise<IUser | null> {
    return await this.userModel.findById(id);
  }
}
