const SSE = require('sse'),
    http = require('http'),
    fs = require('fs'),
    buckets = require('buckets-js'),
    readline = require('readline'),
    Handlebars = require('handlebars');

const connectedClients = [];
// keep a global flag for keeping track of lines in changed files as it is append only
// let latestLineCount = 0;
var server = http.createServer(function (req, res) {
    const queue = buckets.Queue();
    const rd = readline.createInterface({
        input: fs.createReadStream('file.log')
    });

    // read line by line
    rd.on('line', function (line) {
        if (queue.size() < 3) {
            queue.enqueue(line);
        } else {
            queue.dequeue();
            queue.enqueue(line);
        }
    });

    // on close read the html file and embed the array in it
    rd.on('close', () => {
        fs.readFile('index.html', (err, buffer) => {
            if (err) {
                res.end(err.message || 'Some Error Occured');
            }
            const content = Handlebars.compile(buffer.toString());
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end(content({
                lines: queue.toArray()
            }))
        })
    });

});

server.listen(8080, '127.0.0.1', function () {
    var sse = new SSE(server);
    sse.on('connection', function (client) {
        // console.log('client conn');
        let count = 0;
        fs.createReadStream('file.log')
            .on('data', function (chunk) {
                for (i = 0; i < chunk.length; ++i)
                    if (chunk[i] == 10) count++;
            })
            .on('end', function () {
                // console.log(count);
                connectedClients.push({
                    connection: client,
                    linesTillNow: count
                });
            });
    });
});

fs.watch('file.log', {}, (eventType, filename) => {
    if (eventType === 'change') {
        let presentLineIndex = 0;
        const rd = readline.createInterface({
            input: fs.createReadStream('file.log')
        });

        // read line by line
        rd.on('line', function (line) {
            // console.log('index is', presentLineIndex);
            for(let i=0; i<connectedClients.length; i++){
                const client = connectedClients[i];
                if(presentLineIndex > client.linesTillNow){
                    client.linesTillNow = presentLineIndex;
                    client.connection.send(line);
                }
            }
            presentLineIndex++;
        });
    }
});