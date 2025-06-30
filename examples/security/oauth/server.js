/********************************************************************************
 * Copyright (c) 2018 - 2020 Contributors to the Eclipse Foundation
 ********************************************************************************/

const OAuthServer = require("@node-oauth/express-oauth-server");
const bodyParser = require("body-parser");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const express = require("express");
const Memory = require("./memory-model");

const app = express();
app.use(cors());
app.options("*", cors());


const model = new Memory();

app.oauth = new OAuthServer({
    model: model,
});


app.use("/introspect", bodyParser.urlencoded({ extended: false }));
app.use("/introspect", (req, res, next) => {
    if (req.method !== "POST" || !req.is("application/x-www-form-urlencoded")) {
        return res.status(400).end();
    }

    const token = req.body.token;
    delete req.body.token;
    req.body.access_token = token;
    next();
});
app.use("/introspect", app.oauth.authenticate());
app.use("/introspect", (req, res) => {
    const token = res.locals.oauth.token;
    res.json({
        active: !!token,
        scope: token.client.scopes.join(" "),
        client_id: token.client.clientId,
    });
});


app.use("/token", bodyParser.urlencoded({ extended: false }));
app.use("/token", app.oauth.token());


app.use("/resource", (req, res) => {
    res.send("Ok!");
});


https.createServer(
    {
        key: fs.readFileSync("../privatekey.pem"),
        cert: fs.readFileSync("../certificate.pem"),
    },
    app
).listen(3000, "localhost", () => {
    console.log("OAuth 2.0 Server listening on https://localhost:3000");
});
