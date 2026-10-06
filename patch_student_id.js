const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const newFunc = `async function generateMultipleGlobalStudentIds(count: number): Promise<string[]> {
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
      if (doc.exists) {
        if (number >= 999) {
          number = 101;
          alphabets = getNextAlphabet(alphabets);
        } else {
          number++;
        }
      }
      ids.push(\`K\${alphabets}\${number}\`);
      if (!doc.exists && i === 0) {
         // handle first ever case
         number++;
      }
    }

    transaction.set(counterRef, { alphabets, number });
    return ids;
  });
}
`;

if (!code.includes('generateMultipleGlobalStudentIds')) {
  code = code.replace(
    'async function generateGlobalStudentId(): Promise<string> {',
    newFunc + '\nasync function generateGlobalStudentId(): Promise<string> {'
  );
  fs.writeFileSync('app/actions/student.ts', code);
  console.log("generateMultipleGlobalStudentIds injected.");
}
