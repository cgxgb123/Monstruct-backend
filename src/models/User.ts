import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt'; // for password hashing

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  teams: Schema.Types.ObjectId[];
  isCorrectPassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, 'Must use a valid email address!'],
  },
  password: { type: String, required: true, minlength: 5 },
  teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
});
