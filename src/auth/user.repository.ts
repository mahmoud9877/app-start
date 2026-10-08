import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserRepository {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) { }

    findByEmail(email: string) {
        return this.userModel.findOne({ email }).exec();
    }

    create(user: { email: string; name: string; password: string }) {
        return this.userModel.create(user);
    }
}
