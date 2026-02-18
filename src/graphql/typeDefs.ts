import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Stats {
    hp: Int
    atk: Int
    def: Int
    spa: Int
    spd: Int
    spe: Int
  }

  input StatsInput {
    hp: Int
    atk: Int
    def: Int
    spa: Int
    spd: Int
    spe: Int
  }

  type TeamMember {
    species: String
    nickname: String
    shiny: Boolean
    gender: String
    level: Int
    item: String
    ability: String
    nature: String
    teraType: String
    moves: [String]
    evs: Stats
    ivs: Stats
    spriteUrl: String
    modelUrl: String
  }

  input TeamMemberInput {
    species: String!
    nickname: String
    shiny: Boolean
    gender: String
    level: Int
    item: String
    ability: String
    nature: String
    teraType: String
    moves: [String]
    evs: StatsInput
    ivs: StatsInput
  }

  type User {
    _id: ID
    username: String
    email: String
    teams: [Team]
  }

  type Auth {
    token: String
    user: User
  }

  type SearchResult {
    name: String
    displayName: String
    sprite: String
    fallbackSprite: String
  }

  type Query {
    me: User
    getPokemon(name: String!): Pokemon
    getTeams: [Team]
    getTeam(teamId: ID!): Team
    search(name: String!): [SearchResult]
  }

  type Team {
    _id: ID
    teamName: String
    format: String
    members: [TeamMember]
    owner: User
    createdAt: String
  }

  type Move {
    name: String
    power: Int
    accuracy: Int
    pp: Int
    type: String
    damageClass: String
    description: String
  }

  type Pokemon {
    id: Int
    name: String
    moves: [String]
    sprites: Sprites
    types: [TypeSlot]
    spriteUrl: String
    modelUrl: String
  }

  type Sprites {
    front_default: String
  }

  type TypeSlot {
    type: TypeInfo
  }

  type TypeInfo {
    name: String
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): Auth
    login(email: String!, password: String!): Auth
    saveTeam(
      teamName: String!
      format: String!
      members: [TeamMemberInput]!
    ): Team
    updateTeam(
      teamId: ID!
      teamName: String!
      format: String!
      members: [TeamMemberInput]!
    ): Team
    removeTeam(teamId: ID!): User
  }
`;
