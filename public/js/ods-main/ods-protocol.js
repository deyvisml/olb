const Mime = require('mime');

const { protocol } = require('electron');

const PathUtils = require('../utils/path-utils');
const AsarReader = require('../utils/asar-reader');

/**
 *  @Reference: https://electronjs.org/docs/api/protocol
 *  Handle asar file via ods:// scheme.
 *  There is an issue in Windows that can not delete file after open.
 */
const Protocol = {

    getRangeOffset(request) {
        const range = request?.headers?.get('range');
        const rangeStart = range?.replace('bytes=', '')?.split('-')[0] || "0";
        const rangeOffset = parseInt(rangeStart, 10);

        return rangeOffset || 0;
    },

    registerODS() {

        protocol.handle('ods-viewer', (request) => {
            try {
                const filepath = request.url.replace('ods-viewer://', '');  // strip scheme from path
                const bid = filepath.split('.asar')[0]; // path start with bid (e.g.CPTBI1CB.asar/img/0029.jpg)
                const rangeOffset = this.getRangeOffset(request);
                const data = AsarReader.readFile(`${PathUtils.bookPath}${filepath}`, bid);
                const contentLength = (data?.length || 0) - rangeOffset;

                return new Response(
                    data?.subarray(rangeOffset),
                    {
                        headers: {
                            'content-type': Mime.lookup(filepath),
                            'content-length': contentLength,
                        },
                    }
                );
            } catch (ignore) {}
        });
    },

    checkoutBookDataAvailable(bid) {
        const asarPath = `${PathUtils.bookPath}${bid}.asar`;
        const exist = AsarReader.isFileExist(asarPath, 'info', 'content.xml');

        if (!exist) {
            throw new Error(`content.xml is not exist in ${PathUtils.bookPath}${bid}.asar`);
        }
    },
};

module.exports = Protocol;