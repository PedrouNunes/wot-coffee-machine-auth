console.log("Starting consumer...");

// Utility function for formatted logs
function log(msg, data) {
    console.info("======= LOG =======");
    console.info(msg);
    console.dir(data);
    console.info("===================");
}

// Request the Thing Description from the coffee machine
WoT.requestThingDescription("https://localhost:8080/oauth").then(async (td) => {
    try {
        // Consume the Thing using the TD
        const thing = await WoT.consume(td);
        log("Thing Description received:", td);

        // Read all available resources
        let allAvailableResources = await (await thing.readProperty("allAvailableResources")).value();
        log("Available resources:", allAvailableResources);

        // Update water level to 80%
        await thing.writeProperty("availableResourceLevel", 80, {
            uriVariables: { id: "water" }
        });

        // Read updated water level
        const waterLevel = await (
            await thing.readProperty("availableResourceLevel", {
                uriVariables: { id: "water" }
            })
        ).value();
        log("Updated water level:", waterLevel);

        // Observe the "maintenanceNeeded" property
        thing.observeProperty("maintenanceNeeded", async (data) => {
            log("Maintenance required:", await data.value());
        });

        // Request to make 3 large lattes
        const makeCoffee = await thing.invokeAction("makeDrink", undefined, {
            uriVariables: { drinkId: "latte", size: "l", quantity: 3 }
        });
        const makeCoffeep = await makeCoffee?.value();
        log(makeCoffeep?.result ? "Coffee is being prepared." : "Failed to prepare coffee", makeCoffeep);

        // Read resources again after coffee preparation
        allAvailableResources = await (await thing.readProperty("allAvailableResources")).value();
        log("Resources after preparation:", allAvailableResources);

        // Schedule an espresso for every day at 10:00
        const scheduledTask = await thing.invokeAction("setSchedule", {
            drinkId: "espresso",
            size: "m",
            quantity: 2,
            time: "10:00",
            mode: "everyday"
        });
        const scheduledTaskp = await scheduledTask?.value();
        log("Scheduled task response:", scheduledTaskp);

        // Read the list of scheduled tasks
        const schedules = await (await thing.readProperty("schedules")).value();
        log("Scheduled tasks:", schedules);

        // Force maintenance by setting servedCounter > 1000
        await thing.writeProperty("servedCounter", 1001);
    } catch (err) {
        console.error("Error during execution:", err);
    }
}).catch((err) => {
    console.error("Failed to retrieve Thing Description:", err);
});
