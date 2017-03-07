const moment = require('moment'),
	fs = require('fs');

console.log(moment().format('L') + ' ' + moment().format('LTS'));
console.log(`${moment().format('L')} ${moment().format('LTS')}`);

let name = `IIC ${moment().format('L').replace(/\//g, '.')} ${moment().format('LTS')}`;

fs.writeFile(`./Wyniki/${name}`, () => {
	console.log(name);
});