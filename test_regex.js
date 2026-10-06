const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
const str = 'id123,All Grades,FLN Maths,Chapter 1 is Fun,My Title';
console.log(str.match(regex));
