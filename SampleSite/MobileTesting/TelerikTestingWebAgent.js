! function a(b, c, d) {
    function e(g, h) {
        if (!c[g]) {
            if (!b[g]) {
                var i = "function" == typeof require && require;
                if (!h && i) return i(g, !0);
                if (f) return f(g, !0);
                throw new Error("Cannot find module '" + g + "'")
            }
            var j = c[g] = {
                exports: {}
            };
            b[g][0].call(j.exports, function (a) {
                var c = b[g][1][a];
                return e(c ? c : a)
            }, j, j.exports, a, b, c, d)
        }
        return c[g].exports
    }
    for (var f = "function" == typeof require && require, g = 0; g < d.length; g++) e(d[g]);
    return e
}({
    1: [function (a, b) {
        function c(a, b, c, d, e) {
            this.messageId = a, this.responseToMessageId = b, this.fromId = c, this.toId = d, this.data = e
        }
        var d = a("./utils.js");
        c.prototype = {
            constructor: c,
            generateResponseWithPayload: function (a) {
                return new c(d.uuid(), this.messageId, null, this.fromId, a)
            },
            generateResponseFromIdWithPayload: function (a, b) {
                return new c(d.uuid(), this.messageId, a, this.fromId, b)
            },
            toJSON: function () {
                var a = {
                    id: this.messageId,
                    toId: this.toId,
                    data: this.data
                };
                return this.fromId && (a.fromId = this.fromId), this.responseToMessageId && (a.responseToMessageId = this.responseToMessageId), a
            },
            toString: function () {
                return JSON.stringify(this.toJSON())
            },
            toPrettyString: function () {
                return JSON.stringify(this, null, "  ")
            }
        }, b.exports = c
    }, {
        "./utils.js": 16
    }],
    2: [function (a, b) {
        function c() { }

        function d() { }

        function e(a, b, c) {
            this.capabilities = a, this.sharedKey = b, this.resumeId = c
        }

        function f() { }

        function g(a) {
            this.resumeId = a
        }

        function h(a) {
            this.establishConnection = a
        }

        function i() { }
        var j = a("./MessageStash.js"),
            k = a("./TsAutomationProtocol.js"),
            l = a("./automationMessageFactory.js"),
            m = a("./clientInfoFactory.js"),
            n = a("./logger.js");
        c.prototype = {
            constructor: c,
            beginState: function () { },
            endState: function () { },
            onConnected: function () {
                return this
            },
            onMessageReceived: function () {
                return this
            },
            sendMessage: function () {
                return this
            },
            onSendMessageTimeout: function (a, b, c) {
                return c({
                    error: {
                        code: 100,
                        description: "request timed out."
                    }
                }), this
            },
            onClosed: function () {
                return this
            }
        }, d.prototype = new c, d.prototype.onMessageReceived = function (a, b) {
            try {
                var c = l.messageWithJSONString(b);
                return this.handleMessage(a, c, function (b) {
                    a.sendMessage(c.generateResponseWithPayload(b).toString())
                })
            } catch (d) {
                return n.error("Error: Unable to parse message. Ignoring it."), n.error(d), this
            }
        }, d.prototype.handleMessage = function () {
            return this
        }, e.prototype = new d, e.prototype.handleMessage = function (a, b, c) {
            if (b.data && b.data.handshake === k.messages.HS_GET_CLIENT_INFO) {
                var d = k.MT_PROTOCOL_VERSION_MAX;
                if (void 0 !== b.data.serverVersion) {
                    var e = parseInt(b.data.serverVersion);
                    d = e >= k.MT_PROTOCOL_VERSION_MIN && e <= k.MT_PROTOCOL_VERSION_MAX ? e : k.MT_PROTOCOL_VERSION_MAX
                } else d = k.MT_PROTOCOL_VERSION_MIN;
                this.machine.version = d;
                var g = m.create(d);
                return g.capabilities = this.capabilities, g.identity.sharedKey = g.identity.sharedKey || this.machine.sharedKey, "string" == typeof this.resumeId && (g.identity.resumeId = this.resumeId), c(g), new f
            }
            return this
        }, f.prototype = new d, f.prototype.handleMessage = function (a, b) {
            return b.data && b.data.handshake === k.messages.HS_ACCEPTED ? new g(b.data.id) : (b.data && b.data.error && this.machine.emit("error", b.data.error), this)
        }, g.prototype = new d, g.prototype.beginState = function () {
            this.machine.isConnected = !0, this.machine.emit("connected", this.resumeId)
        }, g.prototype.handleMessage = function (a, b, c) {
            var d = j.pull(b.responseToMessageId),
                e = d ? d.responseCallback : null;
            if (e) {
                var f = b.toJSON().data;
                f.error ? f.error.code == k.errors.RECIPIENT_NOT_AVAILABLE.code ? setTimeout(function () {
                    this.sendMessage(a, d.originalMsg, d.originalTimeout, d.responseCallback)
                }.bind(this), 500) : e(f) : e(null, f)
            } else b.data && b.data.cmd ? this.machine.emit("message", b, c) : n.error("Got unhandled message! " + b.toString());
            return this
        }, g.prototype.sendMessage = function (a, b, c, d) {
            return j.stash(b.messageId, c, d, b), a.sendMessage(b.toString()), this
        }, g.prototype.onClosed = function () {
            return this.machine.emit("disconnected"), this
        }, h.prototype = new d, h.prototype.beginState = function (a) {
            this.establishConnection && a.start()
        }, h.prototype.onConnected = function (a) {
            var b = l.messageToIdWithPayload(k.serverId, {
                handshake: k.messages.HS_GET_CLIENT_INFO,
                serverVersion: k.version,
                isResuming: this.establishConnection
            });
            return a.sendMessage(b.toString()), this
        }, h.prototype.handleMessage = function (a, b) {
            this.machine.clientInfo = b.toJSON(), this.machine.version = this.machine.clientInfo.data.version;
            var c = l.messageToIdWithPayload(k.serverId, {
                handshake: k.messages.HS_ACCEPTED,
                id: k.serverId
            });
            return a.sendMessage(c.toString()), new i
        }, h.prototype.sendMessage = function (a, b, c, d) {
            return d && d(l.errorPayloadWithError(k.errors.RECIPIENT_NOT_FOUND)), this
        }, h.prototype.onSendMessageTimeout = function (a, b, c) {
            return this.establishConnection = !1, a.stop(), c(l.errorPayloadWithError(k.errors.TIMEOUT)), this
        }, h.prototype.onClosed = function (a) {
            return this.establishConnection && setTimeout(function () {
                n.debug("Handshake unsuccessful... Retrying..."), a.start()
            }, 100), this
        }, i.prototype = new d, i.prototype.beginState = function () {
            this.retryConnectOnClose = !1, this.machine.isConnected = !0, this.machine.emit("connected")
        }, i.prototype.handleMessage = function (a, b, c) {
            if (b.toId === k.serverId && b.data && b.data.cmd && "suspend" === b.data.cmd) return this.retryConnectOnClose = !0, this;
            this.retryConnectOnClose = !1;
            var d = j.pull(b.responseToMessageId),
                e = d ? d.responseCallback : null;
            return e ? e(null, b.toJSON().data) : b.data && b.data.cmd ? this.machine.emit("message", b, c) : n.error("Got unhandled message!" + b.toString()), this
        }, i.prototype.sendMessage = function (a, b, c, d) {
            return 2 == this.machine.version && ("ios.launch" === b.data.cmd || "coreApi.endExecution" === b.data.cmd) && (this.retryConnectOnClose = !0), j.stash(b.messageId, c, d, b), a.sendMessage(b.toString()), this
        }, i.prototype.onClosed = function (a) {
            return a.stop(), new h(this.retryConnectOnClose)
        }, b.exports = {
            AutomationState: c,
            ElevatedState: d,
            NormalHandshakeStart: e,
            ReverseHandshakeStart: h
        }
    }, {
        "./MessageStash.js": 5,
        "./TsAutomationProtocol.js": 6,
        "./automationMessageFactory.js": 9,
        "./clientInfoFactory.js": 10,
        "./logger.js": 12
    }],
    3: [function (a, b) {
        function c() {
            d.call(this), this.isStarted = !1, this.version = f.version
        }
        var d = a("./EventEmitter.js"),
            e = a("./MessageStash.js"),
            f = a("./TsAutomationProtocol.js");
        c.prototype._provider = null, c.prototype._startState = null, c.prototype.sharedKey = null, c.prototype.transitionToState = function (a) {
            a && this._state !== a && (this._state && (this._state.endState(this._provider), this._state.machine = null), this._state = a, this._state.machine = this, this._state.beginState(this._provider))
        }, c.prototype.start = function (a, b, c) {
            this.isStarted || (this.isStarted = !0, this.sharedKey = c, this._provider = a, e.start(function (a, b) {
                this.isStarted && this._state && this.transitionToState(this._state.onSendMessageTimeout(this._provider, a, b))
            }.bind(this)), a.on("connect", function () {
                this.isStarted && this._state && this.transitionToState(this._state.onConnected(this._provider))
            }.bind(this)), a.on("message", function (a) {
                this.isStarted && this._state && this.transitionToState(this._state.onMessageReceived(this._provider, a))
            }.bind(this)), a.on("close", function () {
                this.isStarted && this._state && this.transitionToState(this._state.onClosed(this._provider))
            }.bind(this)), this.transitionToState(b), a.start())
        }, c.prototype.stop = function () {
            this.isStarted && (this.isStarted = !1, this._state.machine = null, this._state = null, e.stop(), this._provider.stop(), this._provider = null)
        }, c.prototype.sendMessage = function (a, b, c) {
            if (!this._provider) throw new Error("attempted to send a message with no active provider.");
            if (!this._state) throw new Error("attempted to send a message with no active state.");
            if (b && "number" != typeof b) throw new Error("timeout must be a number");
            b || (b = this._provider.defaultTimeout), this.transitionToState(this._state.sendMessage(this._provider, a, b, c))
        }, b.exports = c
    }, {
        "./EventEmitter.js": 4,
        "./MessageStash.js": 5,
        "./TsAutomationProtocol.js": 6
    }],
    4: [function (a, b) {
        b.exports = function () {
            var a = {},
                b = function (b, c) {
                    b in a || (a[b] = []), a[b].push(c)
                },
                c = function (b, c) {
                    for (var d in a[b])
                        if (a[b][d] === c) {
                            a[b].splice(d, 1);
                            break
                        }
                },
                d = function (b) {
                    var c = Array.prototype.slice.call(arguments, 1),
                        d = a[b] || [];
                    for (var e in d) d[e].apply(this, c)
                };
            return this.on = b, this.off = c, this.emit = d, this
        }
    }, {}],
    5: [function (a, b) {
        var c, d = a("./logger.js"),
            e = {},
            f = !1,
            g = {
                start: function (a) {
                    return f ? (d.debug("MessageStash is already running."), void 0) : (d.debug("Starting MessageStash."), c = setInterval(function () {
                        var b = (new Date).getTime();
                        for (var c in e) {
                            var f = e[c];
                            b > f.timestamp && (d.debug("Dropping timed out message."), a(f.originalMsg, f.responseCallback), delete e[c])
                        }
                    }, 100), f = !0, void 0)
                },
                stop: function () {
                    if (!f) return d.debug("MessageStash is already stopped."), void 0;
                    d.debug("Stopping MessageStash."), clearInterval(c);
                    for (var a in e) {
                        var b = e[a];
                        d.debug("Dropping cancelled message."), b.responseCallback({
                            error: {
                                code: 100,
                                description: "cancelled awaiting response for message."
                            }
                        }), delete e[a]
                    }
                    f = !1
                },
                stash: function (a, b, c, d) {
                    e[a] = {
                        responseCallback: c,
                        timestamp: (new Date).getTime() + b,
                        originalTimeout: b,
                        originalMsg: d
                    }
                },
                pull: function (a) {
                    var b = e[a];
                    return b ? (delete e[a], b) : null
                }
            };
        b.exports = g
    }, {
        "./logger.js": 12
    }],
    6: [function (a, b) {
        var c = {
            name: "ts-automation-protocol",
            serverId: "server",
            version: "3",
            MT_PROTOCOL_VERSION_MIN: 2,
            MT_PROTOCOL_VERSION_MAX: 3,
            capabilities: {
                AUTOMATION_TEST_RUNNER: "automation_test_runner",
                AUTOMATION_EXECUTION_AGENT: "automation_execution_agent"
            },
            messages: {
                HS_ACCEPTED: "hs_accepted",
                HS_GET_CLIENT_INFO: "hs_get_client_info"
            },
            commands: {
                GET_CLIENTS_WITH_CAPABILITY: "get-clients-with-capability",
                CONNECT_SOCKETS_SERVER: "connect-sockets-server",
                DISCONNECT_AGENTS: "disconnect-agents",
                SUSPEND: "suspend"
            },
            errors: {
                TIMEOUT: {
                    code: 100,
                    description: "request timed out"
                },
                RECIPIENT_ID_NOT_SPECIFIED: {
                    code: 110,
                    description: "recipient id not specified"
                },
                RECIPIENT_NOT_FOUND: {
                    code: 120,
                    description: "recipient not found"
                },
                RECIPIENT_NOT_AVAILABLE: {
                    code: 130,
                    description: "the recipient exists, but is not available"
                },
                INVALID_RESUME_ID: {
                    code: 140,
                    description: "the provided id is not valid to resume a session"
                },
                HANDSHAKE_FAILED: {
                    code: 150,
                    description: "a step in the handshake process failed. client not connected"
                },
                HANDSHAKE_FAILED_SHARED_KEY: {
                    code: 151,
                    description: "Provided shared key is not valid."
                },
                HANDSHAKE_FAILED_MAX_CLIENTS: {
                    code: 152,
                    description: "Maximum number of connected clients is reached."
                },
                INVALID_MESSAGE: {
                    code: 170,
                    description: "invalid message"
                },
                VERSION_MISMATCH: {
                    code: 180,
                    description: "client version does not match server version"
                },
                RECIPIENT_VERSION_MISMATCH: {
                    code: 190,
                    description: "recipient version mismatch"
                },
                INVALID_CLIENT: {
                    code: 200,
                    description: "invalid client or client configuration"
                },
                PARAMS_NOT_PROVIDED: {
                    code: 300,
                    description: "params were not provided"
                },
                INVALID_PARAMS: {
                    code: 301,
                    description: "invalid params were provided"
                },
                GENERIC_ERROR: {
                    code: 500,
                    description: "an unknown error occurred"
                }
            }
        };
        b.exports = c
    }, {}],
    7: [function (a, b) {
        var c = {
            dialogs: {
                ALERT: "alert_dialog",
                CONFIRM: "confirm_dialog",
                PROMPT: "prompt_dialog"
            },
            responseCodes: {
                SUCCESS: 100,
                FAILURE: 200
            },
            commands: {
                PREPARE_DOMAIN: "web.prepareDomain",
                EXECUTE_SCRIPT: "web.executeScript",
                DIALOGS_PREPARE: "web.dialogs.prepare",
                DIALOGS_GET_STATE: "web.dialogs.getState"
            }
        };
        b.exports = c
    }, {}],
    8: [function (a, b) {
        function c(a, b) {
            this._address = a, this.defaultTimeout = b, d.call(this)
        }
        var d = a("./EventEmitter.js"),
            e = a("./logger.js");
        c.prototype = {
            constructor: c,
            start: function () {
                if (!("WebSocket" in window)) throw new Error("Browser does not support WebSockets.");
                this.websocket || (this.websocket = new WebSocket(this._address, "ts-automation-protocol"), this.websocket.onopen = function () {
                    this.emit("connect")
                }.bind(this), this.websocket.onmessage = function (a) {
                    a && a.data ? this.emit("message", a.data) : e.error("Error: Invalid message type received. Ignoring it.")
                }.bind(this), this.websocket.onclose = function () {
                    this.emit("close"), this.websocket = null
                }.bind(this))
            },
            stop: function () {
                this.websocket && (this.websocket.close(), this.websocket = null)
            },
            sendMessage: function (a) {
                this.websocket && this.websocket.send(a)
            }
        }, b.exports = c
    }, {
        "./EventEmitter.js": 4,
        "./logger.js": 12
    }],
    9: [function (a, b) {
        var c = a("./TsAutomationProtocol.js"),
            d = a("./AutomationMessage.js"),
            e = a("./utils.js"),
            f = {
                messageWithJSONString: function (a) {
                    try {
                        var b = JSON.parse(a),
                            c = new d(b.id, b.responseToMessageId, b.fromId, b.toId, b.data);
                        return c
                    } catch (e) {
                        throw new Error("JSON string is invalid for conversion to an AutomationMessage object.")
                    }
                },
                messageToIdWithPayload: function (a, b) {
                    return new d(e.uuid(), null, null, a, b)
                },
                messageToIdFromIdWithPayload: function (a, b, c) {
                    return new d(e.uuid(), null, b, a, c)
                },
                getClientsWithCapabilitiesPayload: function (a) {
                    return {
                        cmd: c.commands.GET_CLIENTS_WITH_CAPABILITY,
                        params: {
                            capabilities: a
                        }
                    }
                },
                getConnectSocketsServerPayload: function (a, b, d) {
                    return {
                        cmd: c.commands.CONNECT_SOCKETS_SERVER,
                        params: {
                            address: a,
                            sharedKey: b,
                            timeout: d
                        }
                    }
                },
                getDisconnectAgentsPayload: function (a, b) {
                    return {
                        cmd: c.commands.DISCONNECT_AGENTS,
                        params: {
                            agentIds: a,
                            sharedKey: b
                        }
                    }
                },
                getAgentAddedPayload: function (a, b, c) {
                    return {
                        cmd: "agentAdded",
                        params: {
                            agent: {
                                id: a,
                                platformInfo: b,
                                capabilities: c
                            }
                        }
                    }
                },
                getAgentRemovedPayload: function (a) {
                    return {
                        cmd: "agentRemoved",
                        params: {
                            id: a
                        }
                    }
                },
                failurePayloadWithReason: function (a) {
                    return {
                        result: {
                            code: 200,
                            reason: a
                        }
                    }
                },
                successPayload: function () {
                    return {
                        result: {
                            code: 100,
                            reason: "success"
                        }
                    }
                },
                successPayloadWithReason: function (a) {
                    return {
                        result: {
                            code: 100,
                            reason: a
                        }
                    }
                },
                successPayloadWithCustomParams: function (a) {
                    return {
                        result: {
                            code: 100,
                            reason: "success",
                            params: a
                        }
                    }
                },
                errorPayloadWithError: function (a) {
                    return {
                        error: a
                    }
                }
            };
        b.exports = f
    }, {
        "./AutomationMessage.js": 1,
        "./TsAutomationProtocol.js": 6,
        "./utils.js": 16
    }],
    10: [function (a, b) {
        function c() {
            var a = 0,
                b = /MSIE (\d+\.\d+);/.test(navigator.userAgent),
                c = !!navigator.userAgent.match(/Trident\/7.0/),
                d = navigator.userAgent.indexOf("rv:11.0");
            return b && (a = new Number(RegExp.$1)), -1 != navigator.appVersion.indexOf("MSIE 10") && (a = 10), c && -1 != d && (a = 11), a
        }

        function d() {
            var a, b = navigator.appName,
                d = navigator.userAgent,
                e = d.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
            e && null !== (a = d.match(/version\/([\.\d]+)/i)) && (e[2] = a[1]), e = e ? [e[1], e[2]] : [b, navigator.appVersion, "-?"];
            var f = c();
            0 != f && (e[0] = "MSIE", e[1] = f);
            var g = "Unknown OS";
            return -1 != navigator.appVersion.indexOf("Win") && (g = "Windows"), -1 != navigator.appVersion.indexOf("Mac") && (g = "MacOS"), -1 != navigator.appVersion.indexOf("X11") && (g = "UNIX"), -1 != navigator.appVersion.indexOf("Linux") && (g = "Linux"), -1 != navigator.appVersion.indexOf("iPhone OS") && (g = "iOS"), -1 != navigator.appVersion.indexOf("Android") && (g = "Android"), -1 != navigator.appVersion.indexOf("Windows Phone") && (g = "Windows Phone"), {
                name: e[0],
                version: e[1],
                os: g
            }
        }
        var e = (a("./TsAutomationProtocol.js"), {
            create: function (a) {
                var b = d(),
                    c = {
                        version: a.toString(),
                        platformInfo: {
                            platformKey: "web",
                            name: b.name,
                            platform: navigator.platform,
                            system: b.os,
                            systemVersion: "",
                            browser: {
                                name: b.name,
                                version: b.version
                            }
                        },
                        identity: {
                            sharedKey: null
                        }
                    };
                return c
            }
        });
        b.exports = e
    }, {
        "./TsAutomationProtocol.js": 6
    }],
    11: [function (require, module, exports) {
        function web_prepareDomain(a) {
            return a && a.url && stateStorage ? (stateStorage.read({
                wsUrl: null,
                sharedKey: null,
                resumeId: null,
                timeout: null
            }, function (b) {
                window.location.href = a.url + "?wsUrl=" + encodeURIComponent(b.wsUrl) + "&sharedKey=" + b.sharedKey + "&resumeId=" + b.resumeId + "&timeout=" + b.timeout
            }), CreateSuccessResponse(null)) : void 0
        }

        function web_executeScript(params) {
            if (params && params.script) try {
                var targetElement = null;
                if (HasQueryObjects(params.query) && (targetElement = FindTargetElement(params.query), !targetElement)) throw new Error("Element not found.");
                var scriptResult = eval(params.script);
                return params.getResult ? ValidateResult(scriptResult) : scriptResult = !0, CreateSuccessResponse({
                    scriptResult: scriptResult
                })
            } catch (e) {
                return CreateFailResponse("string" == typeof e ? e : e.message)
            }
        }

        function web_dialogs_prepare(a) {
            return a && a.key && dialogsState[a.key] ? (OverwriteDialog(a.key), dialogsState[a.key].push({
                prepareOptions: a.options,
                handled: !1
            }), CreateSuccessResponse(null)) : void 0
        }

        function web_dialogs_getState() {
            return CreateSuccessResponse({
                dialogsState: dialogsState
            })
        }

        function CustomAlert(a) {
            for (var b = dialogsState[WebApiProtocol.dialogs.ALERT], c = 0; c < b.length; c++) {
                var d = b[c];
                if (!d.handled) {
                    d.handled = !0, d.actualText = a;
                    break
                }
            }
            RestoreDialogIfAllHandled(WebApiProtocol.dialogs.ALERT)
        }

        function CustomConfirm(a) {
            for (var b = !1, c = dialogsState[WebApiProtocol.dialogs.CONFIRM], d = 0; d < c.length; d++) {
                var e = c[d];
                if (!e.handled) {
                    e.handled = !0, e.actualText = a, c[d].prepareOptions && c[d].prepareOptions.dialogResult && (b = !0);
                    break
                }
            }
            return RestoreDialogIfAllHandled(WebApiProtocol.dialogs.CONFIRM), b
        }

        function CustomPrompt(a, b) {
            for (var c = null, d = dialogsState[WebApiProtocol.dialogs.PROMPT], e = 0; e < d.length; e++) {
                var f = d[e];
                if (!f.handled) {
                    f.handled = !0, f.actualText = a, f.defaultText = b, d[e].prepareOptions && d[e].prepareOptions.dialogResult && (c = d[e].prepareOptions.dialogResult);
                    break
                }
            }
            return RestoreDialogIfAllHandled(WebApiProtocol.dialogs.PROMPT), c
        }

        function OverwriteDialog(a) {
            switch (a) {
                case WebApiProtocol.dialogs.ALERT:
                    window.alert && window.alert !== CustomAlert && (originalDialogs[a] = window.alert, window.alert = CustomAlert);
                    break;
                case WebApiProtocol.dialogs.CONFIRM:
                    window.confirm && window.confirm !== CustomConfirm && (originalDialogs[a] = window.confirm, window.confirm = CustomConfirm);
                    break;
                case WebApiProtocol.dialogs.PROMPT:
                    window.prompt && window.prompt !== CustomPrompt && (originalDialogs[a] = window.prompt, window.prompt = CustomPrompt)
            }
        }

        function RestoreDialogIfAllHandled(a) {
            for (var b = dialogsState[a], c = 0; c < b.length; c++)
                if (!b[c].handled) return;
            switch (a) {
                case WebApiProtocol.dialogs.ALERT:
                    alert = originalDialogs[a];
                    break;
                case WebApiProtocol.dialogs.CONFIRM:
                    confirm = originalDialogs[a];
                    break;
                case WebApiProtocol.dialogs.PROMPT:
                    prompt = originalDialogs[a]
            }
        }

        function FindSingleTargetElement(a, b, c) {
            if (!a || !b || !c) return null;
            var d, e, f = null;
            if (void 0 !== a.tagName) d = void 0 !== a.index ? parseInt(a.index, 10) : 0, e = b.getElementsByTagName(a.tagName), e.length > d && (f = e[d]);
            else if (void 0 !== a.id) f = c.getElementById(a.id);
            else if (void 0 !== a.name) d = void 0 !== a.index ? parseInt(a.index, 10) : 0, e = c.getElementsByName(a.name), e.length > d && (f = e[d]);
            else if (void 0 !== a.className) d = void 0 !== a.index ? parseInt(a.index, 10) : 0, e = b.getElementsByClassName(a.className), e.length > d && (f = e[d]);
            else if (void 0 !== a.xpath) {
                if (!c.evaluate) throw new Error("This browser does not support xPath queries.");
                d = void 0 !== a.index ? parseInt(a.index, 10) : 0;
                for (var g = c.evaluate(a.xpath, b, null, 0, null), h = g.iterateNext(), i = 0; h && d > i;) h = g.iterateNext(), i++;
                i == d && (f = h)
            }
            return f
        }

        function FindTargetElement(a) {
            var b = null;
            if (Array.isArray(a)) {
                var c = document;
                b = document;
                for (var d = 0; d < a.length; d++) b && b.tagName && ("iframe" == b.tagName.toLowerCase() || "frame" == b.tagName.toLowerCase()) && (c = b.contentDocument, b = b.contentDocument), b = FindSingleTargetElement(a[d], b, c)
            } else b = FindSingleTargetElement(a, document, document);
            return b
        }

        function HasQueryObjects(a) {
            if (!Array.isArray(a)) return !1;
            for (var b = 0; b < a.length; b++)
                if (a[b]) return !0;
            return !1
        }

        function ValidateResult(a) {
            try {
                JSON.stringify(a)
            } catch (b) {
                throw new Error("Result cannot be stringified and transferred through the wire")
            }
        }

        function ProcessMessage(a) {
            var b = CreateFailResponse("unknown command");
            if (!a || "object" != typeof a) return b;
            var c = a.cmd,
                d = a.params;
            switch (c) {
                case WebApiProtocol.commands.PREPARE_DOMAIN:
                    b = web_prepareDomain(d);
                    break;
                case WebApiProtocol.commands.EXECUTE_SCRIPT:
                    b = web_executeScript(d);
                    break;
                case WebApiProtocol.commands.DIALOGS_PREPARE:
                    b = web_dialogs_prepare(d);
                    break;
                case WebApiProtocol.commands.DIALOGS_GET_STATE:
                    b = web_dialogs_getState(d)
            }
            return b
        }

        function CreateSuccessResponse(a) {
            var b = {
                result: {
                    code: WebApiProtocol.responseCodes.SUCCESS,
                    reason: "success"
                }
            };
            return a && (b.params = a), b
        }

        function CreateFailResponse(a) {
            var b = {
                result: {
                    code: WebApiProtocol.responseCodes.FAILURE,
                    reason: a
                }
            };
            return b
        }
        var WebApiProtocol = require("./WebApiProtocol.js"),
            stateStorage = require("./stateStorage.js"),
            originalDialogs = {},
            dialogsState = {};
        for (var key in WebApiProtocol.dialogs) dialogsState[WebApiProtocol.dialogs[key]] = [];
        module.exports = {
            processMessage: ProcessMessage,
            findTargetElement: FindTargetElement
        }
    }, {
        "./WebApiProtocol.js": 7,
        "./stateStorage.js": 14
    }],
    12: [function (a, b) {
        function c(a, b) {
            a >= e && console.log(b)
        }
        var d = {
            DEBUG: 0,
            TRACE: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            FATAL: 5
        },
            e = d.FATAL,
            f = {
                levels: d,
                setLevel: function (a) {
                    e = a
                },
                getLevel: function () {
                    return e
                },
                debug: function () {
                    c(f.levels.DEBUG, arguments)
                },
                trace: function () {
                    c(f.levels.TRACE, arguments)
                },
                info: function () {
                    c(f.levels.INFO, arguments)
                },
                warn: function () {
                    c(f.levels.WARN, arguments)
                },
                error: function () {
                    c(f.levels.ERROR, arguments)
                },
                fatal: function () {
                    c(f.levels.FATAL, arguments)
                }
            };
        b.exports = f
    }, {}],
    13: [function (a) {
        function b(a, b, c, d) {
            n.write({
                wsUrl: a,
                sharedKey: b,
                resumeId: c,
                timeout: d
            });
            try {
                var e = new j(a, d),
                    f = new k([l.capabilities.AUTOMATION_EXECUTION_AGENT], b, c);
                h.start(e, f, b)
            } catch (g) {
                var i = g.message || "Invalid client configuration";
                o.onError(i)
            }
        }

        function c() {
            o.onInitialized()
        }

        function d(a) {
            n.write({
                resumeId: a
            }, function () { }), o.onConnect && o.onConnect()
        }

        function e() {
            o.onDisconnect && o.onDisconnect()
        }

        function f(a, b) {
            var c = m.processMessage(a.data);
            b(c)
        }

        function g(a) {
            o.onError && o.onError(a.description)
        }
        var h, i = a("./ClientConnection.js"),
            j = a("./WebSocketClientProvider.js"),
            k = a("./AutomationStates.js").NormalHandshakeStart,
            l = a("./TsAutomationProtocol.js"),
            m = a("./executor.js"),
            n = a("./stateStorage.js"),
            o = {
                JSON: a("./telerikJSON.js")
            };
        if (window == window.top) {
            o.onInitialized = o.onInitialized || function () {
                n.read({
                    wsUrl: null,
                    sharedKey: null,
                    resumeId: null,
                    timeout: null
                }, function (a) {
                    a.wsUrl && a.sharedKey && b(a.wsUrl, a.sharedKey, a.resumeId, parseInt(a.timeout))
                })
            }, o.onConnect = function () { }, o.onDisconnect = function () { }, o.onError = function () { }, o.start = function (a, c, d) {
                b(a, c, null, d)
            }, o.resume = function (a, c, d, e) {
                b(a, c, d, e)
            }, o.stop = function () {
                h.stop()
            }, n.on(n.events.READY, c), n.initialize();
            try {
                h = new i
            } catch (p) {
                var q = p.message || "This browser is not supported by Telerik Mobile Testing";
                return {
                    error: q
                }
            }
            h.on("connected", d), h.on("disconnected", e), h.on("error", g), h.on("message", f)
        }
        window.telerik_testing_js_agent = o
    }, {
        "./AutomationStates.js": 2,
        "./ClientConnection.js": 3,
        "./TsAutomationProtocol.js": 6,
        "./WebSocketClientProvider.js": 8,
        "./executor.js": 11,
        "./stateStorage.js": 14,
        "./telerikJSON.js": 15
    }],
    14: [function (a, b) {
        function c() {
            window == window.top && (j = a("./telerikJSON.js"), document.body ? e() : window.attachEvent ? window.attachEvent("onload", e) : window.addEventListener("load", e, !1), window.attachEvent ? window.attachEvent("onmessage", f) : window.addEventListener("message", f, !1))
        }

        function d() {
            for (var a = document.getElementsByTagName("script"), b = 0; b < a.length; b++)
                for (var c = 0; c < k.length; c++) {
                    var d = k[c],
                        e = a[b].src.toLowerCase().lastIndexOf(d.toLowerCase());
                    if (e == a[b].src.length - d.length) {
                        var f = a[b].src.substring(0, e) + l;
                        return f
                    }
                }
            return null
        }

        function e() {
            if (!document.getElementById(m)) {
                var a = d();
                if (a) {
                    var b = document.createElement("iframe");
                    b.setAttribute("src", a), b.setAttribute("height", "0px"), b.setAttribute("width", "0px"), b.setAttribute("frameBorder", "0"), b.setAttribute("id", m), b.setAttribute("name", "myId"), b.setAttribute("scrolling", "no"), b.setAttribute("style", "display:none;"), document.body.appendChild(b), o = b.contentWindow
                }
            }
        }

        function f(a) {
            var b = null;
            try {
                b = j.parse(a.data)
            } catch (c) { }
            if (b && b.tsjs_message) switch (b.tsjs_message) {
                case "storageReady":
                    n = !0, r.emit(r.events.READY);
                    break;
                case "getStateResponse":
                    var d = p.pop();
                    d && d(b.tsjs_data);
                    break;
                case "setStateResponse":
                    var e = q.pop();
                    e && e(b.tsjs_data)
            }
        }

        function g(a, b) {
            var c = j.stringify({
                tsjs_message: a,
                tsjs_data: b
            });
            o.postMessage(c, "*")
        }

        function h(a, b) {
            o && ("function" != typeof b && (b = function () { }), p.push(b), g("getState", a))
        }

        function i(a, b) {
            o && ("function" != typeof b && (b = function () { }), q.push(b), g("setState", a))
        }
        var j, k = ["TelerikTestingWebAgent.js", "TelerikTestingWebAgent.min.js"],
            l = "TelerikTestingStorageFrame.html",
            m = "telerik_testing_js_storage_frame",
            n = !1,
            o = null,
            p = [],
            q = [],
            r = {
                initialize: c,
                read: h,
                write: i,
                events: {
                    READY: "ready"
                }
            },
            s = a("./EventEmitter.js");
        s.call(r), b.exports = r
    }, {
        "./EventEmitter.js": 4,
        "./telerikJSON.js": 15
    }],
    15: [function (require, module, exports) {
        function f(a) {
            return 10 > a ? "0" + a : a
        }

        function transform(a) {
            var b = a;
            return a && a.constructor && a.constructor == Date ? b = isFinite(a.valueOf()) ? a.getUTCFullYear() + "-" + f(a.getUTCMonth() + 1) + "-" + f(a.getUTCDate()) + "T" + f(a.getUTCHours()) + ":" + f(a.getUTCMinutes()) + ":" + f(a.getUTCSeconds()) + "Z" : null : ("string" == typeof a || "number" == typeof a || "boolean" == typeof a) && (b = a.valueOf()), b
        }

        function quote(a) {
            return escapable.lastIndex = 0, escapable.test(a) ? '"' + a.replace(escapable, function (a) {
                var b = meta[a];
                return "string" == typeof b ? b : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
            }) + '"' : '"' + a + '"'
        }

        function str(a, b) {
            var c, d, e, f, g, h = gap,
                i = b[a];
            switch (i = transform(i), "function" == typeof rep && (i = rep.call(b, a, i)), typeof i) {
                case "string":
                    return quote(i);
                case "number":
                    return isFinite(i) ? String(i) : "null";
                case "boolean":
                case "null":
                    return String(i);
                case "object":
                    if (!i) return "null";
                    if (gap += indent, g = [], "[object Array]" === Object.prototype.toString.apply(i)) {
                        for (f = i.length, c = 0; f > c; c += 1) g[c] = str(c, i) || "null";
                        return e = 0 === g.length ? "[]" : gap ? "[\n" + gap + g.join(",\n" + gap) + "\n" + h + "]" : "[" + g.join(",") + "]", gap = h, e
                    }
                    if (rep && "object" == typeof rep)
                        for (f = rep.length, c = 0; f > c; c += 1) "string" == typeof rep[c] && (d = rep[c], e = str(d, i), e && g.push(quote(d) + (gap ? ": " : ":") + e));
                    else
                        for (d in i) Object.prototype.hasOwnProperty.call(i, d) && (e = str(d, i), e && g.push(quote(d) + (gap ? ": " : ":") + e));
                    return e = 0 === g.length ? "{}" : gap ? "{\n" + gap + g.join(",\n" + gap) + "\n" + h + "}" : "{" + g.join(",") + "}", gap = h, e
            }
        }

        function stringify(a, b, c) {
            var d;
            if (gap = "", indent = "", "number" == typeof c)
                for (d = 0; c > d; d += 1) indent += " ";
            else "string" == typeof c && (indent = c);
            if (rep = b, b && "function" != typeof b && ("object" != typeof b || "number" != typeof b.length)) throw new Error("telerikJSON.stringify");
            return str("", {
                "": a
            })
        }

        function parse(text, reviver) {
            function walk(a, b) {
                var c, d, e = a[b];
                if (e && "object" == typeof e)
                    for (c in e) Object.prototype.hasOwnProperty.call(e, c) && (d = walk(e, c), void 0 !== d ? e[c] = d : delete e[c]);
                return reviver.call(a, b, e)
            }
            var j;
            if (text = String(text), cx.lastIndex = 0, cx.test(text) && (text = text.replace(cx, function (a) {
                    return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
            })), /^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) return j = eval("(" + text + ")"), "function" == typeof reviver ? walk({
                "": j
            }, "") : j;
            throw new SyntaxError("telerikJSON.parse")
        }
        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            gap, indent, meta = {
                "\b": "\\b",
                "	": "\\t",
                "\n": "\\n",
                "\f": "\\f",
                "\r": "\\r",
                '"': '\\"',
                "\\": "\\\\"
            },
            rep;
        module.exports = {
            stringify: stringify,
            parse: parse
        }
    }, {}],
    16: [function (a, b) {
        var c = {
            uuid: function () {
                return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (a) {
                    var b = 16 * Math.random() | 0,
                        c = "x" == a ? b : 3 & b | 8;
                    return c.toString(16)
                })
            }
        };
        b.exports = c
    }, {}]
}, {}, [13]);
