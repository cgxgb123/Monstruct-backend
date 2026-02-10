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
      } catch (err: any) {
        console.error(err); //  prints to your terminal
        throw new Error(`Signup failed: ${err.message}`); //  prints to sandbox
      }
    },

    login: async (_parent: any, { email, password }: any) => {
      try {
        const user = await User.findOne({ email });
        if (!user) throw new Error('No user found with this email address');

        const correctPw = await user.isCorrectPassword(password);
        if (!correctPw) throw new Error('Incorrect credentials');

        const token = signToken(user.username, user.email, user._id);
        return { token, user };
      } catch (err: any) {
        console.error('Login Error:', err);
        throw new Error(`Login failed: ${err.message}`);
      }
    },

    saveTeam: async (
      _parent: any,
      { teamName, pokemon }: any,
      context: any,
    ) => {
      if (!context.user) {
        throw new Error('You must be logged in to build a team!');
      }

      const newTeam = await Team.create({
        teamName,
        pokemon,
        owner: context.user._id,
      });

      await User.findByIdAndUpdate(
        context.user._id,
        { $push: { teams: newTeam._id } },
        { new: true },
      );

      return newTeam;
    },
  },

  Team: {
    pokemonDetails: async (parent: any) => {
      const requests = parent.pokemon.map((name: string) =>
        axios.get(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`),
      );
      const responses = await Promise.all(requests);
      return responses.map((res) => res.data);
    },
  },
};
