const EnvConfig = require('../../config/env-config');

const CESParser = {

    MY_BOOKS_CID: 'myBooks',
    MY_BOOKS_TITLE: 'My books',

    CONFIG: {
        TYPE_BID: 'bid',
        TYPE_PID: 'pid',
        MY_BOOKS: 0,
    },

    hasMasterProduct(response) {
        if (response && response.data && response.data.licenses) {
            for (const license of response.data.licenses) {
                for (const product of license.oupLicense.productIds) {
                    if (product && product.productId === EnvConfig.get(EnvConfig.OLBConfig.OLB_MASTER_PRODUCT)) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    hasSampleProduct(response) {
        if (response && response.data && response.data.licenses) {
            for (const license of response.data.licenses) {
                for (const product of license.oupLicense.productIds) {
                    if (product != null && product.productId === EnvConfig.get(EnvConfig.OLBConfig.OLB_SAMPLE_PRODUCT)) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    hasProduct(license) {
        return license?.oupLicense?.productIds?.length > 0;
    },

    extractExternalId(external) {
        const id = { bid: null, cid: null };

        switch (external.typeId) {
            case CESParser.CONFIG.TYPE_BID:
                id.bid = external.id;
                break;

            case CESParser.CONFIG.TYPE_PID:
                id.cid = external.id;
                break;
        }
        return id;
    },

    extractExternalIds(externals) {
        const id = { bid: null, cid: null };

        if (externals && externals.length > 0) {
            for (const external of externals) {
                const newId = this.extractExternalId(external);

                id.bid = id.bid || newId.bid;
                id.cid = id.cid || newId.cid;
            }
        }
        return id;
    },

    extractProductsForCode(licenses) {
        const bids = [];
        const cids = [];
        const licenseInfo = {};

        for (const license of licenses) {
            if (this.hasProduct(license)) {
                const { bid, cid } = this.extractExternalIds(license.oupLicense.productIds[0].external);

                if (this.isValidId(cid)) {
                    cids.push(cid);
                } else if (this.isValidId(bid)) {
                    bids.push(bid);
                }
                if (license.expiryDate) {
                    licenseInfo.date = license.expiryDate;
                    licenseInfo.expired = license.expired;
                }
            }
        }
        return { bids, cids, licenseInfo };
    },

    isValidId(id) {
        return (id && id !== '');
    },
};

module.exports = CESParser;