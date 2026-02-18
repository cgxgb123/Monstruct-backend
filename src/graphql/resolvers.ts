// Monstruct-backend/src/graphql/resolvers.ts
import User from '../models/User.ts';
import Team from '../models/Team.ts';
import { signToken } from '../utils/auth.ts';
import axios from 'axios';
import { toApi, toGif } from '../utils/helpers.ts';
import dotenv from 'dotenv';

dotenv.config();

const CDN_BASE =
  process.env.SPRITE_CDN ||
  'https://pub-aabd9f22e2424ac1a99897e017969dae.r2.dev';

export const resolvers = {
  Query: {
    getMove: async (_parent: any, { name }: { name: string }) => {
      try {
        const cleanName = name.toLowerCase().replace(' ', '-');
        const { data } = await axios.get(
          `https://pokeapi.co/api/v2/move/${cleanName}`,
        );

        return {
          name: data.name,
          power: data.power,
          accuracy: data.accuracy,
          pp: data.pp,
          type: data.type.name,
          damageClass: data.damage_class.name,
          description:
            data.effect_entries.find((e: any) => e.language.name === 'en')
              ?.short_effect || '',
        };
      } catch (err) {
        return null;
      }
    },
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
        throw new Error('Could not find that Pokemon. Check your spelling!');
      }
    },

    getTeams: async (_parent: any, _args: any, context: any) => {
      if (!context.user) throw new Error('Not logged in');

      const teams = await Team.find({ owner: context.user._id }).lean();
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
      }).lean();

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
          const showdownName = toGif(p.name);
          const displayName = p.name
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          return {
            name: p.name,
            displayName: displayName,
            sprite: `${CDN_BASE}/official-artwork/${showdownName}.png`,
            fallbackSprite: `${CDN_BASE}/animated/${showdownName}.gif`,
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

      if (!members || members.length === 0) {
        throw new Error('No members provided in team');
      }

      const processedMembers = members.map((member: any) => {
        return {
          species: member.species,
          nickname: member.nickname || member.species,
          shiny: member.shiny || false,
          gender: 'N',
          level: 50,
          item: member.item || '',
          ability: member.ability || '',
          nature: member.nature || 'Serious',
          teraType: member.teraType || 'Normal',
          moves: member.moves || ['', '', '', ''],
          evs: {
            hp: Number(member.evs?.hp) || 0,
            atk: Number(member.evs?.atk) || 0,
            def: Number(member.evs?.def) || 0,
            spa: Number(member.evs?.spa) || 0,
            spd: Number(member.evs?.spd) || 0,
            spe: Number(member.evs?.spe) || 0,
          },
          ivs: {
            hp: Number(member.ivs?.hp) || 31,
            atk: Number(member.ivs?.atk) || 31,
            def: Number(member.ivs?.def) || 31,
            spa: Number(member.ivs?.spa) || 31,
            spd: Number(member.ivs?.spd) || 31,
            spe: Number(member.ivs?.spe) || 31,
          },
        };
      });

      try {
        const team = new Team({
          teamName,
          format,
          members: processedMembers,
          owner: context.user._id,
        });

        // Save the team to DB
        await team.save();

        // update teams array
        await User.findByIdAndUpdate(
          context.user._id,
          { $push: { teams: team._id } },
          { new: true },
        );

        // returns team with all fields
        return team.toObject();
      } catch (err: any) {
        console.error('Save error:', err);
        throw err;
      }
    },

    updateTeam: async (
      _parent: any,
      { teamId, teamName, format, members }: any,
      context: any,
    ) => {
      if (!context.user) throw new Error('You must be logged in!');

      const processedMembers = members.map((member: any) => {
        return {
          species: member.species,
          nickname: member.nickname || member.species,
          shiny: member.shiny || false,
          gender: 'N',
          level: 50,
          item: member.item || '',
          ability: member.ability || '',
          nature: member.nature || 'Serious',
          teraType: member.teraType || 'Normal',
          moves: member.moves || ['', '', '', ''],
          evs: {
            hp: Number(member.evs?.hp) || 0,
            atk: Number(member.evs?.atk) || 0,
            def: Number(member.evs?.def) || 0,
            spa: Number(member.evs?.spa) || 0,
            spd: Number(member.evs?.spd) || 0,
            spe: Number(member.evs?.spe) || 0,
          },
          ivs: {
            hp: Number(member.ivs?.hp) || 31,
            atk: Number(member.ivs?.atk) || 31,
            def: Number(member.ivs?.def) || 31,
            spa: Number(member.ivs?.spa) || 31,
            spd: Number(member.ivs?.spd) || 31,
            spe: Number(member.ivs?.spe) || 31,
          },
        };
      });

      const team = await Team.findOneAndUpdate(
        { _id: teamId, owner: context.user._id },
        {
          teamName,
          format,
          members: processedMembers,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!team) throw new Error('Team not found or unauthorized');
      return team.toObject();
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
      return `${CDN_BASE}/animated/${showdownName}.gif`;
    },
    modelUrl: (parent: any) => {
      const showdownName = toGif(parent.species);
      return `${CDN_BASE}/official-artwork/${showdownName}.png`;
    },
  },
};
