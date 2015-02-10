# Node.js example using the MySQL and Async libraries
I threw this together to demonstrate a simple command-line Node app that uses the [mysql](https://github.com/felixge/node-mysql/) and [Async ](https://github.com/caolan/async) libraries.

# To "build" the app
This is how you install all the project dependencies for just about any Node app:
```
npm install
```

# Configuration
Copy ```config-template.json``` to something like ```myconf.json``` and edit the values appropriately.

# Initializing the DB
This will create a table called ```node_example``` in the schema you specified in your config file. It will also populate that table with a thousand rows. Feel free to take
a look at the structure and the data.

```
node init-db.js myconf.json
```

# Run the app
```
node example.js myconf.json
```
You will see that all the rows have their ```update_count``` fields incremented by one.
