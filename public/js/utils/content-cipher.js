const fs = require('fs');
const crypto = require('crypto');
const fileIO = require('./file-io');

const ContentCipher = {

    CIPHER_BLOCK_SIZE_LENGTH: 6,
    DEFAULT_CIPHER_BLOCK_SIZE: 1024,
    ENHANCED_CIPHER_BLOCK_SIZE: 1024 * 128,   // If the block size is less than 128kb, some media player can play the mp3 even if the file is encrypted.
    CIPHER_SIGN: Buffer.from('smk-inst-allowed'),

    IGNORES_EXT: ['xml', 'json'],
    ENHANCED_EXT: ['mp3', 'mp4'],

    isEncrypted(buffer) {
        return (buffer != null
            && buffer.length >= this.CIPHER_SIGN.length
            && buffer.slice(0, this.CIPHER_SIGN.length).equals(this.CIPHER_SIGN));
    },

    async encryptContent(unpackDir, bid) {
        const entries = fileIO.listFiles(unpackDir);

        for (const entry of entries) {
            const ext = fileIO.getExtension(entry);

            if (ext && this.IGNORES_EXT.includes(ext.toLowerCase())) continue;

            await this.encryptFile(entry, bid);
        }
    },

    /**
     *  The Encrypted File should start {cipher-sign}-{encrypted-data-size}-{encrypted-data}-{data-blocks}
     */
    async encryptFile(path, bid) {
        try {
            const fd = fs.openSync(path, 'r+');
            const stats = fs.statSync(path);
            const blockSize = this.getCipherBlockSize(fd, path);
            const header = this.readHeader(fd, blockSize);
            const encryptedHeader = this.encryptHeader(header, bid);
            const encryptedHeaderSize = encryptedHeader.length.toString().padStart(this.CIPHER_BLOCK_SIZE_LENGTH, '0');

            const buffer = Buffer.alloc(stats.size);
            let newFile;

            fs.readSync(fd, buffer, 0, buffer.length, 0);   // buffer contains entire file.

            newFile = buffer.slice(blockSize); // truncate cipher-block size at front.
            newFile = Buffer.concat([this.CIPHER_SIGN, Buffer.from(encryptedHeaderSize), encryptedHeader, newFile]);

            fs.writeFileSync(path, newFile);
            fs.closeSync(fd);
        } catch (e) {
            console.dir(e);
        }
    },

    decryptFile(buffer, bid) {
        const encryptedHeaderStart = this.CIPHER_SIGN.length + this.CIPHER_BLOCK_SIZE_LENGTH;
        const encryptedHeaderEnd = encryptedHeaderStart + this.readEncryptHeaderSize(buffer);
        const encryptedHeader = buffer.slice(encryptedHeaderStart, encryptedHeaderEnd);
        const decryptedHeader = this.decryptHeader(encryptedHeader, bid);

        return Buffer.concat([decryptedHeader, buffer.slice(encryptedHeaderEnd, buffer.length)]);
    },

    getKeyAndIV(bid) {
        const hmac = crypto.createHmac('sha256', bid);
        const base64 = hmac.digest('base64');
        const key = base64.substring(0, 32);
        const iv = key.substring(0, 16);

        return { key, iv };
    },

    readEncryptHeaderSize(buffer) {
        const start = this.CIPHER_SIGN.length;
        const end = start + this.CIPHER_BLOCK_SIZE_LENGTH;
        const encryptedHeaderSize = buffer.slice(start, end).toString();

        return Number(encryptedHeaderSize);
    },

    readHeader(fd, blockSize) {
        const buffer = Buffer.alloc(blockSize);

        fs.readSync(fd, buffer, 0, blockSize, 0);

        return buffer;
    },

    encryptHeader(header, bid) {
        const { key, iv } = this.getKeyAndIV(bid);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        const encrypted = cipher.update(header);

        // Buffer and Uint8Array are inter-exchangeable.
        return Buffer.concat([encrypted, cipher.final()]);
    },

    decryptHeader(header, bid) {
        const { key, iv } = this.getKeyAndIV(bid);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const decrypted = decipher.update(header);

        // Buffer and Uint8Array are inter-exchangeable.
        return Buffer.concat([decrypted, decipher.final()]);
    },

    getCipherBlockSize(fd, path) {
        const ext = fileIO.getExtension(path);
        let blockSize = this.DEFAULT_CIPHER_BLOCK_SIZE;

        if (ext && this.ENHANCED_EXT.includes(ext.toLowerCase())) {
            blockSize = this.ENHANCED_CIPHER_BLOCK_SIZE;
        }
        blockSize = Math.min(blockSize, fileIO.size(fd));    // Block-size should not exceed the entire file size.

        return blockSize;
    },

};

module.exports = ContentCipher;