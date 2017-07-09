/**
 * Pagination helper module
 * @author Martin Giger
 * @license MIT
 * @module twitchbots-base/pagination
 */
"use strict";

function PaginationHelper(options) {
    let result = [];
    const getPage = (offset) => {
        return options.request(options.url + offset).then((response) => {
            if(response.bots.length > 0) {
                result = result.concat(response.bots);
            }

            if(response._links.next !== null) {
                return getPage(offset + response.limit);
            }
        });
    };
    return getPage(0).then(() => result);
}

module.exports = PaginationHelper;
