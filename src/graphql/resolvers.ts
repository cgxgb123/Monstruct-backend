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

      if (!cleanInput || !context.allPokemon) return [];

      return context.allPokemon
        .filter((p: any) => p.name.includes(cleanInput))
        .slice(0, 10)
        .map((p: any) => {
          const id = p.url.split('/').filter(Boolean).pop();

          // technical name stays lowercase for API calls
          // display name gets capitalized for the UI
          const displayName = p.name
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const showdownName = toGif(p.name);

          return {
            name: p.name,
            displayName: displayName,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
            fallbackSprite: `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`,
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
      { teamName, format, members }: any,
      context: any,
    ) => {
      if (!context.user)
        throw new Error('You must be logged in to build a team!');

      const populatedTeam = await Team.create({
        teamName,
        format,
        members, // Mongoose will now validate this against the new schema
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
  TeamMember: {
    spriteUrl: (parent: any) => {
      // 'parent' here is the team member from your MongoDB array
      const showdownName = toGif(parent.name);
      return `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`;
    },
    modelUrl: async (parent: any) => {
      try {
        //   official Artwork(Home) sprites
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${parent.id}.png`;
      } catch (err) {
        return null;
      }
    },
  },
  Pokemon: {
    spriteUrl: (parent: any) => {
      console.log('parent.name:', parent.name);
      const showdownName = toGif(parent.name);
      console.log('showdownName:', showdownName);
      const url = `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`;
      console.log('sprite URL:', url);
      return url;
    },
    modelUrl: (parent: any) => {
      return (
        parent.sprites.other?.home?.front_default ||
        parent.sprites.front_default
      );
    },
  },
};
