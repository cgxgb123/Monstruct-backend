import User from '../models/User.ts';
import Team from '../models/Team.ts';
import { signToken } from '../utils/auth.ts';
import axios from 'axios';

export const resolvers = {
  Query: {
    // 1. Fetch a single Pokemon from PokeAPI
    getPokemon: async (_parent: any, { name }: { name: string }) => {
      console.log(`Searching PokeAPI for: ${name}`);
      try {
        const { data } = await axios.get(
          `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`,
        );
        return data;
      } catch (err) {
        console.error('PokeAPI Error:', err);
        throw new Error('Could not find that Pokemon. Check your spelling!');
      }
    },

    // 2. Fetch all teams for the logged-in user
    getTeams: async (_parent: any, _args: any, context: any) => {
      if (!context.user) throw new Error('Not logged in');
      return Team.find({ owner: context.user._id }).populate('owner');
    },

    // 3. Get currently logged-in user data
    me: async (_parent: any, _args: any, context: any) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw new Error('Not logged in');
    },
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

      const populatedTeam = await Team.create({
        teamName,
        pokemon,
        owner: context.user._id,
      });

      await User.findByIdAndUpdate(
        context.user._id,
        { $push: { teams: populatedTeam._id } },
        { new: true },
      );

      return populatedTeam.populate('owner');
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
  Pokemon: {
    // This creates the animated 3D GIF link
    spriteUrl: (parent: any) => {
      const cleanName = parent.name.toLowerCase().replace(/[^\w-]/g, '');
      return `https://play.pokemonshowdown.com/sprites/ani/${cleanName}.gif`;
    },
    // This grabs the high-res 3D static render from the PokeAPI data
    modelUrl: (parent: any) => {
      return (
        parent.sprites.other?.home?.front_default ||
        parent.sprites.front_default
      );
    },
  },
};
