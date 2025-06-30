const td = {
    "@context": "https://www.w3.org/2019/wot/td/v1",
    title: "OAuth",
    id: "urn:dev:wot:oauth:test",
    securityDefinitions: {
        oauth2_sc: {
            scheme: "oauth2",
            flow: "client",
            token: "https://localhost:3000/token",
            scopes: ["user", "admin"],
        },
    },
    security: ["oauth2_sc"],
    actions: {
        sayOk: {
            description: "A simple action protected with oauth",
            idempotent: true,
            output: { type: "string" },
        },
    },
};

WoT.produce(td).then((thing) => {
    thing.setActionHandler("sayOk", async () => "Ok!");
    thing.expose();
});
