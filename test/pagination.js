import test from 'ava';
import PaginationHelper from '../pagination';

test("Test paginationhelper", async (t) => {
    t.plan(5);

    const result = await PaginationHelper({
        request: (url) => {
            if(url == "https://localhost?offset=0") {
                t.pass("First call had the correct URL");
                return Promise.resolve({
                    bots: [
                        "foo"
                    ],
                    _links: {
                        next: "https://localhost?offset=100"
                    },
                    limit: 100
                });
            }
            else if(url == "https://localhost?offset=100") {
                t.pass("Second call had the correct url");
                return Promise.resolve({
                    bots: [
                        "bar"
                    ],
                    _links: {
                        next: "https://localhost?offset=200"
                    },
                    limit: 40
                });
            }
            else if(url == "https://localhost?offset=140") {
                t.pass("Last call");
                return Promise.resolve({
                    bots: [],
                    _links: {
                        next: null
                    },
                    limit: 100
                });
            }
            else {
                t.fail();
                return Promise.reject("Not a valid URL");
            }
        },
        url: "https://localhost?offset="
    });

    t.is(result.length, 2);
    t.deepEqual(result, [ "foo", "bar" ]);
});
