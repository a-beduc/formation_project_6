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
                    <img src="${bestMovieData.image_url}" alt="image of ${bestMovieData.title}" onerror="this.src='assets/img_default.jpg';">
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
    let movies = firstPage.results;

    if (firstPage.next) {
        const secondPage = await getRequestFromUrl(firstPage.next);
        movies = firstPage.results.concat(secondPage.results[0]);}
    return movies;
}

async function displayMoviesByGenre(containerDivClass, genre = "") {

    const topMovies = await getBestSixMoviesArray(genre);

    const moviesContainer = document.querySelector(containerDivClass);
    moviesContainer.innerHTML = '';

    for (let i = 0; i < topMovies.length; i++) {
        const movie = topMovies[i];
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.innerHTML = `
            <img src="${movie.image_url}" alt="${movie.title}" alt="image of ${movie.title}" onerror="this.src='assets/img_default.jpg';">
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

async function createSelectGenreList(selectorID, containerDivClass) {
    const arrayOfGenre = await getAllGenre();
    const genreSelectorList = document.getElementById(selectorID, );
    genreSelectorList.innerHTML = '';
    for (let i = 0; i < arrayOfGenre.length; i++) {
        const genre = arrayOfGenre[i];
        const genreSelector = document.createElement('option');
        genreSelector.textContent = genre.name;
        genreSelectorList.appendChild(genreSelector);
    }
    genreSelectorList.value = "Action";
    displayMoviesByGenre(containerDivClass, 'Action')

    genreSelectorList.addEventListener('change', (e) => {
        const selectedGenre = e.target.value;
        console.log(selectedGenre);
        displayMoviesByGenre(containerDivClass, selectedGenre);
    })
}

createSelectGenreList('movie-choice-1', '.cat-box.box-4');
createSelectGenreList('movie-choice-2', '.cat-box.box-5');

const modal = document.getElementById("movieModal");
let modalOpen = false;


async function showMovieDetails(movieID) {
    const movieData = await getMovieData(movieID)
    let modalBody = document.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="modal-block-1">
            <h1>${movieData.title}</h1>
            <h2>${movieData.year} - ${movieData.genres.join(", ")}</h2>
            <h2>A définir - ${movieData.duration} minutes - (${movieData.countries.join(" / ")})</h2>
            <h2>IMDB score: ${movieData.imdb_score}/10</h2>
            <br>
            <p><strong>Réalisé par:</strong></p>
            <p>${movieData.directors.join(", ")}</p>
        </div>
        <div class="modal-block-2">
            <img src=${movieData.image_url} alt="image of ${movieData.title}" onerror="this.src='assets/img_default.jpg';">
        </div>
        <div class="modal-block-3">
            <p>${movieData.long_description}</p>
        </div>
        <div class="modal-block-4">
            <p><strong>Avec:</strong></p>
            <p>${movieData.actors.join(", ")}</p>
        </div>
        <button class="button-close">Fermer</button>
    `;
    const closeModalButton = document.querySelector(".button-close");
    modal.style.display = 'flex';
    modalOpen = true;

    closeModalButton.addEventListener("click", () => {
        modal.style.display = "none";
        modalOpen = false;
    })

}

window.addEventListener("click", (event) => {
    if (event.target === modal && modalOpen) {
        modal.style.display = "none";
        modalOpen = false;
    }
})
