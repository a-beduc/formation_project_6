/**
 * GLOBAL VARIABLES
 */

const baseUrl = 'http://127.0.0.1:8000/api/v1/';
const titlesUrl = `${baseUrl}titles/`
const genresUrl = `${baseUrl}genres/`

/**
 * Fetch data from an API and return a JSON.
 * @param {string} url
 * @returns {Promise<null|Object>}
 */
async function getRequestFromUrl(url) {
    if (url) {
        const response = await fetch(url);
        return await response.json();
    }
    return null;
}

/**
 * Get the data of a movie from its ID.
 * @param {number} id - The movie ID.
 * @returns {Promise<Object>}
 */
async function getMovieData(id) {
    const url = titlesUrl + id;
    return await getRequestFromUrl(url);
}

/**
 * Display the movie with the highest IMDB score from the API in the .bestMovie__box container.
 * @returns {Promise<void>}
 */
async function displayBestMovie() {
    // Get a list of movies sorted by their IMDB score
    const url = `${titlesUrl}?sort_by=-imdb_score`;
    const bestMovies = await getRequestFromUrl(url);

    // Get a JSON containing the best movie data
    const bestMovieData = await getMovieData(bestMovies.results[0].id);

    // Format and present the data of the selected movie in the DOM
    const bestMovieBox = document.querySelector(".bestMovie__box");
    bestMovieBox.innerHTML = `
                <div class="bestMovie__box__image">
                    <img src="${bestMovieData.image_url}" alt="image of ${bestMovieData.title}" onerror="this.src='images/img_default.jpg';">
                </div>
                <div class="bestMovie__box__content">
                    <h2 class="bestMovie__title">${bestMovieData.title}</h2>
                    <p class="bestMovie__description">${bestMovieData.long_description}</p>
                    <button onclick="showMovieDetails(${bestMovieData.id})">Détails</button>
                </div>
    `
}

/**
 * Get the top six movies from an url (can be filtered by their genre)
 * @param {string} [genre=""] - Movie genre ex. "romance"
 * @returns {Promise<Object>}
 */
async function getBestSixMoviesArray(genre= "") {
    // Get a list of movies sorted by their IMDB score
    const url = `${titlesUrl}?sort_by=-imdb_score&genre=${genre}`
    const firstPage = await getRequestFromUrl(url);

    // Save the movies data of the first page in a variable (Between 1 and 5 movie(s) per page)
    let movies = firstPage.results;

    // Check if the API has a second page, if it does get the first movie of the second page
    if (firstPage.next) {
        const secondPage = await getRequestFromUrl(firstPage.next);
        movies = firstPage.results.concat(secondPage.results[0]);
    }
    return movies;
}

/**
 * Display up to six movies with the highest IMDB score of a category in a container.
 * @param {string} containerDivClass
 * @param {string} [genre=""]
 * @returns {Promise<void>}
 */
async function displayMoviesByGenre(containerDivClass, genre = "") {
    // Get the data of the six best movies, store it in an array
    const topMovies = await getBestSixMoviesArray(genre);

    // Select the container in the DOM and empty it
    const moviesContainer = document.querySelector(containerDivClass);
    moviesContainer.innerHTML = ``;

    // Create "cards" for every movie in the topMovies array
    for (let i = 0; i < topMovies.length; i++) {
        const movie = topMovies[i];
        const movieCard = document.createElement('div');
        movieCard.classList.add('movieCard');
        movieCard.innerHTML = `
            <img    class="movieCard__img" 
                    src="${movie.image_url}" 
                    alt="${movie.title}" alt="image of ${movie.title}" 
                    onerror="this.src='images/img_default.jpg';">
            <div class="movieCard__overlay">
                <h2 class="movieCard__title">${movie.title}</h2>
                <button class="movieCard__button" 
                        onclick="showMovieDetails(${movie.id})">
                    Détails
                </button>
            </div>
        `;
        moviesContainer.appendChild(movieCard);
    }

    // Add a "Voir plus" button
    moviesContainer.innerHTML += `
        <button class="categoryMovie__button" 
                onclick="displayMoreMovie('${containerDivClass}')">
            Voir plus
        </button>
    `;
}

/**
 * Create an array with every genre found in the database.
 * @returns {Promise<*[]>}
 */
async function getAllGenre() {
    let dataGenres = []
    let currentPageGenre = await getRequestFromUrl(genresUrl);

    // Get datas from every pages
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

/**
 * Create and initialise a <select> element that display the best movies of the selected categories.
 * @param {string} selectorID - ID of the <select> element
 * @param {string} initial_genre
 * @param {string} containerDivClass - Class name of the container for the associated movies
 * @returns {Promise<void>}
 */
async function createSelectGenreList(selectorID, initial_genre, containerDivClass) {
    const arrayOfGenre = await getAllGenre();

    // Select the container in the DOM and empty it
    const genreSelectorList = document.getElementById(selectorID);
    genreSelectorList.innerHTML = ``;

    // Create the list of options for categories of movies
    for (let i = 0; i < arrayOfGenre.length; i++) {
        const genre = arrayOfGenre[i];
        const genreSelector = document.createElement('option');
        genreSelector.value = genre.name;
        genreSelector.textContent = genre.name;
        genreSelectorList.appendChild(genreSelector);
    }

    // Initialise the container with a default category
    genreSelectorList.value = initial_genre;
    await displayMoviesByGenre(containerDivClass, initial_genre)

    // Handle the change of categories in the <select> element
    genreSelectorList.addEventListener('change', (e) => {
        const selectedGenre = e.target.value
        displayMoviesByGenre(containerDivClass, selectedGenre);
    })
}


/**
 * Handle the display and the content of the modal for a specific movie
 * @param {number} movieID
 * @returns {Promise<void>}
 */
async function showMovieDetails(movieID) {
    const movieData = await getMovieData(movieID)
    let modal = document.querySelector('.modal');

    // Generate the HTML modal element
    modal.innerHTML = `
    <div class="modal__content">
        <div class="modal__body">
            <div class="modal__body__blockTitle">
                <h2>${movieData.title}</h2>
                <h3>${movieData.year} - ${movieData.genres.join(", ")}</h3>
                <h3>${movieData.rated} - ${movieData.duration} minutes - (${movieData.countries.join(" / ")})</h3>
                <h3>IMDB score: ${movieData.imdb_score}/10</h3>
                <br>
                <p class="modal__body__strong">Réalisé par:</p>
                <p>${movieData.directors.join(", ")}</p>
            </div>
            <div class="modal__body__blockImage">
                <img src=${movieData.image_url} alt="image of ${movieData.title}" onerror="this.src='images/img_default.jpg';">
            </div>
            <div class="modal__body__blockDescription">
                <p>${movieData.long_description}</p>
            </div>
            <div class="modal__body__blockActor">
                <p class="modal__body__strong">Avec:</p>
                <p>${movieData.actors.join(", ")}</p>
            </div>
            <button class="modal__body__closeButton">Fermer</button>
        </div>
    </div>
    `;

    // Create a button to close the modal.
    const closeModalButton = document.querySelector(".modal__body__closeButton");
    closeModalButton.addEventListener("click", () => {
        modal.style.display = "none";
        modal.innerHTML = ``
    })

    // Close the modal when you click outside the content window
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
            modal.innerHTML = ``;
        }
    })

    // Display the modal
    modal.style.display = 'flex';
}


/**
 *
 * @param {string} containerDivClass
 * @returns
 */
function displayMoreMovie(containerDivClass) {
    let numberElements = 0;
    if (Math.min(screen.width, window.innerWidth) > 600) {
        numberElements = 2;
    }
    const parentContainer = document.querySelector(containerDivClass);
    const button = parentContainer.querySelector('.categoryMovie__button');
    const MovieCards = parentContainer.querySelectorAll('.movieCard');

    if (button.textContent === 'Voir plus') {
        revealHiddenMovie(MovieCards)
        button.textContent = 'Voir moins';
    } else {
        for (let i = numberElements + 2;  i < MovieCards.length; i++) {
            MovieCards[i].style.display = 'none';
        }
        button.textContent = 'Voir plus';
    }
}

function revealHiddenMovie(listMovieCard) {
    for (let i = 0; i < listMovieCard.length; i++) {
        if (window.getComputedStyle(listMovieCard[i]).display === 'none') {
           listMovieCard[i].style.display = 'grid';
        }
    }
}

/**
 * Event listener for window resize:
 */
window.addEventListener("resize", function() {
    const everyMovieCard = document.querySelectorAll('.movieCard');
    if(window.innerWidth > 992) {
        for (let i = 0; i < everyMovieCard.length; i++) {
            if (everyMovieCard[i].style.display === 'none') {
                everyMovieCard[i].style.display = 'grid';
            }
        }
    }
})

// Initial calls to display movies
displayBestMovie();
displayMoviesByGenre('.categoryMovie__container.box-1', '')
displayMoviesByGenre('.categoryMovie__container.box-2', 'romance')
displayMoviesByGenre('.categoryMovie__container.box-3', 'fantasy')

createSelectGenreList('movie-choice-1', 'Action', '.categoryMovie__container.box-4');
createSelectGenreList('movie-choice-2', 'Animation', '.categoryMovie__container.box-5');
