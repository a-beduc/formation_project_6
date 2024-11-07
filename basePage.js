const baseUrl = 'http://127.0.0.1:8000/api/v1/titles/'

async function getRequestFromUrl(url) {
    if (url) {
        const response = await fetch(url);
        return await response.json();
    }
    return null;
}

async function getMovieData(id) {
    const url = baseUrl + id;
    return await getRequestFromUrl(url);
}

async function displayBestMovie() {
    const url = `${baseUrl}?sort_by=-imdb_score`;
    const bestMovies = await getRequestFromUrl(url);
    const bestMovieData = await getMovieData(bestMovies.results[0].id);
    const bestMovieBox = document.querySelector(".best-movie-box");
    bestMovieBox.innerHTML = `
                <div class="image-container">
                    <img src="${bestMovieData.image_url}">
                </div>
                <div class="text-container">
                    <h1>${bestMovieData.title}</h1>
                    <p>${bestMovieData.long_description}</p>
                    <button>Détails</button>
                </div>
    `
}

displayBestMovie();

async function getBestSixMoviesArray(genre = "") {
    const url = `${baseUrl}?sort_by=-imdb_score&genre=${genre}`
    const firstPage = await getRequestFromUrl(url);
    const secondPage = await getRequestFromUrl(firstPage.next);
    return firstPage.results.concat(secondPage.results[0]);
}

async function displayMoviesByGenre(containerSelector, genre = "") {

    const topMovies = await getBestSixMoviesArray(genre);

    const moviesContainer = document.querySelector(containerSelector);
    moviesContainer.innerHTML = '';

    for (let i = 0; i < topMovies.length; i++) {
        const movie = topMovies[i];
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.innerHTML = `
            <img src="${movie.image_url}" alt="${movie.title}">
            <div class="movie-card-overlay">
                <h2>${movie.title}</h2>
                <button onclick="showMovieDetails(${movie.id})">Détails</button>
            </div>
        `;
        moviesContainer.appendChild(movieCard);
    }
}

displayMoviesByGenre('.cat-box.box-1', '')
displayMoviesByGenre('.cat-box.box-2', 'romance')
displayMoviesByGenre('.cat-box.box-3', 'fantasy')

async function getAllGenre() {
    const genresUrl = "http://127.0.0.1:8000/api/v1/genres/"
    let dataGenres = []
    let currentPageGenre = await getRequestFromUrl(genresUrl);
    while (currentPageGenre !== null) {
        dataGenres = dataGenres.concat(currentPageGenre.results);
        if (currentPageGenre.next) {
            currentPageGenre = await getRequestFromUrl(currentPageGenre.next);
        } else {
            currentPageGenre = null;
        }
    }
    return dataGenres;
}

async function createSelectGenreList(containerID) {
    const arrayOfGenre = await getAllGenre();
    const genreSelectorList = document.getElementById(containerID);
    genreSelectorList.innerHTML = '';
    for (let i = 0; i < arrayOfGenre.length; i++) {
        const genre = arrayOfGenre[i];
        const genreSelector = document.createElement('option');
        genreSelector.textContent = genre.name;
        genreSelectorList.appendChild(genreSelector);
    }
}

createSelectGenreList('movie-choice-1');
createSelectGenreList('movie-choice-2');

