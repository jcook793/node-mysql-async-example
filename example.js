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


//MySQL connection pool and some state variables
var pool  = mysql.createPool(config.mysql),
    currentBatch = null,
    lastId = -1


//Returns the next batch of rows to process and calls the callback
var getNextBatch = function(callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            callback(err)
        } else {
            var sql = 'select * from node_test where id > ? order by id limit ' + config.batchSize,
                params = [lastId]

            connection.query(sql, params, function(err, rows) {
                connection.release()
                currentBatch = rows
                if(rows && rows.length > 0) {
                    lastId = rows[rows.length-1].id
                }
                callback(err)
            })
        }
    })
}


//Returns true if there are (possibly) more rows left to fetch
var hasMoreRows = function() {
    return (currentBatch && currentBatch.length > 0)
}


//Knows how to update a single row, calls the callback when complete
var processRow = function(row, callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            callback(err)
        } else {
            var sql = 'update node_test set update_count = ? where id = ?',
                newUpdateCount = row['update_count'] + 1,
                id = row['id'],
                params = [newUpdateCount, id]

            connection.query(sql, params, function(err) {
                connection.release()
                callback(err)
            })
        }
    })
}


//Knows how to update an entire batch, calls the callback when all are finished
var processBatch = function(callback) {
    if(currentBatch.length > 0) {
        var timeKey = 'Processed batch of ' + currentBatch.length + ' in'
        console.time(timeKey)
        async.each(currentBatch, processRow, function(err) {
            if(!err) {
                console.timeEnd(timeKey)
            }

            callback(err)
        })
    } else {
        callback()
    }
}


//Fetches the next batch to process and processes it, calls the callback function when done
var getNextBatchAndProcess = function(callback) {
    async.series([getNextBatch, processBatch], callback)
}



//And now we come to the actual bit of code that drives the whole thing
async.doWhilst(getNextBatchAndProcess, hasMoreRows, function(err) {
    pool.end()
    if(err) {
        console.error(err)
        process.exit(1)
    }

    console.log('Done!')
})
