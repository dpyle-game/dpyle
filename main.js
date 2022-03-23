"use strict";
function diffle(answer, guess) {
    const table = Array.from({ length: answer.length + 1 }, () => Array.from({ length: guess.length + 1 }, () => ({ cost: 0, paths: [], })));
    table[0][0] = { cost: 0, paths: [[]] };
    for (let a = 1; a < answer.length + 1; a++)
        table[a][0] = { cost: a, paths: table[a - 1][0].paths.map(x => [...x, "+"]) };
    for (let b = 1; b < guess.length + 1; b++)
        table[0][b] = { cost: b, paths: table[0][b - 1].paths.map(x => [...x, "-"]) };
    for (let a = 1; a < answer.length + 1; a++) {
        for (let b = 1; b < guess.length + 1; b++) {
            const accept = table[a - 1][b - 1].cost + (answer[a - 1] == guess[b - 1] ? 0 : Infinity);
            const insert = table[a - 1][b].cost + 1;
            const remove = table[a][b - 1].cost + 1;
            const cost = Math.min(insert, remove, accept);
            const paths = [];
            if (cost == accept)
                paths.push(...table[a - 1][b - 1].paths.map(x => [...x, ">"]));
            if (cost == insert)
                paths.push(...table[a - 1][b].paths.map(x => [...x, "+"]));
            if (cost == remove)
                paths.push(...table[a][b - 1].paths.map(x => [...x, "-"]));
            table[a][b] = { cost, paths };
        }
    }
    let best_score = -Infinity;
    let best_results = [];
    table[answer.length][guess.length].paths.forEach(path => {
        const start = path[0] == ">";
        const end = path[path.length - 1] == ">";
        const pattern = Array.from({ length: guess.length }, x => 0);
        const unused_letter = Array.from(answer); //　answerの中でまだ使ってない文字
        let accept_count = 0;
        let streak_length = 0;
        let score = 0;
        if (start)
            score += 1;
        if (end)
            score += 1;
        let a = 0, b = 0;
        for (let i = 0; i < path.length; i++) {
            switch (path[i]) {
                case ">":
                    accept_count++;
                    streak_length++;
                    pattern[b] = streak_length == 1 ? 2 : 3;
                    unused_letter.splice(unused_letter.indexOf(guess[b]), 1);
                    score += 3 * streak_length;
                    a++;
                    b++;
                    break;
                case "+":
                    streak_length = 0;
                    a++;
                    break;
                case "-":
                    streak_length = 0;
                    b++;
                    break;
            }
        }
        // 黄色を生成
        for (let i = 0; i < guess.length; i++) {
            if (pattern[i] == 0 && unused_letter.includes(guess[i])) {
                pattern[i] = 1;
                unused_letter.splice(unused_letter.indexOf(guess[i]), 1);
            }
        }
        // 緑が一文字のとき黄色に変換
        if (accept_count == 1 && !start && !end) {
            pattern[pattern.indexOf(2)] = 1;
        }
        if (best_score == score) {
            best_results.push({ pattern, start, end });
        }
        else if (best_score < score) {
            best_score = score;
            best_results = [{ pattern, start, end }];
        }
    });
    best_results.sort((a, b) => a.pattern.join() < b.pattern.join() ? 1 : -1);
    return best_results[0];
}
function assure(a, b) {
    if (a instanceof b)
        return a;
    throw new TypeError(`${a} is not ${b.name}.`);
}
const $inputRow = assure(document.getElementById("input_row"), HTMLDivElement);
const $board = assure(document.getElementById("board"), HTMLDivElement);
let play;
let stats;
function getAnswer() {
    return answers[Math.floor((new Date() - new Date(Date.UTC(2022, 2, 23))) / (1000*60*60*24)) % answers.length];
}
function save() {
    localStorage.setItem("diffle_play", JSON.stringify(play));
    localStorage.setItem("diffle_stats", JSON.stringify(stats));
}
function load() {
    const today = getTodayString();
    const statsString = localStorage.getItem("diffle_stats");
    stats = statsString ? JSON.parse(statsString) : {};
    if (stats.played == undefined)
        stats.played = 0;
    if (stats.won == undefined)
        stats.won = 0;
    if (stats.total_guess_count == undefined)
        stats.total_guess_count = 0;
    if (stats.total_letter_count == undefined)
        stats.total_letter_count = 0;
    if (stats.played === 0) {
        assure(document.getElementById("open_help"), HTMLInputElement).checked = true;
    }
    const playString = localStorage.getItem("diffle_play");
    const _play = playString ? JSON.parse(playString) : null;
    if (_play && _play.date == today) {
        play = _play;
        if (play.answer == undefined)
            play.answer = getAnswer();
        play.history.forEach(x => insertGuess(x));
        Array.from(play.guess).forEach(x => insertLetter(x));
        if (play.history[play.history.length - 1] == play.answer)
            showReault();
    }
    else {
        play = {
            date: today,
            guess: "",
            history: [],
            answer: getAnswer(),
            letter_count: 0,
        };
        save();
    }
    showStats();
}
function insertLetter(letter) {
    const letter_element = document.createElement("div");
    letter_element.className = "letter";
    letter_element.textContent = letter;
    $inputRow.appendChild(letter_element);
    $inputRow.classList.remove("empty");
}
function insertGuess(guess) {
    const row = document.createElement("div");
    row.className = "guess";
    const result = diffle(play.answer, guess);
    Array.from(guess).forEach((letter, i) => {
        const letter_element = document.createElement("div");
        letter_element.className = "letter";
        letter_element.textContent = letter;
        letter_element.classList.add(["absent", "present", "head", "tail"][result.pattern[i]]);
        const keyboard_button = assure(document.getElementById("keyboard_" + letter), HTMLButtonElement);
        if (result.pattern[i] == 0
            && keyboard_button.className !== "present"
            && keyboard_button.className !== "correct")
            keyboard_button.className = "absent";
        if (result.pattern[i] == 1
            && keyboard_button.className !== "correct")
            keyboard_button.className = "present";
        if (result.pattern[i] == 2 || result.pattern[i] == 3)
            keyboard_button.className = "correct";
        if (i == 0 && result.start)
            letter_element.classList.add("start");
        if (i == guess.length - 1 && result.end)
            letter_element.classList.add("end");
        row.appendChild(letter_element);
    });
    $board.insertBefore(row, $inputRow);
    $inputRow.innerHTML = "";
    $inputRow.classList.add("empty");
}
function inputLetter(letter) {
    if (play.history[play.history.length - 1] == play.answer)
        return;
    if (!/^[a-z_]$/.test(letter))
        throw new Error("invalid input");
    insertLetter(letter);
    play.guess += letter;
    save();
}
function inputBackspace() {
    if (play.history[play.history.length - 1] == play.answer)
        return;
    if ($inputRow.lastElementChild)
        $inputRow.removeChild($inputRow.lastElementChild);
    if (play.guess !== "")
        play.guess = play.guess.substring(0, play.guess.length - 1);
    if (play.guess == "")
        $inputRow.classList.add("empty");
    save();
}
function enter() {
    if (play.history[play.history.length - 1] == play.answer)
        return;
    if (!answers.includes(play.guess)) {
        myAlert("not in word list");
        return;
    }
    if (play.history.length == 0) {
        stats.played++;
        showStats();
    }
    insertGuess(play.guess);
    play.letter_count += play.guess.length;
    play.history.push(play.guess);
    if (play.guess == play.answer) {
        if (play.history.length <= 1)
            myAlert("miracle!");
        else if (play.history.length <= 3)
            myAlert("genius!");
        else if (play.history.length <= 6)
            myAlert("excellent!");
        else if (play.history.length <= 10)
            myAlert("great!");
        else
            myAlert("good!");
        stats.won++;
        stats.total_guess_count += play.history.length;
        stats.total_letter_count += play.letter_count;
        showReault();
        showStats();
    }
    play.guess = "";
    save();
}
function showReault() {
    $inputRow.style.display = "none";
    assure(document.getElementById("result"), HTMLDivElement).style.display = "";
    assure(document.getElementById("timer_container"), HTMLDivElement).style.display = "";
    assure(document.getElementById("letters_used"), HTMLDivElement).textContent = "" + play.letter_count;
    assure(document.getElementById("words_used"), HTMLDivElement).textContent = "" + play.history.length;
    assure(document.getElementById("words_used_label"), HTMLSpanElement).innerHTML = play.history.length <= 1 ? "Word<br>Used" : "Words<br>Used";
}
function showStats() {
    assure(document.getElementById("stats_played"), HTMLDivElement).textContent = "" + stats.played;
    assure(document.getElementById("stats_won"), HTMLDivElement).textContent = "" + stats.won;
    assure(document.getElementById("stats_average_words"), HTMLDivElement).textContent = stats.won == 0 ? "0.0" : (stats.total_guess_count / stats.won).toFixed(1);
    assure(document.getElementById("stats_average_letters"), HTMLDivElement).textContent = stats.won == 0 ? "0.0" : (stats.total_letter_count / stats.won).toFixed(1);
}
function myAlert(message) {
    const alert = assure(document.getElementById("alert"), HTMLDivElement);
    alert.textContent = message;
    alert.classList.add("visible");
    setTimeout(() => alert.classList.remove("visible"), 1500);
}
function shareImage() {
    const width = 500;
    const circle_radius = 21;
    const dot_radius = 4;
    const margin_x = 2;
    const margin_y = 10;
    const header_height = 70;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = play.history.length * (circle_radius + margin_y) * 2 + header_height;
    const context = assure(canvas.getContext("2d"), CanvasRenderingContext2D);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#1a1a1b";
    context.font = "40px 'HK Super Round Bold'";
    context.textAlign = "center";
    context.fillText("Dpyle".split("").join(String.fromCharCode(8202)), width / 2, 40);
    context.font = "20px 'HK Super Round Bold'";
    context.textAlign = "center";
    context.fillText(play.date, width / 2, 65);
    play.history.forEach((guess, i) => {
        const center_y = (2 * i + 1) * (circle_radius + margin_y) + header_height;
        const result = diffle(play.answer, guess);
        if (guess == play.answer) {
            context.fillStyle = "#4fb061";
            context.fillRect(0, center_y - circle_radius, width, circle_radius * 2);
            return;
        }
        if (result.start) {
            context.fillStyle = "#4fb061";
            context.fillRect(width / 2 - guess.length * (circle_radius + margin_x), center_y - circle_radius, circle_radius + margin_x, circle_radius * 2);
        }
        if (result.end) {
            context.fillStyle = "#4fb061";
            context.fillRect(width / 2 + (guess.length - 1) * (circle_radius + margin_x), center_y - circle_radius, circle_radius + margin_x, circle_radius * 2);
        }
        result.pattern.forEach((color, j) => {
            const center_x = width / 2 + (1 + 2 * j - guess.length) * (circle_radius + margin_x);
            context.beginPath();
            context.arc(center_x, center_y, circle_radius, 0, 360 * Math.PI / 180, false);
            context.fillStyle = ["#959b9d", "#e8b838", "#4fb061", "#4fb061"][color];
            context.fill();
            if (color == 3) {
                context.fillStyle = "#4fb061";
                context.fillRect(center_x - (circle_radius + margin_x) * 2, center_y - circle_radius, (circle_radius + margin_x) * 2, circle_radius * 2);
                context.fill();
            }
        });
    });
    canvas.toBlob(blob => {
        try {
            if (blob == null) {
                throw new Error("something went wrong");
            }
            var fileURL = URL.createObjectURL(blob);
            window.open(fileURL);
        }
        catch (err) {
            console.log(err);
        }
    }, "image/png");
}
document.addEventListener("keydown", (ev) => {
    if (ev.key == "Backspace")
        inputBackspace();
    if (ev.key == "Enter")
        return enter();
    if (/^[A-Za-z_]$/.test(ev.key))
        inputLetter(ev.key.toLowerCase());
});
Array.from("qwertyuiopasdfghjklzxcvbnm_").forEach(letter => {
    const keyboard_button = assure(document.getElementById("keyboard_" + letter), HTMLButtonElement);
    keyboard_button.addEventListener("click", () => inputLetter(letter));
});
function getTodayString() {
    const now = new Date();
    return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}
function updateTimer() {
    const today = getTodayString();
    if (play.date !== today) {
        assure(document.getElementById("timer"), HTMLDivElement).textContent = "00:00:00";
        return;
    }
    const now = new Date();
    const rest = 86400 - (3600 * now.getUTCHours() + 60 * now.getUTCMinutes() + now.getUTCSeconds());
    const rest_hours = Math.floor(rest / 3600);
    const rest_minutes = Math.floor((rest - 3600 * rest_hours) / 60);
    const rest_seconds = rest - 3600 * rest_hours - 60 * rest_minutes;
    const rest_format = `${("" + rest_hours).padStart(2, "0")}:${("" + rest_minutes).padStart(2, "0")}:${("" + rest_seconds).padStart(2, "0")}`;
    assure(document.getElementById("timer"), HTMLDivElement).textContent = rest_format;
}
assure(document.getElementById("keyboard_enter"), HTMLButtonElement).addEventListener("click", enter);
assure(document.getElementById("keyboard_backspace"), HTMLButtonElement).addEventListener("click", inputBackspace);
assure(document.getElementById("share_image_button"), HTMLButtonElement).addEventListener("click", shareImage);
load();
setInterval(updateTimer, 1000);
