const fs = require('fs');
const file = 'kortex_users/parent/ChildAcademicView.tsx';
let code = fs.readFileSync(file, 'utf8');

const badClosure = `            />

            </div>
          </div>
        );
      })}`;

const goodClosure = `            />

          </div>
        );
      })}`;

code = code.replace(badClosure, goodClosure);

fs.writeFileSync(file, code);
