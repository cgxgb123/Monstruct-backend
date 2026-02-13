import User from '../models/User.ts';
import Team from '../models/Team.ts';
import { signToken } from '../utils/auth.ts';
import axios from 'axios';
import { toApi, toGif } from '../utils/helpers.ts';

export const resolvers = {
  Query: {
    getPokemon: async (_parent: any, { name }: { name: string }) => {
      try {
        const apiName = toApi(name);
        const { data } = await axios.get(
          `https://pokeapi.co/api/v2/pokemon/${apiName}`,
        );

        return {
          ...data,
          name: apiName,
        };
      } catch (err) {
        console.error('PokeAPI Error:', err);
        throw new Error('Could not find that Pokemon. Check your spelling!');
      }
    },

    getTeams: async (_parent: any, _args: any, context: any) => {
      if (!context.user) throw new Error('Not logged in');
      return Team.find({ owner: context.user._id }).populate('owner');
    },

    me: async (_parent: any, _args: any, context: any) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw new Error('Not logged in');
    },

    search: async (_: any, { name }: { name: string }, context: any) => {
      const cleanInput = name.toLowerCase().trim();

      // context.allPokemon should be the array of {name, url} objects from index.ts
      if (!cleanInput || !context.allPokemon) return [];

      return context.allPokemon
        .filter((p: any) => p.name.includes(cleanInput))
        .slice(0, 10)
        .map((p: any) => {
          // Extracts ID from the URL string to build the HOME sprite link
          const id = p.url.split('/').filter(Boolean).pop();

          return {
            name: p.name,
            displayName: p.name.replace(/-/g, ' '),
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
          };
        });
    },
  },
  Mutation: {
    signup: async (_parent: any, { username, email, password }: any) => {
      try {
        const user = await User.create({ username, email, password });
        const token = signToken(user.username, user.email, user._id);
        return { token, user };
      } catch (err: any) {
        throw new Error(`Signup failed: ${err.message}`);
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
        throw new Error(`Login failed: ${err.message}`);
      }
    },

    saveTeam: async (
      _parent: any,
      { teamName, pokemon }: any,
      context: any,
    ) => {
      if (!context.user)
        throw new Error('You must be logged in to build a team!');

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

    removeTeam: async (
      _parent: any,
      { teamId }: { teamId: string },
      context: any,
    ) => {
      if (!context.user)
        throw new Error('You must be logged in to delete a team!');

      const deletedTeam = await Team.findOneAndDelete({
        _id: teamId,
        owner: context.user._id,
      });

      if (!deletedTeam) throw new Error('Team not found.');

      return await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { teams: teamId } },
        { new: true },
      ).populate('teams');
    },
  },
  Team: {
    pokemonDetails: async (parent: any) => {
      const requests = parent.pokemon.map((name: string) => {
        const apiName = toApi(name);
        return axios.get(`https://pokeapi.co/api/v2/pokemon/${apiName}`);
      });
      const responses = await Promise.all(requests);
      return responses.map((res) => res.data);
    },
  },
  Pokemon: {
    spriteUrl: (parent: any) => {
      const showdownName = toGif(parent.name);
      return `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`;
    },
    modelUrl: (parent: any) => {
      return (
        parent.sprites.other?.home?.front_default ||
        parent.sprites.front_default
      );
    },
  },
};
