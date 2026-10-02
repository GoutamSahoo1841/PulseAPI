import express from "express";
import clientDependencies from "../Dependencies/dependencies.js"
import authenticate from "../../../shared/middlewares/authenticate.js"

// Create a new router instance
const router = express.Router();

// Destructure the clientController from the dependencies
const { clientController } = clientDependencies.controller

// Apply authentication middleware to all routes in this router
router.use(authenticate);

// Get all clients
router.get("/admin/clients", (req, res, next) => clientController.getClients(req, res, next));

// Onboard a new client
router.post("/admin/clients/onboard", (req, res, next) => clientController.createClient(req, res, next));

// Update client status
router.patch("/admin/clients/:clientId/status", (req, res, next) => clientController.updateClientStatus(req, res, next));

// Delete client
router.delete("/admin/clients/:clientId", (req, res, next) => clientController.deleteClient(req, res, next));

// Create a user for a client
router.post("/admin/clients/:clientId/users", (req, res, next) => clientController.createClientUser(req, res, next));

// Get users for a client
router.get("/admin/clients/:clientId/users", (req, res, next) => clientController.getClientUsers(req, res, next));

// Create API key for a client
router.post("/admin/clients/:clientId/api/keys", (req, res, next) => clientController.createApiKey(req, res, next));

// Get all API keys for a client
router.get("/admin/clients/:clientId/api/keys", (req, res, next) => clientController.getClientApiKeys(req, res, next));

export default router;