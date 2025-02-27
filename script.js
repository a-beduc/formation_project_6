/**
 * GLOBAL VARIABLES
 */

const baseUrl = 'http://127.0.0.1:8000/api/v1/';
const titlesUrl = `${baseUrl}titles/`;
const genresUrl = `${baseUrl}genres/`;

// Log the state of the 'categoryMovie__button', false will hide the movieCards, true will display them.
const showMoreStates = {
    '.categoryMovie__container.box-1': false,
    '.categoryMovie__container.box-2': false,
    '.categoryMovie__container.box-3': false,
    '.categoryMovie__container.box-4': false,
    '.categoryMovie__container.box-5': false,
};

let currentBreakpoint = getBreakpoint(window.innerWidth);

/**
 * Determine the size of the screen and attribute it a keyword ('small', 'medium', 'large')
 * @param {number} width - width of window in pixel
 * @returns {string}
 */
function getBreakpoint(width) {
    if (width < 600) {
        return 'small'
    } else if (width < 992) {
        return 'medium'
    } else {
        return 'large'
    }
}

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

    let buttonInnerText
    if (!showMoreStates[containerDivClass]) {
        buttonInnerText = 'Voir plus';
        } else {
        buttonInnerText = 'Voir moins';
    }
    // Add a "Voir plus" button
    moviesContainer.innerHTML += `
            <button
                class="categoryMovie__button" 
                onclick="displayMoreMovie('${containerDivClass}')">
            ${buttonInnerText}
            </button>
    `;

    updateCategoryDisplay(containerDivClass);
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
 * Modify the state of the Button of the target container, update the display of associated movies cards.
 * @param {string} containerSelector - class to identify a container
 */
function displayMoreMovie(containerSelector) {
    const container = document.querySelector(containerSelector);
    const categoryButton = container.querySelector('.categoryMovie__button');
    if (!showMoreStates[containerSelector]) {
        showMoreStates[containerSelector] = true;
        categoryButton.textContent = 'Voir moins';
    } else {
        showMoreStates[containerSelector] = false;
        categoryButton.textContent = 'Voir plus';
    }
    updateCategoryDisplay(containerSelector);
}

/**
 * Update the display of cards in a container depending on window size and showMortState
 * @param {string} containerSelector - class to identify a container
 */
function updateCategoryDisplay(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const movieCards = container.querySelectorAll('.movieCard');
    let cardsToShow;

    if (showMoreStates[containerSelector]) {
        cardsToShow = 6;
    } else {
        if (window.innerWidth > 992) {
            cardsToShow = 6;
        } else if (window.innerWidth > 600) {
            cardsToShow = 4;
        } else {
            cardsToShow = 2;
        }
    }

    movieCards.forEach((card, index) => {
        if (index < cardsToShow) {
            card.classList.remove("movieCard__hidden");
        } else {
            card.classList.add("movieCard__hidden");
        }
    });
}

/**
 * React to the resizing of the window, and adapt cards displays if the resize reach a breakpoint.
 */
window.addEventListener("resize", function() {
    const newBreakpoint = getBreakpoint(window.innerWidth);
    if (newBreakpoint !== currentBreakpoint) {
        currentBreakpoint = newBreakpoint;
        for (let containerSelector in showMoreStates) {
            updateCategoryDisplay(containerSelector);
        }
    }
});


// Initial calls to display movies
displayBestMovie();
displayMoviesByGenre('.categoryMovie__container.box-1', '')
displayMoviesByGenre('.categoryMovie__container.box-2', 'romance')
displayMoviesByGenre('.categoryMovie__container.box-3', 'fantasy')

createSelectGenreList('movie-choice-1', 'Action', '.categoryMovie__container.box-4');
createSelectGenreList('movie-choice-2', 'Animation', '.categoryMovie__container.box-5');
