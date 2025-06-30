/********************************************************************************
 * Copyright (c) 2018 - 2020 Contributors to the Eclipse Foundation
 ********************************************************************************/

/**
 * Modelo de autenticação em memória para OAuth 2.0
 * Compatível com @node-oauth/express-oauth-server
 */

module.exports = class InMemoryModel {
    constructor() {
        this.clients = [
            {
                clientId: "node-wot",
                clientSecret: "isgreat!",
                redirectUris: [""],
                grants: ["client_credentials"],
                scopes: ["user", "coffee_user"],
            },
        ];
        this.tokens = [];
        this.users = [
            {
                id: "123",
                username: "thomseddon",
                password: "nightworld",
            },
        ];
    }

    getAccessToken(bearerToken) {
        const token = this.tokens.find((t) => t.accessToken === bearerToken);
        return token || false;
    }

    getRefreshToken(bearerToken) {
        const token = this.tokens.find((t) => t.refreshToken === bearerToken);
        return token || false;
    }

    getClient(clientId, clientSecret) {
        const client = this.clients.find(
            (c) => c.clientId === clientId && (!clientSecret || c.clientSecret === clientSecret)
        );
        return client || false;
    }

    saveToken(token, client, user) {
        const savedToken = {
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            client: client,
            user: user,
        };
        this.tokens.push(savedToken);
        return savedToken;
    }

    getUser(username, password) {
        const user = this.users.find((u) => u.username === username && u.password === password);
        return user || false;
    }

    getUserFromClient(client) {
        return this.users[0]; // Simplesmente retorna o primeiro usuário
    }

    saveAuthorizationCode() {
        // Não necessário para client_credentials
    }

    revokeToken() {
        // Não necessário para testes
    }

    dump() {
        console.log("clients", this.clients);
        console.log("tokens", this.tokens);
        console.log("users", this.users);
    }

    expireAllTokens() {
        for (const token of this.tokens) {
            token.accessTokenExpiresAt = Date.now();
        }
    }
};
