import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import type { Request } from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/connection.ts"; // change to js for compilation
// import { typeDefs, resolvers } from './schemas'; // PLACEHOLDER

dotenv.config();

const PORT = process.env.PORT || 5000;

interface MyContext {
  token?: string;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  //  Initialize Apollo Server
  const server = new ApolloServer({
    typeDefs: `type Query { hello: String }`, // placeholder schema
    resolvers: { Query: { hello: () => "Welcome to Monstruct API" } }, // placeholder resolver
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // Middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cors());

  // GraphQL Endpoint
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }: { req: Request }) => ({
        token: req.headers.authorization,
      }),
    }),
  );

  // Connect DB and Start Server
  db.once("open", () => {
    httpServer.listen(PORT, () => {
      console.log(`Server BUSSING at:${PORT}/graphql`);
    });
  });
}

startServer();
