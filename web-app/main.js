import R from "./ramda.js";

const grid_size = 4; // Fixed: Changed === to =

/**
 * Creates the initial 4x4 grid filled with 0s 
 */
const create_initial_grid = (size) => {
    // Fixed: Added the 'return' keyword
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
    // Fixed: Added () to actually call the function
    const empty_cells = get_empty_cells(current_grid);
    
    // Fixed: Changed length() to length (it's a property, not a method)
    if (empty_cells.length === 0) {
        return current_grid;
    }

    const random_index = Math.floor(Math.random() * empty_cells.length);
    const { r: target_row, c: target_col } = empty_cells[random_index];

    // Updated to 0.8 to match your 80%/20% docstring
    const new_value = Math.random() < 0.8 ? 2 : 4;
    
    // Fixed: Changed 'grid.map' to 'current_grid.map'
    return current_grid.map((row, r) => 
        row.map((cell, c) => 
            (r === target_row && c === target_col) ? new_value : cell
        )
    );
};

/**
 * Starts the game
 */
const start_game = () => {
    // Converted all variables and function calls to snake_case
    const empty_grid = create_initial_grid(grid_size);
    const grid_with_one_tile = add_random_2_or_4(empty_grid);
    const starting_grid = add_random_2_or_4(grid_with_one_tile);
    
    return starting_grid;
};

// Start the game and hold the state
let current_grid = start_game();

// You can check the browser console to see your working starting grid!
console.log("Game Started! Initial Grid:", current_grid);

/**
 * Slides all non-zero numbers in a single row/array up down left or right.
 * e.g., [2, 0, 2, 0] -> [2, 2, 0, 0]
 */
const slide_line = (line) => {

};

/**
 * moves tiles depending on the direction input
 */
const move_tile = (direction) => {

};

/**
 * Merges adjacent identical numbers in a single row/array after sliding
 * e.g., [2, 2, 4, 8] -> [4, 0, 4, 8]
 */
const merge_line = (line) => {

};

/**
 * 
 */
const process_turn = R.pipe(
    move_tile(direction),
    add_random_2_or_4

);


/**
 * Checks if the grid is completely full (no 0s).
 */
const is_grid_full = (grid) => {

};

/**
 * Checks if there are any adjacent identical tiles horizontally or vertically.
 */
const has_valid_moves = (grid) => {

};
/**
 * Determines if the player has lost (grid is full AND no valid moves remain).
 */
const is_game_over = (grid) => {

};

/**
 * Checks if the 2048 tile exists anywhere on the board.
 */
const has_won = (grid) => {

};

/**
 * Checks if the player wants to continue after winning
 */
const continue_after_win = () => {

};