import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    me: User
    getPokemon(name: String!): Pokemon
    getTeams: [Team]
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
`;
