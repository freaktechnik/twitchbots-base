/**
 * Pagination helper module
 * @author Martin Giger
 * @license MIT
 * @module twitchbots-base/pagination
 */
"use strict";

const FIRST_PAGE = 0;

function PaginationHelper(options) {
    let result = [];
    const getPage = (offset) => options.request(options.url + offset).then((response) => {
        if(response.bots.length) {
            result = result.concat(response.bots);
        }

        if(response._links.next !== null) {
            return getPage(offset + response.limit);
        }
    });
    return getPage(FIRST_PAGE).then(() => result);
}

module.exports = PaginationHelper;
