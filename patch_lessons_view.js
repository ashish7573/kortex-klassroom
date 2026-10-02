const fs = require('fs');
const file = 'kortex_landing_page/all_lessons_page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `const LessonsView = ({ isLoggedIn, requireAuth, onStartLesson }: any) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");`,
  `const LessonsView = ({ isLoggedIn, requireAuth, onStartLesson, defaultClass, defaultSubject }: any) => {
  const [selectedClass, setSelectedClass] = useState(defaultClass || "");
  const [selectedSubject, setSelectedSubject] = useState(defaultSubject || "");`
);

fs.writeFileSync(file, code);
