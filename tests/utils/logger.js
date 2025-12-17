export function startSuite(name) {
    console.log(`\n⭐  ${name}\n`);
}

export function logSummary(results) {
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;

    console.log("\n---------------------------------------------------");
    console.log(`FINAL RESULTS: ${passed}/${total} PASS`);
    if (failed > 0) {
        console.log(`FAILED: ${failed}`);
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  ❌ ${r.name}: ${r.error}`);
        });
    } else {
        console.log("✅ ALL TESTS PASSED");
    }
    console.log("---------------------------------------------------\n");
}
