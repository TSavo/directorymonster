/*
 * Poseidon Hash Function Constants
 *
 * Generated on: 2025-04-03T23:32:19.779Z
 * These constants are cryptographically secure and should not be changed.
 */

// Individual constants for the Poseidon hash function
function POSEIDON_C0() { return 21815708517280805389244599424865868503654503151182771217342095918409092389316; }
function POSEIDON_C1() { return 7773069109709696082985359496268596318085211872072954630552520601855748090880; }
function POSEIDON_C2() { return 13956172644348863410030477741514675188284611742820022901254788556158595654640; }
function POSEIDON_C3() { return 9762263577749752196807450552094880185490871569155301217326519359730538337132; }
function POSEIDON_C4() { return 5932901235930871004648025346216618376129170764743598165739934667862925399402; }
function POSEIDON_C5() { return 12247413048764969320342156478242746188859238736865995504525620227084135044550; }
function POSEIDON_C6() { return 14245094474771869438086682922833361671600177041102552921624010997634356472428; }
function POSEIDON_C7() { return 10233106967958835521495138475724777890091909221373504482296225719795606708578; }
function POSEIDON_C8() { return 16276660139016493006863001436702745257850185400550787803504332580795395356274; }
function POSEIDON_C9() { return 21527033188836741555027891269999172442176958249249456378762428635153641448663; }

// Get a constant by index
function POSEIDON_CONSTANT(i) {
    if (i == 0) return POSEIDON_C0();
    if (i == 1) return POSEIDON_C1();
    if (i == 2) return POSEIDON_C2();
    if (i == 3) return POSEIDON_C3();
    if (i == 4) return POSEIDON_C4();
    if (i == 5) return POSEIDON_C5();
    if (i == 6) return POSEIDON_C6();
    if (i == 7) return POSEIDON_C7();
    if (i == 8) return POSEIDON_C8();
    if (i == 9) return POSEIDON_C9();
    return 0;
}

// MDS matrix for the Poseidon hash function
function POSEIDON_MDS(i, j) {
    if (i == 0 && j == 0) return 1;
    if (i == 0 && j == 1) return 2;
    if (i == 0 && j == 2) return 3;
    if (i == 1 && j == 0) return 1;
    if (i == 1 && j == 1) return 1;
    if (i == 1 && j == 2) return 1;
    if (i == 2 && j == 0) return 1;
    if (i == 2 && j == 1) return 3;
    if (i == 2 && j == 2) return 2;
    return 0;
}
