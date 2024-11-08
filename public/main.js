
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

    console.log("Fetched data:", data); // Verify data received

    const width = window.innerWidth;
    const height = window.innerHeight;

    const planetColors = ["#f75", "#b9e", "#72e", "#3a0", "#436"];

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Aggregate data by artist
    const artistData = d3.groups(data, d => d.artists[0].name)
        .map(([key, values]) => ({
            key,
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
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(topArtists, d => d.value.avgDuration))
        .range([height - 50, 50]);

    const minSize = 5;
    const maxSize = 100;

    svg.selectAll("circle")
        .data(topArtists)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.value.avgPopularity))
        .attr("cy", d => yScale(d.value.avgDuration))
        .attr("r", d => {
            const radius = minSize + ((d.value.avgPopularity / 100) * (maxSize - minSize));
            return radius;
        })
        .attr("fill", (d, i) => planetColors[i % planetColors.length])
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    svg.selectAll(".artist-label")
        .data(topArtists)
        .enter()
        .append("text")
        .attr("class", "artist-label")
        .attr("x", d => xScale(d.value.avgPopularity))
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
                count: values.length
            }
        }));

    // Sort artists by the number of tracks and take the top 10
    const topArtists = artistData.sort((a, b) => b.value.count - a.value.count).slice(0, 10);

    topArtists.forEach(artist => {
        const artistItem = document.createElement('div');
        artistItem.textContent = `${artist.key} (${artist.value.count} tracks)`;
        trackList.appendChild(artistItem);
    });
}

function playMusic(){
    soundFile.currentTime = 0.01
    soundFile.volume = volume;     
  }