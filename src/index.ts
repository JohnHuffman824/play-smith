import { serve } from "bun"
import index from "./index.html"
import { usersAPI, getUserById } from "./api/users"
import { authAPI } from "./api/auth"
import { playbooksAPI } from "./api/playbooks"
import { teamsAPI } from "./api/teams"
import { sectionsAPI } from "./api/sections"

const server = serve({
  routes: {
    // API routes (must be defined BEFORE catch-all)
    // These routes handle server-side requests and return JSON

    // Auth API endpoints
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

    // User API endpoints
    "/api/users": usersAPI,
    "/api/users/:id": getUserById,

    // Playbook API endpoints
    "/api/playbooks": {
      GET: playbooksAPI.list,
      POST: playbooksAPI.create
    },
    "/api/playbooks/:id": {
      GET: playbooksAPI.get,
      PUT: playbooksAPI.update,
      DELETE: playbooksAPI.delete
    },

    // Section API endpoints
    "/api/playbooks/:playbookId/sections": {
      GET: sectionsAPI.list,
      POST: sectionsAPI.create
    },
    "/api/sections/:sectionId": {
      PUT: sectionsAPI.update,
      DELETE: sectionsAPI.delete
    },

    // Team API endpoints
    "/api/teams": {
      GET: teamsAPI.list
    },

    // Example API endpoints
    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        })
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        })
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name
      return Response.json({
        message: `Hello, ${name}!`,
      })
    },

    // Catch-all route (must be LAST)
    // Serves the React app for all non-API routes
    // This allows React Router to handle client-side routing for paths like:
    // - / (landing page)
    // - /login (login page)
    // - /playbooks (playbook manager)
    // - /playbooks/:playbookId (playbook editor)
    // - /playbooks/:playbookId/plays/:playId (play editor)
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
})

console.log(`🚀 Server running at ${server.url}`)
