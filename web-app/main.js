import * as R from "https://cdn.jsdelivr.net/npm/ramda@0.29.1/es/index.js";

const grid_size = 4;
const num_starting_tiles = 2;
let has_continued = false;
const overlay = document.getElementById('game-over-overlay');
const title = document.getElementById('overlay-title');
const keepPlayingBtn = document.getElementById('keep-playing-button');
let current_score = 0
let is_animating = false;

/**
 * Creates the initial 4x4 grid filled with 0s 
 */
const create_initial_grid = (size) => {
    return Array.from({ length: size }, () => Array(size).fill(0));
};

/**
 * Returns an array of coordinates {r, c} for all empty cells (0s) in the grid.
 */
const get_empty_cells = (current_grid) => {
    const empty_cells = [];
    current_grid.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell === 0) {
                empty_cells.push({ r, c });
            }
        });
    });
    return empty_cells;
};

/**
 * Takes the grid, finds an empty cell, and places a 2 (80% chance) or 4 (20% chance) in it.
 */
const add_random_2_or_4 = (current_grid) => {
    const empty_cells = get_empty_cells(current_grid);
    
    if (empty_cells.length === 0) return current_grid;

    const random_index = Math.floor(Math.random() * empty_cells.length);
    const { r: target_row, c: target_col } = empty_cells[random_index];

    const new_value = { 
        id: Math.random().toString(36).substr(2, 9),
        val: Math.random() < 0.8 ? 2 : 4
    };
    return current_grid.map((row, r) => 
        row.map((cell, c) => 
            (r === target_row && c === target_col) ? new_value : cell
        )
    );
};

/**
 * renders the grid changes
 * @param {*} grid
 */
const render_grid = (grid) => {
    const container = document.getElementById('tile-container');
    const active_ids = new Set();

    grid.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell !== 0) {
                active_ids.add(cell.id);
                const bg_cell = document.getElementById(`c${r}${c}`);
                let el = document.getElementById(`tile-${cell.id}`);

                const x = bg_cell.offsetLeft;
                const y = bg_cell.offsetTop;
                const pos = `${x}px ${y}px`;

                if (!el) {
                    el = document.createElement('div');
                    el.id = `tile-${cell.id}`;
                    el.className = 'tile tile-new';
                    el.style.translate = pos;
                    container.appendChild(el);
                } else {
                    el.style.translate = pos;
                    el.classList.remove('tile-new', 'tile-merged');
                    el.style.zIndex = "";
                }

                if (cell.merged_from) {
                    const dead_id = `tile-${cell.merged_from}`;
                    let dead_el = document.getElementById(dead_id);
                    if (dead_el) {
                        dead_el.style.translate = pos;
                        dead_el.style.zIndex = 1;
                    }

                    void el.offsetWidth;
                    el.classList.add('tile-merged');
                    el.style.zIndex = 10;

                    setTimeout(() => {
                        el.textContent = cell.val;
                        el.dataset.value = cell.val;
                    }, 150);

                    delete cell.merged_from;
                } else {
                    el.textContent = cell.val;
                    el.dataset.value = cell.val;
                }
            }
        });
    });

    Array.from(container.children).forEach(child => {
        const id = child.id.replace('tile-', '');
        if (!active_ids.has(id)) {
            setTimeout(() => child.remove(), 150);
        }
    });
};


/**
 * Repeats the add tile function for the chosen number of starting tiles
 */
const add_starting_tiles =  R.pipe(
    ...R.repeat(add_random_2_or_4, num_starting_tiles)
);

/**
 * Logs the current grid into the browser console for accessibility software
 * @param {string} message - The context of the log (e.g., "Game Started!" or "Swiped Left")
 * @param {Array} grid- The 2D array representing the  game board
 * @returns {void}
 */
const log_grid = (message) => (grid) => console.log(message, grid);

/**
 * Starts the game, passing the grid size as the initial variable
 */
const start_game = () => R.pipe(
    create_initial_grid,
    add_starting_tiles,
    R.tap(render_grid),
    R.tap(log_grid("Game Started! Initial Grid: "))
)(grid_size);

let current_grid = start_game();

/**
 * Adds points to the score and updates the DOM
 */
const update_score = (points) => {
    current_score += points;
    document.getElementById("score").textContent = current_score;
};

/**
 * Checks if there is any adjacent identical tiles in the row
 * @param {*} row
 * @returns
 */
const has_adjacent_duplicates = (row) => {
    return row.some((cell, index) => 
        index < row.length - 1 && 
        cell !== 0 && 
        row[index + 1] !== 0 &&
        cell.val === row[index + 1].val
    );
};

/**
 * Checks if the array of empty cells is completely empty.
 */
const is_grid_full = R.pipe(
    get_empty_cells,
    R.isEmpty
);
/**
 * Checks if there are any adjacent identical tiles horizontally or vertically.
 */
const has_valid_moves = R.anyPass([
    R.any(has_adjacent_duplicates),
    R.pipe(R.transpose, R.any(has_adjacent_duplicates))
]);

/**
 * Determines if the player has lost
 */
const is_game_over = R.allPass([
    is_grid_full,
    R.complement(has_valid_moves)
]);

/**
 * Slides all non-zero numbers to left in a row.
 * e.g., [2, 0, 2, 0] -> [2, 2, 0, 0]
 */
const slide_line = R.pipe(
    R.partition(num => num !== 0),
    R.flatten
);

/**
 * Slides the entire grid
 */
const slide_grid = R.map(slide_line);

/**
 * Checks if a pair contains a non 0, and a 0
 */
const is_slideable_gap = R.allPass([
    R.pipe(R.head, R.equals(0)),
    R.pipe(R.last, R.complement(R.equals(0)))
]);


/**
 * checks for slideable gaps throughout that row/column
 */
const has_slideable_zero = R.pipe(
    R.map(R.propOr(0, "val")),
    R.aperture(2),
    R.any(is_slideable_gap)
);

/**
 * Flips along the vertical axis
 */
const mirror_along_vertical = R.map(R.reverse);

/**
 * Merges adjacent identical numbers in a single row using recursion
 * e.g., [2, 2, 4, 8] -> [4, 0, 4, 8], or [2,0,2,0] -> [4,0,0,0]
 */
const merge_line = (line) => {
    if (line.length === 0) return [];
    const current = line[0];
    const rest = line.slice(1);

    if (current === 0) {
        return [0, ...merge_line(rest)];
    }

    const nextIndex = rest.findIndex((num) => num !== 0);
    if (nextIndex === -1) {
        return [current, ...rest];
    }

    const nextNumber = rest[nextIndex];
    if (current.val === nextNumber.val) {
      const merged_value = current.val * 2;
      update_score(merged_value);
      return [
          { id: current.id, val: merged_value, merged_from: nextNumber.id },
          ...rest.slice(0, nextIndex),
          0,
          ...merge_line(rest.slice(nextIndex + 1))
      ];
    }
    return [current, ...merge_line(rest)];
};

/**
 * merges all rows left in the grid
 */
const merge_grid = R.map(merge_line)

/**
 * checks if you can move a row left
 */
const can_move_row_left = R.anyPass([
    has_adjacent_duplicates,
    has_slideable_zero
]);

/**
 * checks if the whole grid can slide left
 */
const check_left = R.any(can_move_row_left);

/**
 * checks if the whole grid can slide right
 */
const check_right = R.pipe(mirror_along_vertical, check_left);

/**
 * checks if the whole grid can slide up
 */
const check_up = R.pipe(R.transpose, check_left);

/**
 * checks if the whole grid can slide down
 */
const check_down = R.pipe(R.transpose, mirror_along_vertical, check_left);

/**
 * Moves Left
 * @param {*} grid
 * @returns
 */
const move_left = (grid) => R.pipe(
    slide_grid,
    merge_grid,
    slide_grid,
    add_random_2_or_4,
    R.tap(render_grid),
    R.tap(log_grid("Swiped Left!"))
)(grid);

/**
 * moves right
 * @param {*} current_grid 
 * @returns 
 */
const move_right = (current_grid) => R.pipe(
    mirror_along_vertical,
    slide_grid,
    merge_grid,
    slide_grid,
    mirror_along_vertical,
    add_random_2_or_4,
    R.tap(render_grid),
    R.tap(log_grid("Swiped Right!"))
)(current_grid);

const move_up = (grid) => R.pipe(
    R.transpose,
    slide_grid,
    merge_grid,
    slide_grid,
    R.transpose,
    add_random_2_or_4,
    R.tap(render_grid),
    R.tap(log_grid("Swiped Up!"))
)(grid);

const move_down = (current_grid) => R.pipe(
    R.transpose,
    mirror_along_vertical,
    slide_grid,
    merge_grid,
    slide_grid,
    mirror_along_vertical,
    R.transpose,
    add_random_2_or_4,
    R.tap(render_grid),
    R.tap(log_grid("Swiped Down!"))
)(current_grid);

/**
 * Resets the game state and hides the overlay
 */
const reset_game = () => {
    document.getElementById("game-over-overlay").classList.add("hidden");
    has_continued = false;
    current_score = 0;
    document.getElementById("score").textContent = current_score;
    current_grid = start_game();
};

document.getElementById("retry-button").addEventListener("click", reset_game);

/**
 * Checks if the 2048 tile exists anywhere on the board.
 */
const has_won = R.pipe(
    R.flatten,
    R.reject(R.equals(0)),
    R.pluck("val"),
    R.includes(2048)
);



const handle_keypress = (event) => {
    if (is_game_over(current_grid) || is_animating) {
        return;
    }
    
    // We point to your original move functions which handle their own rendering
    const key_actions = {
        "ArrowLeft": { execute: move_left, check: check_left },
        "a":         { execute: move_left, check: check_left },
        "A":         { execute: move_left, check: check_left },
        "ArrowRight":{ execute: move_right, check: check_right },
        "d":         { execute: move_right, check: check_right },
        "D":         { execute: move_right, check: check_right },
        "ArrowUp":   { execute: move_up, check: check_up },
        "w":         { execute: move_up, check: check_up },
        "W":         { execute: move_up, check: check_up },
        "ArrowDown": { execute: move_down, check: check_down },
        "s":         { execute: move_down, check: check_down },
        "S":         { execute: move_down, check: check_down }
    };

    const action = key_actions[event.key];

    if (action) {
        event.preventDefault();
        
        if (action.check(current_grid)) {
            
            is_animating = true;

            current_grid = action.execute(current_grid);

            setTimeout(() => {
                is_animating = false;
            }, 75);

            if (has_won(current_grid) && !has_continued) {
                title.textContent = "You Win!";
                overlay.style.background = "rgba(237, 194, 46, 0.73)";
                keepPlayingBtn.classList.remove("hidden");
                overlay.classList.remove("hidden");
            }
            else if (is_game_over(current_grid)) {
                title.textContent = "Game Over!";
                overlay.style.background = "rgba(238, 228, 218, 0.73)";
                keepPlayingBtn.classList.add("hidden");
                overlay.classList.remove("hidden");
            }
        }
    }
};

document.addEventListener("keydown", handle_keypress);

/**
 * Checks if the player wants to continue after winning
 */
const continue_after_win = () => {
    has_continued = true;
    document.getElementById("game-over-overlay").classList.add("hidden");
};

document.getElementById("keep-playing-button").addEventListener("click", continue_after_win);