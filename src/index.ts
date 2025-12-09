import { serve } from "bun";
import index from "./index.html";
import { usersAPI, getUserById } from "./api/users";
import { authAPI } from "./api/auth";

const server = serve({
  routes: {
    "/*": index,

    "/api/auth/login": {
      POST: authAPI.login,
    },
    "/api/auth/register": {
      POST: authAPI.register,
    },
    "/api/auth/logout": {
      POST: authAPI.logout,
    },
    "/api/auth/me": {
      GET: authAPI.me,
    },

    "/api/users": usersAPI,
    "/api/users/:id": getUserById,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
