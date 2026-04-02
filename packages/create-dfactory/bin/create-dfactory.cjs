#!/usr/bin/env node

(async () => {
  try {
    const entryModule = await import("create-dfactory");

    if (typeof entryModule.runCreateDFactory !== "function") {
      throw new Error("The create-dfactory runtime entrypoint did not export runCreateDFactory().");
    }

    await entryModule.runCreateDFactory();
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Cannot find module") || error.message.includes("ERR_MODULE_NOT_FOUND"))
    ) {
      console.error(
        "The create-dfactory runtime entrypoint is missing. Rebuild the package or reinstall it so the published dist files are available."
      );
      process.exit(1);
    }

    console.error(`Failed to initialize DFactory: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
})();
