# Show (formated) log file
bunyan stairsJs.log

# Show (formated) log file in short notation
bunyan -o short stairsJs.log

# Show (formated) log file
bunyan stairsJs.log

# View multiple files
bunyan stairsJs.log [bar.log ...]

# Filter on a unique request id
bunyan -c 'this.reqId=="5b9130bb-1e29-4627-8393-1a98d0d27691"' stairsJs.log

# Filter on an IP
bunyan -c this.reqIp=="::ffff:192.168.178.24" stairsJs.log

# Filter on a certain instance of stairsJst, using the process id (pid)
bunyan stairsJs.log -c 'this.pid=="1482"'

# Filter on ...  user=bob (if we had that in the log file..)
bunyan -c 'this.user=="bob"' stairsJs.log


# ERROR level and above
$ bunyan stairsJs.log -l error

# Watch incoming HTTP requests.
$ tail -f stairsJs.log | bunyan -c 'this.req'

# Watch outgoing HTTP responses
$ tail -f stairsJs.log | bunyan -c 'this.res'

# COMBINE: What server errors in HTTP responses.
$ tail -f stairsJs.log | bunyan -c 'this.res && this.res.statusCode >= 500'


