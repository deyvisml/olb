window.engineLoader = (function() {

    const ERR_ENGINE_UNHANDLED			= 1000;
    const ERR_ENGINE_NAME_UNDEFINED 	= 1001;
    const ERR_ENGINE_BASE_URL_UNDEFINED = 1002;
    const ERR_ENGINE_NOT_INSTALLED 		= 1003;
    const ERR_ENGINE_INVALID_MANIFEST 	= 1004;
    const MANIFEST_FILENAME 			= 'engine_manifest.js';

    let hostExecution = false;
    let loaderPrepared = false;
    let engineBaseURL = null, engineBucket = null, endPoint = null;

    const isPrepared = function() {
        return loaderPrepared;
    };

    const setHostParams = function(_endPoint, _engineBucket) {
        hostExecution = true;

        endPoint = _endPoint;
        engineBucket = _engineBucket;
        engineBaseURL = {};
    };

    const setBaseURL = function(baseURL) {
        engineBaseURL = baseURL;
        loaderPrepared = true;

        if (hostExecution) {
            engineBaseURL = {};
        }
        if (window.onEngineLoaderPrepared !== undefined && typeof window.onEngineLoaderPrepared === 'function') {
            window.onEngineLoaderPrepared();
        }
    };

    const getBaseURL = function() {
        return engineBaseURL;
    };

    const load = function(name, callback, err_callback) {
        if (name == null || name === '') {
            onEngineLoadFailed(ERR_ENGINE_NAME_UNDEFINED, err_callback);
        } else if (engineBaseURL == null) {
            onEngineLoadFailed(ERR_ENGINE_BASE_URL_UNDEFINED, err_callback);
        } else {
            if (hostExecution) {
                const xhr = new XMLHttpRequest();

                xhr.onload = function() {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        const data = JSON.parse(xhr.response);

                        engineBaseURL[name] = engineBucket + name + '/' + data.response.version + '/hosted';
                        // engineBaseURL = engineBucket + name + '/' + data.response.version + '/hosted';

                        loadManifest(name, callback, err_callback);
                    }
                };
                xhr.open('GET', endPoint + name, true);
                xhr.send();
            } else {
                loadManifest(name, callback, err_callback);
            }
        }
    };

    const loadManifest = function (name, callback, err_callback) {
        try {
            const script = document.createElement('script');

            script.src = getManifestPath(name);
            script.onload = function() {
                loadEngine(name, callback, err_callback);
            };
            script.onerror = function() {
                onEngineLoadFailed(ERR_ENGINE_NOT_INSTALLED, err_callback);
            };
            document.head.appendChild(script);
        } catch (e) {
            onEngineLoadFailed(ERR_ENGINE_NOT_INSTALLED, err_callback);
        }
    };

    const loadEngine = function(name, callback, err_callback) {
        if (engine_manifest != null && typeof engine_manifest == 'object' && engine_manifest.entry != null) {
            let css_ready = undefined;
            let js_ready = undefined;

            // TODO : CHECK THE ENGINE BASE URI IS NOT VALID IT RETURN TRUE.

            engine_manifest.entry.js = engine_manifest.entry.js || [];
            engine_manifest.entry.css = engine_manifest.entry.css || [];

            replacePlaceHolders(name);

            loadStyleSheets(name, engine_manifest.entry.css, function(result) {
                css_ready = result;

                if (css_ready !== undefined && js_ready !== undefined) {
                    onEngineLoadComplete((css_ready && js_ready), name, callback, err_callback);
                }
            });
            loadJavaScripts(name, engine_manifest.entry.js, function(result) {
                js_ready = result;

                if (css_ready !== undefined && js_ready !== undefined) {
                    onEngineLoadComplete((css_ready && js_ready), name, callback, err_callback);
                }
            });
        } else {
            onEngineLoadFailed(ERR_ENGINE_INVALID_MANIFEST, err_callback);
        }
    };

    const loadStyleSheets = function(name, entries, callback) {
        if (entries != null && entries.length > 0) {
            let loaded = 0;

            for (let i=0; i<entries.length; i++) {
                const link = document.createElement('link');

                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = getEntryPath(name, entries[i]);
                link.onload = function() {
                    if (++loaded === entries.length && typeof callback === 'function') {
                        callback(true);
                    }
                };
                link.onerror = function() {
                    callback(false);
                };
                document.head.appendChild(link);
            }
        } else {
            callback(true);
        }
    };

    const loadJavaScripts = function(name, entries, callback) {
        if (entries != null && entries.length > 0) {
            loadJavaScript(name, entries, 0, callback);
        } else {
            callback(true);
        }
    };

    const loadJavaScript = function(name, entries, idx, callback) {
        const script = document.createElement('script');

        script.src = getEntryPath(name, entries[idx]);
        script.onload = function() {
            if (++idx < entries.length) {
                loadJavaScript(name, entries, idx, callback);
            } else {
                if (typeof callback === 'function') {
                    callback(true);
                }
            }
        };
        script.onerror = function() {
            if (typeof callback === 'function') {
                callback(false);
            }
        };
        document.head.appendChild(script);
    };

    const replacePlaceHolders = function(name) {
        const placeHolders = document.getElementsByClassName('embed-placeholder');

        if (placeHolders != null && placeHolders.length > 0) {
            for (let i=0, len=placeHolders.length; i<len; i++) {
                replacePlaceHolder(placeHolders[i], name);
            }
        }
    };

    const replacePlaceHolder = function(placeHolder, name) {
        const xhr = new XMLHttpRequest();
        const uri = getEnginePath(name) + placeHolder.getAttribute('data-embed-html');

        xhr.open('GET', uri);
        xhr.onreadystatechange = function () {
            if (XMLHttpRequest.DONE === this.readyState && this.responseText != null) {
                placeHolder.innerHTML = this.responseText;
            }
        };
        xhr.onerror = function () {};
        xhr.send();
    };

    const getEntryPath = function(name, entry_path) {
        if (entry_path.indexOf('/') !== 0) {
            entry_path = "/" + entry_path;
        }
        return getEnginePath(name) + entry_path;
    };

    const getManifestPath = function(name) {
        return getEnginePath(name) + "/" + MANIFEST_FILENAME;
    };

    const getEnginePath = function(name) {
        if (engineBaseURL === null) {
            return null;
        } else {
            if (hostExecution) {
                return engineBaseURL[name];
            } else {
                return engineBaseURL + name;
            }
        }
    };

    const onEngineLoadComplete = function(result, name, callback, err_callback) {
        if (result) {
            callback(name);
        } else {
            err_callback(ERR_ENGINE_INVALID_MANIFEST);
        }
    };

    const onEngineLoadFailed = function(err_code, err_callback) {
        if (err_callback !== null && typeof err_callback === 'function') {
            err_callback(err_code);
        }
    };

    return {
        ERR_ENGINE_UNHANDLED:			ERR_ENGINE_UNHANDLED,
        ERR_ENGINE_NAME_UNDEFINED: 		ERR_ENGINE_NAME_UNDEFINED,
        ERR_ENGINE_BASE_URL_UNDEFINED: 	ERR_ENGINE_BASE_URL_UNDEFINED,
        ERR_ENGINE_NOT_INSTALLED: 		ERR_ENGINE_NOT_INSTALLED,
        ERR_ENGINE_INVALID_MANIFEST: 	ERR_ENGINE_INVALID_MANIFEST,

        isPrepared: isPrepared,
        setHostParams: setHostParams,
        setBaseURL: setBaseURL,
        getBaseURL: getBaseURL,
        getEnginePath: getEnginePath,

        load: load,
        loadStyleSheets: loadStyleSheets,
        loadJavaScripts: loadJavaScripts
    };

})();