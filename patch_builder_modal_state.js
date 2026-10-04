const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', 'utf8');

const oldState = `  // Selections
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(roster.map(r => r.uid)); // Default all
  const [dueDate, setDueDate] = useState<string>('');`;

const newState = `  // Selections
  const [sourceType, setSourceType] = useState<'kortex' | 'external'>('kortex');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(roster.map(r => r.uid)); // Default all
  const [dueDate, setDueDate] = useState<string>('');`;

code = code.replace(oldState, newState);

const oldSubmit = `  const handleSubmit = async () => {
    if (!selectedTool || selectedStudents.length === 0 || !dueDate) return;
    setSubmitting(true);
    setError(null);
    try {
      
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      
      const res = await createAssignment(token, {
        orgId: combo.orgId,
        comboId: combo.comboId,
        toolId: selectedTool.id,
        toolType: selectedTool.type || selectedTool.content_type || 'Task',
        chapterName: selectedTool.chapter_name || 'Unknown',
        toolTitle: selectedTool.title || selectedTool.subtopic_name || 'Untitled',
        dueDate: dueDate,
        assignedStudentIds: selectedStudents
      });`;

const newSubmit = `  const handleSubmit = async () => {
    if (sourceType === 'kortex' && !selectedTool) { setError("Select a content tool"); return; }
    if (sourceType === 'external' && (!title || !externalLink)) { setError("Provide a title and link"); return; }
    if (selectedStudents.length === 0 || !dueDate) { setError("Missing students or deadline"); return; }
    
    setSubmitting(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      
      const res = await createAssignment(token, {
        orgId: combo.orgId,
        comboId: combo.comboId,
        toolId: sourceType === 'kortex' ? selectedTool.id : 'external',
        toolType: sourceType === 'kortex' ? (selectedTool.type || selectedTool.content_type || 'Task') : 'External',
        chapterName: sourceType === 'kortex' ? (selectedTool.chapter_name || 'Unknown') : 'External Source',
        toolTitle: title || (sourceType === 'kortex' ? (selectedTool.title || selectedTool.subtopic_name || 'Untitled') : 'Untitled'),
        dueDate: dueDate,
        assignedStudentIds: selectedStudents,
        instructions: instructions,
        externalLink: sourceType === 'external' ? externalLink : ''
      });`;

code = code.replace(oldSubmit, newSubmit);

fs.writeFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', code);
