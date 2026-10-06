const str = 'id123,All Grades,FLN Maths,Chapter 1 is Fun,My Title,"Quoted, Title"';
const row = str.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
console.log(row);
