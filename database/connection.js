const mongooseConnectionManager = require('mongoose');
const systemConfiguration = require('../config');
require('dotenv').config();

const establishDatabaseConnection = async () => {
    try {
        const databaseConnectionURI = systemConfiguration.mongodb.uri || process.env.MONGODB_URI;
        
        if (!databaseConnectionURI || databaseConnectionURI.trim() === '') {
            console.warn('⚠️ MongoDB URI not configured - running without database');
            return null;
        }
        
        const databaseConnectionInstance = await mongooseConnectionManager.connect(databaseConnectionURI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        const connectionHostIdentifier = databaseConnectionInstance.connection.host;
        console.log(`✅ MongoDB Connected: ${connectionHostIdentifier}`);
        
        const connectionErrorHandler = (errorInstance) => {
            console.error('❌ MongoDB connection error:', errorInstance.message);
            console.log('🔄 Attempting to reconnect to MongoDB...');
        };
        mongooseConnectionManager.connection.on('error', connectionErrorHandler);

        const disconnectionEventHandler = () => {
            console.warn('⚠️ MongoDB disconnected - will auto-reconnect');
        };
        mongooseConnectionManager.connection.on('disconnected', disconnectionEventHandler);
        
        const reconnectedHandler = () => {
            console.log('✅ MongoDB reconnected successfully');
        };
        mongooseConnectionManager.connection.on('reconnected', reconnectedHandler);

        const applicationTerminationHandler = async () => {
            await mongooseConnectionManager.connection.close();
            console.log('📦 MongoDB connection closed gracefully');
            process.exit(0);
        };
        process.on('SIGINT', applicationTerminationHandler);

        return databaseConnectionInstance;
    } catch (connectionError) {
        console.error('❌ MongoDB connection failed:', connectionError.message);
        console.warn('⚠️ Continuing without database - some features may be limited');
        return null;
    }
};

module.exports = establishDatabaseConnection;
