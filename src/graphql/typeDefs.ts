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
    pokemon: [String] // ids stored in db
    pokemonDetails: [Pokemon] // actual data fetched through axios
    owner: User
    createdAt: String
  }
  type Pokemon {
    id: Int
    name: String
     sprites: Spritest  
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
