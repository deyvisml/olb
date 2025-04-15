const $ = require('jquery');

const galaxyView = {

    render(diary) {
        $('.diary-star-icon').remove();

        const sky = $('.olb-stars');

        if (diary.read_books_count > 24) {
            for (let i = 0; i < diary.read_books_count; i++) {
                sky.append(this.getStar('../images/ods/ic_star_medium_on.png'));
            }
        } else {
            for (let i = 1; i < 25; i++) {
                let star;

                if (i <= diary.read_books_count) {
                    star = this.getStar('../images/ods/ic_star_medium_on.png');
                } else {
                    star = this.getStar('../images/ods/ic_star_medium_off.png');
                    star.appendChild(this.getShootingStar(i));
                }
                sky.append(star);
            }
        }
    },

    getStar(imgSrc) {
        const { x, y } = this.getRandomPosition(985, 400, 40);
        const size = this.getRandomSize();
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'image');

        star.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imgSrc);
        star.setAttributeNS(null, 'x', x.toString());
        star.setAttributeNS(null, 'y', y.toString());
        star.setAttributeNS(null, 'width', size.toString());
        star.setAttributeNS(null, 'height', size.toString());
        star.setAttributeNS(null, 'class', 'diary-star-icon');

        return star;
    },

    getShootingStar(idx) {
        const shootingStar = document.createElementNS('http://www.w3.org/2000/svg', 'animate');

        shootingStar.setAttributeNS(null, 'attributeName', 'opacity');
        shootingStar.setAttributeNS(null, 'attributeType', 'xml');
        shootingStar.setAttributeNS(null, 'values', '0;1;0');
        shootingStar.setAttributeNS(null, 'dur', '10s');
        shootingStar.setAttributeNS(null, 'begin', `${idx % 4}s`);
        shootingStar.setAttributeNS(null, 'repeatCount', 'indefinite');

        return shootingStar;
    },

    getRandomPosition(width, height, padding) {
        const x = Math.floor((Math.random() * (width - padding * 2)) + padding);
        const y = Math.floor((Math.random() * (height - padding * 2)) + padding);

        return { x: x, y: y };
    },

    getRandomSize() {
        const sizes = [25, 20, 15];

        return sizes[Math.floor(Math.random() * sizes.length)];
    }

};

module.exports = galaxyView;