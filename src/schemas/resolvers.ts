import User from '../models/User.js';
import { signToken } from '../utils/auth.js';
import { GraphQLError } from 'graphql';

export const resolvers = {
  Query: {
    // test resolver
    hello: () => 'The Monstruct API is active.',

    me: async (_parent: any, _args: any, context: any) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw new GraphQLError('You must be logged in!');
    },
  },

  Mutation: {
    //  triggers the 'pre-save' hook in user model
    testSignup: async (_parent: any, { username, email, password }: any) => {
      try {
        const user = await User.create({ username, email, password });

        // triggers signToken - utils/auth.ts
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
