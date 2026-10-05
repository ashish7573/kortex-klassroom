require('dotenv').config({ path: '.env.local' });
const { syncCurriculumTotals } = require('./app/actions/admin');

async function test() {
  console.log("Testing syncCurriculumTotals...");
  try {
    // We will just invoke it without a token to see if it throws!
    const result = await syncCurriculumTotals("invalid_token");
    console.log(result);
  } catch (e) {
    console.error("Caught error:", e);
  }
}
test();
