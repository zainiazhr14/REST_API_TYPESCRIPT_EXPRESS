# BASE REST API
This project was generated using [Express JS](https://expressjs.com/).
## Getting Started
### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](nodejs.org) Node ^14.xx
- [Npm](https://npmjs.com)
- [VSC - Visual Studio Code](https://code.visualstudio.com/download)
- Turn Off Prettier Plugin / Format On Save setting on VSC
- Enabled Eslint Plugin


Install dependencies
```javascript
cd REST_API_TYPESCRIPT_EXPRESS
npm install
```

## RUNNING API
Running API (Make sure MongoDB and PostgreSQL is running)

[.env.example](.env.local.example)
### LOCAL (In Your Local Computer)
```javascript
// Create .env.local if on local computer

// on local
npm run local

```

Connection to DB Remote Server
on database.js
```javascript
const tunnel = require('tunnel-ssh');

const configTunnel = {
	username: '',
	password: '',
	host: '',
	port: 22,
	dstPort: 27017,
	localPort: 2000
};

tunnel(configTunnel, function (error, server) {
	if(error){
		console.log("SSH connection error: " + error);
	}
	// load database
	mongoose.connect('mongodb://localhost:2000/'+config.db, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true
	});
});
```

API documentation on
```javascript
http://localhost:3001/documentation
```

Available process.env
```javascript
APP_PORT=3001 //starting port
NODE_MICRO=0 //running micro
```