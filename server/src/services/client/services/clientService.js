
import logger from "../../../shared/config/logger.js";
import { APPLICATION_ROLES, isValidClientRole } from "../../../shared/constants/roles.js";
import AppError from "../../../shared/utils/AppError.js";
import SecurityUtils from "../../../shared/utils/SecurityUtils.js";
import { v4 as uudiv4 } from "uuid";
import crypto from 'crypto';

/**
 * ClientService class to handle business logic related to clients
 * This class is responsible for creating clients, managing client users, and handling API keys for clients. It interacts with the client repository, API key repository, and user repository to perform these operations.
 */
export class ClientService {
    /**
     * Constructor for ClientService
     * @param {Object} dependencies - An object containing the required dependencies
     * @param {Object} dependencies.clientRepository - The client repository instance
     * @param {Object} dependencies.apiKeyRepository - The API key repository instance
     * @param {Object} dependencies.userRepository - The user repository instance
     * @throws Will throw an error if any of the required dependencies are missing
     */
    constructor(dependencies) {
        if (!dependencies) {
            throw new Error('Dependencies are required');
        };

        if (!dependencies.clientRepository) {
            throw new Error('ClientRepository is required');
        };

        if (!dependencies.apiKeyRepository) {
            throw new Error('ApiKeyRepository is required');
        }
        if (!dependencies.userRepository) {
            throw new Error('UserRepository is required');
        }

        // Assign dependencies to instance variables
        this.clientRepository = dependencies.clientRepository;
        this.apiKeyRepository = dependencies.apiKeyRepository;
        this.userRepository = dependencies.userRepository;
    };

    /**
     * Format client object for response by removing sensitive information
     * @param {Object} user - The client user object
     * @returns {Object} - The formatted client user object
     */
    formatClientForResponse(user) {
        const userObj = user.toObject ? user.toObject() : { ...user };
        delete userObj.password;
        return userObj;
    };

    /**
     * Generate unique slug from name
     * @param {String} name - The name to generate the slug from
     * @returns {String} - The generated slug
     */
    generateSlug(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
    }

    /**
     * Create a new client
     * @param {Object} clientData - The client data
     * @param {Object} adminUser - The admin user creating the client
     * @returns {Object} - The created client
     */
    async createClient(clientData, adminUser) {
        try {
            const { name, email, description, website } = clientData;

            const slug = this.generateSlug(name);

            const exisitingClient = await this.clientRepository.findBySlug(slug);

            if (exisitingClient) {
                throw new AppError(`Client with slug ${slug} already exists`, 400);
            }

            const client = await this.clientRepository.create({
                name,
                slug,
                email,
                description,
                website,
                createdBy: adminUser.userId
            });

            // Automatically create a default API Key for the organisation
            const keyId = uudiv4();
            const keyValue = this.generateApiKey();

            const apiKey = await this.apiKeyRepository.create({
                keyId,
                keyValue,
                clientId: client._id,
                name: 'Default Production Ingestion Key',
                description: 'Auto-generated API key for hit telemetry monitoring',
                environment: 'production',
                createdBy: adminUser.userId
            });

            return {
                client,
                apiKey
            };
        } catch (error) {
            logger.error('Error creating client:', error);
            throw error;
        }
    };

    /**
     * Check if a user has access to a specific client
     * @param {Object} user - The user object
     * @param {String} clientId - The client ID
     * @returns {Boolean} - True if the user has access, false otherwise
     */
    canUserAccessClient(user, clientId) {
        if (user.role === APPLICATION_ROLES.SUPER_ADMIN) {
            return true
        }

        return user.clientId && user.clientId.toString() === clientId.toString()
    }

    /**
     * Create a new client user for a specific client
     * @param {String} clientId - The client ID
     * @param {Object} userData - The user data
     * @param {Object} adminUser - The admin user creating the client user
     * @returns {Object} - The created client user
     */
    async createClientUser(clientId, userData, adminUser) {
        try {
            if (!this.canUserAccessClient(adminUser, clientId)) {
                throw new AppError("Access denied", 403)
            };

            const { username, email, password, role = APPLICATION_ROLES.CLIENT_VIEWER } = userData;

            if (!isValidClientRole(role)) {
                throw new AppError("Invalid role for client user", 400)
            };

            const existingUser = await this.userRepository.findByUsername(username);
            if (existingUser) {
                throw new AppError("Username already exists", 409);
            }

            const existingEmail = await this.userRepository.findByEmail(email);
            if (existingEmail) {
                throw new AppError("Email already exists", 409);
            }

            const passwordValidation = SecurityUtils.validatePassword(password);
            if (!passwordValidation.success) {
                throw new AppError(passwordValidation.errors.join('. '), 400);
            }

            const client = await this.clientRepository.findById(clientId);

            if (!client) {
                throw new AppError("Client not found", 404)
            };

            // Set permissions based on role
            let permissions = {
                canCreateApiKeys: false,
                canManageUsers: false,
                canViewAnalytics: true,
                canExportData: false,
            };

            // If the role is client admin, update permissions accordingly
            if (role === APPLICATION_ROLES.CLIENT_ADMIN) {
                permissions = {
                    canCreateApiKeys: true,
                    canManageUsers: true,
                    canViewAnalytics: true,
                    canExportData: true,
                }
            };

            const user = await this.userRepository.create({
                username,
                email,
                password,
                role,
                clientId,
                permissions
            });

            logger.info("Client user created", {
                clientId,
                userId: user._id,
                role
            })

            return this.formatClientForResponse(user)

        } catch (error) {
            logger.error("Error creating client user", error)
            throw error;
        }
    };

    /**
     * Generate a new API key
     * @returns {String} - The generated API key
     */
    generateApiKey() {
        const prefix = "apim";
        const randomBytes = crypto.randomBytes(20).toString("hex");
        return `${prefix}_${randomBytes}`
    }

    /**
     * Create a new API key for a specific client
     * @param {String} clientId - The client ID
     * @param {Object} keyData - The API key data
     * @param {Object} user - The user creating the API key
     * @returns {Object} - The created API key
     */
    async createApiKey(clientId, keyData, user) {
        try {
            const client = await this.clientRepository.findById(clientId);

            if (!client) {
                throw new AppError("Client not found", 404)
            };

            if (!this.canUserAccessClient(user, clientId)) {
                throw new AppError("Access denied", 403)
            };

            if (!(user.role === APPLICATION_ROLES.SUPER_ADMIN || user.role === APPLICATION_ROLES.CLIENT_ADMIN)) {
                throw new AppError("Access denied - Only Super Admin and Client Admin can create API keys", 403)
            };


            const { name, description, environment = "production" } = keyData;

            const keyId = uudiv4();
            const keyValue = this.generateApiKey();

            const apiKey = await this.apiKeyRepository.create({
                keyId,
                keyValue,
                clientId,
                name,
                description,
                environment,
                createdBy: user.userId
            });

            return apiKey;
        } catch (error) {
            logger.error("Error creating API key", error)
            throw error;
        }
    };


    /**
     * Get all API keys for a specific client
     * @param {String} clientId - The client ID
     * @param {Object} user - The user requesting the API keys
     * @returns {Array} - The list of API keys
     */
    async getClientApiKeys(clientId, user) {
        try {
            if (!this.canUserAccessClient(user, clientId)) {
                throw new AppError('Access denied to this client', 403);
            };

            const apiKeys = await this.apiKeyRepository.findByClientId(clientId);

            const formattedResponse = apiKeys.map(key => {
                const keyObj = key.toObject ? key.toObject() : { ...key };
                return keyObj;
            });

            return formattedResponse;

        } catch (error) {
            logger.error('Error getting client API keys:', error);
            throw error;
        }
    };

    async getClientByApiKey(apiKey) {
        try {
            const key = await this.apiKeyRepository.findByKeyValue(apiKey);

            if (!key) {
                return null;
            }

            if (key.isExpired()) {
                return null;
            }

            // Get the populated client from the key
            const client = key.clientId;

            return {
                client,
                apiKey: key,
            };
        } catch (error) {
            logger.error('Error finding client by API key:', error);
            throw error;
        }
    }

    /**
     * Get all clients (or client for user)
     */
    async getClients(query = {}, user) {
        try {
            const filters = {};

            if (user.role !== APPLICATION_ROLES.SUPER_ADMIN) {
                if (!user.clientId) return [];
                filters._id = user.clientId;
            } else {
                if (query.isActive !== undefined && query.isActive !== '') {
                    filters.isActive = query.isActive === 'true' || query.isActive === true;
                }
                if (query.search) {
                    filters.name = { $regex: query.search, $options: 'i' };
                }
            }

            const clients = await this.clientRepository.find(filters);
            return clients;
        } catch (error) {
            logger.error('Error getting clients:', error);
            throw error;
        }
    }

    /**
     * Update client active status
     */
    async updateClientStatus(clientId, isActive, user) {
        try {
            if (user.role !== APPLICATION_ROLES.SUPER_ADMIN) {
                throw new AppError('Only Super Admin can update client status', 403);
            }

            const updatedClient = await this.clientRepository.update(clientId, { isActive });
            if (!updatedClient) {
                throw new AppError('Client not found', 404);
            }

            logger.info('Client status updated', { clientId, isActive });
            return updatedClient;
        } catch (error) {
            logger.error('Error updating client status:', error);
            throw error;
        }
    }

    /**
     * Delete client
     */
    async deleteClient(clientId, user) {
        try {
            if (user.role !== APPLICATION_ROLES.SUPER_ADMIN) {
                throw new AppError('Only Super Admin can delete a client', 403);
            }

            const deletedClient = await this.clientRepository.delete(clientId);
            if (!deletedClient) {
                throw new AppError('Client not found', 404);
            }

            logger.info('Client deleted', { clientId });
            return deletedClient;
        } catch (error) {
            logger.error('Error deleting client:', error);
            throw error;
        }
    }

    /**
     * Get users for a client
     */
    async getClientUsers(clientId, user) {
        try {
            if (!this.canUserAccessClient(user, clientId)) {
                throw new AppError('Access denied', 403);
            }

            let users;
            if (user.role === APPLICATION_ROLES.SUPER_ADMIN) {
                if (!clientId || clientId === 'all') {
                    users = await this.userRepository.findAllWithClients();
                } else if (clientId === 'super_admin') {
                    users = await this.userRepository.findSuperAdmins();
                } else {
                    users = await this.userRepository.findByClientId(clientId);
                }
            } else {
                users = await this.userRepository.findByClientId(clientId);
            }
            return users;
        } catch (error) {
            logger.error('Error getting client users:', error);
            throw error;
        }
    }
}