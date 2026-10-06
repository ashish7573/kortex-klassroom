const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

code = code.replace(
  /async function generateMultipleGlobalStudentIds[\s\S]*?return ids;\n  \}\);\n\}\n/m,
  `async function generateMultipleGlobalStudentIds(count: number): Promise<string[]> {
  const counterRef = adminDb.collection('system').doc('student_counter');
  
  return adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let alphabets = "AAA";
    let number = 101;

    if (doc.exists) {
      const data = doc.data()!;
      alphabets = data.alphabets;
      number = data.number;
    }

    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      if (doc.exists || i > 0) {
        if (number >= 999) {
          number = 101;
          alphabets = getNextAlphabet(alphabets);
        } else {
          number++;
        }
      }
      ids.push(\`K\${alphabets}\${number}\`);
    }

    transaction.set(counterRef, { alphabets, number });
    return ids;
  });
}
`
);

fs.writeFileSync('app/actions/student.ts', code);
console.log("Refined.");
