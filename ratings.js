// ratings.js - Campus Rate ratings page
// Load this file at the very bottom of ratings.html, AFTER the Bootstrap script:
// <script src="ratings.js"></script>


/* ============================================================
   1. GRAB THE PAGE ELEMENTS WE NEED
   ============================================================ */
const canteenList = document.getElementById("canteenList");
const rateUsBtn = document.getElementById("rateUsBtn");
const ratingModal = document.getElementById("ratingModal");

const verificationForm = document.getElementById("verificationForm");
const ratingSection = document.getElementById("ratingSection");
const continueButton = document.getElementById("continueButton");
const submitRatingButton = document.getElementById("submitRatingButton");
const ratingMessage = document.getElementById("ratingMessage");


/* ============================================================
   2. DATA: store a total and a count for each canteen
      average = total / count
   ============================================================ */
const defaultCanteens = [
  { name: "UCU Main Canteen",       total: 0, count: 0 },
  { name: "Guild Canteen",          total: 0, count: 0 },
  { name: "Joy Canteen",            total: 0, count: 0 },
  { name: "Ebenezer Canteen",       total: 0, count: 0 },
  { name: "Delight Canteen",        total: 0, count: 0 },
  { name: "Touch of Class Canteen", total: 0, count: 0 }
];

// Use saved data if it exists, otherwise start fresh
let canteens = JSON.parse(localStorage.getItem("campusRateData")) || defaultCanteens;

// Receipt numbers that have already been used to rate
let usedReceipts = JSON.parse(localStorage.getItem("usedReceipts")) || [];

let selectedCanteen = null;   // the canteen the user clicked
let currentReceipt = "";      // the receipt number typed in the pop-up

function saveRatings() {
  localStorage.setItem("campusRateData", JSON.stringify(canteens));
  localStorage.setItem("usedReceipts", JSON.stringify(usedReceipts));
}


/* ============================================================
   3. DRAW THE CANTEEN CARDS (can be called again at any time)
   ============================================================ */
function renderCanteens() {
  canteenList.innerHTML = "";   // clear old cards

  canteens.forEach(function (c) {
    const hasRatings = c.count > 0;
    const average = hasRatings ? c.total / c.count : 0;   // the maths
    const percent = (average / 5) * 100;                  // 1 star = 20%
    const word = c.count === 1 ? "rating" : "ratings";
    const isSelected = c.name === selectedCanteen ? " selected" : "";

    const summary = hasRatings
      ? '<strong>' + average.toFixed(1) + '</strong> / 5 <span class="muted">(' + c.count + ' ' + word + ')</span>'
      : '<span class="muted">No ratings yet</span>';

    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";
    col.innerHTML =
      '<div class="canteen-card' + isSelected + '" data-canteen="' + c.name + '">' +
        '<h5>' + c.name + '</h5>' +
        '<div class="avg-stars">★★★★★<span class="avg-stars-fill" style="width:' + percent + '%">★★★★★</span></div>' +
        '<p>' + summary + '</p>' +
      '</div>';
    canteenList.appendChild(col);
  });

  // Cards were rebuilt, so attach the click behaviour again
  const canteenCards = document.querySelectorAll(".canteen-card");
  canteenCards.forEach(function (card) {
    card.addEventListener("click", function () {
      canteenCards.forEach(function (x) { x.classList.remove("selected"); });
      card.classList.add("selected");
      selectedCanteen = card.dataset.canteen;
      rateUsBtn.disabled = false;
      document.getElementById("ratingModalLabel").textContent = "Rate " + selectedCanteen;
    });
  });
}

renderCanteens();   // draw the cards when the page first loads


/* ============================================================
   4. STARS: make them clickable (runs once, when the page loads)
   ============================================================ */
document.querySelectorAll(".star-rating").forEach(function (group) {
  const stars = group.querySelectorAll(".star");
  const ratingInput = group.querySelector('input[type="hidden"]');

  stars.forEach(function (star) {
    star.addEventListener("click", function () {
      const selectedRating = Number(star.dataset.value);

      // Store the selected rating
      ratingInput.value = selectedRating;

      // Colour the selected stars yellow
      stars.forEach(function (otherStar) {
        if (Number(otherStar.dataset.value) <= selectedRating) {
          otherStar.classList.add("selected");
        } else {
          otherStar.classList.remove("selected");
        }
      });
    });
  });
});


/* ============================================================
   5. CONTINUE BUTTON: move from verification to the questions
   ============================================================ */
continueButton.addEventListener("click", function () {

  // Check that both required fields have been filled in
  if (!verificationForm.checkValidity()) {
    verificationForm.reportValidity();
    return;
  }

  // Stop the same receipt being used twice
  const receipt = document.getElementById("receiptNumber").value.trim().toLowerCase();
  if (usedReceipts.includes(receipt)) {
    alert("This receipt has already been used to leave a rating.");
    return;
  }
  currentReceipt = receipt;

  // Hide the verification form, show the rating questions
  verificationForm.style.display = "none";
  ratingSection.style.display = "block";
});


/* ============================================================
   6. SUBMIT BUTTON: add the rating and update the averages
   ============================================================ */
submitRatingButton.addEventListener("click", function () {

  // Get the ratings for all four questions
  const ratingInputs = document.querySelectorAll(".star-rating input[type='hidden']");

  // Check every question is rated, and add the scores up
  let sum = 0;
  for (const input of ratingInputs) {
    if (input.value === "") {
      ratingMessage.textContent = "Please rate all four questions before submitting.";
      return;
    }
    sum += Number(input.value);
  }

  const submissionScore = sum / 4;   // this person's overall score

  // Find the chosen canteen and add the rating to it
  const canteen = canteens.find(function (c) { return c.name === selectedCanteen; });
  canteen.total += submissionScore;
  canteen.count += 1;

  // Remember this receipt so it cannot be used again
  usedReceipts.push(currentReceipt);

  saveRatings();       // keep everything after a refresh
  renderCanteens();    // redraw the cards with the new average

  ratingMessage.textContent =
    "Thank you! Your rating has been submitted successfully. We appreciate your feedback.";

  // Prevent another submission
  submitRatingButton.disabled = true;
});


/* ============================================================
   7. RESET THE POP-UP whenever it is closed
      (hidden.bs.modal is an event Bootstrap fires on close)
   ============================================================ */
ratingModal.addEventListener("hidden.bs.modal", function () {
  verificationForm.reset();                    // clear reg + receipt number
  verificationForm.style.display = "block";    // show stage 1 again
  ratingSection.style.display = "none";        // hide stage 2

  document.querySelectorAll(".star-rating input[type='hidden']").forEach(function (i) {
    i.value = "";
  });
  document.querySelectorAll(".star").forEach(function (s) {
    s.classList.remove("selected");
  });

  document.getElementById("ratingComment").value = "";
  ratingMessage.textContent = "";
  submitRatingButton.disabled = false;
  currentReceipt = "";
});