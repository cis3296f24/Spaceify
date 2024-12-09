const request = require('supertest');
const axios = require('axios'); // Import axios
const server = require('../../app'); // Import the server instance

// Test suite for the app routes
describe('App Routes', () => {
    // Clean up after all tests have run by closing the server
    afterAll((done) => {
        server.close(done);
    });

    // Test for the main page route ('/')
    it('should serve the main page', async () => {
        // Simulate a GET request to the root URL
        const res = await request(server).get('/');

        // Assert that the response status code is 200 (OK)
        expect(res.statusCode).toBe(200);

        // Assert that the 'Content-Type' header is 'html' (indicating an HTML response)
        expect(res.header['content-type']).toMatch(/html/);
    });

    // Test for the login route ('/login')
    it('should redirect to Spotify login', async () => {
        // Simulate a GET request to the /login route
        const res = await request(server).get('/login');

        // Assert that the response status code is 302 (indicating a redirect)
        expect(res.statusCode).toBe(302); // Redirect status code

        // Assert that the 'Location' header contains the Spotify authorization URL
        expect(res.headers.location).toContain('https://accounts.spotify.com/authorize');
    });

    // Test for the '/top-tracks' route without an active session
    it('should return unauthorized for /top-tracks without session', async () => {
        // Simulate a GET request to the /top-tracks route
        const res = await request(server).get('/top-tracks');

        // Assert that the response status code is 401 (Unauthorized)
        expect(res.statusCode).toBe(401);

        // Assert that the response body contains the error message 'Unauthorized'
        expect(res.body.error).toBe('Unauthorized');
    });

    // Test for the '/auth-status' route when not authenticated
    it('should indicate not authenticated on /auth-status without session', async () => {
        // Simulate a GET request to the /auth-status route
        const res = await request(server).get('/auth-status');

        // Assert that the response status code is 200 (OK)
        expect(res.statusCode).toBe(200);

        // Assert that the response body indicates the user is not authenticated
        expect(res.body).toEqual({ authenticated: false });
    });

    // Test for the profile page route ('/profile.html')
    it('should serve the profile page', async () => {
        // Simulate a GET request to the /profile.html route
        const res = await request(server).get('/profile.html');

        // Assert that the response status code is 200 (OK)
        expect(res.statusCode).toBe(200);

        // Assert that the 'Content-Type' header is 'html' (indicating an HTML response)
        expect(res.header['content-type']).toMatch(/html/);
    });

    // Test for the /register route
    it('should register a new user', async () => {
        const res = await request(server)
            .post('/register')
            .set('Content-Type', 'application/json') // Set Content-Type header
            .send({ username: 'testuser', password: 'testpassword' });

        console.log('Response status:', res.statusCode);
        console.log('Response body:', res.body);

        if (res.statusCode === 400 && res.body.error === 'Username already exists.') {
            console.log('Username already exists. Test case passed.');
        } else {
            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('User registered successfully.');
        }
    });

    // Test for the /spaceify-login route
    it('should login a user', async () => {
        const res = await request(server)
            .post('/spaceify-login')
            .send({ username: 'testuser', password: 'testpassword' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Login successful.');
    });

    // Test for the /friends route
    it('should get the list of friends for a user', async () => {
        const res = await request(server)
            .get('/friends')
            .query({ username: 'testuser' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('friends');
    });

    // Test for the /profile-data route
    it('should fetch profile data', async () => {
        const res = await request(server)
            .get('/profile-data')
            .query({ username: 'testuser' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('username', 'testuser');
    });
    it('should handle Spotify callback and redirect with access token', async () => {
    const code = 'test_code';
    const accessToken = 'test_access_token';
    const redirectTo = '/';

    // Mock the axios.post method to return a successful response
    jest.spyOn(axios, 'post').mockResolvedValue({
        data: { access_token: accessToken }
    });

    // Simulate a GET request to the /callback route
    const res = await request(server)
        .get('/callback')
        .query({ code, redirect: redirectTo });

    // Assert that the response status code is 302 (indicating a redirect)
    expect(res.statusCode).toBe(302);

    // Assert that the 'Location' header contains the redirect URL with the access token
    expect(res.headers.location).toBe(`${redirectTo}?access_token=${accessToken}`);

    // Restore the original axios.post method
    axios.post.mockRestore();
});
});

describe('GET /top-tracks', () => {
    afterAll((done) => {
        server.close(done);
    });

    it('should return unauthorized if no access token is present', async () => {
        const res = await request(server).get('/top-tracks');
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Unauthorized');
    });
});

// describe('Friends Management', () => {
//     afterAll((done) => {
//         server.close(done);
//     });
//
//     it('should add and remove a friend', async () => {
//         // Add a friend
//         const resAdd = await request(server)
//             .post('/friends/manage')
//             .send({ username: 'testuser', friendUsername: 'frienduser' });
//
//         console.log('Add Friend Response:', resAdd.body);
//
//         expect(resAdd.statusCode).toBe(404);
//         expect(resAdd.body.message).toBe('frienduser added to your friends.');
//
//         // Remove the friend
//         const resRemove = await request(server)
//             .post('/friends/manage')
//             .send({ username: 'testuser', friendUsername: 'frienduser' });
//         console.log('Remove Friend Response:', resRemove.body);
//
//         expect(resRemove.statusCode).toBe(404);
//         expect(resRemove.body.message).toBe('frienduser removed from your friends.');
//     });
// });

// describe('Helmet Middleware', () => {
//     it('should set Content-Security-Policy header', async () => {
//         const res = await request(app).get('/test-csp');
//
//         expect(res.statusCode).toBe(200);
//         expect(res.headers).toHaveProperty('content-security-policy');
//         expect(res.headers['content-security-policy']).toContain("default-src 'self'");
//         expect(res.headers['content-security-policy']).toContain("script-src 'self' 'nonce-");
//         expect(res.headers['content-security-policy']).toContain("style-src 'self' 'nonce-");
//         expect(res.headers['content-security-policy']).toContain("img-src 'self' data: https://i.scdn.co https://www.pixel4k.com");
//         expect(res.headers['content-security-policy']).toContain("connect-src 'self' https://api.spotify.com");
//     });
//});


