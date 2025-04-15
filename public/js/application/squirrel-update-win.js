const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

// i.e. my-app/app-0.1.13/
const appFolder = path.dirname(process.execPath);

// i.e. my-app/Update.exe
const updateExe = path.resolve(appFolder, '..', 'Update.exe');
const exeName = path.basename(process.execPath);
let spawnedArgs = [];

function isSameArgs(args) {
    return (args.length === spawnedArgs.length) && args.every((e, i) => e === spawnedArgs[i]);
}

// Spawn a command and invoke the callback when it completes with an error
// and the output from standard out.
function spawnUpdate(args, detached, callback) {
    let error; let errorEmitted; let stderr; let
        stdout;

    try {
        // Ensure we don't spawn multiple squirrel processes
        // Process spawned, same args:        Attach events to already running process
        // Process spawned, different args:   Return with error
        // No process spawned:                Spawn new process
        if (global.spawnedProcess && !isSameArgs(args)) {
            return callback(`AutoUpdater process with arguments ${args} is already running`);
        } if (!global.spawnedProcess) {
            global.spawnedProcess = spawn(updateExe, args, {
                detached: detached
            });
            spawnedArgs = args || [];
        }
    } catch (error1) {
        error = error1;

        // Shouldn't happen, but still guard it.
        process.nextTick(() => callback(error));
        return null;
    }
    stdout = '';
    stderr = '';
    global.spawnedProcess.stdout.on('data', (data) => {
        stdout += data;
    });
    global.spawnedProcess.stderr.on('data', (data) => {
        stderr += data;
    });
    errorEmitted = false;
    global.spawnedProcess.on('error', (err) => {
        errorEmitted = true;
        callback(err);
    });

    return global.spawnedProcess.on('exit', (code, signal) => {
        global.spawnedProcess = undefined;
        spawnedArgs = [];

        // We may have already emitted an error.
        if (errorEmitted) return;

        const success = code === 0;

        if (success) {
            callback(null, stdout);
        } else {
            callback(`Command failed: ${signal !== null ? signal : code}\n${stderr}`);
        }
    });
}

// Start an instance of the installed app.
exports.processStart = function squirrelUpdateProcessStart() {
    return spawnUpdate(['--processStartAndWait', exeName], true, () => {});
};

// Download the releases specified by the URL and write new results to stdout.
exports.download = function squirrelDownloadNewRelease(updateURL, callback) {
    return spawnUpdate(['--download', updateURL], false, (error, stdout) => {
        let json; let ref; let ref1; let
            update;
        if (error !== null) {
            return callback(error);
        }
        try {
            // Last line of output is the JSON details about the releases
            json = stdout.trim().split('\n').pop();
            // eslint-disable-next-line
            update = (ref = JSON.parse(json)) !== null ? (ref1 = ref.releasesToApply) !== null ? typeof ref1.pop === 'function' ? ref1.pop() : void 0 : void 0 : void 0;
        } catch (jsonError) {
            return callback(`Invalid result:\n${stdout}`);
        }
        return callback(null, update);
    });
};

// Update the application to the latest remote version specified by URL.
exports.update = function squirrelUpdateToLatestWithSpecifiedURL(updateURL, callback) {
    return spawnUpdate(['--update', updateURL], false, callback);
};

// Is the Update.exe installed with the current application?
exports.supported = function squirrelCheckTheUpdateExeForCurrentApplication() {
    try {
        fs.accessSync(updateExe, fs.R_OK);
        return true;
    } catch (error) {
        return false;
    }
};