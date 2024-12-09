// public/__test__/main.test.js
const { jest } = require('@jest/globals');
const { checkAuthentication, loadTopTracks, fetchTracks, renderTracks,displayTracks,fetchFriends } = require('../main.js');

describe('checkAuthentication tests', () => {
    beforeEach(() => {
        // Clear sessionStorage and mocks before each test
        sessionStorage.clear();
        jest.clearAllMocks();
    });

    test('should redirect to login if access token is missing', async () => {
        // Mock alert and window.location.href
        global.alert = jest.fn();
        delete window.location;
        window.location = { href: '' };

        await checkAuthentication();

        expect(global.alert).toHaveBeenCalledWith("Access token missing. Please log in.");
        expect(window.location.href).toBe("/login");
    });

    test('should redirect to login if user is not authenticated', async () => {
        // Mock sessionStorage, fetch, alert, and window.location.href
        sessionStorage.setItem("access_token", "fakeToken");
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ authenticated: false }),
            })
        );
        global.alert = jest.fn();
        delete window.location;
        window.location = { href: '' };

        await checkAuthentication();

        expect(global.alert).toHaveBeenCalledWith("User is not authenticated. Please log in.");
        expect(window.location.href).toBe("/login");
    });

    test('should log error if fetch fails', async () => {
        // Mock sessionStorage and fetch
        sessionStorage.setItem("access_token", "fakeToken");
        global.fetch = jest.fn(() => Promise.reject("Fetch error"));
        console.error = jest.fn();

        await checkAuthentication();

        expect(console.error).toHaveBeenCalledWith("Error checking authentication:", "Fetch error");
    });
});

describe('loadTopTracks tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // test('should call displayTracks with fetched tracks', async () => {
    //     const mockTracks = [{ id: 1, name: 'Track 1' }, { id: 2, name: 'Track 2' }];
    //     global.fetch = jest.fn(() =>
    //         Promise.resolve({
    //             json: () => Promise.resolve(mockTracks),
    //         })
    //     );
    //     const displayTracks = jest.fn();
    //     global.displayTracks = displayTracks;
    //
    //     await loadTopTracks();
    //
    //     expect(global.fetch).toHaveBeenCalledWith('/top-tracks');
    //     expect(displayTracks).toHaveBeenCalledWith(mockTracks);
    // });

    test('should log error if fetch fails', async () => {
        global.fetch = jest.fn(() => Promise.reject("Fetch error"));
        console.error = jest.fn();

        await loadTopTracks();

        expect(console.error).toHaveBeenCalledWith("Error loading top tracks:", "Fetch error");
    });
});

describe('fetchTracks tests', () => {
    let originalSessionStorage;
    let originalDocument;
    let originalFetch;

    beforeEach(() => {
        // Mock sessionStorage
        originalSessionStorage = global.sessionStorage;
        global.sessionStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        }
        // Mock DOM elements
        originalDocument = global.document;
        global.document = {
            getElementById: jest.fn().mockImplementation((id) => {
                const elements = {
                    'error-message': { style: { display: 'none' }, innerText: '' },
                    'spinner': { style: { display: 'none' } },
                };
                return elements[id] || null;
            }),
        };

        // Mock fetch
        originalFetch = global.fetch;
        global.fetch = jest.fn();

        jest.clearAllMocks();
    });

    afterEach(() => {
        global.sessionStorage = originalSessionStorage;
        global.document = originalDocument;
        global.fetch = originalFetch;
    });


    test('should display error message if access token is missing', async () => {
        global.sessionStorage.getItem = jest.fn().mockReturnValue(null);
        // Mock document.getElementById to return an object with innerText property
        global.document.getElementById = jest.fn().mockImplementation((id) => {
            if (id === 'error-message') {
                return { style: { display: 'none' }, innerText: '' };
            }
            return null;
        });

        await fetchTracks();

        expect(global.document.getElementById).toHaveBeenCalledWith('error-message');
        expect(global.document.getElementById('error-message').innerText).toBe('');
    });

    test('should display error message if fetch response is not ok', async () => {
        global.sessionStorage.getItem = jest.fn().mockReturnValue('fakeToken');
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                statusText: 'Not Found',
                json: () => Promise.resolve({ error: 'Not Found' })
            })
        );

        // Mock document.getElementById to return an object with innerText property
        global.document.getElementById = jest.fn().mockImplementation((id) => {
            if (id === 'error-message') {
                return { style: { display: 'none' }, innerText: '' };
            }
            if (id === 'spinner') {
                return { style: { display: 'none' } };
            }
            return null;
        });

        await fetchTracks();

        expect(global.document.getElementById).toHaveBeenCalledWith('spinner');
        expect(global.document.getElementById('spinner').style.display).toBe('none');
        expect(global.document.getElementById('error-message').innerText).toBe('');
        expect(global.document.getElementById('spinner').style.display).toBe('none');
    });

    test('should call renderTracks with fetched track data', async () => {
        const mockTracks = [{ id: 1, name: 'Track 1' }, { id: 2, name: 'Track 2' }];
        global.sessionStorage.getItem = jest.fn().mockReturnValue('fakeToken');
        global.fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockTracks)
        });
        const renderTracks = jest.fn();
        global.renderTracks = renderTracks;

        await fetchTracks();

        expect(global.fetch).toHaveBeenCalledWith('/top-tracks', {
            headers: { Authorization: 'Bearer fakeToken' }
        });
        expect(renderTracks).toHaveBeenCalledWith(mockTracks);
    });

    test('should display error message if no tracks found', async () => {
        global.sessionStorage.getItem = jest.fn().mockReturnValue('fakeToken');
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([])
            })
        );

        await fetchTracks();

        expect(global.document.getElementById('error-message').innerText).toBe('No tracks found.');
        expect(global.document.getElementById('error-message').style.display).toBe('block');
    });

    test('should log error if fetch fails', async () => {
        global.sessionStorage.getItem = jest.fn().mockReturnValue('fakeToken');
        global.fetch = jest.fn(() => Promise.reject('Fetch error'));
        console.error = jest.fn();

        await fetchTracks();

        expect(console.error).toHaveBeenCalledWith('Fetch error:', 'Fetch error');
        expect(global.document.getElementById('error-message').innerText).toBe('An error occurred while fetching track data. Please try again later.');
    });
});


describe('renderTracks tests', () => {
    let originalSessionStorage;
    let originalD3;
    let originalDocument;

    beforeEach(() => {
        // Mock sessionStorage
        originalSessionStorage = global.sessionStorage;
        global.sessionStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };

        // Mock d3
        originalD3 = global.d3;
        global.d3 = {
            select: jest.fn().mockReturnValue({
                selectAll: jest.fn().mockReturnThis(),
                remove: jest.fn().mockReturnThis(),
                append: jest.fn().mockReturnThis(),
                attr: jest.fn().mockReturnThis(),
                data: jest.fn().mockReturnThis(),
                enter: jest.fn().mockReturnThis(),
                append: jest.fn().mockReturnThis(),
                style: jest.fn().mockReturnThis(),
                html: jest.fn().mockReturnThis(),
                on: jest.fn().mockReturnThis(),
                node: jest.fn().mockReturnThis(),
                each: jest.fn().mockReturnThis(),
                text: jest.fn().mockReturnThis()
            }),
            groups: jest.fn(),
            mean: jest.fn(),
            scaleLinear: jest.fn().mockReturnValue({
                domain: jest.fn().mockReturnThis(),
                range: jest.fn().mockReturnThis()
            }),
            extent: jest.fn()
        };

        // Mock DOM elements
        originalDocument = global.document;
        global.document = {
            getElementById: jest.fn().mockReturnValue({
                style: { display: 'none' },
                innerText: ''
            })
        };

        jest.clearAllMocks();
    });

    afterEach(() => {
        global.sessionStorage = originalSessionStorage;
        global.d3 = originalD3;
        global.document = originalDocument;
    });

    test('should render tracks correctly', () => {
        const mockData = [
            { artists: [{ id: '1', name: 'Artist 1' }], popularity: 50, duration_ms: 200000 },
            { artists: [{ id: '2', name: 'Artist 2' }], popularity: 60, duration_ms: 180000 }
        ];

        global.sessionStorage.getItem = jest.fn().mockReturnValue('fakeToken');
        global.d3.groups.mockReturnValue([
            ['1', [mockData[0]]],
            ['2', [mockData[1]]]
        ]);
        global.d3.mean.mockImplementation((values, accessor) => {
            if (accessor === 'popularity') return 55;
            if (accessor === 'duration_ms') return 190000;
        });
        global.d3.extent.mockReturnValue([180000, 200000]);

        renderTracks(mockData);

        expect(global.d3.select).toHaveBeenCalledWith('#chart');
        expect(global.d3.select().selectAll).toHaveBeenCalledWith('*');
        expect(global.d3.select().remove).toHaveBeenCalled();
        expect(global.d3.select().append).toHaveBeenCalledWith('svg');
        expect(global.d3.select().attr).toHaveBeenCalledWith('width', window.innerWidth);
        expect(global.d3.select().attr).toHaveBeenCalledWith('height', window.innerHeight);
        expect(global.d3.groups).toHaveBeenCalledWith(mockData, expect.any(Function));
        expect(global.d3.mean).toHaveBeenCalledTimes(4);
        expect(global.d3.extent).toHaveBeenCalledWith(expect.any(Array), expect.any(Function));
    });
});


describe('displayTracks tests', () => {
    let originalDocument;

    beforeEach(() => {
        // Mock DOM elements
        originalDocument = global.document;
        global.document = {
            getElementById: jest.fn().mockImplementation((id) => {
                if (id === 'track-list') {
                    return {
                        innerHTML: '',
                        appendChild: jest.fn()
                    };
                }
                return null;
            }),
            createElement: jest.fn().mockImplementation((tagName) => {
                return {
                    textContent: '',
                    style: {},
                    appendChild: jest.fn()
                };
            })
        };

        jest.clearAllMocks();
    });

    afterEach(() => {
        global.document = originalDocument;
    });

    test('should log error if track-list element is not found', () => {
    global.document.getElementById = jest.fn().mockReturnValue(null);

    console.error = jest.fn();

    displayTracks([]);

    expect(console.error).toHaveBeenCalledWith('Element with ID "track-list" not found in the DOM.');
});
    test('should display tracks correctly', () => {
        const mockTracks = [
            { artists: [{ name: 'Artist 1' }], name: 'Track 1' },
            { artists: [{ name: 'Artist 1' }], name: 'Track 2' },
            { artists: [{ name: 'Artist 2' }], name: 'Track 3' }
        ];

        displayTracks(mockTracks);

        const trackList = global.document.getElementById('track-list');
        expect(trackList.innerHTML).toBe('');

        // Check if appendChild was called correctly
        expect(trackList.appendChild).toHaveBeenCalledTimes(5); // 2 artists + 3 tracks

        // Check the content of the appended elements
        const [artist1, track1, track2, artist2, track3] = trackList.appendChild.mock.calls.map(call => call[0]);

        expect(artist1.textContent).toBe('Artist 1 (2 tracks)');
        expect(track1.textContent).toBe('Track 1');
        expect(track2.textContent).toBe('Track 2');
        expect(artist2.textContent).toBe('Artist 2 (1 track)');
        expect(track3.textContent).toBe('Track 3');
    });
});


describe('fetchFriends tests', () => {
    let originalFetch;
    let originalDocument;

    beforeEach(() => {
        // Mock fetch
        originalFetch = global.fetch;
        global.fetch = jest.fn();

        // Mock DOM elements
        originalDocument = global.document;
        global.document = {
            getElementById: jest.fn().mockImplementation((id) => {
                if (id === 'friends-list') {
                    return {
                        innerHTML: '',
                        appendChild: jest.fn()
                    };
                }
                return null;
            }),
            createElement: jest.fn().mockImplementation(() => {
                return {
                    textContent: '',
                    addEventListener: jest.fn()
                };
            })
        };

        jest.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        global.document = originalDocument;
    });

    test('should log error if friends-list element is not found', async () => {
        global.document.getElementById = jest.fn().mockReturnValue(null);

        console.error = jest.fn();

        await fetchFriends('testUser');

        expect(console.error).toHaveBeenCalledWith('Element with ID "friends-list" not found in the DOM.');
    });

    test('should log error if fetch fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValue('Fetch error');

        await fetchFriends('testUser');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching friends:', 'Fetch error');
        consoleErrorSpy.mockRestore();
    });

    test('should log error if response is not ok', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockResolvedValue({
            ok: false,
            json: jest.fn().mockResolvedValue({ error: 'Error message' })
        });

        await fetchFriends('testUser');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching friends:', 'Error message');
        consoleErrorSpy.mockRestore();
    });

    test('should fetch and display friends correctly', async () => {
        const mockFriends = ['Friend1', 'Friend2'];
        global.fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ friends: mockFriends })
        });

        await fetchFriends('testUser');

        const friendsList = global.document.getElementById('friends-list');

        // Verify list is cleared before appending
        expect(friendsList.innerHTML).toBe('');

        // Verify correct fetch call
        expect(global.fetch).toHaveBeenCalledWith('/friends?username=testUser');

        // Verify correct number of friends appended
        expect(friendsList.appendChild).toHaveBeenCalledTimes(mockFriends.length);

        // Check contents of each appended element
        mockFriends.forEach((friend, index) => {
            const appendedElement = friendsList.appendChild.mock.calls[index][0];
            expect(appendedElement.textContent).toBe(friend);
            expect(appendedElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });
    });


    test('should log error if fetch fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValue('Fetch error');

        await fetchFriends('testUser');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching friends:', 'Fetch error');
        consoleErrorSpy.mockRestore();
    });

    test('should log error if response is not ok', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockResolvedValue({
            ok: false,
            json: jest.fn().mockResolvedValue({ error: 'Error message' })
        });

        await fetchFriends('testUser');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching friends:', 'Error message');
        consoleErrorSpy.mockRestore();
    });
});


