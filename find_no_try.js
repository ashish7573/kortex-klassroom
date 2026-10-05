const fs = require('fs');

const files = ['app/actions/admin.ts', 'app/actions/provision.ts', 'app/actions/student.ts', 'app/actions/teacher.ts', 'app/actions/teacher_assignments.ts'];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const funcs = code.split(/export (?:async )?function /);
  for (let i = 1; i < funcs.length; i++) {
     const body = funcs[i];
     const name = body.split('(')[0].trim();
     if (!body.includes('catch (error') && !body.includes('catch(e') && !body.includes('catch (e') && !body.includes('catch (err') && !body.includes('catch(err')) {
        console.log(`NO CATCH: ${name} in ${file}`);
     }
  }
}
