const fs = require('fs');
const file = 'app/actions/student.ts';
let code = fs.readFileSync(file, 'utf8');

const parentIdFunc = `
export async function generateParentId(): Promise<string> {
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
    return \`PR_\${alphabets}_\${number}\`;
  });
}
`;

code = code.replace(`export async function provisionStudentPlaceholder`, parentIdFunc + `\nexport async function provisionStudentPlaceholder`);

fs.writeFileSync(file, code);
