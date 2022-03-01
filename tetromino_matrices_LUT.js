// matrices for all tetrominos in all rotations
// blockMatrix[type][state][block][0:x, 1:y]
export const blockMatrix = [
    /*I*/ [
    [[-1, 0], [0, 0], [1, 0], [2, 0]],
    [[1, 1], [1, 0], [1, -1], [1, -2]],
    [[-1, -1], [0, -1], [1, -1], [2, -1]],
    [[0, 1], [0, 0], [0, -1], [0, -2]]],
    /*J*/ [
    [[-1, 1], [-1, 0], [0, 0], [1, 0]],
    [[0, 1], [1, 1], [0, 0], [0, -1]],
    [[-1, 0], [0, 0], [1, 0], [1, -1]],
    [[0, 1], [0, 0], [-1, -1], [0, -1]]],
    /*L*/ [
    [[1, 1], [-1, 0], [0, 0], [1, 0]],
    [[0, 1], [0, 0], [0, -1], [1, -1]],
    [[-1, 0], [0, 0], [1, 0], [-1, -1]],
    [[-1, 1], [0, 1], [0, 0], [0, -1]]],
    /*O*/ [
    [[0, 1], [1, 1], [0, 0], [1, 0]],
    [[0, 1], [1, 1], [0, 0], [1, 0]],
    [[0, 1], [1, 1], [0, 0], [1, 0]],
    [[0, 1], [1, 1], [0, 0], [1, 0]]],
    /*S*/ [
    [[0, 1], [1, 1], [-1, 0], [0, 0]],
    [[0, 1], [0, 0], [1, 0], [1, -1]],
    [[0, 0], [1, 0], [-1, -1], [0, -1]],
    [[-1, 1], [-1, 0], [0, 0], [0, -1]]],
    /*Z*/ [
    [[-1, 1], [0, 1], [0, 0], [1, 0]],
    [[1, 1], [0, 0], [1, 0], [0, -1]],
    [[-1, 0], [0, 0], [0, -1], [1, -1]],
    [[0, 1], [-1, 0], [0, 0], [-1, -1]]],
    /*T*/ [
    [[0, 1], [-1, 0], [0, 0], [1, 0]],
    [[0, 1], [0, 0], [1, 0], [0, -1]],
    [[-1, 0], [0, 0], [1, 0], [0, -1]],
    [[0, 1], [-1, 0], [0, 0], [0, -1]]]
];

// SRS wall kick matrix: wallKick[type][state][test][x or y]
export const wallKick = [
[
[[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
[[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
[[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
[[0, 0], [-1, 0], [-1, -1], [0, 2], [1, -2]]
], 
[
[[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
[[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
[[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
[[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]
]
];
