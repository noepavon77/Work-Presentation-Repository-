document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("input");
    const searchButton = document.getElementById("searchButton");
    const dropdown = document.getElementById("dropdown");
    const suggestion = document.getElementById("suggestion");
    const results = document.getElementById("results");

    let selectedIndex = -1;
    let artists = [];
    let words = [];

    input.setAttribute("autocomplete", "off");

    fetch('data.json')
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                return response.json();
            } else {
                throw new Error('Expected JSON, but got ' + contentType);
            }
        })
        .then(data => {
            artists = data;
            words = getWordsFromArtists(data);
            displayAlbums(data);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });

    function clearResults() {
        results.innerHTML = "";
        results.style.display = "none";
    }

    function clearSuggestion() {
        suggestion.innerHTML = "";
        suggestion.style.display = "none";
    }

    function clearDropdown() {
        dropdown.innerHTML = "";
        dropdown.classList.remove("show");
        selectedIndex = -1;
    }

    function getWordsFromArtists(data) {
        let words = [];
        data.forEach(artist => {
            words.push(artist.name.toLowerCase());
            artist.albums.forEach(album => {
                words.push(album.title.toLowerCase());
                album.songs.forEach(song => {
                    words.push(song.title.toLowerCase());
                });
            });
        });
        return words;
    }

    input.addEventListener("input", (e) => {
        clearDropdown();
        clearResults();

        const query = input.value.toLowerCase().trim();

        if (query.length === 0) {
            clearSuggestion();
            return;
        }
        const regex = new RegExp("^" + query, "i");
        const matches = words.filter(word => regex.test(word) && word !== query);

        if (matches.length > 0) {
            const closestMatch = matches[0];
            const highlightedSuggestion = closestMatch.substring(query.length);
            suggestion.innerHTML = highlightedSuggestion;
            suggestion.style.display = "block";
            showDropdown(matches);
        } else {
            clearSuggestion();
        }
    });

    function showDropdown(matches) {
        dropdown.innerHTML = "";
        matches.forEach((word) => {
            const item = document.createElement("div");
            item.classList.add("dropdown-item");
            item.textContent = word;
            item.addEventListener("click", () => {
                input.value = word;
                clearSuggestion();
                clearDropdown();
            });
            dropdown.appendChild(item);
        });
        dropdown.classList.add("show");
    }

    input.addEventListener("keydown", (e) => {
        const items = document.querySelectorAll(".dropdown-item");

        if (e.keyCode === 40 || e.keyCode === 38) { // Arrow down or up
            e.preventDefault();
            selectedIndex = (e.keyCode === 40) ? (selectedIndex + 1) % items.length : (selectedIndex - 1 + items.length) % items.length;
            updateActiveItem(items);
            clearSuggestion();
            if (items[selectedIndex]) {
                input.value = items[selectedIndex].textContent;
                items[selectedIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        } else if (e.keyCode === 13) { // Enter
            e.preventDefault();
            if (selectedIndex > -1 && items[selectedIndex]) {
                input.value = items[selectedIndex].textContent;
                clearSuggestion();
                clearDropdown();
            } else if (suggestion.textContent !== "") {
                input.value += suggestion.textContent.trim();
                clearSuggestion();
                clearDropdown();
            }
            searchButton.click();
        } else if (e.keyCode === 39) { // Arrow right
            e.preventDefault();
            if (suggestion.textContent !== "") {
                input.value += suggestion.textContent.trim();
                clearSuggestion();
                clearDropdown();
            }
        }
    });

    function updateActiveItem(items) {
        items.forEach((item, index) => {
            item.classList.toggle("active", index === selectedIndex);
        });
    }

    function performSearch(query) {
        clearResults();

        if (query.length === 0) {
            results.innerHTML = "Please enter a valid search query.";
            results.style.display = "block";
            return;
        }

        let foundArtist = artists.find(artist => artist.name.toLowerCase() === query);
        if (foundArtist) {
            displayArtistInfo(foundArtist);
            return;
        }

        let foundAlbum = findAlbum(query);
        if (foundAlbum) {
            displayAlbumInfo(foundAlbum);
            return;
        }

        let foundSong = findSong(query);
        if (foundSong) {
            displaySongInfo(foundSong);
            return;
        }

        results.innerHTML = "No results found.";
        results.style.display = "block";
    }

    function findSong(query) {
        for (let artist of artists) {
            for (let album of artist.albums) {
                let foundSong = album.songs.find(song => song.title.toLowerCase() === query);
                if (foundSong) {
                    return { artist: artist.name, album: album, song: foundSong };
                }
            }
        }
        return null;
    }

    function findAlbum(query) {
        for (let artist of artists) {
            let foundAlbum = artist.albums.find(album => album.title.toLowerCase() === query);
            if (foundAlbum) {
                return { artist: artist.name, album: foundAlbum };
            }
        }
        return null;
    }

    function displayArtistInfo(artist) {
        let albumsHtml = artist.albums.map(album => `
            <div class="album-detail-info">
                <h3>${album.title}</h3>
                <img class="description-album img" src="${album.coverImage}" alt="${album.title}">
                <p class="description-album">${album.description}</p>
                <h4>Songs:</h4>
                <ul class="album-detail-ul">
                    ${album.songs.map(song => `
                        <li class="album-detail-li">
                            <span class="album-detaili-span">${song.title}</span>
                            <audio controls>
                                <source class="album-detail-audio" type="audio/mpeg">
                                Your browser does not support the audio element.
                            </audio>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');

        results.innerHTML = `
            <h2>${artist.name}</h2>
            <img class="circular-image" src="${artist.image}" alt="${artist.name}">
            <div class="album-container-info">${albumsHtml}</div>
        `;

        results.style.display = "block";
    }

    function displaySongInfo(song) {
        results.innerHTML = `
        <div class= "album-container-song">
            <h2>${song.song.title}</h2>
            <p>Artist: ${song.artist}</p>
            <p>Album: ${song.album.title}</p>
            <audio controls>
                <source type="audio/mpeg">
                Your browser does not support the audio element.
            </audio> </div>
        `;
        results.style.display = "block";
    }

    function displayAlbumInfo(album) {
        let songsHtml = album.album.songs.map(song => 
            `<li class="album-detail-li">
                <span class="album-detail-li-span">${song.title}</span>
                <audio controls>
                    <source src=" " type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </li>`
        ).join('');

        results.innerHTML = `
            <h2>${album.album.title}</h2>
            <p>Artist: ${album.artist}</p>
            <img class="image-albumn" src="${album.album.coverImage}" alt="${album.album.title}">
            <p class="description-album">${album.album.description}</p>
            <h4>Songs:</h4>
            <div class="description-album">
            <ul class="album-detail-ul">${songsHtml}</ul></div>
        `;
        results.style.display = "block";
    }

    function displayAlbums(data) {
        const albumGrid = document.getElementById('album-grid');
        albumGrid.innerHTML = ''; // Clear previous content
        data.forEach(artist => {
            artist.albums.forEach(album => {
                const albumItem = document.createElement('div');
                albumItem.classList.add('album-item');
                albumItem.innerHTML = `
                    <img src="${album.coverImage}" alt="${album.title}">
                    <h3>${album.title}</h3>
                    <p>Artist: ${artist.name}</p>
                    <button class="more" id= "more_id">More</button>
                `;
                albumGrid.appendChild(albumItem);
            });
        });
    }

    searchButton.addEventListener("click", () => {
        clearSuggestion();
        clearDropdown();    
        const query = input.value.toLowerCase().trim();
        performSearch(query);
    });

    input.addEventListener("click", () => {
        clearSuggestion();
        clearDropdown();    
    });

    document.addEventListener("click", (e) => {
        if (!e.target.matches("#input") && !e.target.matches(".dropdown-item")) {
            clearDropdown();
        }
    });

    input.addEventListener("focus", () => {
        clearSuggestion();
        clearDropdown();
    });

    dropdown.addEventListener("mouseover", (e) => {
        clearSuggestion();
        const target = e.target;
        if (target.classList.contains("dropdown-item")) {
            input.value = target.textContent.trim();
        }
    });
});
