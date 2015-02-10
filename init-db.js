var mysql = require('mysql'),
    async = require('async')

if(process.argv.length < 3) {
    console.error('Missing config file!')
    process.exit(1)
}


//Load the config file, setup defaults
var configFile = process.argv[2]
if(configFile.indexOf('.') !== 0 && configFile.indexOf('/') !== 0) {
    configFile = './' + configFile
}
var config = require(configFile)
config.batchSize = config.batchSize || 10

//MySQL connection pool
var pool  = mysql.createPool(config.mysql)


//Creates the table
var createTable = function(callback) {
    var sql = 'create table node_test ' +
              '(id int not null auto_increment, ' +
              'update_count int null default 0, ' +
              'created_on datetime null default now(), ' +
              'updated_on datetime null default now(), ' +
              'primary key (id))'

    pool.getConnection(function(err, connection) {
        if(err) {
            callback(err)
        } else {
            connection.query(sql, function(err) {
                connection.release()
                callback(err)
            })
        }
    })
}


//Inserts 1,000 rows
var insertRows = function(callback) {
    async.times(1000, function(n, next) {
        pool.getConnection(function(err, connection) {
            if(err) {
                next(err)
            } else {
                connection.query('insert into node_test values()', function(err) {
                    connection.release()
                    next(err)
                })
            }
        })
    }, callback)
}



//Here's where it actually starts
async.series([createTable, insertRows], function(err) {
    pool.end()
    if(err) {
        console.error(err)
        process.exit(1)
    }

    console.log('Done!')
})
