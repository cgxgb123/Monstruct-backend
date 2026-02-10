import User from '../models/User.ts';
import Team from '../models/Team.ts';
import { signToken } from '../utils/auth.ts';
import axios from 'axios';

export const resolvers = {
  Query: {
    // getPokemon and getTeams queries
  },
  Mutation: {
    testSignup: async (_parent: any, { username, email, password }: any) => {
      try {
        const user = await User.create({ username, email, password });
        const token = signToken(user.username, user.email, user._id);

        return { token, user };
      } catch (err) {
        console.error(err);
        throw new Error(
          'Failed to create user. Check if email/username is unique.',
        );
      }
    },
  },
};
