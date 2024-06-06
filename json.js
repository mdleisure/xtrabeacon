const jsonfile = require('jsonfile');
const path = 'settings.json';

console.dir(jsonfile.readFileSync(path))

const stored=jsonfile.readFileSync(path)
console.log("Stored Contents",stored.ip)