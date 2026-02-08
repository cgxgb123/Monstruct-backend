import { Schema, model, type Model } from 'mongoose';

export interface ITeam {
  teamName: string; // user-defined name
  createdAt: Date;
  pokemon: string[]; // IDs/Names from PokeAPI
  owner: Schema.Types.ObjectId;
}

const teamSchema = new Schema<ITeam>({
  teamName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  pokemon: {
    type: [String],
    required: true,
    // enforce the 6-pokemon team limit
    validate: [arrayLimit, '{PATH} cannot exceed 6 Pokemon'],
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});
// helper function to limit array size to enforce 6-pokemon team
function arrayLimit(val: string[]) {
  return val.length <= 6;
}

const Team = model<ITeam>('Team', teamSchema);
export default Team;
