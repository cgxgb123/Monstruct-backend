import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    _id: ID
    username: String
    email: String
    teams: [Team]
  }

  type Team {
    _id: ID
    teamName: String
    pokemon: [String]
    owner: User
    createdAt: String
  }

  type Auth {
    token: String
    user: User
  }

  type Query {
    me: User
    hello: String
  }

  type Mutation {
    testSignup(username: String!, email: String!, password: String!): Auth
  }
`;
