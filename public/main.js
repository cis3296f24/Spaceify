// Adds a glowing effect to the cursor when the mouse is moved
// NOTE: This functionality is not yet fully implemented
document.addEventListener('mousemove', function(e) {
    const cursor = document.createElement('div'); // Create a div element to act as the cursor glow
    cursor.classList.add('cursor-glow'); // Add a CSS class for styling
    cursor.style.left = e.pageX + 'px'; // Position the glow at the cursor's X-coordinate
    cursor.style.top = e.pageY + 'px'; // Position the glow at the cursor's Y-coordinate
    document.body.appendChild(cursor); // Add the glow element to the DOM

    // Remove the glow element after 500 milliseconds
    setTimeout(() => {
        cursor.remove();
    }, 500);
});

// Checks if the user is authenticated by verifying the access token
async function checkAuthentication() {
    try {
        const accessToken = sessionStorage.getItem("access_token"); // Retrieve the access token from sessionStorage

        // Redirect to login if access token is missing
        if (!accessToken) {
            alert("Access token missing. Please log in.");
            window.location.href = "/login";
            return;
        }

        // Verify authentication status with the server
        const response = await fetch("/auth-status", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();

        // Load top tracks if authenticated, otherwise redirect to login
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

// Fetches the top tracks of the authenticated user
async function loadTopTracks() {
    try {
        const response = await fetch('/top-tracks'); // Request top tracks from the server
        const tracks = await response.json(); // Parse the response as JSON
        displayTracks(tracks); // Display the fetched tracks
    } catch (error) {
        console.error("Error loading top tracks:", error);
    }
}

// Initializes the page on load, saving tokens and setting styles
document.addEventListener("DOMContentLoaded", function() {
    const username = localStorage.getItem('username') || 'Guest'; // Default to 'Guest' if username is not set
    const accessToken = new URLSearchParams(window.location.search).get('access_token'); // Extract access token from URL

    // Save the access token and clean the URL
    if (accessToken) {
        sessionStorage.setItem('access_token', accessToken); // Store the token
        const newUrl = window.location.origin + window.location.pathname; // Construct the new URL without query parameters
        window.history.replaceState({}, document.title, newUrl); // Update the browser's history
        console.log('Access token saved to sessionStorage and URL cleaned.');
    } else {
        console.log('No access token found in URL.');
    }

    // Set background properties
    document.body.style.backgroundImage = "url('/sky-full-of-stars-space-4k_1540139420.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";

    // Style the title, text, and forms dynamically
    const titleElement = document.querySelector('h1');
    if (titleElement) {
        titleElement.style.color = 'white';
        titleElement.style.textAlign = 'center';
        titleElement.style.fontFamily = "'Arial', sans-serif";
    }

    // Apply similar styling to paragraph and forms
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

    checkAuthentication(); // Initiate the authentication check
    fetchTracks(); // Fetch the tracks data for visualization
});

// Fetches and renders track data as planets with additional artist details
async function fetchTracks() {
    const accessToken = sessionStorage.getItem('access_token'); // Retrieve the token for authorization
    const spinner = document.getElementById('spinner');

    // Handle missing access token
    if (!accessToken) {
        document.getElementById('error-message').innerText = 'Error: Access token not found in the URL.';
        return;
    }

    try {
        spinner.style.display = 'block'; // Display a loading spinner
        const response = await fetch("/top-tracks", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        // Handle unsuccessful responses
        if (!response.ok) {
            const errorData = await response.json();
            document.getElementById('error-message').innerText = `Error: ${errorData.error || 'An unknown error occurred.'}`;
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const trackData = await response.json(); // Parse the track data
        console.log('Fetched track data:', trackData);

        if (trackData && trackData.length) {
            renderTracks(trackData); // Visualize the track data
        } else {
            console.error('No tracks found in the response:', trackData);
            document.getElementById('error-message').innerText = 'No tracks found.';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('error-message').innerText = 'An error occurred while fetching track data. Please try again later.';
    } finally {
        spinner.style.display = 'none'; // Hide the spinner
    }
}

// Renders fetched track data into a visual chart with D3.js

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
                    planet = "sun.jpg"
                    break;
                case 1:
                    planet = "mercury.jpg"
                    break;
                case 2:
                    planet = "venus.jpg"
                    break;
                case 3:
                    planet = "earth.jpg"
                    break;
                case 4:
                    planet = "mars.jpg"
                    break;
                case 5:
                    planet = "jupiter.jpg"
                    break;
                case 6:
                    planet = "saturn.jpg"
                    break;
                case 7:
                    planet = "uranus.jpg"
                    break;
                case 8:
                    planet = "neptune.jpg"
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
        });

    svg.selectAll(".artist-label")
        .data(topArtists)
        .enter()
        .append("text")
        .attr("class", "artist-label")
        .attr("x", d => xScale(textPosition++ * 10))
        .attr("y", d => yScale(d.value.avgDuration) + 5)
        .attr("text-anchor", "middle")
        .text(d => d.key);
}

function displayTracks(tracks) {
    const trackList = document.getElementById('track-list');
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
  module.exports = {
        checkAuthentication,
        fetchTracks,
        renderTracks,
        fetchUserProfile,
        fetchFriends,
        goToHome
   };
}

// Functionality for Login and redirection to profile page
document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const username = document.getElementById("user").value;
    const password = document.getElementById("pass").value;
  
    try {
      // Make a login request to backend
      const response = await fetch('/spaceify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
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

  /*async function fetchFriends(username) {
    const friendsList = document.getElementById("friends-list");
    friendsList.innerHTML = "";

    // Fetch friends and render their profiles
    fetch(`/friends?username=${username}`)
        .then((response) => response.json())
        .then((data) => {
        data.friends.forEach((friend) => {
            const friendItem = document.createElement("li");
            friendItem.textContent = friend;

            // Clicking on a friend redirects to their profile
            friendItem.addEventListener("click", () => {
            window.location.href = `/friend-profile.html?username=${friend}`;
            });

            friendsList.appendChild(friendItem);
        });
        });
    }*/

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

    /*
async function addFriend(username, friendUsername) {
    try {
        const response = await fetch('/friends/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, friendUsername }),
        });
        const data = await response.json();

        if (response.ok) {
            alert('Friend added successfully!');
            fetchFriends(username);
        } else {
            alert(data.error || 'Error adding friend.');
        }
    } catch (error) {
        console.error('Error adding friend:', error);
    }
}

async function removeFriend(username, friendUsername) {
    try {
        const response = await fetch('/friends/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, friendUsername }),
        });
        const data = await response.json();

        if (response.ok) {
            alert('Friend removed successfully!');
            fetchFriends(username);
        } else {
            alert(data.error || 'Error removing friend.');
        }
    } catch (error) {
        console.error('Error removing friend:', error);
    }
}
    */

function goToHome() {
    window.history.back();
}