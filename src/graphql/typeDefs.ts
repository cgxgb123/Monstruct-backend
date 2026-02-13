import { gql } from 'graphql-tag';

export const typeDefs = gql`
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
  }

  type Query {
    me: User
    getPokemon(name: String!): Pokemon
    getTeams: [Team]
    search(name: String!): [SearchResult]
  }

  type Team {
    _id: ID
    teamName: String
    pokemon: [String]
    pokemonDetails: [Pokemon]
    owner: User
    createdAt: String
  }

  type Pokemon {
    id: Int
    name: String
    sprites: Sprites
    types: [TypeSlot]
    spriteUrl: String # animated gif URL
    modelUrl: String # 3D model URL (if available)
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
    saveTeam(teamName: String!, pokemon: [String]!): Team
    removeTeam(teamId: ID!): User
  }
`;
