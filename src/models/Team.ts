import { Schema, model, Document } from 'mongoose';

export interface ITeam extends Document {
  teamName: string; // user-defined name
  createdAt: Date;
  pokemon: string[]; // IDs from PokeAPI
  owner: Schema.Types.ObjectId;
}

const teamSchema = new Schema<ITeam>({
  teamName: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  pokemon: [{ type: String, required: true }],
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const Team = model<ITeam>('Team', teamSchema);
export default Team;
