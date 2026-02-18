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

      const teams = await Team.find({ owner: context.user._id }).populate(
        'owner',
      );

      console.log('Teams found:', teams.length);
      teams.forEach((team, i) => {
        console.log(
          `Team ${i}: ${team.teamName}, members: ${team.members?.length}`,
        );
        if (team.members?.length > 0) {
        }
      });

      return teams;
    },

    getTeam: async (
      _parent: any,
      { teamId }: { teamId: string },
      context: any,
    ) => {
      if (!context.user) throw new Error('Not logged in');

      const team = await Team.findOne({
        _id: teamId,
        owner: context.user._id,
      }).populate('owner');

      console.log('=== getTeam DEBUG ===');
      console.log('Team found:', team?.teamName);
      console.log('Members:', team?.members?.length);
      console.log('========================');

      return team;
    },

    me: async (_parent: any, _args: any, context: any) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('teams');
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

      console.log('=== SAVE TEAM DEBUG ===');
      console.log('Team Name:', teamName);
      console.log('Format:', format);
      console.log('Members Count:', members?.length);
      console.log('First Member:', members?.[0]);
      console.log('User ID:', context.user._id);
      console.log('=========================');

      if (!members || members.length === 0) {
        throw new Error('No members provided in team');
      }

      try {
        const populatedTeam = await Team.create({
          teamName,
          format,
          members,
          owner: context.user._id,
        });

        console.log('Team saved with ID:', populatedTeam._id);
        console.log('Team members in DB:', populatedTeam.members?.length);

        await User.findByIdAndUpdate(
          context.user._id,
          { $push: { teams: populatedTeam._id } },
          { new: true },
        );

        const savedTeam = await Team.findById(populatedTeam._id).populate(
          'owner',
        );
        console.log('Returned team members:', savedTeam?.members?.length);
        return savedTeam;
      } catch (err: any) {
        console.error('Save error:', err.message);
        throw err;
      }
    },

    updateTeam: async (
      _parent: any,
      { teamId, teamName, format, members }: any,
      context: any,
    ) => {
      if (!context.user) throw new Error('You must be logged in!');

      const updatedTeam = await Team.findOneAndUpdate(
        { _id: teamId, owner: context.user._id },
        { teamName, format, members },
        { new: true },
      );

      if (!updatedTeam) throw new Error('Team not found or unauthorized');
      return updatedTeam.populate('owner');
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
      const showdownName = toGif(parent.species);
      return `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`;
    },
    modelUrl: async (parent: any) => {
      try {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${parent.id}.png`;
      } catch (err) {
        return null;
      }
    },
  },

  Team: {
    teamName: (parent: any) => parent.teamName,
    format: (parent: any) => parent.format,
    members: (parent: any) => parent.members || [],
  },
};
