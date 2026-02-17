import { Schema, model, Types } from 'mongoose';

interface ITeamMember {
  species?: string;
  nickname?: string;
  shiny: boolean;
  gender: 'M' | 'F' | 'N';
  level: number;
  item: string;
  ability: string;
  nature: string;
  teraType: string;
  moves: string[];
  evs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  ivs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    species: { type: String },
    nickname: { type: String },
    shiny: { type: Boolean, default: false },
    gender: { type: String, enum: ['M', 'F', 'N'], default: 'N' },
    level: { type: Number, default: 50 },
    item: { type: String, default: '' },
    ability: { type: String, default: '' },
    nature: { type: String, default: 'Serious' },
    teraType: { type: String, default: 'Normal' },
    moves: { type: [String], default: ['', '', '', ''] },
    evs: {
      hp: { type: Number, default: 0 },
      atk: { type: Number, default: 0 },
      def: { type: Number, default: 0 },
      spa: { type: Number, default: 0 },
      spd: { type: Number, default: 0 },
      spe: { type: Number, default: 0 },
    },
    ivs: {
      hp: { type: Number, default: 31 },
      atk: { type: Number, default: 31 },
      def: { type: Number, default: 31 },
      spa: { type: Number, default: 31 },
      spd: { type: Number, default: 31 },
      spe: { type: Number, default: 31 },
    },
  },
  { _id: false },
);

export interface ITeam extends Document {
  teamName: string;
  format: string;
  members: ITeamMember[];
  owner: Types.ObjectId; // Reference to User
}

const teamSchema = new Schema<ITeam>(
  {
    teamName: { type: String, required: true, trim: true },
    format: { type: String, default: 'gen9vgc2026regi' },
    members: [teamMemberSchema],
    // FIXED: Add owner field with ref to User model
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

teamSchema.path('members').validate(function (value: ITeamMember[]) {
  return value.length <= 6;
}, 'Team cannot exceed 6 Pokemon');

const Team = model<ITeam>('Team', teamSchema);
export default Team;
