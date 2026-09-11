// =========================
// FIREBASE
// =========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHMFscEo1aNJREp3kc-vhPLv4DAbW9TYw",
  authDomain: "cpec-times.firebaseapp.com",
  databaseURL: "https://cpec-times-default-rtdb.firebaseio.com",
  projectId: "cpec-times",
  storageBucket: "cpec-times.firebasestorage.app",
  messagingSenderId: "12698513478",
  appId: "1:12698513478:web:1439520bd2c51651135a47",
  measurementId: "G-LCR16ET306"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =========================
// NAVIGATION DROPDOWN
// =========================

// Opens/closes a dropdown menu when its button is clicked
function toggleDropdown(button) {

    // Find the dropdown content next to the button
    const content = button.nextElementSibling;

    // Find the arrow inside the button
    const arrow = button.querySelector(".arrow");

    // Show/hide the dropdown
    content.classList.toggle("show");

    // Rotate the arrow
    arrow.classList.toggle("rotate");
}

// =========================
// NAVIGATION BAR
// =========================

const navbar = document.getElementById("navbar");

if (navbar) {
    navbar.innerHTML = `
        <nav>

            <a href="index.html" class="logo">
                <img src="images/cpec-times-logo.png" alt="CPEC Times">
            </a>

            <a href="index.html">Home</a>

            <div class="nav-dropdown">
                <a href="weekly-news.html">Weekly News ▾</a>

                <div class="nav-dropdown-content">
                    <a href="week.html?week=week1">Aug 16 - Aug 22, 2026</a>
                </div>
            </div>

            <div class="nav-dropdown">
                <a href="articles.html"> Articles ▾</a>

                <div class="nav-dropdown-content">
                    <a href="#">Unavailable</a>
                </div>
            </div>
            <a href="clubs.html">Clubs</a>
            <a href="about.html">About</a>

        </nav>
    `;
}

// =========================
// POLL FUNCTION
// =========================

async function createPoll(pollId, answerList) {

    // Get the Firebase poll document
    const pollRef = doc(db, "polls", pollId);

    // Check if the poll already exists
    const pollSnapshot = await getDoc(pollRef);

    // Only create the poll if it doesn't exist
    if (!pollSnapshot.exists()) {

        const pollData = {};

        answerList.forEach(answer => {
            pollData[answer.trim()] = 0;
        });

        await setDoc(pollRef, pollData);

    }

}

async function votePoll(answer) {

    

    // Clicked poll answer
    const poll = answer.closest(".poll");

    // Stop if a vote is already being processed
    if (poll.dataset.voting === "true") {
        return;
    }

    // Lock the poll
    poll.dataset.voting = "true";

    const answers = poll.querySelectorAll("label");

    // Get the Firebase poll ID
    const pollId = poll.dataset.pollId;

    // Get the answer that was clicked
    const selectedAnswer =
        answer.querySelector(".poll-answer-text").textContent.trim();

    // Get the previous answer
    const previousAnswer = localStorage.getItem(`poll_${pollId}`);

    // Same answer again
    if (previousAnswer === selectedAnswer) {
        poll.dataset.voting = "false";
        return;
    }

    // Get the poll document from Firestore
    const pollRef = doc(db, "polls", pollId);

    // Get current poll data
    const pollSnapshot = await getDoc(pollRef);

    if (!pollSnapshot.exists()) {
        console.error("Poll not found in Firestore.");
        return;
    }

    const pollData = pollSnapshot.data();

    // - 1 vote to the previous answer
    if (previousAnswer) {
        pollData[previousAnswer] =
            Math.max(Number(pollData[previousAnswer] || 0) - 1, 0);
    }

    // + 1 vote to the new answer
    pollData[selectedAnswer] =
        Number(pollData[selectedAnswer] || 0) + 1;

    // Save the updated votes
    await updateDoc(pollRef, {
        [selectedAnswer]: pollData[selectedAnswer],
        ...(previousAnswer
            ? { [previousAnswer]: pollData[previousAnswer] }
            : {})
    });

    // Remember the user's vote
    localStorage.setItem(`poll_${pollId}`, selectedAnswer);

    poll.dataset.selected = selectedAnswer;

    let totalVotes = 0;

    answers.forEach(choice => {

        const choiceText =
            choice.querySelector(".poll-answer-text").textContent.trim();

        totalVotes += Number(pollData[choiceText] || 0);
    });

    // Show the percentages
    answers.forEach(choice => {

        const choiceText =
            choice.querySelector(".poll-answer-text").textContent.trim();

        const votes = Number(pollData[choiceText] || 0);

        const percentage = totalVotes === 0
            ? 0
            : Math.round((votes / totalVotes) * 100);

        const percentageText = choice.querySelector(".poll-percentage");
        percentageText.textContent = `${percentage}%`;

        // result bar
        const resultBar = choice.querySelector(".poll-result-bar");
        resultBar.style.width = `${percentage}%`;

    });

        // Unlock the poll
    poll.dataset.voting = "false";

}

async function loadPollResults(poll) {

    // Get the Firebase poll ID
    const pollId = poll.dataset.pollId;

    // Get the poll answers
    const answers = poll.querySelectorAll("label");

    // Get the poll document from Firestore
    const pollRef = doc(db, "polls", pollId);

    // Get current poll data
    const pollSnapshot = await getDoc(pollRef);

    if (!pollSnapshot.exists()) {
        console.error("Poll not found in Firestore.");
        return;
    }

    const pollData = pollSnapshot.data();

    let totalVotes = 0;

    answers.forEach(choice => {

        const choiceText =
            choice.querySelector(".poll-answer-text").textContent.trim();

        totalVotes += Number(pollData[choiceText] || 0);
    });

    // Show the percentages
    answers.forEach(choice => {

        const choiceText =
            choice.querySelector(".poll-answer-text").textContent.trim();

        const votes = Number(pollData[choiceText] || 0);

        const percentage = totalVotes === 0
            ? 0
            : Math.round((votes / totalVotes) * 100);

        const percentageText = choice.querySelector(".poll-percentage");

        // Only show percentages if there are votes
        if (totalVotes > 0) {
            percentageText.textContent = `${percentage}%`;
        }

        // result bar
        const resultBar = choice.querySelector(".poll-result-bar");
        resultBar.style.width = `${percentage}%`;

    });

    // Remember the user's previous vote
    const previousAnswer = localStorage.getItem(`poll_${pollId}`);

    if (previousAnswer) {
        poll.dataset.selected = previousAnswer;
    }

}

// =========================
// WEEKLY NEWS PAGE
// =========================

// Get the "week" from the URL
// Example: week.html?week=week3
const parameters = new URLSearchParams(window.location.search);

const selectedWeek = parameters.get("week") || "week1";


// =========================
// WEEK INFORMATION
// =========================

// Each week has:
// - a title
// - a default image
// - a text file containing the article
const weeks = {

    week1: {
        title: "Aug 16 - Aug 22, 2026",
        file: "articles/weekly-news-folder/week1.txt"
    },

};

const events = {
    event1: {
        title: "CPEC Fall Festival",
        file: "articles/events-folder/event1.txt"
    },

};

// Find the week that was selected in the URL
const currentWeek = weeks[selectedWeek];


// Find the HTML element where the article will appear
const newsEl = document.getElementById("weekly-news");


// Only run this code if:
// 1. The selected week exists
// 2. The page has a weekly-news element
if (currentWeek && newsEl) {

    // Find the title on the page and change it to the title of the selected week
    const titleEl = document.querySelector(".card h2");
    if (titleEl) titleEl.textContent = currentWeek.title;

    // =========================
    // LOAD THE TEXT FILE
    // =========================

    // Fetch the .txt file for the selected week
    fetch(currentWeek.file)

        // Convert the response into plain text
        .then(response => response.text())

        // "news" now contains everything inside the .txt file
        .then(news => {


            // =========================
            // [HEADING: text]
            // =========================

            // Find every [HEADING: text] in the text file
            // and replace it with an HTML heading
            news = news.replace(/\[HEADING: (.*?)\]/g, (match, text) => {

                // Turn the marker into an actual HTML heading
                return `<h3>${text}</h3>`;

            });

            // =========================
            // [BR]
            // =========================

            // Find every [BR] in the text file
            // and replace it with an HTML line break
            news = news.replaceAll("[BR]", "<br>");


            // =========================
            // [IMAGE: filename] + [CAPTION: text]
            // =========================
            // Find an image followed by an optional caption
            //
            // Example:
            // [IMAGE: students.jpg]
            // [CAPTION: CPEC students gather during the first week of school.]

            news = news.replace(
                /\[IMAGE: (.*?)\]\s*\[CAPTION: (.*?)\]/g,
                (match, imageName, captionText) => {

                    // Turn the image and caption into one figure
                    return `
                        <figure class="news-image">
                            <img src="images/${imageName}" alt="" class="card-image">
                            <figcaption>${captionText}</figcaption>
                        </figure>
                    `;
                }
            );


            // =========================
            // [SOURCES]
            // =========================
            // Find everything between:
            // [SOURCES]
            // and
            // [/SOURCES]

            news = news.replace(/\[SOURCES\]([\s\S]*?)\[\/SOURCES\]/g, (match, sourceContent) => {

                // Split the sources into separate lines
                const sources = sourceContent.trim().split("\n");

                // Create the Sources section
                return `
                    <div class="sources">
                        <h3>Sources</h3>
                        ${sources.map(source => `
                            <p>${source.trim()}</p>
                        `).join("")}
                    </div>
                `;
            });


            // =========================
            // [POLL]
            // =========================

            news = news.replace(/\[POLL:\s*(.*?)\]([\s\S]*?)\[\/POLL\]/g, (match, pollId, pollContent) => {

                const question = pollContent.match(/question:\s*(.*)/)[1];

                const answers = pollContent.match(/answers:\s*(.*)/)[1];

                const answerList = answers.split("|");

                createPoll(pollId, answerList);

                return `
                    <div class="poll" data-poll-id="${pollId}">

                        <h3>${question}</h3>

                        ${answerList.map(answer => `

                            <label onclick="votePoll(this)">

                                <span class="poll-answer-text">
                                    ${answer.trim()}
                                </span>

                                <div class="poll-result">
                                    <div class="poll-result-bar"></div>
                                </div>

                                <span class="poll-percentage"></span>

                            </label>

                        `).join("")}

                    </div>
                `;
            });

            // =========================
            // DISPLAY THE ARTICLE
            // =========================

            // Put all of our processed HTML onto the page
            newsEl.innerHTML = news;
            newsEl.querySelectorAll(".poll").forEach(poll => {
                loadPollResults(poll);
            });

        })


        // If something goes wrong loading the file,
        // show the error in the browser console
        .catch(error => {

            console.error("Error loading weekly news:", error);

        });

}

// =========================
// ARTICLES PAGE
// =========================

// Get the "article" from the URL
// Example: article.html?article=article1
const articleParameters = new URLSearchParams(window.location.search);
const selectedArticle = articleParameters.get("article") || "article1";

const articles = {
    article1: {
        title: "To Pound or Not to Pound?",
        file: "articles/articles-folder/article1.txt"
    }
};

// Find the article that was selected in the URL
const currentArticle = articles[selectedArticle];

// Find the HTML element where the article will appear
const articleEl = document.getElementById("article-content");

// Only run this code if:
// 1. The selected article exists
// 2. The page has an article-content element
if (currentArticle && articleEl) {

    // Find the title on the page
    const titleEl = document.getElementById("article-title");

    // Change the title to the article title
    if (titleEl) titleEl.textContent = currentArticle.title;

    // Load the text file
    fetch(currentArticle.file)

        // Convert the response into plain text
        .then(response => response.text())

        // "news" now contains everything inside the .txt file
        .then(news => {


            // =========================
            // [HEADING: text]
            // =========================

            // Find every [HEADING: text] in the text file
            // and replace it with an HTML heading
            news = news.replace(/\[HEADING: (.*?)\]/g, (match, text) => {

                // Turn the marker into an actual HTML heading
                return `<h3>${text}</h3>`;

            });

            // =========================
            // [BR]
            // =========================

            // Find every [BR] in the text file
            // and replace it with an HTML line break
            news = news.replaceAll("[BR]", "<br>");


            // =========================
            // [IMAGE: filename] + [CAPTION: text]
            // =========================
            // Find an image followed by an optional caption
            //
            // Example:
            // [IMAGE: students.jpg]
            // [CAPTION: CPEC students gather during the first week of school.]

            news = news.replace(
                /\[IMAGE: (.*?)\]\s*\[CAPTION: (.*?)\]/g,
                (match, imageName, captionText) => {

                    // Turn the image and caption into one figure
                    return `
                        <figure class="news-image">
                            <img src="images/${imageName}" alt="" class="card-image">
                            <figcaption>${captionText}</figcaption>
                        </figure>
                    `;
                }
            );


            // =========================
            // [SOURCES]
            // =========================
            // Find everything between:
            // [SOURCES]
            // and
            // [/SOURCES]

            news = news.replace(/\[SOURCES\]([\s\S]*?)\[\/SOURCES\]/g, (match, sourceContent) => {

                // Split the sources into separate lines
                const sources = sourceContent.trim().split("\n");

                // Create the Sources section
                return `
                    <div class="sources">
                        <h3>Sources</h3>
                        ${sources.map(source => `
                            <p>${source.trim()}</p>
                        `).join("")}
                    </div>
                `;
            });


            // =========================
            // [POLL]
            // =========================

            // Find everything between:
            // [POLL]
            // and
            // [/POLL]
            news = news.replace(/\[POLL:\s*(.*?)\]([\s\S]*?)\[\/POLL\]/g, (match, pollId, pollContent) => {

                const question = pollContent.match(/question:\s*(.*)/)[1];

                const answers = pollContent.match(/answers:\s*(.*)/)[1];

                const answerList = answers.split("|");

                createPoll(pollId, answerList);

                return `
                    <div class="poll" data-poll-id="${pollId}">

                        <h3>${question}</h3>

                        ${answerList.map(answer => `

                            <label onclick="votePoll(this)">

                                <span class="poll-answer-text">
                                    ${answer.trim()}
                                </span>

                                <div class="poll-result">
                                    <div class="poll-result-bar"></div>
                                </div>

                                <span class="poll-percentage"></span>

                            </label>

                        `).join("")}

                    </div>
                `;
            });


            // =========================
            // DISPLAY THE ARTICLE
            // =========================

            // Put all of our processed HTML onto the page
            articleEl.innerHTML = news;
            articleEl.querySelectorAll(".poll").forEach(poll => {
                loadPollResults(poll);
            }); 

        })


        // If something goes wrong loading the file,
        // show the error in the browser console
        .catch(error => {

            console.error("Error loading article:", error);

        });
}

window.toggleDropdown = toggleDropdown;
window.votePoll = votePoll;