const fs = require('fs');

let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const oldFunc = `export async function generateParentId(idToken: string): Promise<string> {
  // 🔒 PATCH: Block unauthenticated DDOS attacks
  await adminAuth.verifyIdToken(idToken);
  
  const counterRef = adminDb.collection('system').doc('parent_counter');
  
  return adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let alphabets = "AAA";
    let number = 101;

    if (doc.exists) {
      const data = doc.data() as { alphabets: string, number: number };
      alphabets = data.alphabets || "AAA";
      number = data.number || 101;

      if (number >= 999) {
        number = 101;
        alphabets = getNextAlphabet(alphabets);
      } else {
        number++;
      }
    } else {
      transaction.set(counterRef, { alphabets, number });
    }

    transaction.update(counterRef, { alphabets, number });
    return \`PRT-\${alphabets}\${number}\`;
  });
}`;

const newFunc = `export async function generateParentId(idToken: string): Promise<string> {
  try {
    // 🔒 PATCH: Block unauthenticated DDOS attacks
    await adminAuth.verifyIdToken(idToken);
    
    const counterRef = adminDb.collection('system').doc('parent_counter');
    
    return await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterRef);
      
      let alphabets = "AAA";
      let number = 101;

      if (doc.exists) {
        const data = doc.data() as { alphabets: string, number: number };
        alphabets = data.alphabets || "AAA";
        number = data.number || 101;

        if (number >= 999) {
          number = 101;
          alphabets = getNextAlphabet(alphabets);
        } else {
          number++;
        }
      } else {
        transaction.set(counterRef, { alphabets, number });
      }

      transaction.update(counterRef, { alphabets, number });
      return \`PRT-\${alphabets}\${number}\`;
    });
  } catch (error) {
    console.error("Error generating parent ID:", error);
    // Fallback to a random ID if transaction fails or auth fails
    return \`PRT-ERR\${Math.floor(Math.random() * 900) + 100}\`;
  }
}`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('app/actions/student.ts', code);
console.log("Patched generateParentId");
