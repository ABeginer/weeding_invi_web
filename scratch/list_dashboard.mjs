import fs from 'node:fs';

const files = fs.readdirSync('components/dashboard');
console.log(files);

