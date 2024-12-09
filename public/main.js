// Define trackData
let trackData = [];

// Function to check if user is authenticated
async function checkAuthentication() {
    try {
        const accessToken = sessionStorage.getItem("access_token");

        if (!accessToken) {
            alert("Access token missing. Please log in.");
            window.location.href = "/login";
            return;
        }
        
        const response = await fetch("/auth-status", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();

        if (data.authenticated) {
            loadTopTracks();
        } else {
            alert("User is not authenticated. Please log in.");
            window.location.href = '/login';
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
    }
}

// Function to load top tracks from the backend
async function loadTopTracks() {
    try {
        const response = await fetch('/top-tracks');
        const tracks = await response.json();
        displayTracks(tracks);
    } catch (error) {
        console.error("Error loading top tracks:", error);
    }
}

// Display Title on the page and save access token to session storage for redirection purposes
document.addEventListener("DOMContentLoaded", function() {
    const username = localStorage.getItem('username') || 'Guest';
    const accessToken = new URLSearchParams(window.location.search).get('access_token');

    if (accessToken) {
        // Save access token in sessionStorage
        sessionStorage.setItem('access_token', accessToken);

        // Clean the URL by removing the access token parameter
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        console.log('Access token saved to sessionStorage and URL cleaned.');
    } else {
        console.log('No access token found in URL.');
    }
    
    document.body.style.backgroundImage = "url('/sky-full-of-stars-space-4k_1540139420.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";

    // Change the font color for the title
    const titleElement = document.querySelector('h1');
    if (titleElement) {
        titleElement.style.color = 'white';
        titleElement.style.textAlign = 'center';
        titleElement.style.fontFamily = "'Arial', sans-serif";
    }
    const text = document.querySelector('p');
    if (text) {
        text.style.color = 'white';
        text.style.textAlign = 'center';
        text.style.fontFamily = "'Arial', sans-serif";
    }
    const loginForm = document.querySelector('form');
    if (loginForm) {
        loginForm.style.color = 'white';
        loginForm.style.textAlign = 'center';
        loginForm.style.fontFamily = "'Arial', sans-serif";
        loginForm.style.background = 'rgba(255, 255, 255, 0.1)';
        loginForm.style.borderRadius = '10px';
        loginForm.style.padding = '20px';
        loginForm.style.marginTop = '50px';
        loginForm.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.3)';
    }
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.color = 'white'; // Change spinner font color
        spinner.style.textAlign = 'center';
        spinner.style.fontFamily = "'Arial', sans-serif";
    }
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.style.color = 'white'; // Change error message font color
        errorMessage.style.textAlign = 'center';
        errorMessage.style.fontFamily = "'Arial', sans-serif";
    }

    // Profile page functionality
    if (window.location.pathname.endsWith('profile.html')) {
        document.getElementById('username-display').textContent = username;
        fetchFriends(username);

        const friendInput = document.getElementById("friend-input");
        const manageFriendButton = document.getElementById("manage-friend-button");

        // Handle Add/Remove Friend
        manageFriendButton.addEventListener("click", async () => {
            const friendUsername = friendInput.value.trim();
    
            if (!friendUsername) {
                alert("Please enter a username.");
                return;
            }
    
            try {
                const response = await fetch("/friends/manage", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                    username: localStorage.getItem("username"), // Current logged-in user
                    friendUsername,
                }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                alert(data.message);
                fetchFriends(localStorage.getItem("username")); // Refresh the friends list
            } else {
                alert(data.error || "Failed to manage friend.");
            }
            } catch (error) {
                console.error("Error managing friend:", error);
                alert("An error occurred.");
            }
        });
  
        // For results screenshot upload functionality
        const uploadButton = document.getElementById("upload-screenshot-button");
        const screenshotInput = document.getElementById("screenshot-input");
        const screenshotImg = document.getElementById("screenshot");
        const uploadDateText = document.getElementById("upload-date");

        uploadButton.addEventListener("click", () => {
            screenshotInput.click();
        });
        screenshotInput.addEventListener("change", async () => {
            const file = screenshotInput.files[0];
            if (file) {
                const formData = new FormData();
                formData.append("screenshot", file);
        
                try {
                    const response = await fetch("/upload-screenshot", {
                        method: "POST",
                        body: formData,
                        headers: {
                            Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
                        },
                    });
        
                    const data = await response.json();
                    if (response.ok) {
                        screenshotImg.src = data.screenshot;
                        uploadDateText.textContent = `Uploaded on: ${new Date(data.uploadDate).toLocaleDateString()}`;
                    } else {
                        alert(data.error || "Failed to upload screenshot.");
                    }
                } catch (error) {
                    console.error("Error uploading screenshot:", error);
                    alert("An error occurred while uploading your screenshot.");
                }
            }
        });

        async function fetchUserProfile() {
            try {
            const response = await fetch(`/profile-data?username=${localStorage.getItem("username")}`);
            const data = await response.json();
    
            if (response.ok) {
                screenshotImg.src = data.screenshot || "placeholder.jpg";
                uploadDateText.textContent = data.uploadDate
                ? `Uploaded on: ${new Date(data.uploadDate).toLocaleDateString()}`
                : "(No results uploaded yet)";
            } else {
                console.error("Error fetching user profile:", data.error);
            }
            } catch (error) {
            console.error("Error fetching user profile:", error);
            }
        }
        fetchUserProfile();
    }

    // Friend profile functionality
    if (window.location.pathname.endsWith("friend-profile.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        /*const friendUsername = urlParams.get("username");

        const friendUsernameElement = document.getElementById("friend-username");
        const friendScreenshotElement = document.getElementById("friend-screenshot");
        const friendUploadDateElement = document.getElementById("friend-upload-date");*/

        async function fetchFriendProfile() {
            const urlParams = new URLSearchParams(window.location.search);
            const friendUsername = urlParams.get("username");

            if (!friendUsername) {
                console.error("No username found in the URL.");
                document.getElementById("friend-username").textContent = "No friend selected.";
                return;
            }

            try {
                const response = await fetch(`/profile-data?username=${friendUsername}`);
                const data = await response.json();

                if (response.ok) {
                    document.getElementById("friend-username").textContent = data.username;
                    
                    const friendScreenshotElement = document.getElementById("friend-screenshot");
                    friendScreenshotElement.src = data.screenshot || "placeholder.jpg";
                    const friendUploadDateElement = document.getElementById("friend-upload-date");
                    friendUploadDateElement.textContent = data.uploadDate
                        ? `Uploaded on: ${new Date(data.uploadDate).toLocaleDateString()}`
                        : "(No results uploaded yet)";
                } else {
                    console.error("Error fetching friend profile:", data.error);
                }
            } catch (error) {
                console.error("Error fetching friend profile:", error);
            }
        }

        fetchFriendProfile();
    }

    checkAuthentication();
    fetchTracks();
}); //DOMContentLoaded ends

async function fetchTracks() {
   const accessToken = sessionStorage.getItem('access_token');
   const spinner = document.getElementById('spinner');

    if (!accessToken) {
        document.getElementById('error-message').innerText = 'Error: Access token not found in the URL.';
        return;
    }

    try {
        spinner.style.display = 'block';
        const response = await fetch("/top-tracks", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            document.getElementById('error-message').innerText = `Error: ${errorData.error || 'An unknown error occurred.'}`;
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        trackData = await response.json();
        console.log('Fetched track data:', trackData);

        if (trackData && trackData.length) {
            renderTracks(trackData);
        } else {
            console.error('No tracks found in the response:', trackData);
            document.getElementById('error-message').innerText = 'No tracks found.';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('error-message').innerText = 'An error occurred while fetching track data. Please try again later.';
    } finally {
        spinner.style.display = 'none';
    }
}

function renderTracks(data) {
    const accessToken = sessionStorage.getItem("access_token");

    d3.select("#chart").selectAll("*").remove();

    console.log("Fetched data:", data); // Verify data received

    const width = window.innerWidth;
    const height = window.innerHeight;

    const planetColors = ["#f75", "#b9e", "#72e", "#3a0", "#436"];

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Aggregate data by artist
    const artistData = d3.groups(data, d => d.artists[0].id)
        .map(([id, values]) => ({
            key: values[0].artists[0].name, // Use artist name for display
            id, // Use artist ID for API calls
            value: {
                avgPopularity: d3.mean(values, d => d.popularity),
                avgDuration: d3.mean(values, d => d.duration_ms),
                count: values.length
            }
        }));

    // Sort artists by the number of tracks and take the top 10
    const topArtists = artistData.sort((a, b) => b.value.count - a.value.count).slice(0, 10);
    console.log('Top artists data:', topArtists);

    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([100, width - 100]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(topArtists, d => d.value.avgDuration))
        .range([height - 150, 150]);

    const minSize = 30;
    const maxSize = 130;


    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 100, 1)")
        .style("color", "#fff")
        .style("padding", "10px")
        .style("border-radius", "0px")
        .style("border-color", "white")
        .style("border-style", "solid")
        .style("pointer-events", "none")
        .style("display", "none")
        .style("font-size", "20px")
        .style("font-family", "'Share Tech Mono', monospace")
        .style("max-width", "300px")
        .style("height", "auto")
        .style("overflow", "visible")
        .style("white-space", "normal");

    console.log("Tooltip element created:", tooltip.node());

    let planetPosition = 1;
    let textPosition = 1;

    svg.selectAll("circle")
        .data(topArtists)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(planetPosition++ * 10))
        .attr("cy", d => yScale(d.value.avgDuration))
        .attr("r", d => {
            const radius = minSize + ((d.value.count / 10) * (maxSize - minSize));
            return radius;
        })
        //Iterate through each circle and create a pattern for it
        .each(function (d, i) {
            const radius = minSize + ((d.value.count / 10) * (maxSize - minSize));
            const patternId = `earthpattern-${i}`;
            let planet;
            //Choose image for planet
            switch(i) {
                case 0:
                    planet = "sun2.jpg"
                    break;
                case 1:
                    planet = "mercury2.jpg"
                    break;
                case 2:
                    planet = "venus2.jpg"
                    break;
                case 3:
                    planet = "earth2.jpg"
                    break;
                case 4:
                    planet = "mars2.jpg"
                    break;
                case 5:
                    planet = "jupiter2.jpg"
                    break;
                case 6:
                    planet = "saturn.jpg"
                    break;
                case 7:
                    planet = "uranus2.jpg"
                    break;
                case 8:
                    planet = "neptune2.jpg"
                    break;
                case 9:
                    planet = "pluto.jpg"
                    break;
                default:
                    break;
            }
            svg.append("defs")
                .append("pattern")
                .attr("id", patternId)
                .attr("patternUnits", "objectBoundingBox")
                .attr("width", 1)
                .attr("height", 1)
                .append("image")
                .attr("xlink:href", planet)
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", radius * 2)
                .attr("height", radius * 2);

            d3.select(this)
                .attr("fill", `url(#${patternId})`);
        })
        //.attr("stroke", "white")
        //.attr("stroke-width", 2)
        .on("mouseover", async (event, d) => {
            try {
                // Show the tooltip immediately with basic info
                tooltip.style("display", "block")
                    .html(`<strong>${d.key}</strong><br>Tracks: ${d.value.count}<br>Popularity: ${Math.round(d.value.avgPopularity)}<br>Loading more info...`);
        
                // Fetch additional artist details using the Spotify Web API
                const response = await fetch(`https://api.spotify.com/v1/artists/${d.id}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
        
                if (!response.ok) {
                    throw new Error('Failed to fetch artist details');
                }
        
                const artistDetails = await response.json();
                const imageUrl = artistDetails.images[0]?.url || '';
        
                // Update the tooltip with additional details
                tooltip.html(`
                    <strong>${d.key}</strong><br>
                    <div style="display: flex; justify-content: center; align-items: center; text-align: center; margin-top: 10px;">
                        <img src="${imageUrl}" alt="Artist Image"
                            style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;">
                    </div>
                    Genres: ${artistDetails.genres.join(', ')}<br>
                    Followers: ${artistDetails.followers.total.toLocaleString()}<br>
                `);
                tooltip.select('img')
                    .style('width', '100px')
                    .style('height', '100px')
                    .style('object-fit', 'cover')
                    .style('border-radius', '0%');
        
            } catch (error) {
                console.error('Error fetching artist details:', error);
                tooltip.html(`<strong>${d.key}</strong><br>Error loading details.`);
            }
        })
        .on("mousemove", (event) => {
            tooltip.style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);

        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        })
        .on("click", (event, d) => {
            // Open a new window with the track list for the clicked artist
            const newWindow = window.open("", "_blank", "width=600,height=400");
            newWindow.document.write(`
                <html>
                <head>
                    <title>${d.key} - Track List</title>
                    <style nonce="abc123">
                        body {
                            font-family: monospace;
                            background-color: rgba(0, 0, 100, 1);
                            color: white;
                            margin: 0;
                            padding: 20px;
                        }
                        h1 {
                            text-align: center;
                        }
                        ul {
                            list-style-type: none;
                            padding: 0;
                        }
                        li {
                            margin: 5px 0;
                            padding: 5px;
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <h1>${d.key} - Track List</h1>
                    <ul id="track-list"></ul>
                    <script nonce="abc123">
                        async function fetchTracks() {
                            console.log('Fetching tracks...');
                            const response = await fetch(
                                'https://api.spotify.com/v1/artists/${d.id}/top-tracks?market=US',
                                { headers: { Authorization: 'Bearer ${accessToken}' } }
                            );
                            if (response.ok) {
                                const data = await response.json();
                                const list = document.getElementById('track-list');
                                data.tracks.forEach(track => {
                                    const li = document.createElement('li');
                                    li.textContent = track.name;
                                    list.appendChild(li);
                                });
                            } else {
                                console.error('Failed to fetch tracks');
                            }
                        }
                        fetchTracks();
                    </script>
                </body>
                </html>
            `);
    
            /*newWindow.onload = async () => {
                console.log('New window loaded');
                await fetchTracksForArtist(d.id, newWindow);
            };*/
        });

    svg.selectAll(".artist-label")
        .data(topArtists)
        .enter()
        .append("text")
        .attr("class", "artist-label")
        .attr("x", d => xScale(textPosition++ * 10))
        .attr("y", d => yScale(d.value.avgDuration) + 5)
        .attr("text-anchor", "middle")
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width','1px')
        .attr('font-size', '15px')
        .attr('font-family','Impact')
        .attr('font-weight','bold')
        .text(d => d.key);
}

async function fetchTracksForArtist(artistId, newWindow) {
    console.log('fetchTracksForArtist called with artistId:', artistId);
    try {
        const accessToken = sessionStorage.getItem("access_token");
        if (!accessToken) {
            throw new Error("Access token is missing or expired.");
        }

        // Fetch top tracks from Spotify API
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tracks for the artist');
        }

        const trackData = await response.json();
        const trackList = trackData.tracks;

        // Ensure the DOM is loaded in the new window before appending
        newWindow.onload = () => {
            const trackListElement = newWindow.document.getElementById('track-list');

            if (!trackListElement) {
                throw new Error("Track list element not found in the new window.");
            }

            // Add track names to the new window's track list
            trackList.forEach(track => {
                const trackItem = newWindow.document.createElement('li');
                trackItem.textContent = track.name;
                trackListElement.appendChild(trackItem);
            });
        };
    } catch (error) {
        console.error('Error fetching tracks for artist:', error);
        newWindow.document.body.innerHTML = `
            <p style="color: white;">Error loading tracks for this artist. Please try again later.</p>`;
    }
}

console.log("Track Data:", trackData);

function displayTracks(tracks) {
    const trackList = document.getElementById('track-list');
    if (!trackList) {
        console.error('Element with ID "track-list" not found in the DOM.');
        return;
    }
    trackList.innerHTML = '';

    // Aggregate data by artist
    const artistData = d3.groups(tracks, d => d.artists[0].name)
        .map(([key, values]) => ({
            key,
            value: {
                count: values.length,
                tracks: values.map(track => track.name) // Get track names
            }
        }));

    // Sort artists by the number of tracks and take the top 10
    const topArtists = artistData.sort((a, b) => b.value.count - a.value.count).slice(0, 10);

    topArtists.forEach(artist => {
        const artistItem = document.createElement('div');
        artistItem.textContent = `${artist.key} (${artist.value.count} tracks)`;
        artistItem.style.color = 'white';
        artistItem.style.fontWeight = 'bold';
        trackList.appendChild(artistItem);

        const trackTitles = document.createElement('ul');
        artist.value.tracks.forEach(track => {
            const trackItem = document.createElement('li');
            trackItem.textContent = track;
            trackItem.style.color = 'white';
            trackTitles.appendChild(trackItem);
        });
        trackList.appendChild(trackTitles);
    });
  
  const d3 = require('d3');
}

module.exports = {
    checkAuthentication,
    fetchTracks,
    renderTracks,
    loadTopTracks,
    displayTracks,
    fetchFriends,
    goToHome
};

    // Functionality for Login and redirection to profile page
    document.getElementById("login-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("user").value;
        const password = document.getElementById("pass").value;

        try {
            // Make a login request to backend
            const response = await fetch('/spaceify-login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password}),
            });

            const result = await response.json();

            if (response.ok) {
                console.log("Login form submitted.");
                localStorage.setItem('username', result.username); // Store the username
                sessionStorage.setItem('access_token', result.accessToken); // Store the access token
                window.location.href = `profile.html?access_token=${result.accessToken}`; // Redirect to profile page
            } else {
                document.getElementById('error-message').textContent = result.error || 'Login failed.';
            }

        } catch (error) {
            console.error('Error during login:', error);
            document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
        }
    });

    // Fetch and Display Friends
    async function fetchFriends(username) {
        const friendsList = document.getElementById("friends-list");
        friendsList.innerHTML = ""; // Clear the current list

        try {
            const response = await fetch(`/friends?username=${username}`);
            const data = await response.json();

            if (response.ok) {
                data.friends.forEach((friend) => {
                    const friendItem = document.createElement("li");
                    friendItem.textContent = friend;

                    // Clicking on a friend's name redirects to their profile
                    friendItem.addEventListener("click", () => {
                        window.location.href = `/friend-profile.html?username=${friend}`;
                    });

                    friendsList.appendChild(friendItem);
                });
            } else {
                console.error("Error fetching friends:", data.error);
            }
        } catch (error) {
            console.error("Error fetching friends:", error);
        }
    }

    function goToHome() {
        window.history.back();
    }