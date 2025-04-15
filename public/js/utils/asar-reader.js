// noinspection NpmUsedModulesInstalled, original-fs is provided by electron
const ofs = require('original-fs');
const pickle = require('chromium-pickle-js');

const contentCipher = require('./content-cipher');

const AsarReader = {

    HEADER_SIZE_BYTES: 8,

    URI_SEPARATOR: '/',

    headers: {},

    isFileExist(asarPath, fileType, fileName) {
        const header = this.getAsarHeader(asarPath);

        return header?.files[fileType]?.files[fileName] != null;
    },

    clearAsarHeader(asarFilepath) {
        this.headers[asarFilepath] = null;
    },

    getAsarHeader(asarFilepath) {
        if (this.headers[asarFilepath] == null) {
            this.headers[asarFilepath] = this.readAsarHeader(asarFilepath);
        }
        return this.headers[asarFilepath];
    },

    readAsarHeader(asarFilepath) {
        let header = null;
        const fd = ofs.openSync(asarFilepath, 'r');

        try {
            const headerSizeBuffer = Buffer.alloc(AsarReader.HEADER_SIZE_BYTES);

            if (ofs.readSync(fd, headerSizeBuffer, 0, AsarReader.HEADER_SIZE_BYTES, null) !== 8) {
                throw new Error('Unable to read header size');
            }

            const sizePickle = pickle.createFromBuffer(headerSizeBuffer);
            const headerSize = sizePickle.createIterator().readUInt32();
            const headerBuffer = Buffer.alloc(headerSize);

            if (ofs.readSync(fd, headerBuffer, 0, headerSize, null) !== headerSize) {
                throw new Error('Unable to read header');
            }

            const headerPickle = pickle.createFromBuffer(headerBuffer);
            const headerString = headerPickle.createIterator().readString();

            header = JSON.parse(headerString);
            header.size = headerSize;
        } finally {
            ofs.closeSync(fd);
        }
        return header;
    },

    readFile(filepath, bid = null) {
        const [asarBaseUri, resourcePath] = filepath.split('.asar');
        const asarFilepath = `${asarBaseUri}.asar`;
        const [ , resourceType, filename ] = resourcePath.split(this.URI_SEPARATOR);
        const header = this.getAsarHeader(asarFilepath);
        let buffer = null;

        if (header?.files[resourceType]?.files[filename]) {
            const file = header.files[resourceType].files[filename];
            const fd = ofs.openSync(asarFilepath, 'r');

            try {
                const readOffset = parseInt(file.offset, 10) + header.size + AsarReader.HEADER_SIZE_BYTES;

                buffer = Buffer.alloc(file.size);
                ofs.readSync(fd, buffer, 0, file.size, readOffset);

                if (contentCipher.isEncrypted(buffer)) {
                    buffer = contentCipher.decryptFile(buffer, bid);
                }
            } finally {
                ofs.closeSync(fd);
            }
        }
        return buffer;
    },
}

module.exports = AsarReader;