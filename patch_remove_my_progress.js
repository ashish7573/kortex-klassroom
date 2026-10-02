const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const startTag = `{/* My Progress Section */}`;
const endTag = `      {/* Out of Energy Modal */}`;

// Actually, "Out of Energy Modal" comes BEFORE My Progress Section in the text I dumped earlier.
// Let's use string indexOf to precisely remove it.
const startStr = `{/* My Progress Section */}`;
const endStr = `        )}
      </div>`;

const idx1 = code.indexOf(startStr);
const idx2 = code.indexOf(endStr, idx1);

if (idx1 !== -1 && idx2 !== -1) {
    code = code.substring(0, idx1) + code.substring(idx2 + endStr.length);
    fs.writeFileSync(file, code);
    console.log("Success");
} else {
    console.log("Failed");
}
