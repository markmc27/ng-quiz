(typeof(process) !== "undefined" ? process : (function() {
    var shift = Array.prototype.shift;


    function EventObject(listener, ctx) {
        this.listener = listener;
        this.ctx = ctx;
    }


    function EventEmitter() {

        this._events = {};
        this._maxListeners = EventEmitter.defaultMaxListeners;
    }

    EventEmitter.defaultMaxListeners = 10;

    EventEmitter.prototype.on = function(type, listener, ctx) {
        var events = this._events,
            event = (events[type] || (events[type] = [])),
            maxListeners = this._maxListeners;

        event.push(new EventObject(listener, ctx || this));

        if (maxListeners !== -1 && event.length > maxListeners) {
            console.error("EventEmitter.on(type, listener, ctx) possible EventEmitter memory leak detected. " + maxListeners + " listeners added");
        }

        return this;
    };

    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    EventEmitter.prototype.once = function(type, listener, ctx) {
        var _this = this;
        ctx || (ctx = this);

        function once() {
            _this.off(type, once, ctx);
            listener.apply(ctx, arguments);
        }

        return this.on(type, once, ctx);
    };

    EventEmitter.prototype.listenTo = function(obj, type, listener, ctx) {
        if (!(obj instanceof EventEmitter)) throw new Error("EventEmitter.listenTo(obj, type, listener, ctx) obj must be an instance of EventEmitter");

        obj.on(type, listener, ctx || this);

        return this;
    };

    EventEmitter.prototype.off = function(type, listener, ctx) {
        var thisEvents = this._events,
            events, event,
            i;

        if (!type) {
            for (var key in thisEvents) {
                if ((events = thisEvents[key])) events.length = 0;
            }

            return this;
        }

        events = thisEvents[type];
        if (!events) return this;

        if (!listener) {
            events.length = 0;
        } else {
            ctx = ctx || this;
            i = events.length;

            while (i--) {
                event = events[i];

                if (event.listener === listener && event.ctx === ctx) {
                    events.splice(i, 1);
                    break;
                }
            }
        }

        return this;
    };

    EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

    EventEmitter.prototype.removeAllListeners = function() {
        var events = this._events,
            event;

        for (var key in events) {
            if ((event = events[i])) event.length = 0;
        }
    };

    EventEmitter.prototype.emit = function(type) {
        var events = this._events[type],
            a1, a2, a3, a4,
            length, event,
            i;

        if (!events || !events.length) return this;
        length = arguments.length;

        if (length === 1) {
            i = events.length;
            while (i--) {
                (event = events[i]).listener.call(event.ctx);
            }
        } else if (length === 2) {
            a1 = arguments[1];
            i = events.length;
            while (i--) {
                (event = events[i]).listener.call(event.ctx, a1);
            }
        } else if (length === 3) {
            a1 = arguments[1];
            a2 = arguments[2];
            i = events.length;
            while (i--) {
                (event = events[i]).listener.call(event.ctx, a1, a2);
            }
        } else if (length === 4) {
            a1 = arguments[1];
            a2 = arguments[2];
            a3 = arguments[3];
            i = events.length;
            while (i--) {
                (event = events[i]).listener.call(event.ctx, a1, a2, a3);
            }
        } else if (length === 5) {
            a1 = arguments[1];
            a2 = arguments[2];
            a3 = arguments[3];
            a4 = arguments[4];
            i = events.length;
            while (i--) {
                (event = events[i]).listener.call(event.ctx, a1, a2, a3, a4);
            }
        } else {
            shift.apply(arguments);
            i = events.length;
            while (i--) {
                (event = events[i]).listener.apply(event.ctx, arguments);
            }
        }

        return this;
    };

    EventEmitter.prototype.setMaxListeners = function(count) {
        this._maxListeners = count;
        return this;
    };


    function Process() {

        EventEmitter.call(this);
        var arch = /\b(?:AMD|IA|Win|WOW|x86_|x)64\b/i.exec(navigator.platform);

        this.pid = 0;
        this.title = "browser";
        this.browser = true;
        this.env = {};
        this.argv = [];
        this.version = "1.0.0";
        this.versions = {};
        this.config = {};
        this.execPath = ".";
        this.execArgv = [];
        this.arch = arch ? arch[0] : "unknown"
        this.platform = ((navigator.platform.split(/[ \s]+/)[0]).toLowerCase() || "unknown");
        this.maxTickDepth = 100;
        this._cwd = location.pathname;
    }
    Process.prototype = Object.create(EventEmitter.prototype);
    Process.prototype.constructor = Process;

    Process.prototype.memoryUsage = (function() {
        var performance = window.performance || {},
            memory = {
                rss: 0,
                heapTotal: 0,
                heapUsed: 0
            };

        performance.memory || (performance.memory = {});

        return function memoryUsage() {
            memory.rss = performance.memory.jsHeapSizeLimit || 0;
            memory.heapTotal = performance.memory.totalJSHeapSize || 0;
            memory.heapUsed = performance.memory.usedJSHeapSize || 0;

            return memory;
        };
    }());

    Process.prototype.nextTick = (function() {
        var canSetImmediate = !!window.setImmediate,
            canPost = window.postMessage && window.addEventListener;

        if (canSetImmediate) {
            return function(fn) {
                return window.setImmediate(fn)
            };
        }

        if (canPost) {
            var queue = [];

            window.addEventListener("message", function(e) {
                var source = e.source;

                if ((source === window || source === null) && e.data === "process-tick") {
                    e.stopPropagation();

                    if (queue.length > 0) queue.shift()();
                }
            }, true);

            return function nextTick(fn) {
                queue.push(fn);
                window.postMessage("process-tick", "*");
            };
        }

        return function nextTick(fn) {
            setTimeout(fn, 0);
        };
    }());

    Process.prototype.cwd = function() {
        return this._cwd;
    };

    Process.prototype.chdir = function(dir) {
        var cwd = location.pathname;

        if (cwd.indexOf(dir.substring(0, cwd.length)) === 0) {
            this._cwd = dir;
        } else {
            throw new Error("process.chdir can't change to directory " + dir);
        }
    };

    Process.prototype.hrtime = (function() {
        var performance = window.performance || {},
            start;

        Date.now || (Date.now = function now() {
            return (new Date()).getTime();
        });
        start = Date.now();

        performance.now || (performance.now =
            performance.mozNow ||
            performance.msNow ||
            performance.oNow ||
            performance.webkitNow ||
            function now() {
                return Date.now() - start;
            }
        );

        function performanceNow() {
            return start + performance.now();
        }

        return function hrtime(previousTimestamp) {
            var clocktime = performanceNow() * 1e-3,
                seconds = Math.floor(clocktime),
                nanoseconds = (clocktime % 1) * 1e9;

            if (previousTimestamp) {
                seconds -= previousTimestamp[0];
                nanoseconds -= previousTimestamp[1];

                if (nanoseconds < 0) {
                    seconds--;
                    nanoseconds += 1e9;
                }
            }

            return [seconds, nanoseconds]
        }
    }());

    Process.prototype.uptime = (function() {
        var start = Date.now();

        return function uptime() {
            return ((Date.now() - start) * 1e-3) | 0;
        }
    }());

    Process.prototype.abort = function() {
        throw new Error("process.abort is not supported");
    };

    Process.prototype.binding = function(name) {
        throw new Error("process.binding is not supported");
    };

    Process.prototype.umask = function(mask) {
        throw new Error("process.umask is not supported");
    };

    Process.prototype.kill = function(id, signal) {
        throw new Error("process.kill is not supported");
    };

    Process.prototype.initgroups = function(user, extra_group) {
        throw new Error("process.initgroups is not supported");
    };

    Process.prototype.setgroups = function(groups) {
        throw new Error("process.setgroups is not supported");
    };

    Process.prototype.getgroups = function() {
        throw new Error("process.getgroups is not supported");
    };

    Process.prototype.getuid = function() {
        throw new Error("process.getuid is not supported");
    };

    Process.prototype.setgid = function() {
        throw new Error("process.setgid is not supported");
    };

    Process.prototype.getgid = function() {
        throw new Error("process.getgid is not supported");
    };

    Process.prototype.exit = function() {
        throw new Error("process.exit is not supported");
    };

    Process.prototype.setuid = function(id) {
        throw new Error("process.setuid is not supported");
    };

    Object.defineProperty(Process.prototype, "stderr", {
        get: function() {
            throw new Error("process.stderr is not supported");
        },
        set: function() {
            throw new Error("process.stderr is not supported");
        }
    });

    Object.defineProperty(Process.prototype, "stdin", {
        get: function() {
            throw new Error("process.stderr is not supported");
        },
        set: function() {
            throw new Error("process.stderr is not supported");
        }
    });

    Object.defineProperty(Process.prototype, "stdout", {
        get: function() {
            throw new Error("process.stderr is not supported");
        },
        set: function() {
            throw new Error("process.stderr is not supported");
        }
    });

    return new Process();
}()))
