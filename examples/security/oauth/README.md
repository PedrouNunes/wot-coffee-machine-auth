## Summary of Code Purpose

This script acts as a **Web of Things (WoT) consumer** that connects to a "Smart Coffee Machine" Thing using a **Thing Description (TD)** and interacts with it over **HTTPS with OAuth 2.0 authentication**. It:

* Reads resources
* Updates the water level
* Prepares a drink
* Schedules a task
* Observes for maintenance needs

---

## Step-by-Step Code Explanation

### 1. **Start and Logging Utility**

```js
console.log("Starting consumer...");
function log(msg, data) {
    console.info("======= LOG =======");
    console.info(msg);
    console.dir(data);
    console.info("===================");
}
```

* A startup message is printed.
* The `log()` function prints structured debug information for readability.

---

### 2. **Requesting the Thing Description**

```js
WoT.requestThingDescription("https://localhost:8080/oauth")
```

* Uses the WoT runtime to fetch the TD (Thing Description) of the coffee machine hosted at `https://localhost:8080/oauth`.

---

### 3. **Consuming the Thing**

```js
const thing = await WoT.consume(td);
log("Thing Description received:", td);
```

* The consumer uses the TD to create a local API client to interact with the Thing.

---

### 4. **Reading All Available Resources**

```js
let allAvailableResources = await (await thing.readProperty("allAvailableResources")).value();
log("Available resources:", allAvailableResources);
```

* Reads an object that shows how much of each resource (water, milk, etc.) is available.

---

### 5. **Updating Water Level**

```js
await thing.writeProperty("availableResourceLevel", 80, {
    uriVariables: { id: "water" }
});
```

* Writes a new value (`80%`) to the water resource using `uriVariables`.

---

### 6. **Verifying the Updated Water Level**

```js
const waterLevel = await (await thing.readProperty("availableResourceLevel", {
    uriVariables: { id: "water" }
})).value();
log("Updated water level:", waterLevel);
```

* Reads back the water level to confirm the update.

---

### 7. **Observing the `maintenanceNeeded` Property**

```js
thing.observeProperty("maintenanceNeeded", async (data) => {
    log("Maintenance required:", await data.value());
});
```

* Registers an observer callback. If the Thing emits a change in maintenance status, it logs it.

---

### 8. **Preparing a Coffee Drink**

```js
const makeCoffee = await thing.invokeAction("makeDrink", undefined, {
    uriVariables: { drinkId: "latte", size: "l", quantity: 3 }
});
const makeCoffeep = await makeCoffee?.value();
log(makeCoffeep?.result ? "Coffee is being prepared." : "Failed to prepare coffee", makeCoffeep);
```

* Invokes the `makeDrink` action to prepare 3 large lattes.
* Logs whether the preparation was successful based on the returned object.

---

### 9. **Reading Resources Again**

```js
allAvailableResources = await (await thing.readProperty("allAvailableResources")).value();
log("Resources after preparation:", allAvailableResources);
```

* Checks remaining resources after making the coffee.

---

### 10. **Scheduling a Coffee**

```js
const scheduledTask = await thing.invokeAction("setSchedule", {
    drinkId: "espresso",
    size: "m",
    quantity: 2,
    time: "10:00",
    mode: "everyday"
});
const scheduledTaskp = await scheduledTask?.value();
log("Scheduled task response:", scheduledTaskp);
```

* Invokes the `setSchedule` action to automate coffee preparation every day at 10:00.

---

### 11. **Reading Scheduled Tasks**

```js
const schedules = await (await thing.readProperty("schedules")).value();
log("Scheduled tasks:", schedules);
```

* Retrieves and logs all scheduled drink tasks.

---

### 12. **Forcing Maintenance**

```js
await thing.writeProperty("servedCounter", 1001);
```

* Writes a high number to `servedCounter` to simulate usage and trigger maintenance condition.

---

### 13. **Error Handling**

```js
} catch (err) {
    console.error("Error during execution:", err);
}
}).catch((err) => {
    console.error("Failed to retrieve Thing Description:", err);
});
```

* Catches both:

  * Errors during Thing Description request
  * Errors during Thing interaction

---

## Expected Behavior When Running

If everything is configured correctly (OAuth server running, TD reachable, etc.), this script will fullfill the steps below:

1. Connect to the coffee machine
2. Show the TD details
3. Read and update resources
4. Prepare a drink
5. Schedule another
6. Log any maintenance needs
7. Exit cleanly or display any errors encountered

---

# oAuth JavaScript example

This is example is composed by two actors: one Thing that expose an action with oAuth2.0 client credential security constraint and a client who want to use that function. In the example, we are using an utility server to generate tokens and validate client credentials. Therefore, the **wot-consumer** force the action `href` to be the same as the utility server with the goal to validate the obtained oAuth2.0 token. In the feature the exposing servient could also play this role.

## run the example

Set the current working directory to this folder. Then execute:

```bash
npm install
```

Now you are ready to run the example.

```bash
# start the server
npm run server
```

in a different terminal

```bash
# start the exposer
npm run start:exposer
```

Finally, in other terminal

```bash
npm run start:consumer
```

you should see the following line at the end of consumer log:

```bash
oAuth token was Ok!
```

This confirms that the oAuth flow was completed successfully. Now you can have fun revoking the access to the consumer script. Go
to `./exposer.js` and try to remove the string `"user"` from the grants. Run again the example and you will see that the action is not executed and an error is returned by the client.

## Where is a TS version?

See [here](../../../packages/examples/src/security/oauth)
