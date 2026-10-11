import BaseRepository from "./BaseRepository.js";
import User from "../../../shared/models/User.js";
import Client from "../../../shared/models/Client.js";
import logger from "../../../shared/config/logger.js";
import mongoose from "mongoose";

/**
 * MongoDB implementation of the UserRepository.
 * This class provides methods to interact with the User collection in MongoDB.
 */
class MongoUserRepository extends BaseRepository {
    constructor() {
        super(User)
    }


    /**
     * Creates a new user in the database.
     * @param {Object} userData - The data of the user to be created.
     * @returns {Promise<Object>} - Returns the created user object.
     */
    async create(userData) {
        try {
            let data = { ...userData }
            if (!data.permissions) {
                if (data.role === "super_admin" || data.role === "client_admin") {
                    data.permissions = {
                        canCreateApiKeys: true,
                        canManageUsers: true,
                        canViewAnalytics: true,
                        canExportData: true,
                    }
                } else {
                    data.permissions = {
                        canCreateApiKeys: false,
                        canManageUsers: false,
                        canViewAnalytics: true,
                        canExportData: false,
                    }
                }
            }

            const user = new this.model(data);
            await user.save();

            logger.info("User created", { username: user.username });
            return user
        } catch (error) {
            logger.error("Error creating user", error)
            throw error;
        }
    }

    /**
     * Finds a user by their ID.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Object>} - Returns the user object if found.
     */
    async findById(userId) {
        try {
            const user = await this.model.findById(userId)
            return user
        } catch (error) {
            logger.error("Error finding user by id", error)
            throw error;
        }
    }

    /**
     * Finds a user by their username.
     * @param {string} username - The username of the user.
     * @returns {Promise<Object>} - Returns the user object if found.
     */
    async findByUsername(username) {
        try {
            const user = await this.model.findOne({ username })
            return user
        } catch (error) {
            logger.error("Error finding user by username", error)
            throw error;
        }
    }

    /**
     * Finds a user by their email.
     * @param {string} email - The email of the user.
     * @returns {Promise<Object>} - Returns the user object if found.
     */
    async findByEmail(email) {
        try {
            const user = await this.model.findOne({ email })
            return user
        } catch (error) {
            logger.error("Error finding user by email", error)
            throw error;
        }
    }

    /**
     * Finds all active users.
     * @returns {Promise<Array>} - Returns an array of active user objects.
     */
    /**
     * Finds all active users with populated client information.
     * @returns {Promise<Array>} - Returns an array of user objects.
     */
    async findAll() {
        try {
            const users = await this.model.find({ isActive: true }).populate("clientId", "name slug").select("-password");
            return users;
        } catch (error) {
            logger.error("Error finding all users", error);
            throw error;
        }
    }

    /**
     * Finds all users with populated client info regardless of active status.
     * @returns {Promise<Array>}
     */
    async findAllWithClients() {
        try {
            const users = await this.model.find().populate("clientId", "name slug").select("-password");
            return users;
        } catch (error) {
            logger.error("Error finding all users with clients", error);
            throw error;
        }
    }

    /**
     * Finds super admin users.
     * @returns {Promise<Array>}
     */
    async findSuperAdmins() {
        try {
            const users = await this.model.find({ role: "super_admin" }).select("-password");
            return users;
        } catch (error) {
            logger.error("Error finding super admin users", error);
            throw error;
        }
    }

    /**
     * Finds users by clientId.
     * @param {string} clientId
     * @returns {Promise<Array>}
     */
    async findByClientId(clientId) {
        try {
            if (!clientId || clientId === 'all') {
                return await this.findAllWithClients();
            }
            if (clientId === 'super_admin') {
                return await this.findSuperAdmins();
            }
            if (!mongoose.Types.ObjectId.isValid(clientId)) {
                return [];
            }
            const users = await this.model.find({ clientId }).populate("clientId", "name slug").select("-password");
            return users;
        } catch (error) {
            logger.error("Error finding users by clientId", error);
            throw error;
        }
    }
}

export default new MongoUserRepository()