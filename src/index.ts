import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import db from './config/connection.ts';
import { typeDefs } from './graphql/typeDefs.ts';
import { resolvers } from './graphql/resolvers.ts';
import { authMiddleware } from './utils/auth.ts';

dotenv.config();

const PORT = process.env.PORT || 5000;

let allPokemonNames: string[] = [];

const loadPokemonNames = async () => {
  try {
    const { data } = await axios.get(
      'https://pokeapi.co/api/v2/pokemon?limit=10000',
    );
    allPokemonNames = data.results.map((p: any) => p.name);
  } catch (err) {
    console.error(err);
  }
};

interface MyContext {
  token?: string;
  allPokemonNames?: string[];
}

async function startServer() {
  await loadPokemonNames();

  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cors());

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = authMiddleware({ req });
        return {
          ...auth,
          allPokemonNames,
        };
      },
    }),
  );

  db.once('open', () => {
    httpServer.listen(PORT, () => {
      console.log(`Server BUSSING at:${PORT}/graphql`);
    });
  });
}

startServer();
