import { serve } from 'bun'
import index from './index.html'
import { usersAPI, getUserById } from './api/users'
import { authAPI } from './api/auth'
import { playbooksAPI } from './api/playbooks'
import { playbookSharesAPI } from './api/playbook-shares'
import { presentationsAPI } from './api/presentations'
import { foldersAPI } from './api/folders'
import { teamsAPI } from './api/teams'
import { sectionsAPI } from './api/sections'
import { playsAPI } from './api/plays'
import { formationsAPI } from './api/formations'
import { conceptsAPI } from './api/concepts'
import { conceptGroupsAPI } from './api/concept-groups'
import { rolesAPI } from './api/roles'
import { presetRoutesAPI } from './api/preset-routes'
import { unifiedSearchAPI } from './api/unified-search'
import { modifierOverridesAPI } from './api/modifierOverrides'
import { labelsAPI, playLabelsAPI, playbookLabelsAPI } from './api/labels'
import { handleCallSheetExport } from './api/exports'

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
    "/api/playbooks/:id/star": {
      PUT: playbooksAPI.toggleStar
    },
    "/api/playbooks/:id/restore": {
      PUT: playbooksAPI.restore
    },
    "/api/playbooks/:id/permanent": {
      DELETE: playbooksAPI.permanentDelete
    },
    "/api/trash": {
      DELETE: playbooksAPI.emptyTrash
    },
    "/api/playbooks/:id/shares": {
      GET: playbookSharesAPI.listShares,
      POST: playbookSharesAPI.createShare
    },
    "/api/playbooks/:id/shares/:teamId": {
      DELETE: playbookSharesAPI.deleteShare
    },
    "/api/playbooks/:id": {
      GET: playbooksAPI.get,
      PUT: playbooksAPI.update,
      DELETE: playbooksAPI.delete
    },

    // Presentation API endpoints
    "/api/playbooks/:playbookId/presentations": {
      GET: presentationsAPI.list,
      POST: presentationsAPI.create
    },
    "/api/presentations/:presentationId": {
      GET: presentationsAPI.get,
      PUT: presentationsAPI.update,
      DELETE: presentationsAPI.delete
    },
    "/api/presentations/:presentationId/slides": {
      POST: presentationsAPI.addSlide,
      PUT: presentationsAPI.reorderSlides
    },
    "/api/presentations/:presentationId/slides/:slideId": {
      DELETE: presentationsAPI.removeSlide
    },

    // Folder API endpoints
    "/api/folders": {
      GET: foldersAPI.list,
      POST: foldersAPI.create
    },
    "/api/folders/:id": {
      PUT: foldersAPI.update,
      DELETE: foldersAPI.delete
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

    // Play API endpoints
    "/api/playbooks/:playbookId/plays": {
      GET: playsAPI.list,
      POST: playsAPI.create
    },
    "/api/plays/:playId": {
      GET: playsAPI.get,
      PUT: playsAPI.update,
      DELETE: playsAPI.delete
    },
    "/api/plays/:playId/duplicate": {
      POST: playsAPI.duplicate
    },

    // Label API endpoints
    '/api/labels/presets': {
      GET: labelsAPI.listPresets
    },
    '/api/teams/:teamId/labels': {
      GET: labelsAPI.listTeamLabels,
      POST: labelsAPI.create
    },
    '/api/labels/:labelId': {
      PUT: labelsAPI.update,
      DELETE: labelsAPI.delete
    },
    '/api/plays/:playId/labels': {
      GET: playLabelsAPI.list,
      PUT: playLabelsAPI.set
    },
    '/api/playbooks/:playbookId/labels': {
      GET: playbookLabelsAPI.list,
      PUT: playbookLabelsAPI.set
    },

    // Team API endpoints
    '/api/teams': {
      GET: teamsAPI.list,
      POST: teamsAPI.create
    },
    '/api/teams/:id': {
      GET: teamsAPI.get,
      PATCH: teamsAPI.update,
      DELETE: teamsAPI.delete
    },
    '/api/teams/:id/members': {
      GET: teamsAPI.getMembers
    },
    '/api/teams/:id/members/:userId': {
      PATCH: teamsAPI.updateMemberRole,
      DELETE: teamsAPI.removeMember
    },
    '/api/teams/:id/invitations': {
      POST: teamsAPI.createInvitation
    },
    '/api/teams/:id/invitations/:invitationId': {
      DELETE: teamsAPI.deleteInvitation
    },
    '/api/invitations/accept': {
      POST: teamsAPI.acceptInvitation
    },

    // Formation API endpoints
    '/api/teams/:teamId/formations': {
      GET: formationsAPI.list,
      POST: formationsAPI.create
    },
    '/api/formations/:id': {
      GET: formationsAPI.get,
      PUT: formationsAPI.update,
      DELETE: formationsAPI.delete
    },

    // Concept API endpoints
    '/api/teams/:teamId/concepts': {
      GET: conceptsAPI.list,
      POST: conceptsAPI.create
    },
    '/api/teams/:teamId/concepts/search': {
      GET: conceptsAPI.search
    },
    '/api/concepts/:id': {
      GET: conceptsAPI.get,
      PUT: conceptsAPI.update,
      DELETE: conceptsAPI.delete
    },

    // Concept Group API endpoints
    '/api/teams/:teamId/concept-groups': {
      GET: conceptGroupsAPI.list,
      POST: conceptGroupsAPI.create
    },
    '/api/teams/:teamId/concept-groups/search': {
      GET: conceptGroupsAPI.search
    },
    '/api/concept-groups/:id': {
      GET: conceptGroupsAPI.get,
      PUT: conceptGroupsAPI.update,
      DELETE: conceptGroupsAPI.delete
    },

    // Modifier Override API endpoints
    '/api/modifiers/:modifierId/overrides': {
      GET: modifierOverridesAPI.listByModifier,
      POST: modifierOverridesAPI.create
    },
    '/api/modifier-overrides/:id': {
      PUT: modifierOverridesAPI.update,
      DELETE: modifierOverridesAPI.delete
    },

    // Role API endpoints
    '/api/teams/:teamId/roles': {
      GET: rolesAPI.list,
      PUT: rolesAPI.update
    },

    // Preset Route API endpoints
    '/api/preset-routes': {
      GET: presetRoutesAPI.list
    },

    // Unified Search API endpoint
    '/api/search': {
      GET: unifiedSearchAPI.search
    },

    // Export API endpoints
    '/api/export/callsheet': {
      POST: handleCallSheetExport
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
