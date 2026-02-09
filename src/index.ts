import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/connection.ts';
import { typeDefs } from './graphql/typeDefs.ts'; // PLACEHOLDER
import { resolvers } from './graphql/resolvers.ts'; // PLACEHOLDER
import { authMiddleware } from './utils/auth.ts';

dotenv.config();

const PORT = process.env.PORT || 5000;

interface MyContext {
  token?: string;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // Middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cors());

  // GraphQL Endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        return authMiddleware({ req });
      },
    }),
  );

  // Connect DB and Start Server
  db.once('open', () => {
    httpServer.listen(PORT, () => {
      console.log(`Server BUSSING at:${PORT}/graphql`);
    });
  });
}

startServer();
