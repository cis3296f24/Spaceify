document.addEventListener("DOMContentLoaded", function() {
    fetchTracks();
});

function getAccessToken() {
    const params = new URLSearchParams(window.location.search);
    return params.get('access_token');
}

async function checkAuthentication() {
    try {
        const response = await fetch('/auth-status');
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

async function loadTopTracks() {
    try {
        const response = await fetch('/top-tracks');
        const tracks = await response.json();
        displayTracks(tracks);
    } catch (error) {
        console.error("Error loading top tracks:", error);
    }
}

// Display Title on the page
document.addEventListener("DOMContentLoaded", function() {
    document.body.style.backgroundImage = "url('/sky-full-of-stars-space-4k_1540139420.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";

    // Change the font color for the title
    const titleElement = document.querySelector('h1');
    if (titleElement) {
        titleElement.style.color = 'white';
    }
    // Check authentication and fetch tracks
    checkAuthentication();
    fetchTracks();
});

document.addEventListener('DOMContentLoaded', checkAuthentication);

async function fetchTracks() {
    const accessToken = getAccessToken();
    const spinner = document.getElementById('spinner');

    if (!accessToken) {
        document.getElementById('error-message').innerText = 'Error: Access token not found in the URL.';
        return;
    }

    try {
        spinner.style.display = 'block';
        const response = await fetch(`/top-tracks?access_token=${accessToken}`);

        if (!response.ok) {
            const errorData = await response.json();
            document.getElementById('error-message').innerText = `Error: ${errorData.error || 'An unknown error occurred.'}`;
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const trackData = await response.json();
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
    d3.select("#chart").selectAll("*").remove();

    console.log("Fetched data:", data);

    const width = window.innerWidth;
    const height = window.innerHeight;

    const planetColors = ["#f75", "#b9e", "#72e", "#3a0", "#436"];

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const artistData = d3.groups(data, d => d.artists[0].name)
        .map(([key, values]) => ({
            key,
            value: {
                avgPopularity: d3.mean(values, d => d.popularity),
                avgDuration: d3.mean(values, d => d.duration_ms),
                count: values.length
            }
        }));

    const topArtists = artistData.sort((a, b) => b.value.count - a.value.count).slice(0, 10);
    console.log('Top artists data:', topArtists);

    const minSize = 30;
    const maxSize = 130;

    // Create a group for each planet and place it in a fixed position
    const groups = svg.selectAll(".planet-group")
        .data(topArtists)
        .enter()
        .append("g")
        .attr("class", "planet-group")
        .attr("transform", (d, i) => {
            const x = (i + 1) * 150; // Spacing planets horizontally
            const y = height / 2 + Math.sin(i) * 100; // Random vertical positioning
            return `translate(${x}, ${y})`;
        });

    // Add planets (circles)
    groups.append("circle")
        .attr("r", d => {
            const radius = minSize + ((d.value.count / 10) * (maxSize - minSize));
            return radius;
        })
        .attr("fill", (d, i) => planetColors[i % planetColors.length])
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("class", "rotating-planet"); // Add the rotating class for animation

    // Add labels
    groups.append("text")
        .attr("y", 5)
        .attr("text-anchor", "middle")
        .text(d => d.key)
        .style("font-size", "12px")
        .style("fill", "white");

    // Call the function to animate planets (floating and rotating around themselves)
    animatePlanets(groups);
}

// Function to animate planets: rotation and floating
function animatePlanets(groups) {
    groups.selectAll("circle")
        .each(function(d, i) {
            const circle = d3.select(this);

            // Floating effect (move up and down around the planet's center)
            function floatPlanet() {
                circle.transition()
                    .duration(3000) // Floating duration
                    .ease(d3.easeSinInOut)
                    .attr("transform", "translateY(-10px)") // Move up
                    .transition()
                    .duration(3000) // Move down
                    .ease(d3.easeSinInOut)
                    .attr("transform", "translateY(10px)")
                    .transition() // Reset the position
                    .duration(3000)
                    .ease(d3.easeSinInOut)
                    .attr("transform", "translateY(0)")
                    .on("end", floatPlanet); // Loop the floating animation
            }

            // Rotation around the planet's own center
            function rotatePlanet() {
                circle.transition()
                    .duration(5000) // 5 seconds for a full rotation
                    .ease(d3.easeLinear)
                    .attrTween("transform", function() {
                        return function(t) {
                            const angle = t * 360; // Rotate 360 degrees
                            return `rotate(${angle})`; // Rotate around the center of each planet
                        };
                    })
                    .on("end", rotatePlanet); // Infinite rotation
            }

            // Start both floating and rotation animations
            floatPlanet();
            rotatePlanet();
        });
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
        trackList.appendChild(artistItem);

        const trackTitles = document.createElement('ul');
        artist.value.tracks.forEach(track => {
            const trackItem = document.createElement('li');
            trackItem.textContent = track;
            trackItem.style.color = 'blue';
            trackTitles.appendChild(trackItem);
        });
        trackList.appendChild(trackTitles);
    });
}