
import { runTestsInModule } from "./utils/run.js";
import { logSummary, startSuite } from "./utils/logger.js";

const modules = [
    "./modules/booking.tests.js",
    "./modules/deposit.tests.js",
    "./modules/pipeline.tests.js",
    "./modules/intake.tests.js",
    "./modules/gallery.tests.js",
    "./modules/messaging.tests.js",
    "./modules/notifications.tests.js",
    "./modules/settings.tests.js"
];

export async function runAllTests() {
    startSuite("InkFlow-OS Automated Test Suite");

    let results = [];
    try {
        for (const modulePath of modules) {
            // Use dynamic import for ESM modules
            const module = await import(modulePath);
            const moduleResults = await runTestsInModule(module);
            results.push(...moduleResults);
        }
    } catch (err) {
        console.error("Runner Error:", err);
    }

    logSummary(results);
    return results;
}

// Exec if run directly
if (process.argv[1] === import.meta.url.slice(7) || process.argv[1].endsWith('antigravity_test_runner.js')) {
    runAllTests();
}

export default runAllTests;
