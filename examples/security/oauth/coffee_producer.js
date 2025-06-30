WoT.produce({
    title: "OAuth",  // deve bater com o caminho: https://localhost:8080/oauth
    id: "urn:dev:wot:oauth:test",
    description: `A smart coffee machine with a range of capabilities.`,
    support: "https://github.com/eclipse-thingweb/node-wot/",
    securityDefinitions: {
        oauth2_sc: {
            scheme: "oauth2",
            flow: "client",
            token: "https://localhost:3000/token",
            scopes: ["coffee_user"]
        }
    },
    security: ["oauth2_sc"],
    properties: {
        allAvailableResources: {
            type: "object",
            readOnly: true,
            properties: {
                water: { type: "integer", minimum: 0, maximum: 100 },
                milk: { type: "integer", minimum: 0, maximum: 100 },
                chocolate: { type: "integer", minimum: 0, maximum: 100 },
                coffeeBeans: { type: "integer", minimum: 0, maximum: 100 }
            }
        },
        availableResourceLevel: {
            type: "number",
            uriVariables: {
                id: {
                    type: "string",
                    enum: ["water", "milk", "chocolate", "coffeeBeans"]
                }
            }
        },
        servedCounter: {
            type: "integer",
            minimum: 0
        },
        maintenanceNeeded: {
            type: "boolean",
            observable: true
        },
        schedules: {
            type: "array",
            readOnly: true,
            items: {
                type: "object",
                properties: {
                    drinkId: { type: "string" },
                    size: { type: "string", enum: ["s", "m", "l"] },
                    quantity: { type: "integer", minimum: 1, maximum: 5 },
                    time: { type: "string" },
                    mode: {
                        type: "string",
                        enum: [
                            "once", "everyday", "everyMo", "everyTu", "everyWe",
                            "everyTh", "everyFr", "everySat", "everySun"
                        ]
                    }
                }
            }
        }
    },
    actions: {
        makeDrink: {
            uriVariables: {
                drinkId: { type: "string" },
                size: { type: "string", enum: ["s", "m", "l"] },
                quantity: { type: "integer", minimum: 1, maximum: 5 }
            },
            output: {
                type: "object",
                properties: {
                    result: { type: "boolean" },
                    message: { type: "string" }
                }
            }
        },
        setSchedule: {
            input: {
                type: "object",
                required: ["time", "mode"],
                properties: {
                    drinkId: { type: "string" },
                    size: { type: "string", enum: ["s", "m", "l"] },
                    quantity: { type: "integer", minimum: 1, maximum: 5 },
                    time: { type: "string" },
                    mode: {
                        type: "string",
                        enum: [
                            "once", "everyday", "everyMo", "everyTu", "everyWe",
                            "everyTh", "everyFr", "everySat", "everySun"
                        ]
                    }
                }
            },
            output: {
                type: "object",
                properties: {
                    result: { type: "boolean" },
                    message: { type: "string" }
                }
            }
        }
    },
    events: {
        outOfResource: {
            data: { type: "string" }
        }
    }
}).then((thing) => {
    let allAvailableResources = {
        water: 100,
        milk: 100,
        chocolate: 100,
        coffeeBeans: 100
    };
    let servedCounter = 0;
    let maintenanceNeeded = false;
    let schedules = [];

    const sizeQuantifiers = { s: 0.1, m: 0.2, l: 0.3 };
    const drinkRecipes = {
        espresso: { water: 1, milk: 0, chocolate: 0, coffeeBeans: 2 },
        americano: { water: 2, milk: 0, chocolate: 0, coffeeBeans: 2 },
        cappuccino: { water: 1, milk: 1, chocolate: 0, coffeeBeans: 2 },
        latte: { water: 1, milk: 2, chocolate: 0, coffeeBeans: 2 },
        hotChocolate: { water: 0, milk: 0, chocolate: 1, coffeeBeans: 0 },
        hotWater: { water: 1, milk: 0, chocolate: 0, coffeeBeans: 0 }
    };

    thing.setPropertyReadHandler("allAvailableResources", async () => allAvailableResources);
    thing.setPropertyReadHandler("maintenanceNeeded", async () => maintenanceNeeded);
    thing.setPropertyReadHandler("schedules", async () => schedules);
    thing.setPropertyWriteHandler("servedCounter", async (val) => {
        servedCounter = await val.value();
        if (servedCounter > 1000) {
            maintenanceNeeded = true;
            thing.emitPropertyChange("maintenanceNeeded");
        }
    });

    thing.setPropertyReadHandler("availableResourceLevel", async (options) => {
        const id = options?.uriVariables?.id;
        if (!id || !(id in allAvailableResources)) throw Error("Missing or invalid 'id'");
        return allAvailableResources[id];
    });

    thing.setPropertyWriteHandler("availableResourceLevel", async (val, options) => {
        const id = options?.uriVariables?.id;
        if (!id || !(id in allAvailableResources)) throw Error("Missing or invalid 'id'");
        allAvailableResources[id] = await val.value();
    });

    thing.setActionHandler("makeDrink", async (_params, options) => {
        let drinkId = "americano";
        let size = "m";
        let quantity = 1;

        const uriVars = options?.uriVariables ?? {};
        if (uriVars.drinkId) drinkId = uriVars.drinkId;
        if (uriVars.size) size = uriVars.size;
        if (uriVars.quantity) quantity = uriVars.quantity;

        const newResources = { ...allAvailableResources };
        for (const res in newResources) {
            newResources[res] -= Math.ceil(quantity * sizeQuantifiers[size] * drinkRecipes[drinkId][res]);
            if (newResources[res] < 0) {
                thing.emitEvent("outOfResource", `Low ${res}: ${newResources[res]}%`);
                return { result: false, message: `${res} too low` };
            }
        }

        allAvailableResources = newResources;
        servedCounter += quantity;
        return { result: true, message: `Your ${drinkId} is brewing!` };
    });

    thing.setActionHandler("setSchedule", async (params) => {
        const p = await params.value();
        if (!p.time || !p.mode) {
            return { result: false, message: "Missing required time/mode" };
        }
        p.drinkId ??= "americano";
        p.size ??= "m";
        p.quantity ??= 1;
        schedules.push(p);
        return { result: true, message: "Schedule set!" };
    });

    thing.expose().then(() => {
        console.info("Coffee maker exposed as 'OAuth' with OAuth2 security");
    });
}).catch(console.error);
